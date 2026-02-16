import { randomBytes } from 'crypto';
import { getAttendeeById, updateAttendeeQRToken } from './db';

const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

export function generateQRToken(): string {
  return randomBytes(16).toString('hex');
}

export async function getOrCreateQRPayload(attendeeId: string): Promise<{
  qrPayload: string;
  expiresAt: Date;
} | null> {
  const attendee = await getAttendeeById(attendeeId);
  if (!attendee) return null;

  const token = generateQRToken();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
  await updateAttendeeQRToken(attendeeId, token, expiresAt);

  const qrPayload = `${attendeeId}:${token}`;
  return { qrPayload, expiresAt };
}
