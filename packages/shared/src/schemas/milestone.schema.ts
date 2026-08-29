import { z } from 'zod';
import { MILESTONE_STATUSES } from '../constants/status.constants.js';

// ─── Create ──────────────────────────────────────────────────────────────────
// baselineDate is REQUIRED on create — this is the only time it can be set.
export const createMilestoneSchema = z
  .object({
    projectId: z.string().uuid(),
    name: z.string().min(3).max(200),
    description: z.string().max(2000).optional(),
    baselineDate: z.coerce.date({
      required_error: 'Baseline date is required on milestone creation',
    }),
    forecastDate: z.coerce.date().optional(),
    actualDate: z.coerce.date().nullable().optional(),
    status: z.enum(MILESTONE_STATUSES).default('NOT_STARTED'),
  })
  .strict();

// ─── Update ──────────────────────────────────────────────────────────────────
// BASELINE IMMUTABILITY — LAYER 1 (Zod):
// The update schema uses .strict() and OMITS baselineDate entirely.
// Any payload that includes "baselineDate" will be rejected with a Zod error
// before it reaches the service layer.
export const updateMilestoneSchema = z
  .object({
    name: z.string().min(3).max(200).optional(),
    description: z.string().max(2000).optional(),
    forecastDate: z.coerce.date().optional(),
    actualDate: z.coerce.date().nullable().optional(),
    status: z.enum(MILESTONE_STATUSES).optional(),
  })
  .strict(); // ← .strict() ensures "baselineDate" in body → Zod error

// ─── Query ───────────────────────────────────────────────────────────────────
export const milestoneQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),
    status: z.enum(MILESTONE_STATUSES).optional(),
    overdue: z.coerce.boolean().optional(),
  })
  .strict();
