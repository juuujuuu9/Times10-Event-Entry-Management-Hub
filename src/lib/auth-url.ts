/**
 * Canonical origin for auth redirects. Use when AUTH_URL is set (production on Vercel)
 * to avoid localhost redirects.
 */
export function getCanonicalOrigin(fallbackOrigin?: string): string {
  const authUrl =
    (typeof process !== 'undefined' && process.env?.AUTH_URL) ||
    (typeof import.meta !== 'undefined' && (import.meta.env?.AUTH_URL as string));
  if (authUrl) return new URL(authUrl).origin;
  return fallbackOrigin ?? '';
}

/** Sign-out URL with callbackUrl so redirect uses canonical origin (fixes localhost on Vercel). */
export function getSignOutUrl(fallbackOrigin?: string): string {
  const origin = getCanonicalOrigin(fallbackOrigin);
  if (!origin) return '/api/auth/signout';
  const callbackUrl = encodeURIComponent(`${origin}/`);
  return `/api/auth/signout?callbackUrl=${callbackUrl}`;
}
