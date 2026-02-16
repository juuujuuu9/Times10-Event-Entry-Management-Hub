import { defineConfig } from 'auth-astro';
import Google from '@auth/core/providers/google';
import { getStaffRole } from './src/lib/staff';

// Force the OAuth redirect_uri when the request URL is wrong (e.g. Vercel infers localhost).
// Set AUTH_URL in production (e.g. https://qrsuite.times10.net or https://qrsuite.times10.net/api/auth).
const authUrl =
  (typeof process !== 'undefined' && process.env?.AUTH_URL) ||
  (typeof import.meta !== 'undefined' && (import.meta.env?.AUTH_URL as string));
const authBase = authUrl
  ? authUrl.endsWith('/api/auth')
    ? authUrl
    : `${authUrl.replace(/\/$/, '')}/api/auth`
  : undefined;

export default defineConfig({
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
      // Catch-all: when AUTH_URL is set, never redirect to localhost (fixes signout, callback, etc. on Vercel).
      const canonicalOrigin = authBase ? new URL(authBase).origin : null;
      const base = canonicalOrigin ?? baseUrl;
      if (url.startsWith('/')) return `${base}${url}`;
      try {
        const u = new URL(url);
        if (canonicalOrigin && (u.origin.includes('localhost') || u.origin === baseUrl)) {
          return `${canonicalOrigin}${u.pathname}${u.search}${u.hash}`;
        }
        if (u.origin === baseUrl) return url;
        return base;
      } catch {
        return base;
      }
    },
    async signIn({ user }) {
      const role = getStaffRole(user.email ?? undefined);
      return role !== null;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = (token.role as 'admin' | 'scanner' | 'staff') ?? 'staff';
        session.user.id = token.sub ?? undefined;
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
