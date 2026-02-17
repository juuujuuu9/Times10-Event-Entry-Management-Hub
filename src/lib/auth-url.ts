/**
 * Canonical origin for auth redirects. Use AUTH_URL when set, else derive from request headers
 * (fixes localhost on Vercel where Astro.url.origin can be wrong).
 */
export function getCanonicalOrigin(request?: Request, fallbackOrigin?: string): string {
  const authUrl =
    (typeof process !== 'undefined' && (process.env?.AUTH_URL || process.env?.NEXTAUTH_URL)) ||
    (typeof import.meta !== 'undefined' && ((import.meta.env?.AUTH_URL as string) || (import.meta.env?.NEXTAUTH_URL as string)));
  if (authUrl) return new URL(authUrl).origin;

  // Vercel: use Host/X-Forwarded-Host — Astro.url can be localhost.
  if (request) {
    const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
    const proto = request.headers.get('x-forwarded-proto') ?? 'https';
    if (host && !host.includes('localhost')) return `${proto}://${host.split(',')[0].trim()}`;
  }
  return fallbackOrigin ?? '';
}

/**
 * Relative sign-out path with callbackUrl. Always use relative URL so the browser
 * never navigates to an absolute localhost URL (Vercel can set Astro.url.origin to localhost).
 */
export function getSignOutUrl(request?: Request, fallbackOrigin?: string): string {
  const origin = getCanonicalOrigin(request, fallbackOrigin);
  const callback =
    origin && !origin.includes('localhost') ? `${origin}/` : '/';
  return `/api/auth/signout?callbackUrl=${encodeURIComponent(callback)}`;
}

/**
 * Props for a POST form that signs out without loading the GET signout page
 * (that page’s form action can be wrong on Vercel). Use when AUTH_URL/NEXTAUTH_URL
 * is set so we can fetch the CSRF token from the canonical origin.
 */
export async function getSignOutFormProps(
  request: Request
): Promise<{ action: string; callbackUrl: string; csrfToken: string } | null> {
  const origin = getCanonicalOrigin(request);
  if (!origin || origin.includes('localhost')) return null;
  try {
    const res = await fetch(`${origin}/api/auth/csrf`, {
      headers: { cookie: request.headers.get('cookie') ?? '' },
    });
    const data = (await res.json()) as { csrfToken?: string };
    if (!data?.csrfToken) return null;
    return {
      action: '/api/auth/signout',
      callbackUrl: `${origin}/`,
      csrfToken: data.csrfToken,
    };
  } catch {
    return null;
  }
}
