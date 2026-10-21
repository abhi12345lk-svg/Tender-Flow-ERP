import { BaseRepository } from './baseRepository.js';
import { db } from '../db/dexieDb.js';

/**
 * Repository for Module 6: FMD / SD
 */
export class FmdSdRepository extends BaseRepository {
  constructor() {
    super(db.fmdSd, 'fmd');
  }

  /**
   * Filter deposits by type ('FMD', 'SD', 'PBG')
   */
  async getByType(depositType) {
    if (!depositType) return await this.getAll();
    return await this.table.where('depositType').equals(depositType).toArray();
  }

  /**
   * Filter deposits by Tender Number
   */
  async getByTenderNumber(tenderNumber) {
    if (!tenderNumber) return await this.getAll();
    return await this.table.where('tenderNumber').equals(tenderNumber).toArray();
  }

  /**
   * Filter deposits by Work Order Number
   */
  async getByWorkOrderNumber(workOrderNumber) {
    if (!workOrderNumber) return await this.getAll();
    return await this.table.where('workOrderNumber').equals(workOrderNumber).toArray();
  }

  /**
   * Get active custody items
   */
  async getActiveCustody() {
    return await this.table.where('status').equals('Active').toArray();
  }
}

export const fmdSdRepo = new FmdSdRepository();
