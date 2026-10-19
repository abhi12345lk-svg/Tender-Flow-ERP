import express from 'express';
import {
  getAgreements,
  getAgreementById,
  createAgreement,
  updateAgreement,
  deleteAgreement,
  downloadAgreementDocx,
} from '../controllers/agreementController.js';
import { validate } from '../middleware/validate.js';
import {
  agreementCreateSchema,
  agreementUpdateSchema,
} from '../validators/agreementValidator.js';

const router = express.Router();

router.get('/', getAgreements);
router.get('/:id', getAgreementById);
router.get('/:id/docx', downloadAgreementDocx);
router.post('/', validate(agreementCreateSchema), createAgreement);
router.put('/:id', validate(agreementUpdateSchema), updateAgreement);
router.patch('/:id', validate(agreementUpdateSchema), updateAgreement);
router.delete('/:id', deleteAgreement);

export default router;
