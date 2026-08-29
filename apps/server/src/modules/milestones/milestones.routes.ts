import { Router } from 'express';
import { authenticate, authorize, validate } from '../../middleware/index.js';
import {
  createMilestoneSchema,
  updateMilestoneSchema,
} from '@scb/shared';
import { milestoneController } from './milestones.controller.js';

// ─── Milestone Routes ────────────────────────────────────────────────────────
// Nested under /projects/:projectId/milestones for creation/listing.
// Direct /milestones/:id for update/delete.

const projectScopedRouter = Router({ mergeParams: true });
const directRouter = Router();

// ─── Project-scoped routes ───────────────────────────────────────────────────
projectScopedRouter.get(
  '/',
  authenticate,
  milestoneController.getByProject,
);

projectScopedRouter.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(createMilestoneSchema),
  milestoneController.create,
);

// ─── Direct routes ───────────────────────────────────────────────────────────
directRouter.get(
  '/:id',
  authenticate,
  milestoneController.getById,
);

directRouter.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(updateMilestoneSchema), // ← Layer 1: .strict() rejects baselineDate
  milestoneController.update,
);

directRouter.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  milestoneController.delete,
);

export const milestoneProjectRoutes = projectScopedRouter;
export const milestoneDirectRoutes = directRouter;
