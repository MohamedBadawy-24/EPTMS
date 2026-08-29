import {
  pgTable,
  uuid,
  varchar,
  real,
  timestamp,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { projects } from './projects';

// ─── Contractor Scores Table ─────────────────────────────────────────────────
// The 6 exact sub-scores: schedule, quality, resources, safety, coordination, docs.
// overallScore is a PostgreSQL generated column (average of all 6).
export const contractorScores = pgTable('contractor_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  contractorName: varchar('contractor_name', { length: 200 }).notNull(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),

  // ─── 6 Sub-Scores (0–100) ──────────────────────────────────────────────
  schedule: real('schedule').notNull(),
  quality: real('quality').notNull(),
  resources: real('resources').notNull(),
  safety: real('safety').notNull(),
  coordination: real('coordination').notNull(),
  docs: real('docs').notNull(),

  // ─── Generated Column: overallScore ─────────────────────────────────────
  // Average of the 6 sub-scores, rounded to 1 decimal place.
  overallScore: real('overall_score').generatedAlwaysAs(
    sql`ROUND(((schedule + quality + resources + safety + coordination + docs) / 6.0)::numeric, 1)::real`,
  ),

  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
