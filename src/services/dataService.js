import { repositories } from './repositories/index.js';
import { api } from './apiClient.js';
import { syncService } from './sync/syncService.js';
import { db } from './db/dexieDb.js';
import { MODULE_CONFIG, computeFieldDiffs } from './sync/syncUtils.js';
import { auditService } from './audit/auditService.js';

/**
 * DataService Coordinator for TenderFlow ERP
 *
 * Implements clean architectural boundary between:
 * 1. Local Offline Storage: IndexedDB via Dexie.js repositories
 * 2. Remote Backend Services: Express API via apiClient
 * 3. Safe Cloud Sync & Reconciliation: User-controlled, non-destructive synchronization
 *
 * Step 2 Local-First Storage & Persistence Migration:
 * - Direct read/write to Dexie repositories as primary local persistence.
 * - Offline CRUD operations survive browser reloads.
 * - Client-side JSON backup export and import for full data ownership.
 * - Offline resolution of related records (Agreements, Bills, FMD) for Work Orders.
 */
export const dataService = {
  // Local IndexedDB repositories (Offline-First)
  local: repositories,

  // Remote Server API client (Render Backend / MongoDB)
  remote: api,

  // Safe Cloud Sync & Reconciliation Service (getter avoids circular import TDZ)
  get sync() {
    return syncService;
  },

  /**
   * Prime IndexedDB with clean baseline reference datasets if the local stores are empty.
   * Automatically clears legacy demo records (wo-01, agr-01, bill-01, fmd-01, and old PWD subdivisions).
   */
  async initLocalStorage(initialDatasets = {}) {
    try {
      // 1. Purge legacy demo records if present in local IndexedDB
      const demoWoIds = ['wo-01', 'wo-02', 'wo-03', 'wo-04'];
      const existingWos = await repositories.workOrders.getAll();
      const hasDemoWos = existingWos.some((w) => demoWoIds.includes(w.id));
      if (hasDemoWos) {
        await Promise.all([
          repositories.workOrders.clear(),
          repositories.agreements.clear(),
          repositories.billing.clear(),
          repositories.fmdSd.clear(),
        ]);
      }

      // Check if subdivisions has old PWD records and reset to clean divisions
      const existingSubs = await repositories.subdivisions.getAll();
      const hasOldPwdSubs = existingSubs.some(
        (s) => s.code?.startsWith('SD-CIVIL') || s.code?.startsWith('SD-ROADS') || s.inCharge?.includes('A.E.')
      );
      if (hasOldPwdSubs) {
        await repositories.subdivisions.clear();
        if (Array.isArray(initialDatasets.subdivisions) && initialDatasets.subdivisions.length > 0) {
          await repositories.subdivisions.bulkPut(initialDatasets.subdivisions);
        }
      }

      const fyCount = await repositories.financialYears.count();
      if (fyCount === 0 && Array.isArray(initialDatasets.financialYears) && initialDatasets.financialYears.length > 0) {
        await repositories.financialYears.bulkPut(initialDatasets.financialYears);
      }

      const subCount = await repositories.subdivisions.count();
      if (subCount === 0 && Array.isArray(initialDatasets.subdivisions) && initialDatasets.subdivisions.length > 0) {
        await repositories.subdivisions.bulkPut(initialDatasets.subdivisions);
      }

      const woCount = await repositories.workOrders.count();
      if (woCount === 0 && Array.isArray(initialDatasets.workOrders) && initialDatasets.workOrders.length > 0) {
        await repositories.workOrders.bulkPut(initialDatasets.workOrders);
      }

      const agrCount = await repositories.agreements.count();
      if (agrCount === 0 && Array.isArray(initialDatasets.agreements) && initialDatasets.agreements.length > 0) {
        await repositories.agreements.bulkPut(initialDatasets.agreements);
      }

      const billCount = await repositories.billing.count();
      if (billCount === 0 && Array.isArray(initialDatasets.billingList) && initialDatasets.billingList.length > 0) {
        await repositories.billing.bulkPut(initialDatasets.billingList);
      }

      const fmdCount = await repositories.fmdSd.count();
      if (fmdCount === 0 && Array.isArray(initialDatasets.fmdList) && initialDatasets.fmdList.length > 0) {
        await repositories.fmdSd.bulkPut(initialDatasets.fmdList);
      }

      return { success: true };
    } catch (err) {
      console.warn('[DataService] Local IndexedDB priming skipped:', err.message);
      return { success: false, error: err.message };
    }
  },

  /**
   * Load all datasets from IndexedDB for the six core modules
   */
  async loadAllFromLocal() {
    const [financialYears, subdivisions, workOrders, agreements, billingList, fmdList] = await Promise.all([
      repositories.financialYears.getAll(),
      repositories.subdivisions.getAll(),
      repositories.workOrders.getAll(),
      repositories.agreements.getAll(),
      repositories.billing.getAll(),
      repositories.fmdSd.getAll(),
    ]);

    return {
      financialYears,
      subdivisions,
      workOrders,
      agreements,
      billingList,
      fmdList,
    };
  },

  /**
   * Resolve related records locally in IndexedDB for a given Work Order.
   * Enables the Work Order Detail Modal to function 100% offline.
   */
  async getRelatedRecordsForWorkOrder(workOrder) {
    if (!workOrder) return null;
    const woId = workOrder._id || workOrder.id;
    const woNum = workOrder.workOrderNumber;
    const tenderNum = workOrder.tenderNumber;

    const [allAgreements, allBills, allFmd] = await Promise.all([
      repositories.agreements.getAll(),
      repositories.billing.getAll(),
      repositories.fmdSd.getAll(),
    ]);

    // Match related agreements
    const matchedAgreements = allAgreements.filter(
      (a) => (woId && a.workOrderId === woId) || (woNum && a.workOrderNumber === woNum) || (tenderNum && a.tenderNumber === tenderNum)
    );

    // Match related bills
    const matchedBills = allBills.filter(
      (b) => (woId && b.workOrderId === woId) || (woNum && b.workOrderNumber === woNum)
    );

    // Match related FMD / SD deposits
    const matchedFmd = allFmd.filter(
      (f) => (woId && f.workOrderId === woId) || (woNum && f.workOrderNumber === woNum) || (tenderNum && f.tenderNumber === tenderNum)
    );

    const totalBilled = matchedBills.reduce((acc, b) => acc + (Number(b.grossAmount) || Number(b.netPayableAmount) || 0), 0);
    const woAmount = Number(workOrder.workOrderAmount) || 0;
    const billingProgressPercent = woAmount > 0 ? Math.min(100, Math.round((totalBilled / woAmount) * 100)) : 0;
    const remainingAmount = Math.max(0, woAmount - totalBilled);

    return {
      agreements: matchedAgreements,
      bills: matchedBills,
      fmdDeposits: matchedFmd,
      summary: {
        totalBilled,
        remainingAmount,
        billingProgressPercent,
        agreementsCount: matchedAgreements.length,
        billsCount: matchedBills.length,
        fmdDepositsCount: matchedFmd.length,
      },
    };
  },

  /**
   * Export complete local IndexedDB database to a downloadable JSON file.
   */
  async exportBackupJson() {
    const data = await this.loadAllFromLocal();
    const stats = await this.getStorageStats();

    const backupPayload = {
      app: 'TenderFlow ERP',
      version: '1.0.0-offline-pwa',
      exportDate: new Date().toISOString(),
      format: 'TENDERFLOW_JSON_BACKUP_V1',
      stats,
      data,
    };

    const jsonBlob = new Blob([JSON.stringify(backupPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(jsonBlob);
    const filename = `TenderFlow_Govt_Backup_${new Date().toISOString().slice(0, 10)}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    // Register verified safety backup for cloud sync gating
    syncService.setBackupVerified({ filename, stats });

    return { success: true, filename, stats };
  },

  /**
   * Validate JSON backup file structure, schema version, and required fields
   */
  validateBackupPayload(backupPayload) {
    if (!backupPayload || typeof backupPayload !== 'object') {
      throw new Error('Invalid backup file: Payload must be a non-empty JSON object.');
    }

    const data = backupPayload.data || backupPayload;
    if (typeof data !== 'object' || data === null) {
      throw new Error('Invalid backup file: Missing or corrupted data payload.');
    }

    const hasModules =
      Array.isArray(data.financialYears) ||
      Array.isArray(data.subdivisions) ||
      Array.isArray(data.workOrders) ||
      Array.isArray(data.agreements) ||
      Array.isArray(data.billingList) ||
      Array.isArray(data.billing) ||
      Array.isArray(data.fmdList) ||
      Array.isArray(data.fmdSd);

    if (!hasModules) {
      throw new Error('Unrecognized backup format: No recognized government business module datasets found.');
    }

    const normalizedData = {
      financialYears: Array.isArray(data.financialYears) ? data.financialYears : [],
      subdivisions: Array.isArray(data.subdivisions) ? data.subdivisions : [],
      workOrders: Array.isArray(data.workOrders) ? data.workOrders : [],
      agreements: Array.isArray(data.agreements) ? data.agreements : [],
      billing: Array.isArray(data.billingList)
        ? data.billingList
        : Array.isArray(data.billing)
        ? data.billing
        : [],
      fmdSd: Array.isArray(data.fmdList)
        ? data.fmdList
        : Array.isArray(data.fmdSd)
        ? data.fmdSd
        : [],
    };

    // Schema validation for required fields
    for (const item of normalizedData.financialYears) {
      if (!item.id && !item.label) throw new Error('Invalid Financial Year record: missing required label or id');
    }
    for (const item of normalizedData.subdivisions) {
      if (!item.id && !item.code && !item.name) throw new Error('Invalid Subdivision record: missing required code/name or id');
    }
    for (const item of normalizedData.workOrders) {
      if (!item.id && !item.workOrderNumber) throw new Error('Invalid Work Order record: missing required workOrderNumber or id');
    }
    for (const item of normalizedData.agreements) {
      if (!item.id && !item.agreementNumber) throw new Error('Invalid Agreement record: missing required agreementNumber or id');
    }
    for (const item of normalizedData.billing) {
      if (!item.id && !item.invoiceNumber && !item.billNumber) throw new Error('Invalid Billing record: missing required invoiceNumber or id');
    }
    for (const item of normalizedData.fmdSd) {
      if (!item.id && !item.tenderNumber) throw new Error('Invalid FMD / SD record: missing required tenderNumber or id');
    }

    return { isValid: true, normalizedData };
  },

  /**
   * Restore Pre-Flight Comparison: Inspect records to add, collisions, and conflicts
   * across all six business modules before committing any writes.
   */
  async analyzeBackupJson(backupPayload) {
    const { normalizedData } = this.validateBackupPayload(backupPayload);
    const currentLocal = await this.loadAllFromLocal();

    const localLookup = {
      financialYears: currentLocal.financialYears || [],
      subdivisions: currentLocal.subdivisions || [],
      workOrders: currentLocal.workOrders || [],
      agreements: currentLocal.agreements || [],
      billing: currentLocal.billingList || [],
      fmdSd: currentLocal.fmdList || [],
    };

    const modulesReport = {};
    let totalIncoming = 0;
    let totalToAdd = 0;
    let totalCollisions = 0;
    let totalIdentical = 0;

    const moduleKeys = ['financialYears', 'subdivisions', 'workOrders', 'agreements', 'billing', 'fmdSd'];

    for (const modKey of moduleKeys) {
      const config = MODULE_CONFIG[modKey];
      const incomingList = normalizedData[modKey] || [];
      const localList = localLookup[modKey] || [];

      // Map local items by id and keyField
      const localById = new Map();
      const localByKey = new Map();

      localList.forEach((item) => {
        if (item.id) localById.set(item.id, item);
        if (item._id) localById.set(item._id, item);
        const keyVal = item[config.keyField];
        if (keyVal) localByKey.set(String(keyVal).trim(), item);
      });

      const toAdd = [];
      const collisions = [];
      const identical = [];

      for (const incomingItem of incomingList) {
        let match = null;
        if (incomingItem.id && localById.has(incomingItem.id)) {
          match = localById.get(incomingItem.id);
        } else if (incomingItem._id && localById.has(incomingItem._id)) {
          match = localById.get(incomingItem._id);
        } else {
          const keyVal = incomingItem[config.keyField];
          if (keyVal && localByKey.has(String(keyVal).trim())) {
            match = localByKey.get(String(keyVal).trim());
          }
        }

        if (!match) {
          toAdd.push(incomingItem);
        } else {
          const diffs = computeFieldDiffs(match, incomingItem, config.compareFields);
          if (diffs.length === 0) {
            identical.push({ incomingItem, localItem: match });
          } else {
            collisions.push({
              incomingItem,
              localItem: match,
              diffs,
              key: incomingItem[config.keyField] || incomingItem.id,
            });
          }
        }
      }

      totalIncoming += incomingList.length;
      totalToAdd += toAdd.length;
      totalCollisions += collisions.length;
      totalIdentical += identical.length;

      modulesReport[modKey] = {
        label: config.label,
        keyField: config.keyField,
        incomingCount: incomingList.length,
        toAdd,
        collisions,
        identical,
      };
    }

    return {
      isValid: true,
      exportDate: backupPayload.exportDate || null,
      app: backupPayload.app || 'TenderFlow ERP',
      format: backupPayload.format || 'JSON Backup',
      summary: {
        totalIncoming,
        totalToAdd,
        totalCollisions,
        totalIdentical,
      },
      modules: modulesReport,
      backupPayload,
    };
  },

  /**
   * Safe JSON restore with ACID transaction rollback, preventing accidental overwrites.
   * If overwriteCollisions is false, only non-conflicting new records are added.
   */
  async importBackupJson(backupPayload, { overwriteCollisions = false } = {}) {
    const analysis = await this.analyzeBackupJson(backupPayload);
    const { modules } = analysis;

    const moduleTableMap = {
      financialYears: db.financialYears,
      subdivisions: db.subdivisions,
      workOrders: db.workOrders,
      agreements: db.agreements,
      billing: db.billing,
      fmdSd: db.fmdSd,
    };

    const results = {
      added: 0,
      updated: 0,
      skipped: 0,
      details: {},
    };

    // Use atomic Dexie transaction across all 6 stores.
    // If anything fails during execution, Dexie automatically rolls back all stores!
    try {
      await db.transaction('rw', [
        db.financialYears,
        db.subdivisions,
        db.workOrders,
        db.agreements,
        db.billing,
        db.fmdSd,
      ], async () => {
        for (const [modKey, modReport] of Object.entries(modules)) {
          const table = moduleTableMap[modKey];
          let modAdded = 0;
          let modUpdated = 0;
          let modSkipped = 0;

          // 1. Safely add new records that have no local conflict
          for (const item of modReport.toAdd) {
            await table.put(item);
            modAdded++;
          }

          // 2. Handle collisions according to explicit user selection
          if (overwriteCollisions) {
            for (const col of modReport.collisions) {
              await table.put(col.incomingItem);
              modUpdated++;
            }
            for (const iden of modReport.identical) {
              await table.put(iden.incomingItem);
              modUpdated++;
            }
          } else {
            // Preserve all existing records untouched
            modSkipped += modReport.collisions.length + modReport.identical.length;
          }

          results.added += modAdded;
          results.updated += modUpdated;
          results.skipped += modSkipped;
          results.details[modKey] = {
            added: modAdded,
            updated: modUpdated,
            skipped: modSkipped,
          };
        }
      });

      // Record successful restore audit log
      await auditService.logRestore(
        results.added + results.updated,
        `Added: ${results.added}, Replaced: ${results.updated}, Preserved: ${results.skipped}`
      );

      return results;
    } catch (err) {
      // Guard against misleading success entries on failure
      await auditService.logFailure('database', 'restore', 'RESTORE', err);
      throw err;
    }
  },

  /**
   * Reset local IndexedDB to official divisional baseline master records
   */
  async resetToBaselineDatasets(initialDatasets = {}) {
    await Promise.all([
      repositories.financialYears.clear(),
      repositories.subdivisions.clear(),
      repositories.workOrders.clear(),
      repositories.agreements.clear(),
      repositories.billing.clear(),
      repositories.fmdSd.clear(),
    ]);

    await this.initLocalStorage(initialDatasets);
    return await this.loadAllFromLocal();
  },

  // Backwards compatibility alias
  async resetToDemoDatasets(initialDatasets = {}) {
    return await this.resetToBaselineDatasets(initialDatasets);
  },

  /**
   * Inspect current local IndexedDB storage statistics across the six business modules
   */
  async getStorageStats() {
    try {
      const [fy, wo, agr, bill, sub, fmd] = await Promise.all([
        repositories.financialYears.count(),
        repositories.workOrders.count(),
        repositories.agreements.count(),
        repositories.billing.count(),
        repositories.subdivisions.count(),
        repositories.fmdSd.count(),
      ]);

      return {
        financialYears: fy,
        workOrders: wo,
        agreements: agr,
        billing: bill,
        subdivisions: sub,
        fmdSd: fmd,
        total: fy + wo + agr + bill + sub + fmd,
      };
    } catch (err) {
      return { error: err.message, total: 0 };
    }
  },
};
