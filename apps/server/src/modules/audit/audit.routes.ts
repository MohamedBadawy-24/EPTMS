import { Router } from 'express';
import { authenticate, authorize, validate } from '../../middleware/index.js';
import { auditQuerySchema } from '@scb/shared';
import { auditController } from './audit.controller.js';

// ─── Audit Routes ────────────────────────────────────────────────────────────
// All audit routes require ADMIN role.

const router = Router();

router.get(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(auditQuerySchema, 'query'),
  auditController.getAll,
);

export const auditRoutes = router;
