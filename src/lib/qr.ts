import { getDefaultEventId } from './db';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validateUUID(s: string): void {
  if (!UUID_REGEX.test(s)) throw new Error('Invalid UUID');
}

export interface QRPayload {
  eventId: string;
  entryId: string;
  token: string;
  format: 'v2' | 'v1-legacy';
}

/** Encode eventId, entryId, token into QR string (v2 format). */
export function encodeQR(eventId: string, entryId: string, token: string): string {
  validateUUID(eventId);
  validateUUID(entryId);
  return `${eventId}:${entryId}:${token}`;
}

/**
 * Decode QR string into payload. Supports v2 (eventId:entryId:token) and v1-legacy (entryId:token).
 * For v1-legacy, eventId is resolved via getDefaultEventId().
 */
export async function decodeQR(qrData: string): Promise<QRPayload> {
  const parts = qrData.split(':');

  if (parts.length === 3) {
    const [eventId, entryId, token] = parts;
    if (!eventId || !entryId || !token) throw new Error('Invalid QR format');
    validateUUID(eventId);
    validateUUID(entryId);
    return { eventId, entryId, token, format: 'v2' };
  }

  if (parts.length === 2) {
    const [entryId, token] = parts;
    if (!entryId || !token) throw new Error('Invalid QR format');
    validateUUID(entryId);
    console.warn('Legacy QR scanned:', entryId);
    const eventId = await getDefaultEventId();
    return { eventId, entryId, token, format: 'v1-legacy' };
  }

  throw new Error('Invalid QR format');
}
