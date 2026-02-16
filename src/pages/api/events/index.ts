import type { APIRoute } from 'astro';
import { getAllEvents, createEvent } from '../../../lib/db';

export const GET: APIRoute = async () => {
  try {
    const events = await getAllEvents();
    return new Response(JSON.stringify(events), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('GET /api/events', err);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch events' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as { name?: string; slug?: string; micrositeUrl?: string };
    const name = (body?.name ?? '').trim();
    const slug = (body?.slug ?? '').trim().toLowerCase().replace(/\s+/g, '-');
    if (!name || !slug) {
      return new Response(
        JSON.stringify({ error: 'name and slug are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const event = await createEvent({
      name,
      slug,
      micrositeUrl: body?.micrositeUrl?.trim() || undefined,
    });
    return new Response(JSON.stringify(event), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = (err as Error)?.message ?? '';
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return new Response(
        JSON.stringify({ error: 'An event with this slug already exists' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }
    console.error('POST /api/events', err);
    return new Response(
      JSON.stringify({ error: 'Failed to create event' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
