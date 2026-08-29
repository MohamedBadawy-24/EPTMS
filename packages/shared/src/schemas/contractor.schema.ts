import { z } from 'zod';

// ─── Sub-score validation (shared) ───────────────────────────────────────────
// The 6 exact sub-scores: schedule, quality, resources, safety, coordination, docs
const scoreField = z.number().min(0).max(100);

// ─── Create ──────────────────────────────────────────────────────────────────
// Note: overallScore is a PostgreSQL generated column (average of 6 sub-scores)
// — it is NEVER included in create/update schemas.
export const createContractorSchema = z
  .object({
    contractorName: z.string().min(2).max(200),
    projectId: z.string().uuid(),
    schedule: scoreField,
    quality: scoreField,
    resources: scoreField,
    safety: scoreField,
    coordination: scoreField,
    docs: scoreField,
  })
  .strict();

// ─── Update ──────────────────────────────────────────────────────────────────
export const updateContractorSchema = z
  .object({
    contractorName: z.string().min(2).max(200).optional(),
    schedule: scoreField.optional(),
    quality: scoreField.optional(),
    resources: scoreField.optional(),
    safety: scoreField.optional(),
    coordination: scoreField.optional(),
    docs: scoreField.optional(),
  })
  .strict();

// ─── Query ───────────────────────────────────────────────────────────────────
export const contractorQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),
    search: z.string().max(100).optional(),
  })
  .strict();
