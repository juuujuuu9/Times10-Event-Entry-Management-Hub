import { defineConfig } from 'auth-astro';
import Google from '@auth/core/providers/google';
import { getStaffRole } from './src/lib/staff';

// Force the OAuth redirect_uri when the request URL is wrong (e.g. Vercel infers localhost).
// Set AUTH_URL (and NEXTAUTH_URL in production) so sign-out and callbacks use the canonical origin.
// Fallback: VERCEL_URL (Vercel provides this; value is host only, e.g. my-app.vercel.app).
const authUrl =
  (typeof process !== 'undefined' && (process.env?.AUTH_URL || process.env?.NEXTAUTH_URL)) ||
  (typeof import.meta !== 'undefined' && ((import.meta.env?.AUTH_URL as string) || (import.meta.env?.NEXTAUTH_URL as string))) ||
  (typeof process !== 'undefined' &&
    process.env?.VERCEL_URL &&
    `https://${process.env.VERCEL_URL}`);
const authBase = authUrl
  ? authUrl.endsWith('/api/auth')
    ? authUrl
    : `${authUrl.replace(/\/$/, '')}/api/auth`
  : undefined;

export default defineConfig({
  basePath: '/api/auth',
  trustHost: true,
  ...(authBase && { redirectProxyUrl: authBase }),
  providers: [
    Google({
      clientId: import.meta.env.GOOGLE_CLIENT_ID,
      clientSecret: import.meta.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: 'select_account',
        },
      },
    }),
  ],
  callbacks: {
    redirect({ url, baseUrl }) {
      // Read at request time — module-level authUrl can be undefined if config ran at build.
      const runtimeAuthUrl =
        (typeof process !== 'undefined' && (process.env?.AUTH_URL || process.env?.NEXTAUTH_URL)) ||
        (typeof process !== 'undefined' &&
          process.env?.VERCEL_URL &&
          `https://${process.env.VERCEL_URL}`);
      const productionUrl = runtimeAuthUrl ?? authUrl ?? baseUrl;
      const origin = productionUrl ? new URL(productionUrl).origin : baseUrl;
      if (url.startsWith('/')) return `${origin}${url}`;
      try {
        if (new URL(url).origin === origin) return url;
      } catch {
        /* invalid url */
      }
      return origin;
    },
    async signIn({ user }) {
      const role = getStaffRole(user.email ?? undefined);
      return role !== null;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = (token.role as 'admin' | 'scanner' | 'staff') ?? 'staff';
        if (token.sub) session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const role = getStaffRole(user.email);
        if (role) token.role = role;
      }
      return token;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
});
