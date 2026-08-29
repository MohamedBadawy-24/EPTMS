import { Router } from 'express';
import { authenticate, authorize, validate } from '../../middleware/index.js';
import {
  createProjectSchema,
  updateProjectSchema,
  projectQuerySchema,
  createStoppageSchema,
  updateStoppageSchema,
} from '@scb/shared';
import { projectController } from './projects.controller.js';

// ─── Project Routes ──────────────────────────────────────────────────────────
// Strict middleware chain: authenticate → authorize('ADMIN') → validate → controller

const router = Router();

router.get(
  '/',
  authenticate,
  validate(projectQuerySchema, 'query'),
  projectController.getAll,
);

router.get(
  '/:id',
  authenticate,
  projectController.getById,
);

router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(createProjectSchema),
  projectController.create,
);

router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(updateProjectSchema),
  projectController.update,
);

router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  projectController.delete,
);

// ─── Stoppages & Dynamic Extensions Routes ────────────────────────────────────

router.get(
  '/:id/stoppages',
  authenticate,
  projectController.getStoppages,
);

router.post(
  '/:id/stoppages',
  authenticate,
  authorize('ADMIN'),
  validate(createStoppageSchema),
  projectController.createStoppage,
);

router.patch(
  '/:id/stoppages/:stoppageId',
  authenticate,
  authorize('ADMIN'),
  validate(updateStoppageSchema),
  projectController.updateStoppage,
);

router.delete(
  '/:id/stoppages/:stoppageId',
  authenticate,
  authorize('ADMIN'),
  projectController.deleteStoppage,
);

export const projectRoutes = router;
