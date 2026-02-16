export interface Attendee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  dietaryRestrictions?: string;
  checkedIn: boolean;
  checkedInAt?: string;
  rsvpAt: string;
  qrCode?: string;
  qrPayload?: string;
  qrExpiresAt?: string;
  qrUsedAt?: string;
  qrUsedByDevice?: string;
  eventId?: string;
  micrositeEntryId?: string;
  sourceData?: unknown;
  createdAt?: string;
}

export interface RSVPFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  dietaryRestrictions: string;
}

export interface CheckInResult {
  success: boolean;
  attendee?: Attendee;
  event?: { id: string; name: string };
  message: string;
}
