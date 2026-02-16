import { neon } from '@neondatabase/serverless';

let sql: ReturnType<typeof neon> | null = null;

function getDb() {
  if (!sql) {
    const url = import.meta.env.DATABASE_URL ?? (typeof process !== 'undefined' ? process.env.DATABASE_URL : undefined);
    if (!url || url === 'placeholder') throw new Error('DATABASE_URL is not set');
    sql = neon(url);
  }
  return sql;
}

function rowToAttendee(row: Record<string, unknown>) {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    dietaryRestrictions: row.dietary_restrictions,
    checkedIn: row.checked_in,
    checkedInAt: row.checked_in_at,
    rsvpAt: row.rsvp_at,
    qrExpiresAt: row.qr_expires_at,
    qrUsedAt: row.qr_used_at,
    qrUsedByDevice: row.qr_used_by_device,
  };
}

export async function getAllAttendees() {
  const db = getDb();
  const rows = await db`SELECT * FROM attendees ORDER BY rsvp_at DESC`;
  return rows.map((row) => rowToAttendee(row as Record<string, unknown>));
}

export async function getAttendeeById(id: string) {
  const db = getDb();
  const rows = await db`SELECT * FROM attendees WHERE id = ${id}`;
  return rows.length ? rowToAttendee(rows[0] as Record<string, unknown>) : null;
}

export async function getAttendeeByEmail(email: string) {
  const db = getDb();
  const rows = await db`SELECT * FROM attendees WHERE email = ${email}`;
  return rows.length ? rowToAttendee(rows[0] as Record<string, unknown>) : null;
}

export async function createAttendee(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  dietaryRestrictions?: string;
}) {
  const db = getDb();
  const id = crypto.randomUUID();
  const rows = await db`
    INSERT INTO attendees (id, first_name, last_name, email, phone, company, dietary_restrictions, checked_in, rsvp_at)
    VALUES (${id}, ${data.firstName}, ${data.lastName}, ${data.email}, ${data.phone ?? ''}, ${data.company ?? ''}, ${data.dietaryRestrictions ?? ''}, false, NOW())
    RETURNING *
  `;
  return rowToAttendee(rows[0] as Record<string, unknown>);
}

export async function checkInAttendee(id: string) {
  const db = getDb();
  const rows = await db`
    UPDATE attendees SET checked_in = true, checked_in_at = NOW() WHERE id = ${id}
    RETURNING *
  `;
  if (!rows.length) throw new Error('Attendee not found');
  return rowToAttendee(rows[0] as Record<string, unknown>);
}

export async function findAttendeeByToken(id: string, token: string) {
  const db = getDb();
  const rows = await db`
    SELECT * FROM attendees
    WHERE id = ${id}
      AND qr_token = ${token}
      AND qr_expires_at > NOW()
      AND qr_used_at IS NULL
  `;
  return rows.length ? rowToAttendee(rows[0] as Record<string, unknown>) : null;
}

export async function checkInAttendeeWithToken(
  id: string,
  token: string,
  scannerDeviceId: string | null
) {
  const db = getDb();
  const rows = await db`
    UPDATE attendees
    SET qr_used_at = NOW(),
        qr_used_by_device = ${scannerDeviceId},
        checked_in = true,
        checked_in_at = NOW()
    WHERE id = ${id} AND qr_token = ${token}
    RETURNING *
  `;
  if (!rows.length) throw new Error('Attendee not found');
  return rowToAttendee(rows[0] as Record<string, unknown>);
}

export async function deleteAttendee(id: string) {
  const db = getDb();
  const rows = await db`DELETE FROM attendees WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}

export async function updateAttendeeQRToken(
  id: string,
  token: string,
  expiresAt: Date
) {
  const db = getDb();
  await db`
    UPDATE attendees
    SET qr_token = ${token}, qr_expires_at = ${expiresAt}
    WHERE id = ${id}
  `;
}
