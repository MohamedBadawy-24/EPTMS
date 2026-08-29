import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { projects } from './projects';

// ─── Milestone Status Enum ───────────────────────────────────────────────────
export const milestoneStatusEnum = pgEnum('milestone_status', [
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
  'ON_HOLD',
]);

// ─── Milestones Table ────────────────────────────────────────────────────────
// BASELINE IMMUTABILITY is enforced at three layers:
//   Layer 1: Zod schema (.strict() omits baselineDate on update)
//   Layer 2: Service layer explicit check + audit log
//   Layer 3: PostgreSQL BEFORE UPDATE trigger (see triggers/baseline_immutability.sql)
export const milestones = pgTable('milestones', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  baselineDate: timestamp('baseline_date', { withTimezone: true }).notNull(),
  forecastDate: timestamp('forecast_date', { withTimezone: true }),
  actualDate: timestamp('actual_date', { withTimezone: true }),
  status: milestoneStatusEnum('status').notNull().default('NOT_STARTED'),

  // ─── Generated Column: delayDays ────────────────────────────────────────
  // Computes the number of days between baseline and forecast (or current date).
  // Positive = delayed, negative = ahead of schedule, 0 = on track.
  delayDays: integer('delay_days').generatedAlwaysAs(
    sql`EXTRACT(DAY FROM (forecast_date - baseline_date))::integer`,
  ),

  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
