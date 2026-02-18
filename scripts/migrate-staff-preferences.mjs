/**
 * Migration: add staff_preferences table for per-user last_selected_event_id.
 * Survives logout/login, works across devices.
 *
 * Usage:
 *   node scripts/migrate-staff-preferences.mjs --dry-run
 *   node scripts/migrate-staff-preferences.mjs
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const DRY_RUN = process.argv.includes('--dry-run');
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Missing DATABASE_URL. Set it in .env at project root.');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function main() {
  if (DRY_RUN) {
    console.log('[DRY RUN] No changes will be written.\n');
  }

  if (!DRY_RUN) {
    await sql`
      CREATE TABLE IF NOT EXISTS staff_preferences (
        user_id TEXT PRIMARY KEY,
        last_selected_event_id UUID REFERENCES events(id) ON DELETE SET NULL
      )
    `;
    console.log('staff_preferences table ready');

    // Fix existing tables: ensure FK uses ON DELETE SET NULL (no orphaned refs when event is deleted)
    try {
      await sql`ALTER TABLE staff_preferences DROP CONSTRAINT IF EXISTS staff_preferences_last_selected_event_id_fkey`;
      await sql`ALTER TABLE staff_preferences
        ADD CONSTRAINT staff_preferences_last_selected_event_id_fkey
        FOREIGN KEY (last_selected_event_id) REFERENCES events(id) ON DELETE SET NULL`;
      console.log('FK constraint: ON DELETE SET NULL');
    } catch (e) {
      if (e.code === '42710') {
        console.log('FK already has ON DELETE SET NULL');
      } else {
        throw e;
      }
    }
  } else {
    console.log('Would create staff_preferences (user_id, last_selected_event_id)');
  }

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Done. Run without --dry-run to apply.');
    process.exit(0);
  }

  console.log('Migration done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
