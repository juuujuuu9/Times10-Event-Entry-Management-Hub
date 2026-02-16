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
  qrExpiresAt?: string;
  qrUsedAt?: string;
  qrUsedByDevice?: string;
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
  message: string;
}
