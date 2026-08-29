import { z } from 'zod';
import { PROCUREMENT_STATUSES } from '../constants/status.constants.js';

// ─── Create ──────────────────────────────────────────────────────────────────
// Note: remainingQuantity is a PostgreSQL generated column — never in the schema.
export const createProcurementSchema = z
  .object({
    projectId: z.string().uuid(),
    itemName: z.string().min(2).max(200),
    description: z.string().max(2000).optional(),
    tenderQuantity: z.number().int().nonnegative(),
    allocatedQuantity: z.number().int().nonnegative().default(0),
    deliveredQuantity: z.number().int().nonnegative().default(0),
    unitCost: z.number().nonnegative(),
    status: z.enum(PROCUREMENT_STATUSES).default('PENDING'),
  })
  .strict()
  .refine(
    (data) => data.allocatedQuantity <= data.tenderQuantity,
    {
      message: 'Allocated quantity cannot exceed tender quantity',
      path: ['allocatedQuantity'],
    },
  )
  .refine(
    (data) => data.deliveredQuantity <= data.allocatedQuantity,
    {
      message: 'Delivered quantity cannot exceed allocated quantity',
      path: ['deliveredQuantity'],
    },
  );

// ─── Update ──────────────────────────────────────────────────────────────────
export const updateProcurementSchema = z
  .object({
    itemName: z.string().min(2).max(200).optional(),
    description: z.string().max(2000).optional(),
    tenderQuantity: z.number().int().nonnegative().optional(),
    allocatedQuantity: z.number().int().nonnegative().optional(),
    deliveredQuantity: z.number().int().nonnegative().optional(),
    unitCost: z.number().nonnegative().optional(),
    status: z.enum(PROCUREMENT_STATUSES).optional(),
  })
  .strict();

// ─── Query ───────────────────────────────────────────────────────────────────
export const procurementQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),
    status: z.enum(PROCUREMENT_STATUSES).optional(),
    atRisk: z.coerce.boolean().optional(), // remaining <= 0
  })
  .strict();
