import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Applies raw SQL trigger scripts to the database.
 * Run with: npm run db:trigger
 */
async function applyTriggers() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database.');

    const triggerSQL = readFileSync(
      join(__dirname, 'baseline_immutability.sql'),
      'utf-8',
    );

    await client.query(triggerSQL);
    console.log('✅ Baseline immutability trigger applied successfully.');
  } catch (error) {
    console.error('❌ Failed to apply triggers:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyTriggers();
