import type { APIRoute } from 'astro';
import {
  getAllAttendees,
  getAttendeeById,
  createAttendee,
  deleteAttendee,
} from '../../lib/db';
import { getOrCreateQRPayload } from '../../lib/qr-token';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const eventId = url.searchParams.get('eventId') ?? undefined;
    const attendees = await getAllAttendees(eventId ?? undefined);
    return new Response(JSON.stringify(attendees), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('GET /api/attendees', err);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch attendees' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = (await request.json()) || {};
    if (!data.firstName || !data.lastName || !data.email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const attendee = await createAttendee({
      ...data,
      eventId: data.eventId ?? undefined,
    });
    const qrResult = await getOrCreateQRPayload(attendee.id);
    const body = qrResult
      ? { ...attendee, qrPayload: qrResult.qrPayload, qrExpiresAt: qrResult.expiresAt.toISOString() }
      : attendee;
    return new Response(JSON.stringify(body), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = (err as Error)?.message || '';
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return new Response(
        JSON.stringify({ error: 'This email is already registered for this event' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }
    console.error('POST /api/attendees', err);
    return new Response(
      JSON.stringify({ error: 'Failed to create attendee' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const { id } = ((await request.json()) || {}) as { id?: string };
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Attendee ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const deleted = await deleteAttendee(id);
    if (!deleted) {
      return new Response(
        JSON.stringify({ error: 'Attendee not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('DELETE /api/attendees', err);
    return new Response(
      JSON.stringify({ error: 'Failed to delete attendee' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
