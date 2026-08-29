import { Router } from 'express';
import { authenticate, authorize, validate } from '../../middleware/index.js';
import {
  createProcurementSchema,
  updateProcurementSchema,
  procurementQuerySchema,
} from '@scb/shared';
import { procurementController } from './procurement.controller.js';

// ─── Procurement Routes ──────────────────────────────────────────────────────

const projectScopedRouter = Router({ mergeParams: true });
const directRouter = Router();

// ─── Project-scoped routes ───────────────────────────────────────────────────
projectScopedRouter.get(
  '/',
  authenticate,
  procurementController.getByProject,
);

projectScopedRouter.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(createProcurementSchema),
  procurementController.create,
);

// ─── Direct routes ───────────────────────────────────────────────────────────
directRouter.get(
  '/',
  authenticate,
  validate(procurementQuerySchema, 'query'),
  procurementController.getAll,
);

directRouter.get(
  '/:id',
  authenticate,
  procurementController.getById,
);

directRouter.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(updateProcurementSchema),
  procurementController.update,
);

directRouter.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  procurementController.delete,
);

export const procurementProjectRoutes = projectScopedRouter;
export const procurementDirectRoutes = directRouter;
