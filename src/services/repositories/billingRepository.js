import { BaseRepository } from './baseRepository.js';
import { db } from '../db/dexieDb.js';

/**
 * Repository for Module 4: Billing
 */
export class BillingRepository extends BaseRepository {
  constructor() {
    super(db.billing, 'bill');
  }

  /**
   * Filter bills by Work Order ID
   */
  async getByWorkOrder(workOrderId) {
    if (!workOrderId) return await this.getAll();
    return await this.table.where('workOrderId').equals(workOrderId).toArray();
  }

  /**
   * Filter bills by Financial Year
   */
  async getByFinancialYear(fyLabel) {
    if (!fyLabel) return await this.getAll();
    return await this.table.where('financialYear').equals(fyLabel).toArray();
  }

  /**
   * Compute billing aggregate statistics for a work order locally
   */
  async getSummaryForWorkOrder(workOrderId) {
    const bills = await this.getByWorkOrder(workOrderId);
    const totalGross = bills.reduce((sum, b) => sum + (Number(b.grossAmount) || 0), 0);
    const totalPassed = bills.reduce((sum, b) => sum + (Number(b.passedAmount) || 0), 0);
    const totalNet = bills.reduce((sum, b) => sum + (Number(b.netPayableAmount) || 0), 0);
    const count = bills.length;

    return {
      billCount: count,
      totalGross,
      totalPassed,
      totalNet,
      bills,
    };
  }
}

export const billingRepo = new BillingRepository();
