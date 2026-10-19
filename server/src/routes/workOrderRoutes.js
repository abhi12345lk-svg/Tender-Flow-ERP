import express from 'express';
import {
  getWorkOrders,
  getWorkOrderById,
  createWorkOrder,
  updateWorkOrder,
  deleteWorkOrder,
} from '../controllers/workOrderController.js';
import { validate } from '../middleware/validate.js';
import {
  workOrderCreateSchema,
  workOrderUpdateSchema,
} from '../validators/workOrderValidator.js';

const router = express.Router();

router.get('/', getWorkOrders);
router.get('/:id', getWorkOrderById);
router.post('/', validate(workOrderCreateSchema), createWorkOrder);
router.put('/:id', validate(workOrderUpdateSchema), updateWorkOrder);
router.patch('/:id', validate(workOrderUpdateSchema), updateWorkOrder);
router.delete('/:id', deleteWorkOrder);

export default router;
