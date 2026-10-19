import express from 'express';
import {
  getFmdSdList,
  getFmdSdById,
  createFmdSd,
  updateFmdSd,
  deleteFmdSd,
  addDocumentMetadata,
  deleteDocumentMetadata,
} from '../controllers/fmdSdController.js';
import { validate } from '../middleware/validate.js';
import { fmdSdCreateSchema, fmdSdUpdateSchema } from '../validators/fmdSdValidator.js';

const router = express.Router();

router.get('/', getFmdSdList);
router.get('/:id', getFmdSdById);
router.post('/', validate(fmdSdCreateSchema), createFmdSd);
router.put('/:id', validate(fmdSdUpdateSchema), updateFmdSd);
router.patch('/:id', validate(fmdSdUpdateSchema), updateFmdSd);
router.delete('/:id', deleteFmdSd);

// Document metadata endpoints
router.post('/:id/documents', addDocumentMetadata);
router.delete('/:id/documents/:docId', deleteDocumentMetadata);

export default router;
