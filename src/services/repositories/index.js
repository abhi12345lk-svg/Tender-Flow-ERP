import { db } from '../db/dexieDb.js';
import { financialYearRepo } from './financialYearRepository.js';
import { workOrderRepo } from './workOrderRepository.js';
import { agreementRepo } from './agreementRepository.js';
import { billingRepo } from './billingRepository.js';
import { subdivisionRepo } from './subdivisionRepository.js';
import { fmdSdRepo } from './fmdSdRepository.js';

/**
 * Unified Repositories registry for all six business modules
 */
export const repositories = {
  db,
  financialYears: financialYearRepo,
  workOrders: workOrderRepo,
  agreements: agreementRepo,
  billing: billingRepo,
  subdivisions: subdivisionRepo,
  fmdSd: fmdSdRepo,
};

export {
  db,
  financialYearRepo,
  workOrderRepo,
  agreementRepo,
  billingRepo,
  subdivisionRepo,
  fmdSdRepo,
};
