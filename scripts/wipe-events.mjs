/**
 * Wipe all events and attendees so you can start fresh.
 * Run migrate-events afterward to get a new default event.
 *
 *   node scripts/wipe-events.mjs
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Missing DATABASE_URL. Set it in .env at project root.');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function main() {
  const attendeeResult = await sql`DELETE FROM attendees`;
  const attendeeCount = attendeeResult.rowCount ?? 0;
  console.log(`Deleted ${attendeeCount} attendee(s)`);

  const eventResult = await sql`DELETE FROM events`;
  const eventCount = eventResult.rowCount ?? 0;
  console.log(`Deleted ${eventCount} event(s)`);

  console.log('Done. Run: npm run migrate-events (to create the default event again).');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
