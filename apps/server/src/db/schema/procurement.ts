import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { projects } from './projects';

// ─── Procurement Status Enum ─────────────────────────────────────────────────
export const procurementStatusEnum = pgEnum('procurement_status', [
  'PENDING',
  'TENDERED',
  'ALLOCATED',
  'PARTIALLY_DELIVERED',
  'DELIVERED',
  'CANCELLED',
]);

// ─── Procurement Items Table ─────────────────────────────────────────────────
export const procurementItems = pgTable('procurement_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  itemName: varchar('item_name', { length: 200 }).notNull(),
  description: text('description'),
  tenderQuantity: integer('tender_quantity').notNull(),
  allocatedQuantity: integer('allocated_quantity').notNull().default(0),
  deliveredQuantity: integer('delivered_quantity').notNull().default(0),
  unitCost: numeric('unit_cost', { precision: 12, scale: 2 }).notNull(),
  status: procurementStatusEnum('status').notNull().default('PENDING'),

  // ─── Generated Column: remainingQuantity ────────────────────────────────
  // Prevents state drift by always computing remaining from the source fields.
  remainingQuantity: integer('remaining_quantity').generatedAlwaysAs(
    sql`tender_quantity - allocated_quantity - delivered_quantity`,
  ),

  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
