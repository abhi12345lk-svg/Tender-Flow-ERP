import { BaseRepository } from './baseRepository.js';
import { db } from '../db/dexieDb.js';

/**
 * Repository for Module 1: Financial Year
 */
export class FinancialYearRepository extends BaseRepository {
  constructor() {
    super(db.financialYears, 'fy');
  }

  /**
   * Get the currently active Financial Year
   */
  async getActive() {
    const all = await this.getAll();
    return all.find((fy) => fy.isCurrent) || all[0] || null;
  }

  /**
   * Mark a specific FY as the active operating year and unset others
   */
  async setActive(id) {
    const all = await this.getAll();
    for (const fy of all) {
      const isTarget = fy.id === id || fy._id === id;
      if (fy.isCurrent !== isTarget) {
        await this.update(fy.id, { isCurrent: isTarget });
      }
    }
    return await this.getById(id);
  }

  /**
   * Find by label (e.g. "2024-2025")
   */
  async getByLabel(label) {
    if (!label) return null;
    return await this.table.where('label').equals(label).first();
  }
}

export const financialYearRepo = new FinancialYearRepository();
