import { randomBytes } from 'crypto';
import { getAttendeeById, updateAttendeeQRToken, getDefaultEventId } from './db';
import { encodeQR } from './qr';

const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

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
