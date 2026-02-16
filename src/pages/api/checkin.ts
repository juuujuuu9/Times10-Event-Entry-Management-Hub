import type { APIRoute } from 'astro';
import {
  getAttendeeById,
  findAttendeeByToken,
  checkInAttendeeWithToken,
} from '../../lib/db';
import { checkRateLimit } from '../../lib/rate-limit';
import { logCheckInAttempt } from '../../lib/audit';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isValidUUID(s: string): boolean {
  return UUID_REGEX.test(s);
}

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

    const colonIndex = qrData.indexOf(':');
    if (colonIndex === -1) {
      logCheckInAttempt({ ip, outcome: 'invalid_format' });
      return new Response(
        JSON.stringify({ error: 'Invalid QR code format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const id = qrData.slice(0, colonIndex);
    const token = qrData.slice(colonIndex + 1);
    if (!id || !token) {
      logCheckInAttempt({ ip, outcome: 'invalid_format' });
      return new Response(
        JSON.stringify({ error: 'Invalid QR code format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!isValidUUID(id)) {
      logCheckInAttempt({ ip, outcome: 'invalid_format' });
      return new Response(
        JSON.stringify({ error: 'Invalid QR code format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const attendee = await findAttendeeByToken(id, token);
    if (!attendee) {
      const existing = await getAttendeeById(id);
      if (existing?.qrUsedAt) {
        logCheckInAttempt({ ip, outcome: 'replay_attempt', attendeeId: id });
        return new Response(
          JSON.stringify({ error: 'QR code already used' }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        );
      }
      logCheckInAttempt({ ip, outcome: 'invalid_or_expired', attendeeId: id });
      return new Response(
        JSON.stringify({ error: 'Invalid or expired QR code' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const updated = await checkInAttendeeWithToken(id, token, scannerDeviceId);
    logCheckInAttempt({ ip, outcome: 'success', attendeeId: updated.id });
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
    logCheckInAttempt({ ip, outcome: 'error' });
    return new Response(
      JSON.stringify({ error: 'Failed to process check-in' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
