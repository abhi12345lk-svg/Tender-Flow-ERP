import { BaseRepository } from './baseRepository.js';
import { db } from '../db/dexieDb.js';

/**
 * Repository for Module 5: Subdivision
 */
export class SubdivisionRepository extends BaseRepository {
  constructor() {
    super(db.subdivisions, 'sub');
  }

  /**
   * Filter active subdivisions
   */
  async getActiveSubdivisions() {
    return await this.table.where('status').equals('Active').toArray();
  }

  /**
   * Find by Subdivision Code (e.g. "SD-CIVIL-01")
   */
  async getByCode(code) {
    if (!code) return null;
    return await this.table.where('code').equals(code).first();
  }
}

export const subdivisionRepo = new SubdivisionRepository();
