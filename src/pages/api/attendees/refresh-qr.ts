import type { APIRoute } from 'astro';
import { getOrCreateQRPayload } from '../../../lib/qr-token';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { id } = ((await request.json()) || {}) as { id?: string };
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Attendee ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await getOrCreateQRPayload(id);
    if (!result) {
      return new Response(
        JSON.stringify({ error: 'Attendee not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ qrPayload: result.qrPayload, expiresAt: result.expiresAt.toISOString() }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('POST /api/attendees/refresh-qr', err);
    return new Response(
      JSON.stringify({ error: 'Failed to generate QR payload' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
