import type { APIRoute } from 'astro';
import {
  getAllAttendees,
  getAttendeeById,
  createAttendee,
  deleteAttendee,
} from '../../lib/db';

export const GET: APIRoute = async () => {
  try {
    const attendees = await getAllAttendees();
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
    const attendee = await createAttendee(data);
    return new Response(JSON.stringify(attendee), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = (err as Error)?.message || '';
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return new Response(
        JSON.stringify({ error: 'Email already registered' }),
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
