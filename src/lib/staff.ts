/**
 * Staff role from env allowlist. No DB table; use STAFF_EMAILS, ADMIN_EMAILS, STAFF_DOMAINS.
 */

export type StaffRole = 'admin' | 'scanner' | 'staff';

function getEnv(name: string): string | undefined {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return (import.meta.env as Record<string, string | undefined>)[name];
  }
  return typeof process !== 'undefined' ? process.env[name] : undefined;
}

function parseList(value: string | undefined): string[] {
  if (!value || typeof value !== 'string') return [];
  return value.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
}

export function getStaffRole(email: string | null | undefined): StaffRole | null {
  if (!email || typeof email !== 'string') return null;
  const normalized = email.trim().toLowerCase();
  const domain = normalized.split('@')[1];

  const adminEmails = parseList(getEnv('ADMIN_EMAILS'));
  const staffEmails = parseList(getEnv('STAFF_EMAILS'));
  const staffDomains = parseList(getEnv('STAFF_DOMAINS'));

  if (adminEmails.length > 0 && adminEmails.includes(normalized)) return 'admin';
  if (staffEmails.length > 0 && staffEmails.includes(normalized)) return 'staff';
  if (staffDomains.length > 0 && domain && staffDomains.includes(domain)) return 'staff';

  return null;
}

export function isStaffEmail(email: string | null | undefined): boolean {
  return getStaffRole(email) !== null;
}
