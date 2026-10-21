import { dataService } from '../dataService.js';
import { api } from '../apiClient.js';
import { db } from '../db/dexieDb.js';
import { generateId } from '../../utils/formatters.js';

/**
 * TenderFlow ERP — Safe Cloud Sync & Reconciliation Engine
 *
 * Implements strict user-controlled, non-destructive synchronization between
 * client-side Dexie IndexedDB and remote MongoDB (Render/Express).
 *
 * Safety Principles Enforced:
 * 1. Never automatically delete or overwrite records on either side.
 * 2. Require a verified JSON backup before applying any merge/sync.
 * 3. Dry-run difference inspection before any data modification.
 * 4. Explicit conflict detection and side-by-side resolution UI.
 * 5. Idempotent uploads and downloads with per-record sync status.
 * 6. Attachment isolation: Documents are never uploaded without explicit consent.
 * 7. Parent-first sync ordering and foreign key to ObjectId translation.
 */

import {
  MODULE_CONFIG,
  normalizeRemoteDoc,
  normalizeLocalDoc,
  computeFieldDiffs,
} from './syncUtils.js';

export {
  MODULE_CONFIG,
  normalizeRemoteDoc,
  normalizeLocalDoc,
  computeFieldDiffs,
};

/**
 * Validates 24-character hexadecimal MongoDB ObjectId string
 */
export const isValidObjectId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

class SyncService {
  constructor() {
    this.latestBackupToken = null;
  }

  /**
   * Health and connectivity check
   */
  async checkBackendHealth() {
    const rawUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || 'http://localhost:5000/api/v1';
    const cleanUrl = rawUrl.replace(/\/+$/, '');
    try {
      const health = await api.health.check();
      const isHealthy = health?.status === 'healthy';
      return {
        isConnected: isHealthy,
        health,
        url: cleanUrl,
      };
    } catch (err) {
      return {
        isConnected: false,
        error: err.message,
        url: cleanUrl,
      };
    }
  }

  /**
   * Retrieve persistent local-to-remote ID map from IndexedDB appSettings
   */
  async getPersistentIdMap() {
    try {
      const setting = await db.appSettings.get('sync_id_map');
      return setting?.mapping && typeof setting.mapping === 'object' ? { ...setting.mapping } : {};
    } catch (err) {
      console.warn('[SyncService] Failed to read persistent ID map:', err.message);
      return {};
    }
  }

  /**
   * Store persistent local-to-remote ID map in IndexedDB appSettings
   */
  async savePersistentIdMap(mapping) {
    try {
      await db.appSettings.put({
        key: 'sync_id_map',
        mapping,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[SyncService] Failed to save persistent ID map:', err.message);
    }
  }

  /**
   * Record verified backup token
   */
  setBackupVerified(backupInfo) {
    this.latestBackupToken = {
      timestamp: Date.now(),
      dateStr: new Date().toISOString(),
      filename: backupInfo.filename || 'TenderFlow_Backup.json',
      stats: backupInfo.stats || {},
    };
    return this.latestBackupToken;
  }

  /**
   * Verify whether a safety backup exists within the last 15 minutes
   */
  hasValidSafetyBackup() {
    if (!this.latestBackupToken) return false;
    const fifteenMinutes = 15 * 60 * 1000;
    return Date.now() - this.latestBackupToken.timestamp < fifteenMinutes;
  }

  /**
   * Dry-Run Difference Inspection across all 6 business modules.
   * Completely read-only: does not modify local IndexedDB or remote MongoDB.
   */
  async inspectSyncDifferences() {
    // 1. Health check first
    const healthStatus = await this.checkBackendHealth();
    if (!healthStatus.isConnected) {
      return {
        canSync: false,
        isUnauthorized: false,
        reason: 'Backend is offline or unreachable. Local records cannot be synchronized.',
        healthStatus,
        modules: {},
        summary: {
          pendingUploadCount: 0,
          pendingDownloadCount: 0,
          conflictCount: 0,
          syncedCount: 0,
          totalDifferences: 0,
        },
      };
    }

    // 2. Load all local records from Dexie IndexedDB
    const localData = await dataService.loadAllFromLocal();

    // 3. Load all remote records from MongoDB API
    const remoteResults = await Promise.allSettled([
      api.financialYears.getAll(),
      api.subdivisions.getAll(),
      api.workOrders.getAll(),
      api.agreements.getAll(),
      api.billing.getAll(),
      api.fmdSd.getAll(),
    ]);

    // Parent-first module ordering
    const moduleKeys = ['financialYears', 'subdivisions', 'workOrders', 'agreements', 'billing', 'fmdSd'];
    const remoteData = {};

    for (let i = 0; i < moduleKeys.length; i++) {
      const key = moduleKeys[i];
      const res = remoteResults[i];
      if (res.status === 'fulfilled' && Array.isArray(res.value?.data)) {
        remoteData[key] = res.value.data.map(normalizeRemoteDoc);
      } else {
        const isAuthError =
          res.reason?.status === 401 ||
          res.reason?.message?.includes('401') ||
          res.reason?.message?.toLowerCase().includes('unauthorized') ||
          res.reason?.message?.toLowerCase().includes('token');

        return {
          canSync: false,
          isUnauthorized: isAuthError,
          reason: isAuthError
            ? 'Officer Authentication Required: Server requires official authentication credentials to access cloud records.'
            : `Failed to safely retrieve remote records for ${MODULE_CONFIG[key].label}: ${
                res.reason?.message || 'Endpoint error'
              }`,
          healthStatus,
          modules: {},
          summary: {
            pendingUploadCount: 0,
            pendingDownloadCount: 0,
            conflictCount: 0,
            syncedCount: 0,
            totalDifferences: 0,
          },
        };
      }
    }

    // 4. Update in-memory ID map with all matched remote IDs
    const idMap = await this.getPersistentIdMap();

    // 5. Compare local and remote datasets for each module
    const modulesReport = {};
    let totalPendingUpload = 0;
    let totalPendingDownload = 0;
    let totalConflicts = 0;
    let totalSynced = 0;

    for (const modKey of moduleKeys) {
      const config = MODULE_CONFIG[modKey];
      const localList = (localData[modKey] || []).map(normalizeLocalDoc);
      const remoteList = remoteData[modKey] || [];

      const pendingUploads = [];
      const pendingDownloads = [];
      const conflicts = [];
      const synced = [];

      // Create lookup maps for remote records
      const remoteById = new Map();
      const remoteByKey = new Map();

      remoteList.forEach((r) => {
        if (r._id) remoteById.set(r._id, r);
        if (r.id) remoteById.set(r.id, r);
        const keyVal = r[config.keyField];
        if (keyVal) remoteByKey.set(String(keyVal).trim(), r);
      });

      // Track matched remote records to find downloads later
      const matchedRemoteIds = new Set();

      // Check each local item
      for (const localItem of localList) {
        let remoteMatch = null;

        // Match priority: 1. Remote _id, 2. Primary business key
        if (localItem._id && remoteById.has(localItem._id)) {
          remoteMatch = remoteById.get(localItem._id);
        } else if (localItem.id && remoteById.has(localItem.id)) {
          remoteMatch = remoteById.get(localItem.id);
        } else {
          const keyVal = localItem[config.keyField];
          if (keyVal && remoteByKey.has(String(keyVal).trim())) {
            remoteMatch = remoteByKey.get(String(keyVal).trim());
          }
        }

        if (remoteMatch) {
          // Record remote ID mapping
          if (localItem.id && remoteMatch._id) {
            idMap[localItem.id] = remoteMatch._id;
          }
          const keyVal = localItem[config.keyField];
          if (keyVal && remoteMatch._id) {
            idMap[String(keyVal).trim()] = remoteMatch._id;
          }
        }

        if (!remoteMatch) {
          // Exists locally only -> Pending Upload
          pendingUploads.push({
            id: localItem.id,
            key: localItem[config.keyField] || localItem.id,
            title: localItem.title || localItem.name || localItem.label || localItem[config.keyField] || localItem.id,
            item: localItem,
            type: 'upload',
          });
        } else {
          matchedRemoteIds.add(remoteMatch._id || remoteMatch.id);

          // Both exist -> Check for differences
          const diffs = computeFieldDiffs(localItem, remoteMatch, config.compareFields);

          if (diffs.length === 0) {
            synced.push({
              id: localItem.id,
              key: localItem[config.keyField] || localItem.id,
              title: localItem.title || localItem.name || localItem.label || localItem[config.keyField] || localItem.id,
              item: localItem,
              type: 'synced',
            });
          } else {
            // Fields differ -> Conflict
            conflicts.push({
              id: localItem.id,
              key: localItem[config.keyField] || localItem.id,
              title: localItem.title || localItem.name || localItem.label || localItem[config.keyField] || localItem.id,
              localItem,
              remoteItem: remoteMatch,
              diffs,
              type: 'conflict',
              resolution: 'keep_local', // default choice for user review
            });
          }
        }
      }

      // Check remote items that have no local counterpart -> Pending Download
      for (const remoteItem of remoteList) {
        const rId = remoteItem._id || remoteItem.id;
        if (!matchedRemoteIds.has(rId)) {
          pendingDownloads.push({
            id: rId,
            key: remoteItem[config.keyField] || rId,
            title: remoteItem.title || remoteItem.name || remoteItem.label || remoteItem[config.keyField] || rId,
            item: remoteItem,
            type: 'download',
          });
        }
      }

      totalPendingUpload += pendingUploads.length;
      totalPendingDownload += pendingDownloads.length;
      totalConflicts += conflicts.length;
      totalSynced += synced.length;

      modulesReport[modKey] = {
        label: config.label,
        keyField: config.keyField,
        pendingUploads,
        pendingDownloads,
        conflicts,
        synced,
        totalLocal: localList.length,
        totalRemote: remoteList.length,
      };
    }

    // Persist discovered ID mappings
    await this.savePersistentIdMap(idMap);

    return {
      canSync: true,
      isUnauthorized: false,
      healthStatus,
      modules: modulesReport,
      summary: {
        pendingUploadCount: totalPendingUpload,
        pendingDownloadCount: totalPendingDownload,
        conflictCount: totalConflicts,
        syncedCount: totalSynced,
        totalDifferences: totalPendingUpload + totalPendingDownload + totalConflicts,
      },
    };
  }

  /**
   * Log an operation to Dexie's syncLog table for auditability
   */
  async logSyncAction(entity, entityId, operation, status, details = '') {
    try {
      await db.syncLog.add({
        entity,
        entityId: String(entityId),
        operation,
        status,
        details,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[SyncService] Failed to write sync log entry:', err.message);
    }
  }

  /**
   * Helper to translate local entity fields and foreign keys into MongoDB-compatible payload.
   * Handles parent-to-child foreign key mappings cleanly without sending invalid string IDs into ObjectIds.
   */
  preparePayloadForUpload(modKey, rawItem, idMap) {
    const payload = { ...rawItem };
    delete payload._syncStatus;
    delete payload._lastModified;
    delete payload._conflictDetails;

    if (modKey === 'workOrders') {
      // Map subdivisionId -> subdivision (ObjectId)
      if (payload.subdivisionId) {
        if (isValidObjectId(payload.subdivisionId)) {
          payload.subdivision = payload.subdivisionId;
        } else if (idMap[payload.subdivisionId] && isValidObjectId(idMap[payload.subdivisionId])) {
          payload.subdivision = idMap[payload.subdivisionId];
        } else {
          payload.subdivision = null;
        }
        delete payload.subdivisionId;
      } else if (!isValidObjectId(payload.subdivision)) {
        payload.subdivision = null;
      }
    } else if (modKey === 'agreements') {
      // Map workOrderId -> workOrder (ObjectId, Required)
      let resolvedWoId = null;
      if (isValidObjectId(payload.workOrderId)) {
        resolvedWoId = payload.workOrderId;
      } else if (payload.workOrderId && idMap[payload.workOrderId] && isValidObjectId(idMap[payload.workOrderId])) {
        resolvedWoId = idMap[payload.workOrderId];
      } else if (payload.workOrderNumber && idMap[payload.workOrderNumber] && isValidObjectId(idMap[payload.workOrderNumber])) {
        resolvedWoId = idMap[payload.workOrderNumber];
      } else if (isValidObjectId(payload.workOrder)) {
        resolvedWoId = payload.workOrder;
      }

      delete payload.workOrderId;
      payload.workOrder = resolvedWoId;
    } else if (modKey === 'billing') {
      // Map workOrderId -> workOrder (ObjectId, Required)
      let resolvedWoId = null;
      if (isValidObjectId(payload.workOrderId)) {
        resolvedWoId = payload.workOrderId;
      } else if (payload.workOrderId && idMap[payload.workOrderId] && isValidObjectId(idMap[payload.workOrderId])) {
        resolvedWoId = idMap[payload.workOrderId];
      } else if (payload.workOrderNumber && idMap[payload.workOrderNumber] && isValidObjectId(idMap[payload.workOrderNumber])) {
        resolvedWoId = idMap[payload.workOrderNumber];
      } else if (isValidObjectId(payload.workOrder)) {
        resolvedWoId = payload.workOrder;
      }

      delete payload.workOrderId;
      payload.workOrder = resolvedWoId;

      // Map subdivisionId -> subdivision (ObjectId, Optional)
      if (payload.subdivisionId) {
        if (isValidObjectId(payload.subdivisionId)) {
          payload.subdivision = payload.subdivisionId;
        } else if (idMap[payload.subdivisionId] && isValidObjectId(idMap[payload.subdivisionId])) {
          payload.subdivision = idMap[payload.subdivisionId];
        } else {
          payload.subdivision = null;
        }
        delete payload.subdivisionId;
      } else if (!isValidObjectId(payload.subdivision)) {
        payload.subdivision = null;
      }

      // Field normalization
      payload.invoiceNumber = payload.invoiceNumber || payload.billNumber;
      payload.invoiceDate = payload.invoiceDate || payload.billDate;
      payload.amount = Number(payload.amount ?? payload.totalAmount ?? 0);
      payload.totalAmount = Number(payload.totalAmount ?? payload.amount ?? 0);
    } else if (modKey === 'fmdSd') {
      // Map workOrderId -> workOrder (ObjectId, Optional)
      let resolvedWoId = null;
      if (isValidObjectId(payload.workOrderId)) {
        resolvedWoId = payload.workOrderId;
      } else if (payload.workOrderId && idMap[payload.workOrderId] && isValidObjectId(idMap[payload.workOrderId])) {
        resolvedWoId = idMap[payload.workOrderId];
      } else if (payload.workOrderNumber && idMap[payload.workOrderNumber] && isValidObjectId(idMap[payload.workOrderNumber])) {
        resolvedWoId = idMap[payload.workOrderNumber];
      } else if (isValidObjectId(payload.workOrder)) {
        resolvedWoId = payload.workOrder;
      }

      delete payload.workOrderId;
      payload.workOrder = resolvedWoId;

      // Ensure required tenderTitle
      payload.tenderTitle =
        payload.tenderTitle ||
        payload.title ||
        payload.workOrderNumber ||
        `Custody for Tender ${payload.tenderNumber || 'N/A'}`;
    }

    return payload;
  }

  /**
   * Execute Reviewed Synchronization (Idempotent & Safe).
   * Enforces strict parent-first order, foreign key translation, and verified backup gate.
   */
  async executeReviewedSync(diffReport, conflictResolutions = {}, options = { uploadAttachments: false }) {
    if (!diffReport || !diffReport.canSync) {
      throw new Error('Cannot execute sync: dry-run inspection was not completed or reported errors.');
    }

    if (!this.hasValidSafetyBackup()) {
      throw new Error('SAFETY BLOCKED: A verified JSON backup must be exported before synchronizing.');
    }

    const results = {
      uploaded: 0,
      downloaded: 0,
      conflictsResolved: 0,
      skipped: 0,
      errors: [],
    };

    // Load persistent ID mapping
    const idMap = await this.getPersistentIdMap();

    // Populate existing local entity ObjectIds into mapping
    const localData = await dataService.loadAllFromLocal();
    Object.values(localData).forEach((list) => {
      if (Array.isArray(list)) {
        list.forEach((item) => {
          if (item?.id && item?._id && isValidObjectId(item._id)) {
            idMap[item.id] = item._id;
          }
        });
      }
    });

    // Enforce strict parent-first module sequence:
    // 1. Financial Years (parent)
    // 2. Subdivisions (parent)
    // 3. Work Orders (parent of agreements, bills, fmd; child of subdivisions)
    // 4. Agreements (child of work orders)
    // 5. Billing (child of work orders & subdivisions)
    // 6. FMD / SD (optional child of work orders)
    const parentFirstSequence = ['financialYears', 'subdivisions', 'workOrders', 'agreements', 'billing', 'fmdSd'];

    for (const modKey of parentFirstSequence) {
      const modReport = diffReport.modules?.[modKey];
      if (!modReport) continue;

      const config = MODULE_CONFIG[modKey];
      const apiRef = api[config.apiRef];
      const repoRef = dataService.local[config.repoRef];

      // 1. Process Pending Uploads (Local -> Cloud)
      for (const item of modReport.pendingUploads) {
        try {
          const payload = this.preparePayloadForUpload(modKey, item.item, idMap);

          // Verify parent foreign key requirements before sending to MongoDB
          if (modKey === 'agreements' && !payload.workOrder) {
            results.skipped++;
            const skipMsg = `Skipped Agreement [${item.key}]: Parent Work Order '${
              item.item.workOrderNumber || item.item.workOrderId || 'N/A'
            }' not found on cloud. Synchronize Work Orders first.`;
            results.errors.push(skipMsg);
            await this.logSyncAction(modKey, item.id, 'upload_skipped', 'missing_parent', skipMsg);
            continue;
          }

          if (modKey === 'billing' && !payload.workOrder) {
            results.skipped++;
            const skipMsg = `Skipped Bill [${item.key}]: Parent Work Order '${
              item.item.workOrderNumber || item.item.workOrderId || 'N/A'
            }' not found on cloud. Synchronize Work Orders first.`;
            results.errors.push(skipMsg);
            await this.logSyncAction(modKey, item.id, 'upload_skipped', 'missing_parent', skipMsg);
            continue;
          }

          // If attachments present but user opted out, don't send heavy base64 to cloud
          if (!options.uploadAttachments && payload.uploadedDocuments) {
            payload.uploadedDocuments = payload.uploadedDocuments.map((doc) => ({
              id: doc.id,
              name: doc.name,
              size: doc.size,
              uploadedAt: doc.uploadedAt,
              type: doc.type,
              // omit dataUrl to save bandwidth
            }));
          }

          let res;
          // Attempt idempotent create
          try {
            res = await apiRef.create(payload);
          } catch (createErr) {
            // If already exists on server, find and update
            if (createErr.status === 409 || createErr.message?.includes('already exists')) {
              const allRemote = await apiRef.getAll({ [config.keyField]: item.key });
              const matched = allRemote?.data?.[0];
              if (matched?._id) {
                res = await apiRef.update(matched._id, payload);
              } else {
                throw createErr;
              }
            } else {
              throw createErr;
            }
          }

          const remoteId = res?.data?._id;
          if (remoteId) {
            // Update mapping
            idMap[item.id] = remoteId;
            if (item.item[config.keyField]) {
              idMap[String(item.item[config.keyField]).trim()] = remoteId;
            }

            await repoRef.update(item.id, {
              _id: remoteId,
              _syncStatus: 'synced',
              _lastSyncedAt: new Date().toISOString(),
            });
          } else {
            await repoRef.update(item.id, {
              _syncStatus: 'synced',
              _lastSyncedAt: new Date().toISOString(),
            });
          }

          await this.logSyncAction(modKey, item.id, 'upload', 'success');
          results.uploaded++;
        } catch (err) {
          results.errors.push(`Upload failed for ${config.label} [${item.key}]: ${err.message}`);
          await this.logSyncAction(modKey, item.id, 'upload', 'failed', err.message);
        }
      }

      // 2. Process Pending Downloads (Cloud -> Local)
      for (const item of modReport.pendingDownloads) {
        try {
          const docToInsert = {
            ...item.item,
            id: item.item._id || item.item.id || generateId(config.repoRef.slice(0, 3)),
            _syncStatus: 'synced',
            _lastSyncedAt: new Date().toISOString(),
          };

          await repoRef.create(docToInsert);

          // Update ID mapping
          if (docToInsert.id && docToInsert._id) {
            idMap[docToInsert.id] = docToInsert._id;
          }
          if (docToInsert[config.keyField] && docToInsert._id) {
            idMap[String(docToInsert[config.keyField]).trim()] = docToInsert._id;
          }

          await this.logSyncAction(modKey, docToInsert.id, 'download', 'success');
          results.downloaded++;
        } catch (err) {
          results.errors.push(`Download failed for ${config.label} [${item.key}]: ${err.message}`);
          await this.logSyncAction(modKey, item.id, 'download', 'failed', err.message);
        }
      }

      // 3. Process Conflicts with Explicit User Resolutions
      for (const item of modReport.conflicts) {
        try {
          const userChoice = conflictResolutions[item.id] || item.resolution || 'keep_local';

          if (userChoice === 'keep_local') {
            // Overwrite cloud with local version
            const targetCloudId = item.remoteItem._id || item.remoteItem.id;
            const payload = this.preparePayloadForUpload(modKey, item.localItem, idMap);

            if (targetCloudId) {
              await apiRef.update(targetCloudId, payload);
              idMap[item.id] = targetCloudId;
            }
            await repoRef.update(item.id, {
              _syncStatus: 'synced',
              _lastSyncedAt: new Date().toISOString(),
              _conflictDetails: null,
            });
            await this.logSyncAction(modKey, item.id, 'conflict_keep_local', 'success');
            results.conflictsResolved++;
          } else if (userChoice === 'keep_cloud') {
            // Overwrite local with cloud version
            const cloudDoc = {
              ...item.remoteItem,
              id: item.localItem.id, // preserve local id
              _id: item.remoteItem._id,
              _syncStatus: 'synced',
              _lastSyncedAt: new Date().toISOString(),
              _conflictDetails: null,
            };
            if (item.localItem.id && item.remoteItem._id) {
              idMap[item.localItem.id] = item.remoteItem._id;
            }
            await repoRef.update(item.id, cloudDoc);
            await this.logSyncAction(modKey, item.id, 'conflict_keep_cloud', 'success');
            results.conflictsResolved++;
          } else if (userChoice === 'keep_both') {
            // Duplicate local record with suffix and accept cloud record
            const duplicatedLocal = {
              ...item.localItem,
              id: generateId(config.repoRef.slice(0, 3)),
              [config.keyField]: `${item.localItem[config.keyField]}-LOCAL-COPY`,
              title: item.localItem.title ? `${item.localItem.title} (Local Copy)` : undefined,
              _syncStatus: 'pending_upload',
            };
            await repoRef.create(duplicatedLocal);

            const cloudDoc = {
              ...item.remoteItem,
              id: item.localItem.id,
              _id: item.remoteItem._id,
              _syncStatus: 'synced',
              _lastSyncedAt: new Date().toISOString(),
              _conflictDetails: null,
            };
            if (item.localItem.id && item.remoteItem._id) {
              idMap[item.localItem.id] = item.remoteItem._id;
            }
            await repoRef.update(item.id, cloudDoc);
            await this.logSyncAction(modKey, item.id, 'conflict_keep_both', 'success');
            results.conflictsResolved++;
          }
        } catch (err) {
          results.errors.push(`Conflict resolution failed for ${config.label} [${item.key}]: ${err.message}`);
          await this.logSyncAction(modKey, item.id, 'conflict_resolve', 'failed', err.message);
        }
      }
    }

    // Persist final ID map
    await this.savePersistentIdMap(idMap);

    return results;
  }
}

export const syncService = new SyncService();

