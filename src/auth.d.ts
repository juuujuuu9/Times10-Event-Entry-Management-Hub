import type { DefaultUser } from '@auth/core/types';

declare module '@auth/core/types' {
  interface User extends DefaultUser {
    role?: 'admin' | 'scanner' | 'staff';
  }
}
