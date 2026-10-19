import express from 'express';
import {
  getBillingList,
  getBillingById,
  createBilling,
  updateBilling,
  deleteBilling,
} from '../controllers/billingController.js';
import { validate } from '../middleware/validate.js';
import {
  billingCreateSchema,
  billingUpdateSchema,
} from '../validators/billingValidator.js';

const router = express.Router();

router.get('/', getBillingList);
router.get('/:id', getBillingById);
router.post('/', validate(billingCreateSchema), createBilling);
router.put('/:id', validate(billingUpdateSchema), updateBilling);
router.patch('/:id', validate(billingUpdateSchema), updateBilling);
router.delete('/:id', deleteBilling);

export default router;
