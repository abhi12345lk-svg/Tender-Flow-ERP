import express from 'express';
import authRoutes from './authRoutes.js';
import financialYearRoutes from './financialYearRoutes.js';
import workOrderRoutes from './workOrderRoutes.js';
import agreementRoutes from './agreementRoutes.js';
import billingRoutes from './billingRoutes.js';
import subdivisionRoutes from './subdivisionRoutes.js';
import fmdSdRoutes from './fmdSdRoutes.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Authentication and session endpoints (publicly accessible)
router.use('/auth', authRoutes);

// Protected Government Works Business Endpoints (Strictly require authenticated session)
router.use('/financial-years', requireAuth, financialYearRoutes);
router.use('/work-orders', requireAuth, workOrderRoutes);
router.use('/agreements', requireAuth, agreementRoutes);
router.use('/billing', requireAuth, billingRoutes);
router.use('/subdivisions', requireAuth, subdivisionRoutes);
router.use('/fmd-sd', requireAuth, fmdSdRoutes);

export default router;

