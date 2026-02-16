import type { APIRoute } from 'astro';
import {
  getAttendeeById,
  getAttendeeByEmail,
  checkInAttendee,
} from '../../lib/db';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { qrData } = ((await request.json()) || {}) as { qrData?: string };
    if (!qrData) {
      return new Response(
        JSON.stringify({ error: 'QR data is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    let attendeeData: { id?: string; email?: string };
    try {
      attendeeData = JSON.parse(qrData);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid QR code format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const { id, email } = attendeeData;
    if (!id && !email) {
      return new Response(
        JSON.stringify({ error: 'QR code must contain attendee ID or email' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    let attendee = id
      ? await getAttendeeById(id)
      : await getAttendeeByEmail(email!);
    if (!attendee) {
      return new Response(
        JSON.stringify({ error: 'Attendee not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (attendee.checkedIn) {
      return new Response(
        JSON.stringify({
          error: 'Already checked in',
          attendee: {
            ...attendee,
            message: `${attendee.firstName} ${attendee.lastName} was already checked in at ${new Date(attendee.checkedInAt!).toLocaleString()}`,
          },
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const updated = await checkInAttendee(attendee.id);
    return new Response(
      JSON.stringify({
        success: true,
        attendee: updated,
        message: `${updated.firstName} ${updated.lastName} checked in successfully!`,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('POST /api/checkin', err);
    return new Response(
      JSON.stringify({ error: 'Failed to process check-in' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
