import express from 'express';
import {
  getFinancialYears,
  getFinancialYearById,
  createFinancialYear,
  updateFinancialYear,
  deleteFinancialYear,
  setActiveFinancialYear,
} from '../controllers/financialYearController.js';
import { validate } from '../middleware/validate.js';
import {
  financialYearCreateSchema,
  financialYearUpdateSchema,
} from '../validators/financialYearValidator.js';

const router = express.Router();

router.get('/', getFinancialYears);
router.get('/:id', getFinancialYearById);
router.post('/', validate(financialYearCreateSchema), createFinancialYear);
router.put('/:id', validate(financialYearUpdateSchema), updateFinancialYear);
router.patch('/:id', validate(financialYearUpdateSchema), updateFinancialYear);
router.delete('/:id', deleteFinancialYear);
router.patch('/:id/set-active', setActiveFinancialYear);

export default router;
