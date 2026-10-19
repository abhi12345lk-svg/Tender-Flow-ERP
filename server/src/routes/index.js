import express from 'express';
import authRoutes from './authRoutes.js';
import financialYearRoutes from './financialYearRoutes.js';
import workOrderRoutes from './workOrderRoutes.js';
import agreementRoutes from './agreementRoutes.js';
import billingRoutes from './billingRoutes.js';
import subdivisionRoutes from './subdivisionRoutes.js';
import fmdSdRoutes from './fmdSdRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/financial-years', financialYearRoutes);
router.use('/work-orders', workOrderRoutes);
router.use('/agreements', agreementRoutes);
router.use('/billing', billingRoutes);
router.use('/subdivisions', subdivisionRoutes);
router.use('/fmd-sd', fmdSdRoutes);

export default router;
