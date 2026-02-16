/**
 * One-time setup: creates attendees table, indexes, optional sample data.
 * Loads DATABASE_URL from .env at project root. Idempotent.
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Missing DATABASE_URL. Set it in .env at project root.');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function run(statement) {
  return sql.query(statement, []);
}

async function main() {
  await run('DROP TABLE IF EXISTS attendees CASCADE');
  console.log('Dropped attendees (if existed)');

  await run(`
    CREATE TABLE attendees (
      id VARCHAR(255) PRIMARY KEY,
      first_name VARCHAR(255) NOT NULL,
      last_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      phone VARCHAR(50),
      company VARCHAR(255),
      dietary_restrictions TEXT,
      checked_in BOOLEAN DEFAULT FALSE,
      checked_in_at TIMESTAMP,
      rsvp_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Created table attendees');

  await run('CREATE INDEX idx_attendees_email ON attendees(email)');
  await run('CREATE INDEX idx_attendees_checked_in ON attendees(checked_in)');
  await run('CREATE INDEX idx_attendees_rsvp_at ON attendees(rsvp_at)');
  console.log('Created indexes');

  await run(`
    INSERT INTO attendees (id, first_name, last_name, email, phone, company, dietary_restrictions, checked_in, rsvp_at) VALUES
    ('sample1', 'John', 'Doe', 'john.doe@example.com', '+1 555-0123', 'Tech Corp', 'Vegetarian', false, NOW() - INTERVAL '2 days'),
    ('sample2', 'Jane', 'Smith', 'jane.smith@example.com', '+1 555-0124', 'Design Studio', '', true, NOW() - INTERVAL '1 day')
    ON CONFLICT (email) DO NOTHING
  `);
  console.log('Inserted sample data (skipped if already present)');

  console.log('Done. Tables are ready.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
