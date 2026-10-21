import { BaseRepository } from './baseRepository.js';
import { db } from '../db/dexieDb.js';

/**
 * Repository for Module 2: Work Order
 */
export class WorkOrderRepository extends BaseRepository {
  constructor() {
    super(db.workOrders, 'wo');
  }

  /**
   * Filter work orders by Financial Year
   */
  async getByFinancialYear(fyLabel) {
    if (!fyLabel) return await this.getAll();
    return await this.table.where('financialYear').equals(fyLabel).toArray();
  }

  /**
   * Filter work orders by Subdivision ID
   */
  async getBySubdivision(subdivisionId) {
    if (!subdivisionId) return await this.getAll();
    return await this.table.where('subdivisionId').equals(subdivisionId).toArray();
  }

  /**
   * Find by Work Order Number
   */
  async getByWorkOrderNumber(woNum) {
    if (!woNum) return null;
    return await this.table.where('workOrderNumber').equals(woNum).first();
  }
}

export const workOrderRepo = new WorkOrderRepository();
