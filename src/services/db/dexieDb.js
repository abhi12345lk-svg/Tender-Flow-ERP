import Dexie from 'dexie';

/**
 * TenderFlow ERP — IndexedDB Schema (Dexie.js)
 * High-performance local storage for offline-first government works records.
 * Covers all six core business modules plus local application settings and sync log.
 */
export class TenderFlowDatabase extends Dexie {
  constructor() {
    super('TenderFlowERP_DB');

    this.version(1).stores({
      // 1. Financial Year
      financialYears: '&id, label, status, isCurrent, createdAt',

      // 2. Work Order
      workOrders: '&id, workOrderNumber, tenderNumber, financialYear, subdivisionId, status, contractorName, createdAt',

      // 3. Agreement
      agreements: '&id, agreementNumber, workOrderId, tenderNumber, status, language, createdAt',

      // 4. Billing
      billing: '&id, billNumber, workOrderId, financialYear, billDate, paymentStatus, createdAt',

      // 5. Subdivision
      subdivisions: '&id, code, name, status, createdAt',

      // 6. FMD / SD
      fmdSd: '&id, depositType, tenderNumber, workOrderNumber, status, expiryDate, createdAt',

      // Application metadata & local preferences (e.g. active FY, layout state)
      appSettings: '&key, updatedAt',

      // Sync audit trail (foundation for future explicit consent-based synchronization)
      syncLog: '++id, entity, entityId, operation, status, timestamp',
    });
  }
}

// Singleton database instance
export const db = new TenderFlowDatabase();
