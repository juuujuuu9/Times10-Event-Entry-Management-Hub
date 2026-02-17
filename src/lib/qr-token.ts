import { randomBytes } from 'crypto';
import { getAttendeeById, updateAttendeeQRToken, getDefaultEventId } from './db';
import { encodeQR } from './qr';

// Event check-in QRs (including CSV import) must be valid until the event. 15 min broke imported/scanned QRs.
const TTL_DAYS =
  Number(
    (typeof import.meta !== 'undefined' && (import.meta.env?.QR_TOKEN_TTL_DAYS as string | undefined)) ||
      (typeof process !== 'undefined' && process.env?.QR_TOKEN_TTL_DAYS) ||
      7
  ) || 7;
const TOKEN_TTL_MS = TTL_DAYS * 24 * 60 * 60 * 1000;

export function generateQRToken(): string {
  return randomBytes(16).toString('hex');
}

export async function getOrCreateQRPayload(
  attendeeId: string,
  eventId?: string
): Promise<{ qrPayload: string; expiresAt: Date } | null> {
  const attendee = await getAttendeeById(attendeeId);
  if (!attendee) return null;

  const resolvedEventId = eventId ?? (attendee.eventId as string | undefined) ?? (await getDefaultEventId());
  const token = generateQRToken();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
  await updateAttendeeQRToken(attendeeId, token, expiresAt, resolvedEventId);

  const qrPayload = encodeQR(resolvedEventId, attendeeId, token);
  return { qrPayload, expiresAt };
}
