/**
 * TenderFlow ERP — Divisional Audit Trail Service
 *
 * Records auditable government actions across all six core modules:
 * - Create, update, delete, restore, and approved cloud sync actions.
 * - Captures: timestamp, authenticated actor, entity, record ID, action, changed-fields summary.
 * - Strictly strips secrets, tokens, and binary/dataUrl document payloads.
 * - Guards against misleading success entries on failed operations.
 */

import { db } from '../db/dexieDb.js';

// Sensitive keys that must NEVER be written to the audit trail
const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'bearerToken',
  'dataUrl',
  'uploadedDocuments',
  'fileContent',
  'buffer',
  'blob',
  'secret',
]);

/**
 * Strips sensitive keys and heavy binary payloads from an object
 */
export const sanitizeAuditData = (data) => {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    return data.slice(0, 10).map(sanitizeAuditData);
  }

  const cleaned = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEYS.has(key)) {
      cleaned[key] = '[REDACTED_FOR_AUDIT]';
    } else if (typeof value === 'object' && value !== null) {
      cleaned[key] = sanitizeAuditData(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
};

/**
 * Computes a human-readable list of changed fields between two records
 */
export const computeChangedFieldsSummary = (oldRecord, newRecord) => {
  if (!oldRecord || !newRecord) return null;

  const changes = [];
  const keys = new Set([...Object.keys(oldRecord), ...Object.keys(newRecord)]);

  for (const key of keys) {
    if (key.startsWith('_') || SENSITIVE_KEYS.has(key)) continue;

    const oldVal = oldRecord[key];
    const newVal = newRecord[key];

    // Simple comparison
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes.push({
        field: key,
        from: oldVal !== undefined ? String(oldVal).slice(0, 50) : null,
        to: newVal !== undefined ? String(newVal).slice(0, 50) : null,
      });
    }
  }

  return changes.length > 0 ? changes : null;
};

/**
 * Reads currently authenticated officer name/role from sessionStorage if available
 */
export const getActiveActor = () => {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const stored = window.sessionStorage.getItem('tenderflow_officer');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.name) return `${parsed.name} (${parsed.role || 'Officer'})`;
      }
    }
  } catch {
    // Ignore storage parse errors
  }
  return 'Divisional Officer';
};

class AuditService {
  /**
   * Primary audit log writer
   */
  async logAction({
    entity,
    recordId,
    action, // 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'SYNC'
    status = 'success', // 'success' | 'failed'
    actor = null,
    changedFields = null,
    details = '',
  }) {
    const effectiveActor = actor || getActiveActor();

    try {
      const entry = {
        entity: String(entity || 'system'),
        entityId: String(recordId || 'N/A'),
        operation: action,
        status: status === 'failed' ? 'FAILED' : 'SUCCESS',
        actor: effectiveActor,
        changedFields: changedFields ? sanitizeAuditData(changedFields) : null,
        details: typeof details === 'string' ? details : JSON.stringify(sanitizeAuditData(details)),
        timestamp: new Date().toISOString(),
      };

      // Persist in Dexie syncLog table
      if (db?.syncLog) {
        await db.syncLog.add(entry);
      }
      return entry;
    } catch (err) {
      console.warn('[AuditService] Failed to record audit log:', err.message);
      return null;
    }
  }

  // Safe helper for CREATE
  async logCreate(entity, recordId, recordData, actor = null) {
    const summary = recordData
      ? Object.entries(sanitizeAuditData(recordData))
          .filter(([k]) => !k.startsWith('_'))
          .slice(0, 5)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ')
      : '';

    return this.logAction({
      entity,
      recordId,
      action: 'CREATE',
      status: 'success',
      actor,
      details: summary ? `Created with initial values (${summary})` : 'New record created',
    });
  }

  // Safe helper for UPDATE
  async logUpdate(entity, recordId, oldRecord, newRecord, actor = null) {
    const diff = computeChangedFieldsSummary(oldRecord, newRecord);
    const diffSummary = diff ? diff.map((d) => `${d.field}: ${d.from} → ${d.to}`).join('; ') : 'Updated record';

    return this.logAction({
      entity,
      recordId,
      action: 'UPDATE',
      status: 'success',
      actor,
      changedFields: diff,
      details: diffSummary,
    });
  }

  // Safe helper for DELETE
  async logDelete(entity, recordId, recordData = null, actor = null) {
    return this.logAction({
      entity,
      recordId,
      action: 'DELETE',
      status: 'success',
      actor,
      details: recordData ? `Deleted record (${recordData.workOrderNumber || recordData.name || recordId})` : 'Record deleted',
    });
  }

  // Safe helper for RESTORE
  async logRestore(recordCount, details = '', actor = null) {
    return this.logAction({
      entity: 'database',
      recordId: 'bulk_restore',
      action: 'RESTORE',
      status: 'success',
      actor,
      details: `Restored ${recordCount} records from verified JSON backup. ${details}`.trim(),
    });
  }

  // Safe helper for APPROVED CLOUD SYNC
  async logApprovedSync(entity, recordId, operation, status = 'success', details = '', actor = null) {
    return this.logAction({
      entity,
      recordId,
      action: `SYNC_${operation.toUpperCase()}`,
      status,
      actor,
      details,
    });
  }

  // Helper for FAILED operations - ensures no misleading success entries
  async logFailure(entity, recordId, action, error, actor = null) {
    return this.logAction({
      entity,
      recordId,
      action,
      status: 'failed',
      actor,
      details: `FAILED: ${error?.message || String(error)}`,
    });
  }

  /**
   * Retrieve recent audit logs from IndexedDB
   */
  async getAuditLogs(limit = 100, entityFilter = null) {
    try {
      if (!db?.syncLog) return [];
      let query = db.syncLog.orderBy('id').reverse();
      const logs = await query.limit(limit).toArray();

      if (entityFilter) {
        return logs.filter((l) => l.entity === entityFilter);
      }
      return logs;
    } catch (err) {
      console.warn('[AuditService] Failed to load audit logs:', err.message);
      return [];
    }
  }

  /**
   * Clear audit logs (Admin only)
   */
  async clearAuditLogs() {
    try {
      if (db?.syncLog) {
        await db.syncLog.clear();
      }
      return true;
    } catch (err) {
      console.warn('[AuditService] Failed to clear audit logs:', err.message);
      return false;
    }
  }
}

export const auditService = new AuditService();
