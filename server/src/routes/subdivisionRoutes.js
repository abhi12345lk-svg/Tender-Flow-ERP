import express from 'express';
import {
  getSubdivisions,
  getSubdivisionById,
  createSubdivision,
  updateSubdivision,
  deleteSubdivision,
} from '../controllers/subdivisionController.js';
import { validate } from '../middleware/validate.js';
import {
  subdivisionCreateSchema,
  subdivisionUpdateSchema,
} from '../validators/subdivisionValidator.js';

const router = express.Router();

router.get('/', getSubdivisions);
router.get('/:id', getSubdivisionById);
router.post('/', validate(subdivisionCreateSchema), createSubdivision);
router.put('/:id', validate(subdivisionUpdateSchema), updateSubdivision);
router.patch('/:id', validate(subdivisionUpdateSchema), updateSubdivision);
router.delete('/:id', deleteSubdivision);

export default router;
