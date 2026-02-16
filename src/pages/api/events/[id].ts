import type { APIRoute } from 'astro';
import { getEventById } from '../../../../lib/db';

export const GET: APIRoute = async ({ params }) => {
  const id = params?.id;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Event ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  try {
    const event = await getEventById(id);
    if (!event) {
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify(event), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('GET /api/events/[id]', err);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch event' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
