import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  numeric,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { users } from './users';

// ─── Project Status Enum ─────────────────────────────────────────────────────
export const projectStatusEnum = pgEnum('project_status', [
  'PLANNING',
  'ACTIVE',
  'ON_HOLD',
  'COMPLETED',
  'CANCELLED',
]);

// ─── Projects Table ──────────────────────────────────────────────────────────
// RAG status is NEVER stored here — always computed on-the-fly by ragCalculator.
// Cost comparison for RAG uses finalCost vs contractValue.
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  status: projectStatusEnum('status').notNull().default('PLANNING'),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  contractValue: numeric('contract_value', { precision: 15, scale: 2 }).notNull(),
  finalCost: numeric('final_cost', { precision: 15, scale: 2 }),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
