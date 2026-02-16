/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    session: import('@auth/core/types').Session | null;
    user: import('@auth/core/types').User | null;
    isStaff: boolean;
    isAdmin: boolean;
    isScanner: boolean;
  }
}
