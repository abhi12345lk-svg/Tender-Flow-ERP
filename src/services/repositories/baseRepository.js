import { generateId } from '../../utils/formatters.js';

/**
 * Base Repository providing unified CRUD abstraction over Dexie.js IndexedDB tables.
 * Decouples React UI components from low-level database operations.
 */
export class BaseRepository {
  /**
   * @param {import('dexie').Table} table - Dexie Table instance
   * @param {string} idPrefix - Prefix used when auto-generating local entity IDs
   */
  constructor(table, idPrefix = 'rec') {
    this.table = table;
    this.idPrefix = idPrefix;
  }

  /**
   * Fetch all records with optional in-memory filter
   */
  async getAll(filterFn = null) {
    const records = await this.table.toArray();
    if (typeof filterFn === 'function') {
      return records.filter(filterFn);
    }
    return records;
  }

  /**
   * Fetch a single record by primary key (id)
   */
  async getById(id) {
    if (!id) return null;
    return await this.table.get(id);
  }

  /**
   * Insert a new record into IndexedDB
   */
  async create(data) {
    const now = new Date().toISOString();
    const id = data.id || data._id || generateId(this.idPrefix);
    const record = {
      ...data,
      id,
      createdAt: data.createdAt || now,
      updatedAt: now,
    };

    await this.table.put(record);
    return record;
  }

  /**
   * Update an existing record in IndexedDB
   */
  async update(id, updates) {
    if (!id) throw new Error('Cannot update record without an ID');

    const existing = await this.table.get(id);
    if (!existing) {
      throw new Error(`Record with ID ${id} not found in local database`);
    }

    const updated = {
      ...existing,
      ...updates,
      id, // Preserve ID
      updatedAt: new Date().toISOString(),
    };

    await this.table.put(updated);
    return updated;
  }

  /**
   * Delete a record by ID
   */
  async delete(id) {
    if (!id) return false;
    await this.table.delete(id);
    return true;
  }

  /**
   * Bulk upsert records (useful for initial seeding or import)
   */
  async bulkPut(items) {
    if (!Array.isArray(items) || items.length === 0) return [];
    const now = new Date().toISOString();
    const normalized = items.map((item) => ({
      ...item,
      id: item.id || item._id || generateId(this.idPrefix),
      createdAt: item.createdAt || now,
      updatedAt: item.updatedAt || now,
    }));
    await this.table.bulkPut(normalized);
    return normalized;
  }

  /**
   * Count records in table
   */
  async count() {
    return await this.table.count();
  }

  /**
   * Clear all records in table
   */
  async clear() {
    return await this.table.clear();
  }
}
