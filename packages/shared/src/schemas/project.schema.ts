import { z } from 'zod';
import { PROJECT_STATUSES } from '../constants/status.constants.js';

// ─── Create ──────────────────────────────────────────────────────────────────
export const createProjectSchema = z
  .object({
    code: z
      .string()
      .min(2)
      .max(20)
      .regex(/^[A-Z0-9-]+$/, 'Code must be uppercase alphanumeric with dashes'),
    name: z.string().min(3).max(200),
    description: z.string().max(2000).optional(),
    status: z.enum(PROJECT_STATUSES).default('PLANNING'),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    contractValue: z.number().positive('Contract value must be positive'),
    finalCost: z.number().positive().nullable().optional(),
    createdBy: z.string().uuid().optional(), // Set by server from auth context
  })
  .strict()
  .refine((data) => data.endDate > data.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

// ─── Update ──────────────────────────────────────────────────────────────────
export const updateProjectSchema = z
  .object({
    name: z.string().min(3).max(200).optional(),
    description: z.string().max(2000).optional(),
    status: z.enum(PROJECT_STATUSES).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    contractValue: z.number().positive().optional(),
    finalCost: z.number().positive().nullable().optional(),
  })
  .strict();

// ─── Query Filters ───────────────────────────────────────────────────────────
export const projectQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().max(100).optional(),
    status: z.enum(PROJECT_STATUSES).optional(),
    rag: z.enum(['GREEN', 'AMBER', 'RED']).optional(),
  })
  .strict();
