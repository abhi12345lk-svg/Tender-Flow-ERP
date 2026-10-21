import { BaseRepository } from './baseRepository.js';
import { db } from '../db/dexieDb.js';

/**
 * Repository for Module 3: Agreement
 */
export class AgreementRepository extends BaseRepository {
  constructor() {
    super(db.agreements, 'agr');
  }

  /**
   * Filter agreements by Work Order ID
   */
  async getByWorkOrder(workOrderId) {
    if (!workOrderId) return await this.getAll();
    return await this.table.where('workOrderId').equals(workOrderId).toArray();
  }

  /**
   * Find by Agreement Number
   */
  async getByAgreementNumber(agrNum) {
    if (!agrNum) return null;
    return await this.table.where('agreementNumber').equals(agrNum).first();
  }
}

export const agreementRepo = new AgreementRepository();
