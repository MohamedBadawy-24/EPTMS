import { Router } from 'express';
import { authenticate, authorize, validate } from '../../middleware/index.js';
import {
  createContractorSchema,
  updateContractorSchema,
  contractorQuerySchema,
} from '@scb/shared';
import { contractorController } from './contractors.controller.js';

// ─── Contractor Routes ───────────────────────────────────────────────────────

const router = Router();

router.get(
  '/',
  authenticate,
  validate(contractorQuerySchema, 'query'),
  contractorController.getAll,
);

router.get(
  '/:id',
  authenticate,
  contractorController.getById,
);

router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(createContractorSchema),
  contractorController.create,
);

router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(updateContractorSchema),
  contractorController.update,
);

router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  contractorController.delete,
);

export const contractorRoutes = router;
