import type { APIRoute } from 'astro';
import {
  getAttendeeById,
  getEventById,
  findAttendeeByEventAndToken,
  checkInAttendeeWithTokenScoped,
} from '../../lib/db';
import { decodeQR } from '../../lib/qr';
import { checkRateLimit } from '../../lib/rate-limit';
import { logCheckInAttempt } from '../../lib/audit';

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? 'unknown';
  return request.headers.get('x-real-ip') ?? 'unknown';
}

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
    const body = (await request.json()) as { qrData?: string; scannerDeviceId?: string } | null;
    const qrData = body?.qrData;
    const scannerDeviceId = body?.scannerDeviceId ?? null;

    if (!qrData || typeof qrData !== 'string') {
      logCheckInAttempt({ ip, outcome: 'invalid_format' });
      return new Response(
        JSON.stringify({ error: 'QR data is required' }),
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
        return new Response(
          JSON.stringify({ error: 'QR code already used' }),
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
