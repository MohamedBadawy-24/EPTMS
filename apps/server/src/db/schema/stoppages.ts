import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
} from 'drizzle-orm/pg-core';
import { projects } from './projects';

// ─── Project Stoppages & Extensions Table ─────────────────────────────────────
// Tracks official contract stoppages / extensions (التوقفات والتمديدات الزمنية)
// Supports both resolved stoppages (with endDate) and ongoing delays (endDate is null).
export const projectStoppages = pgTable('project_stoppages', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  reason: varchar('reason', { length: 255 }).notNull(),
  daysAdded: integer('days_added'),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
