import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { Attendee } from '@/types/attendee';
import { apiService } from '@/services/api';
import { AdminDashboard } from '@/components/AdminDashboard';
import { Toaster } from '@/components/ui/sonner';

export interface EventOption {
  id: string;
  name: string;
  slug: string;
}

interface AdminPageProps {
  /** Initial attendees from server (optional). */
  initialAttendees?: Attendee[];
  /** Events for selector. */
  events?: EventOption[];
  /** Pre-selected event ID from URL ?event= */
  selectedEventId?: string;
}

export function AdminPage({
  initialAttendees = [],
  events = [],
  selectedEventId = '',
}: AdminPageProps) {
  const [attendees, setAttendees] = useState<Attendee[]>(initialAttendees);
  const [eventId, setEventId] = useState(selectedEventId);
  const [loading, setLoading] = useState(!initialAttendees.length);
  const [error, setError] = useState<string | null>(null);

  const loadAttendees = useCallback(async (eid?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getAllAttendees(eid || undefined);
      setAttendees(data);
    } catch (err) {
      console.error('Error loading attendees:', err);
      const status = (err as Error & { status?: number })?.status;
      let message = 'Failed to load attendees';
      if (err instanceof TypeError && (err as Error).message === 'Failed to fetch') {
        message = 'Cannot reach server. Make sure the dev server is running.';
      } else if (status === 401) {
        message = 'Session expired. Please sign in again.';
      } else if (status === 500) {
        message = 'Server error. Check DATABASE_URL and server logs.';
      } else if (err instanceof Error && (err as Error).message) {
        message = (err as Error).message;
      }
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setEventId(selectedEventId);
  }, [selectedEventId]);

  useEffect(() => {
    loadAttendees(eventId || undefined);
  }, [eventId, loadAttendees]);

  const onEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const params = new URLSearchParams(window.location.search);
    if (value) {
      params.set('event', value);
    } else {
      params.delete('event');
    }
    const qs = params.toString();
    window.location.href = qs ? `/admin?${qs}` : '/admin';
  };

  return (
    <>
      <Toaster position="top-center" richColors />
      {events.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <label htmlFor="event-select" className="text-sm font-medium text-slate-700">
            Event
          </label>
          <select
            id="event-select"
            value={eventId}
            onChange={onEventChange}
            className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#d63a2e] focus:outline-none focus:ring-1 focus:ring-[#d63a2e]"
          >
            <option value="">All events</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name}
              </option>
            ))}
          </select>
          <a
            href="/admin/events/new"
            className="text-sm text-[#d63a2e] hover:underline"
          >
            + New event
          </a>
        </div>
      )}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d63a2e]" />
          <span className="ml-2 text-slate-600">Loading...</span>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => loadAttendees(eventId || undefined)}
            className="mt-2 text-sm font-medium underline"
          >
            Retry
          </button>
        </div>
      )}
      {!loading && (
        <AdminDashboard
          attendees={attendees}
          eventId={eventId || undefined}
          onRefresh={() => loadAttendees(eventId || undefined)}
        />
      )}
    </>
  );
}
