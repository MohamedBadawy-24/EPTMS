import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';

// ─── Role Enum ───────────────────────────────────────────────────────────────
export const roleEnum = pgEnum('user_role', ['ADMIN', 'VIEWER']);

// ─── Users Table ─────────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: roleEnum('role').notNull().default('VIEWER'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
