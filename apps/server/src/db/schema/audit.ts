import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { users } from './users';

// ─── Audit Action Enum ───────────────────────────────────────────────────────
export const auditActionEnum = pgEnum('audit_action', [
  'CREATE',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'BASELINE_ATTEMPT',
]);

// ─── Audit Entity Enum ───────────────────────────────────────────────────────
export const auditEntityEnum = pgEnum('audit_entity', [
  'USER',
  'PROJECT',
  'MILESTONE',
  'PROCUREMENT_ITEM',
  'CONTRACTOR_SCORE',
]);

// ─── Audit Log Table ─────────────────────────────────────────────────────────
// Captures CREATE, UPDATE, DELETE, LOGIN, and BASELINE_ATTEMPT events
// with full beforeState/afterState JSONB payloads.
export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  action: auditActionEnum('action').notNull(),
  entity: auditEntityEnum('entity').notNull(),
  entityId: uuid('entity_id'),
  beforeState: jsonb('before_state'),
  afterState: jsonb('after_state'),
  metadata: jsonb('metadata'), // Extra context (e.g., IP address, user agent)
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
