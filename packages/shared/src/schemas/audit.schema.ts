import { z } from 'zod';

// ─── Audit Log Event Types ───────────────────────────────────────────────────
export const AUDIT_ACTIONS = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'BASELINE_ATTEMPT',
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_ENTITIES = [
  'USER',
  'PROJECT',
  'MILESTONE',
  'PROCUREMENT_ITEM',
  'CONTRACTOR_SCORE',
] as const;
export type AuditEntity = (typeof AUDIT_ENTITIES)[number];

// ─── Query ───────────────────────────────────────────────────────────────────
export const auditQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),
    action: z.enum(AUDIT_ACTIONS).optional(),
    entity: z.enum(AUDIT_ENTITIES).optional(),
    userId: z.string().uuid().optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  })
  .strict();
