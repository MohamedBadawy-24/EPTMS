import { Router } from 'express';
import { authenticate, authorize, validate } from '../../middleware/index.js';
import { loginSchema, registerSchema } from '@scb/shared';
import { authController } from './auth.controller.js';

// ─── Auth Routes ─────────────────────────────────────────────────────────────

const router = Router();

router.post(
  '/login',
  validate(loginSchema),
  authController.login,
);

router.post(
  '/register',
  authenticate,
  authorize('ADMIN'),
  validate(registerSchema),
  authController.register,
);

router.post(
  '/logout',
  authenticate,
  authController.logout,
);

router.get(
  '/me',
  authenticate,
  authController.me,
);

export const authRoutes = router;
