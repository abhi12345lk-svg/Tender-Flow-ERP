import express from 'express';
import { login, getMe, logout, setupInitialAdmin } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { loginSchema, setupAdminSchema } from '../validators/authValidator.js';

const router = express.Router();

router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/setup-initial-admin', validate(setupAdminSchema), setupInitialAdmin);
router.get('/me', requireAuth, getMe);
router.post('/logout', logout);

export default router;
