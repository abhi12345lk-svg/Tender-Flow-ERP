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

      // 4. Billing (Baseline v1)
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

    // Version 2 Upgrade: Corrects billing indexes to align with official invoiceNumber, invoiceDate, status
    this.version(2).stores({
      billing: '&id, invoiceNumber, billNumber, workOrderId, financialYear, invoiceDate, billDate, status, paymentStatus, totalAmount, netPayable, createdAt',
    }).upgrade((tx) => {
      // Safe, non-destructive migration callback to normalize existing records in-place
      return tx.table('billing').toCollection().modify((bill) => {
        if (!bill.invoiceNumber && bill.billNumber) bill.invoiceNumber = bill.billNumber;
        if (!bill.invoiceDate && bill.billDate) bill.invoiceDate = bill.billDate;
        if (!bill.status && bill.paymentStatus) bill.status = bill.paymentStatus;
        if (bill.totalAmount === undefined && bill.amount !== undefined) bill.totalAmount = bill.amount;
        if (bill.netPayable === undefined && bill.netPayableAmount !== undefined) bill.netPayable = bill.netPayableAmount;
      });
    });
  }
}

// Singleton database instance
export const db = new TenderFlowDatabase();
