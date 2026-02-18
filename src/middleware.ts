import { defineMiddleware } from 'astro:middleware';
import { getSession } from 'auth-astro/server';

/** Get session or null if auth is misconfigured (e.g. missing AUTH_SECRET). */
async function getSessionSafe(request: Request): Promise<Awaited<ReturnType<typeof getSession>>> {
  try {
    return await getSession(request);
  } catch (err) {
    console.error('[auth] getSession failed (check AUTH_SECRET and auth config):', err);
    return null;
  }
}

const PUBLIC_PATH_PATTERNS = [
  /^\/login$/,
  /^\/api\/auth\//,
  /^\/_astro\//,
  /^\/favicon\.(ico|svg)$/,
];

const STAFF_PAGE_PATTERNS = [/^\/$/, /^\/admin(\/|$)/, /^\/scanner(\/|$)/];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATH_PATTERNS.some((p) => p.test(pathname));
}

function isStaffPage(pathname: string): boolean {
  return STAFF_PAGE_PATTERNS.some((p) => p.test(pathname));
}

function isStaffOnlyApi(pathname: string, method: string): boolean {
  if (pathname.startsWith('/api/auth/')) return false;
  if (pathname === '/api/attendees') return true; // GET, POST, DELETE all require staff (no public RSVP)
  if (pathname === '/api/webhooks/entry' && method === 'POST') return false; // auth via Bearer in handler
  if (pathname === '/api/attendees' && (method === 'GET' || method === 'DELETE')) return true;
  if (pathname === '/api/checkin' && method === 'POST') return true;
  if (pathname === '/api/send-email' && (method === 'GET' || method === 'POST')) return true;
  if (pathname === '/api/attendees/refresh-qr' && method === 'POST') return true;
  if (pathname === '/api/attendees/import' && method === 'POST') return true;
  if (pathname === '/api/attendees/export' && method === 'GET') return true;
  if (pathname.startsWith('/api/events')) return true;
  return false;
}

function isApiRequest(pathname: string): boolean {
  return pathname.startsWith('/api/');
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, request, redirect, locals } = context;
  const pathname = url.pathname;
  const method = request.method;

  if (isPublicPath(pathname)) {
    const session = await getSessionSafe(request);
    locals.session = session;
    locals.user = session?.user ?? null;
    const role = locals.user?.role;
    locals.isStaff = !!role && ['admin', 'scanner', 'staff'].includes(role);
    locals.isAdmin = role === 'admin';
    locals.isScanner = role === 'scanner' || role === 'admin';
    return next();
  }

  if (isStaffPage(pathname) || isStaffOnlyApi(pathname, method)) {
    const session = await getSessionSafe(request);
    locals.session = session;
    locals.user = session?.user ?? null;
    const role = locals.user?.role;
    locals.isStaff = !!role && ['admin', 'scanner', 'staff'].includes(role);
    locals.isAdmin = role === 'admin';
    locals.isScanner = role === 'scanner' || role === 'admin';

    if (!locals.isStaff) {
      if (isApiRequest(pathname)) {
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
      const returnTo = encodeURIComponent(pathname + url.search);
      return redirect(`/login?returnTo=${returnTo}&required=staff`);
    }

    return next();
  }

  const session = await getSessionSafe(request);
  locals.session = session;
  locals.user = session?.user ?? null;
  const role = locals.user?.role;
  locals.isStaff = !!role && ['admin', 'scanner', 'staff'].includes(role);
  locals.isAdmin = role === 'admin';
  locals.isScanner = role === 'scanner' || role === 'admin';
  return next();
});
