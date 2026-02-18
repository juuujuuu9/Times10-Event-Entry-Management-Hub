import type { APIRoute } from 'astro';
import {
  getAttendeeById,
  getEventById,
  findAttendeeByEventAndToken,
  checkInAttendeeWithTokenScoped,
  checkInAttendee,
} from '../../lib/db';
import { decodeQR } from '../../lib/qr';
import { checkRateLimit, getClientIp } from '../../lib/rate-limit';
import { logCheckInAttempt } from '../../lib/audit';

export const POST: APIRoute = async ({ request }) => {
  const ip = getClientIp(request);

  const rate = checkRateLimit(ip);
  if (!rate.allowed) {
    logCheckInAttempt({ ip, outcome: 'rate_limited' });
    return new Response(
      JSON.stringify({
        error: 'Too many check-in attempts. Please try again later.',
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          ...(rate.retryAfterSec != null && {
            'Retry-After': String(rate.retryAfterSec),
          }),
        },
      }
    );
  }

  try {
    const body = (await request.json()) as {
      qrData?: string;
      attendeeId?: string;
      scannerDeviceId?: string;
    } | null;
    const qrData = body?.qrData;
    const attendeeId = body?.attendeeId;
    const scannerDeviceId = body?.scannerDeviceId ?? null;

    // Manual check-in by attendee ID (staff override)
    if (attendeeId && typeof attendeeId === 'string') {
      const attendee = await getAttendeeById(attendeeId);
      if (!attendee) {
        logCheckInAttempt({ ip, outcome: 'not_found', attendeeId });
        return new Response(
          JSON.stringify({ error: 'Attendee not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (attendee.checkedIn) {
        const event = attendee.eventId
          ? await getEventById(attendee.eventId as string)
          : null;
        logCheckInAttempt({ ip, outcome: 'replay_attempt', attendeeId, eventId: attendee.eventId });
        return new Response(
          JSON.stringify({
            alreadyCheckedIn: true,
            attendee,
            event: event ? { id: event.id, name: event.name } : undefined,
            message: `Already checked in: ${attendee.firstName} ${attendee.lastName}`,
          }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        );
      }
      const updated = await checkInAttendee(attendeeId);
      const event = updated.eventId
        ? await getEventById(updated.eventId as string)
        : null;
      logCheckInAttempt({ ip, outcome: 'success', attendeeId: updated.id, eventId: updated.eventId });
      return new Response(
        JSON.stringify({
          success: true,
          event: event ? { id: event.id, name: event.name } : undefined,
          attendee: updated,
          message: `${updated.firstName} ${updated.lastName} checked in successfully!`,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!qrData || typeof qrData !== 'string') {
      logCheckInAttempt({ ip, outcome: 'invalid_format' });
      return new Response(
        JSON.stringify({ error: 'QR data or attendee ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let eventId: string;
    let entryId: string;
    let token: string;
    try {
      const payload = await decodeQR(qrData);
      eventId = payload.eventId;
      entryId = payload.entryId;
      token = payload.token;
    } catch {
      logCheckInAttempt({ ip, outcome: 'invalid_format' });
      return new Response(
        JSON.stringify({ error: 'Invalid QR code format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const event = await getEventById(eventId);
    if (!event) {
      logCheckInAttempt({ ip, outcome: 'not_found', eventId, entryId });
      return new Response(
        JSON.stringify({ error: 'Event not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const attendee = await findAttendeeByEventAndToken(eventId, entryId, token);
    if (!attendee) {
      const existing = await getAttendeeById(entryId);
      if (existing?.eventId !== eventId) {
        logCheckInAttempt({ ip, outcome: 'invalid_or_expired', attendeeId: entryId });
        return new Response(
          JSON.stringify({ error: 'Invalid or expired QR code' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (existing?.qrUsedAt || existing?.checkedIn) {
        logCheckInAttempt({ ip, outcome: 'replay_attempt', attendeeId: entryId });
        const message = existing
          ? `Already checked in: ${existing.firstName} ${existing.lastName}`
          : 'QR code already used';
        return new Response(
          JSON.stringify({
            alreadyCheckedIn: true,
            attendee: existing,
            event: { id: event.id, name: event.name },
            message,
          }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (existing?.qrExpiresAt && new Date(existing.qrExpiresAt as string) < new Date()) {
        return new Response(
          JSON.stringify({ error: 'QR code expired' }),
          { status: 410, headers: { 'Content-Type': 'application/json' } }
        );
      }
      logCheckInAttempt({ ip, outcome: 'invalid_or_expired', attendeeId: entryId });
      return new Response(
        JSON.stringify({ error: 'Invalid or expired QR code' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const updated = await checkInAttendeeWithTokenScoped(
      eventId,
      entryId,
      token,
      scannerDeviceId
    );
    logCheckInAttempt({ ip, outcome: 'success', attendeeId: updated.id, eventId });
    return new Response(
      JSON.stringify({
        success: true,
        event: { id: event.id, name: event.name },
        attendee: updated,
        message: `${updated.firstName} ${updated.lastName} checked in successfully!`,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('POST /api/checkin', err);
    logCheckInAttempt({ ip, outcome: 'error' });
    return new Response(
      JSON.stringify({ error: 'Failed to process check-in' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
