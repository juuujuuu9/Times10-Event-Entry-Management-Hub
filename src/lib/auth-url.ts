/**
 * Canonical origin for auth redirects. Use AUTH_URL when set, else derive from request headers
 * (fixes localhost on Vercel where Astro.url.origin can be wrong).
 */
export function getCanonicalOrigin(request?: Request, fallbackOrigin?: string): string {
  const authUrl =
    (typeof process !== 'undefined' && process.env?.AUTH_URL) ||
    (typeof import.meta !== 'undefined' && (import.meta.env?.AUTH_URL as string));
  if (authUrl) return new URL(authUrl).origin;

  // Vercel: use Host/X-Forwarded-Host — Astro.url can be localhost.
  if (request) {
    const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
    const proto = request.headers.get('x-forwarded-proto') ?? 'https';
    if (host && !host.includes('localhost')) return `${proto}://${host.split(',')[0].trim()}`;
  }
  return fallbackOrigin ?? '';
}

/** Sign-out URL with callbackUrl so redirect uses canonical origin (fixes localhost on Vercel). */
export function getSignOutUrl(request?: Request, fallbackOrigin?: string): string {
  const origin = getCanonicalOrigin(request, fallbackOrigin);
  if (!origin || origin.includes('localhost')) return '/api/auth/signout';
  const callbackUrl = encodeURIComponent(`${origin}/`);
  return `${origin}/api/auth/signout?callbackUrl=${callbackUrl}`;
}
