import { repositories } from './repositories/index.js';
import { api } from './apiClient.js';
import { syncService } from './sync/syncService.js';

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

  // Safe Cloud Sync & Reconciliation Service
  sync: syncService,

  /**
   * Prime IndexedDB with initial reference datasets if the local stores are empty.
   */
  async initLocalStorage(initialDatasets = {}) {
    try {
      const fyCount = await repositories.financialYears.count();
      if (fyCount === 0 && Array.isArray(initialDatasets.financialYears)) {
        await repositories.financialYears.bulkPut(initialDatasets.financialYears);
      }

      const subCount = await repositories.subdivisions.count();
      if (subCount === 0 && Array.isArray(initialDatasets.subdivisions)) {
        await repositories.subdivisions.bulkPut(initialDatasets.subdivisions);
      }

      const woCount = await repositories.workOrders.count();
      if (woCount === 0 && Array.isArray(initialDatasets.workOrders)) {
        await repositories.workOrders.bulkPut(initialDatasets.workOrders);
      }

      const agrCount = await repositories.agreements.count();
      if (agrCount === 0 && Array.isArray(initialDatasets.agreements)) {
        await repositories.agreements.bulkPut(initialDatasets.agreements);
      }

      const billCount = await repositories.billing.count();
      if (billCount === 0 && Array.isArray(initialDatasets.billingList)) {
        await repositories.billing.bulkPut(initialDatasets.billingList);
      }

      const fmdCount = await repositories.fmdSd.count();
      if (fmdCount === 0 && Array.isArray(initialDatasets.fmdList)) {
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
   * Restore/import verified JSON backup into local IndexedDB.
   */
  async importBackupJson(backupPayload) {
    if (!backupPayload || typeof backupPayload !== 'object') {
      throw new Error('Invalid backup file format: must be a valid JSON object');
    }

    const data = backupPayload.data || backupPayload;

    const results = {
      financialYears: 0,
      subdivisions: 0,
      workOrders: 0,
      agreements: 0,
      billingList: 0,
      fmdList: 0,
    };

    if (Array.isArray(data.financialYears) && data.financialYears.length > 0) {
      await repositories.financialYears.bulkPut(data.financialYears);
      results.financialYears = data.financialYears.length;
    }

    if (Array.isArray(data.subdivisions) && data.subdivisions.length > 0) {
      await repositories.subdivisions.bulkPut(data.subdivisions);
      results.subdivisions = data.subdivisions.length;
    }

    if (Array.isArray(data.workOrders) && data.workOrders.length > 0) {
      await repositories.workOrders.bulkPut(data.workOrders);
      results.workOrders = data.workOrders.length;
    }

    if (Array.isArray(data.agreements) && data.agreements.length > 0) {
      await repositories.agreements.bulkPut(data.agreements);
      results.agreements = data.agreements.length;
    }

    if (Array.isArray(data.billingList) && data.billingList.length > 0) {
      await repositories.billing.bulkPut(data.billingList);
      results.billingList = data.billingList.length;
    } else if (Array.isArray(data.billing) && data.billing.length > 0) {
      await repositories.billing.bulkPut(data.billing);
      results.billingList = data.billing.length;
    }

    if (Array.isArray(data.fmdList) && data.fmdList.length > 0) {
      await repositories.fmdSd.bulkPut(data.fmdList);
      results.fmdList = data.fmdList.length;
    } else if (Array.isArray(data.fmdSd) && data.fmdSd.length > 0) {
      await repositories.fmdSd.bulkPut(data.fmdSd);
      results.fmdList = data.fmdSd.length;
    }

    return results;
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
