/** Structured audit log for check-in attempts (JSON lines to console). */
export type CheckInOutcome =
  | 'success'
  | 'invalid_format'
  | 'not_found'
  | 'already_checked_in'
  | 'rate_limited'
  | 'replay_attempt'
  | 'invalid_or_expired'
  | 'error';

export function logCheckInAttempt(params: {
  ip: string;
  outcome: CheckInOutcome;
  attendeeId?: string | null;
  timestamp?: Date;
}): void {
  const { ip, outcome, attendeeId = null, timestamp = new Date() } = params;
  const line = JSON.stringify({
    type: 'check_in_attempt',
    timestamp: timestamp.toISOString(),
    ip,
    outcome,
    attendeeId,
  });
  console.log(line);
}
