import type { APIRoute } from 'astro';
import {
  getAllEvents,
  getAttendeesForOfflineCache,
  type OfflineCacheAttendee,
} from '../../../lib/db';

export type OfflineCacheData = {
  cachedAt: string;
  defaultEventId: string;
  events: { id: string; name: string }[];
  attendees: OfflineCacheAttendee[];
};

/** Get attendees with qr_token for offline cache. Staff-only (middleware). */
export const GET: APIRoute = async ({ url }) => {
  try {
    const eventId = url.searchParams.get('eventId') ?? undefined;
    const events = await getAllEvents();
    const defaultEvent = events.find((e) => e.slug === 'default') ?? events[0];
    const defaultEventId = defaultEvent?.id ?? '';

    const attendees = await getAttendeesForOfflineCache(eventId);

    const data: OfflineCacheData = {
      cachedAt: new Date().toISOString(),
      defaultEventId,
      events: events.map((e) => ({ id: e.id, name: e.name })),
      attendees,
    };

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('GET /api/attendees/offline-cache', err);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch offline cache' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
