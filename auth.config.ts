import { defineConfig } from 'auth-astro';
import Google from '@auth/core/providers/google';
import { getStaffRole } from './src/lib/staff';

export default defineConfig({
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
