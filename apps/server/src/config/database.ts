import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from './env.js';
import * as schema from '../db/schema/index.js';

// ─── Database Connection ─────────────────────────────────────────────────────
// Single connection pool for the application.

const connectionString = config.database.url;

const queryClient = postgres(connectionString, {
  max: 10, // Connection pool size
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(queryClient, { schema });

export type Database = typeof db;
