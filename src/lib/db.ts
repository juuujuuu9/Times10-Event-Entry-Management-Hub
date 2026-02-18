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

const DEFAULT_EVENT_CACHE_TTL_MS = 60 * 60 * 1000; // 1h
let defaultEventIdCache: { id: string; expiresAt: number } | null = null;

export interface EventRow {
  id: string;
  name: string;
  slug: string;
  micrositeUrl?: string;
  settings?: Record<string, unknown>;
  createdAt?: string;
}

function rowToEvent(row: Record<string, unknown>): EventRow {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    micrositeUrl: row.microsite_url as string | undefined,
    settings: row.settings as Record<string, unknown> | undefined,
    createdAt: row.created_at as string | undefined,
  };
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
    eventId: row.event_id,
    micrositeEntryId: row.microsite_entry_id,
    sourceData: row.source_data,
    createdAt: row.created_at,
  };
}

export async function getEventById(id: string): Promise<EventRow | null> {
  const db = getDb();
  const rows = await db`SELECT * FROM events WHERE id = ${id}`;
  return rows.length ? rowToEvent(rows[0] as Record<string, unknown>) : null;
}

export async function getEventBySlug(slug: string): Promise<EventRow | null> {
  const db = getDb();
  const rows = await db`SELECT * FROM events WHERE slug = ${slug}`;
  return rows.length ? rowToEvent(rows[0] as Record<string, unknown>) : null;
}

export async function getAllEvents(): Promise<EventRow[]> {
  const db = getDb();
  const rows = await db`SELECT * FROM events ORDER BY created_at DESC`;
  return rows.map((row) => rowToEvent(row as Record<string, unknown>));
}

export async function getDefaultEventId(): Promise<string> {
  const now = Date.now();
  if (defaultEventIdCache && defaultEventIdCache.expiresAt > now) {
    return defaultEventIdCache.id;
  }
  const slug =
    (typeof import.meta !== 'undefined' && import.meta.env?.DEFAULT_EVENT_SLUG) ||
    (typeof process !== 'undefined' && process.env?.DEFAULT_EVENT_SLUG) ||
    'default';
  const event = await getEventBySlug(slug);
  if (!event) throw new Error('Default event not found. Run npm run migrate-events.');
  defaultEventIdCache = { id: event.id, expiresAt: now + DEFAULT_EVENT_CACHE_TTL_MS };
  return event.id;
}

export async function getAllAttendees(eventId?: string) {
  const db = getDb();
  if (eventId) {
    const rows = await db`
      SELECT * FROM attendees
      WHERE event_id = ${eventId}
      ORDER BY created_at DESC NULLS LAST, rsvp_at DESC
    `;
    return rows.map((row) => rowToAttendee(row as Record<string, unknown>));
  }
  const rows = await db`SELECT * FROM attendees ORDER BY rsvp_at DESC`;
  return rows.map((row) => rowToAttendee(row as Record<string, unknown>));
}

export async function getAttendeesByEventId(eventId: string) {
  return getAllAttendees(eventId);
}

/** Minimal attendee data including qr_token for offline cache. Staff-only. */
export type OfflineCacheAttendee = {
  id: string;
  eventId: string;
  qrToken: string | null;
  qrExpiresAt: string | null;
  checkedIn: boolean;
  firstName: string;
  lastName: string;
  email: string;
  eventName?: string;
};

export async function getAttendeesForOfflineCache(eventId?: string): Promise<OfflineCacheAttendee[]> {
  const db = getDb();
  const rowToOffline = (row: Record<string, unknown>): OfflineCacheAttendee => ({
    id: row.id as string,
    eventId: (row.event_id ?? '') as string,
    qrToken: (row.qr_token ?? null) as string | null,
    qrExpiresAt: (row.qr_expires_at ?? null) as string | null,
    checkedIn: Boolean(row.checked_in),
    firstName: (row.first_name ?? '') as string,
    lastName: (row.last_name ?? '') as string,
    email: (row.email ?? '') as string,
    eventName: row.event_name as string | undefined,
  });
  if (eventId) {
    const rows = await db`
      SELECT a.id, a.event_id, a.qr_token, a.qr_expires_at, a.checked_in,
             a.first_name, a.last_name, a.email, e.name as event_name
      FROM attendees a
      LEFT JOIN events e ON e.id = a.event_id
      WHERE a.event_id = ${eventId}
      ORDER BY a.created_at DESC NULLS LAST, a.rsvp_at DESC
    `;
    return rows.map((row) => rowToOffline(row as Record<string, unknown>));
  }
  const rows = await db`
    SELECT a.id, a.event_id, a.qr_token, a.qr_expires_at, a.checked_in,
           a.first_name, a.last_name, a.email, e.name as event_name
    FROM attendees a
    LEFT JOIN events e ON e.id = a.event_id
    ORDER BY a.created_at DESC NULLS LAST, a.rsvp_at DESC
  `;
  return rows.map((row) => rowToOffline(row as Record<string, unknown>));
}

/** Search attendees by name or email. Optionally scope by eventId. Joins event name for display. */
export async function searchAttendees(eventId?: string, q?: string) {
  if (!q?.trim()) return getAllAttendees(eventId);
  const db = getDb();
  const pattern = `%${String(q).trim().slice(0, 200)}%`;
  const rowToAttendeeWithEvent = (row: Record<string, unknown>) => ({
    ...rowToAttendee(row),
    eventName: row.event_name as string | undefined,
  });
  if (eventId) {
    const rows = await db`
      SELECT a.*, e.name as event_name FROM attendees a
      LEFT JOIN events e ON e.id = a.event_id
      WHERE a.event_id = ${eventId}
        AND (a.first_name ILIKE ${pattern} OR a.last_name ILIKE ${pattern} OR a.email ILIKE ${pattern})
      ORDER BY a.created_at DESC NULLS LAST, a.rsvp_at DESC
    `;
    return rows.map((row) => rowToAttendeeWithEvent(row as Record<string, unknown>));
  }
  const rows = await db`
    SELECT a.*, e.name as event_name FROM attendees a
    LEFT JOIN events e ON e.id = a.event_id
    WHERE a.first_name ILIKE ${pattern} OR a.last_name ILIKE ${pattern} OR a.email ILIKE ${pattern}
    ORDER BY a.created_at DESC NULLS LAST, a.rsvp_at DESC
  `;
  return rows.map((row) => rowToAttendeeWithEvent(row as Record<string, unknown>));
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

export async function createAttendee(
  data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string;
    dietaryRestrictions?: string;
    eventId?: string;
    micrositeEntryId?: string;
    sourceData?: Record<string, unknown>;
  }
) {
  const db = getDb();
  const id = crypto.randomUUID();
  const eventId = data.eventId ?? (await getDefaultEventId());
  const sourceDataJson = data.sourceData != null ? JSON.stringify(data.sourceData) : null;
  const rows = await db`
    INSERT INTO attendees (id, event_id, first_name, last_name, email, phone, company, dietary_restrictions, checked_in, rsvp_at, created_at, microsite_entry_id, source_data)
    VALUES (${id}, ${eventId}, ${data.firstName}, ${data.lastName}, ${data.email}, ${data.phone ?? ''}, ${data.company ?? ''}, ${data.dietaryRestrictions ?? ''}, false, NOW(), NOW(), ${data.micrositeEntryId ?? null}, ${sourceDataJson})
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

/** Event-scoped lookup for check-in (v2 QR format). */
export async function findAttendeeByEventAndToken(
  eventId: string,
  entryId: string,
  token: string
) {
  const db = getDb();
  const rows = await db`
    SELECT * FROM attendees
    WHERE event_id = ${eventId}
      AND id = ${entryId}
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
        qr_token = NULL,
        qr_expires_at = NULL,
        checked_in = true,
        checked_in_at = NOW()
    WHERE id = ${id} AND qr_token = ${token}
    RETURNING *
  `;
  if (!rows.length) throw new Error('Attendee not found');
  return rowToAttendee(rows[0] as Record<string, unknown>);
}

/** Event-scoped atomic check-in (v2 QR format). */
export async function checkInAttendeeWithTokenScoped(
  eventId: string,
  entryId: string,
  token: string,
  scannerDeviceId: string | null
) {
  const db = getDb();
  const rows = await db`
    UPDATE attendees
    SET qr_used_at = NOW(),
        qr_used_by_device = ${scannerDeviceId},
        qr_token = NULL,
        qr_expires_at = NULL,
        checked_in = true,
        checked_in_at = NOW()
    WHERE event_id = ${eventId}
      AND id = ${entryId}
      AND qr_token = ${token}
      AND qr_expires_at > NOW()
      AND qr_used_at IS NULL
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

/** Set qr_token and qr_expires_at for an attendee. Always updates by id so token is persisted. */
export async function updateAttendeeQRToken(
  id: string,
  token: string,
  expiresAt: Date,
  _eventId?: string
) {
  const db = getDb();
  await db`
    UPDATE attendees
    SET qr_token = ${token}, qr_expires_at = ${expiresAt}
    WHERE id = ${id}
  `;
}

export async function findAttendeeByEventAndMicrositeId(
  eventId: string,
  micrositeEntryId: string
) {
  const db = getDb();
  const rows = await db`
    SELECT id, qr_token, qr_expires_at FROM attendees
    WHERE event_id = ${eventId} AND microsite_entry_id = ${micrositeEntryId}
  `;
  return rows.length ? (rows[0] as { id: string; qr_token: string | null; qr_expires_at: string | null }) : null;
}

/** For CSV import deduplication: skip if this event already has an attendee with this email. */
export async function findAttendeeByEventAndEmail(
  eventId: string,
  email: string
): Promise<{ id: string } | null> {
  const db = getDb();
  const rows = await db`
    SELECT id FROM attendees
    WHERE event_id = ${eventId} AND LOWER(TRIM(email)) = LOWER(TRIM(${email}))
  `;
  return rows.length ? (rows[0] as { id: string }) : null;
}

export async function createEvent(data: {
  name: string;
  slug: string;
  micrositeUrl?: string;
  settings?: Record<string, unknown>;
}) {
  const db = getDb();
  const id = crypto.randomUUID();
  const settingsJson = data.settings != null ? JSON.stringify(data.settings) : null;
  await db`
    INSERT INTO events (id, name, slug, microsite_url, settings, created_at)
    VALUES (${id}, ${data.name}, ${data.slug}, ${data.micrositeUrl ?? null}, ${settingsJson}, NOW())
  `;
  return { id, ...data };
}

/** Delete an event and all its attendees. */
export async function deleteEvent(id: string): Promise<boolean> {
  const db = getDb();
  await db`DELETE FROM attendees WHERE event_id = ${id}`;
  const rows = await db`DELETE FROM events WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}
