import express from 'express';
import {
  getFmdSdList,
  getFmdSdById,
  createFmdSd,
  updateFmdSd,
  deleteFmdSd,
  uploadFileDocument,
  downloadDocument,
  viewDocument,
  downloadFmdSdDocx,
  deleteDocumentMetadata,
} from '../controllers/fmdSdController.js';
import { validate } from '../middleware/validate.js';
import { fmdSdCreateSchema, fmdSdUpdateSchema } from '../validators/fmdSdValidator.js';
import { upload } from '../services/fileStorageService.js';

const router = express.Router();

router.get('/', getFmdSdList);
router.get('/:id', getFmdSdById);
router.get('/:id/docx', downloadFmdSdDocx);
router.post('/', validate(fmdSdCreateSchema), createFmdSd);
router.put('/:id', validate(fmdSdUpdateSchema), updateFmdSd);
router.patch('/:id', validate(fmdSdUpdateSchema), updateFmdSd);
router.delete('/:id', deleteFmdSd);

// Real file upload endpoint
router.post('/:id/upload', upload.single('file'), uploadFileDocument);

// Document download and inline view endpoints
router.get('/:id/documents/:docId/download', downloadDocument);
router.get('/:id/documents/:docId/view', viewDocument);
router.delete('/:id/documents/:docId', deleteDocumentMetadata);

export default router;
