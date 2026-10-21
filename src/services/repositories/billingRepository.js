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
   * Filter single bill by Invoice Number using indexed key
   */
  async getByInvoiceNumber(invoiceNumber) {
    if (!invoiceNumber) return null;
    return await this.table.where('invoiceNumber').equals(invoiceNumber).first();
  }

  /**
   * Compute billing aggregate statistics for a work order locally using verified property names
   */
  async getSummaryForWorkOrder(workOrderId) {
    const bills = await this.getByWorkOrder(workOrderId);
    // Total Gross: sum of gross/total amounts across all submitted & passed bills
    const totalGross = bills.reduce((sum, b) => sum + (Number(b.totalAmount ?? b.grossAmount ?? b.amount) || 0), 0);
    // Total Passed: sum of bills officially reviewed and marked 'Passed'
    const totalPassed = bills.reduce((sum, b) => {
      const isPassed = b.status === 'Passed' || b.paymentStatus === 'Passed';
      return isPassed ? sum + (Number(b.totalAmount ?? b.passedAmount ?? b.amount) || 0) : sum;
    }, 0);
    // Total Net: sum of actual net payable after statutory deductions
    const totalNet = bills.reduce((sum, b) => sum + (Number(b.netPayable ?? b.netPayableAmount) || 0), 0);
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
