import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Users, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import type { Attendee } from '@/types/attendee';
import { apiService } from '@/services/api';
import { RSVPForm } from '@/components/RSVPForm';
import { CheckInScanner } from '@/components/CheckInScanner';
import { AdminDashboard } from '@/components/AdminDashboard';

export function AppShell() {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [activeTab, setActiveTab] = useState('rsvp');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAttendees = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getAllAttendees();
      setAttendees(data);
    } catch (err) {
      console.error('Error loading attendees:', err);
      const status = (err as Error & { status?: number })?.status;
      let message = 'Failed to load attendees';
      if (err instanceof TypeError && (err as Error).message === 'Failed to fetch') {
        message =
          'Cannot reach server. Make sure the dev server is running.';
      } else if (status === 404) {
        message = 'API not found.';
      } else if (status === 500) {
        message = 'Server error (e.g. database). Check DATABASE_URL and server logs.';
      } else if (err instanceof Error && (err as Error).message) {
        message = (err as Error).message;
      }
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendees();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Toaster position="top-center" richColors />

      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-[#d63a2e] p-2 rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-slate-900">
                  Event RSVP & Check-in
                </h1>
                <p className="text-xs text-slate-500">
                  Manage your event attendees
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-sm">
                <Users className="h-4 w-4 mr-1" />
                {attendees.length} Total
              </Badge>
              <Badge variant="default" className="text-sm bg-green-600">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                {attendees.filter((a) => a.checkedIn).length} Checked In
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d63a2e]"></div>
            <span className="ml-2 text-slate-600">Loading...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p>{error}</p>
            <Button onClick={loadAttendees} variant="outline" size="sm" className="mt-2">
              Retry
            </Button>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="relative w-full lg:w-[400px] h-12">
            {/* White track (reference: white container) */}
            <div
              className="absolute inset-0 rounded-full border border-slate-200 bg-white shadow-sm dark:bg-white dark:border-slate-200"
              aria-hidden
            />
            {/* Sliding active segment (reference: tinted block behind active tab) */}
            <div
              className="absolute top-2 bottom-2 rounded-full border border-slate-200 bg-slate-100 transition-[transform] duration-200 ease-out dark:border-slate-200 dark:bg-slate-100"
              style={{
                width: 'calc((100% - 1rem) / 3)',
                left: '0.5rem',
                transform: `translateX(${activeTab === 'rsvp' ? 0 : activeTab === 'checkin' ? 100 : 200}%)`,
              }}
              aria-hidden
            />
            <TabsList className="relative z-10 grid w-full grid-cols-3 h-full rounded-full border-0 bg-transparent p-2 dark:bg-transparent">
              <TabsTrigger
                value="rsvp"
                className="border-0 bg-transparent text-slate-700 data-[state=active]:bg-transparent data-[state=active]:text-[#d63a2e] data-[state=active]:font-semibold data-[state=active]:shadow-none dark:bg-transparent dark:text-slate-700 dark:data-[state=active]:bg-transparent dark:data-[state=active]:text-[#d63a2e]"
              >
                RSVP Form
              </TabsTrigger>
              <TabsTrigger
                value="checkin"
                className="border-0 bg-transparent text-slate-700 data-[state=active]:bg-transparent data-[state=active]:text-[#d63a2e] data-[state=active]:font-semibold data-[state=active]:shadow-none dark:bg-transparent dark:text-slate-700 dark:data-[state=active]:bg-transparent dark:data-[state=active]:text-[#d63a2e]"
              >
                Check-in
              </TabsTrigger>
              <TabsTrigger
                value="admin"
                className="border-0 bg-transparent text-slate-700 data-[state=active]:bg-transparent data-[state=active]:text-[#d63a2e] data-[state=active]:font-semibold data-[state=active]:shadow-none dark:bg-transparent dark:text-slate-700 dark:data-[state=active]:bg-transparent dark:data-[state=active]:text-[#d63a2e]"
              >
                Admin
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="rsvp" className="space-y-6">
            <RSVPForm
              onSuccess={async () => {
                await loadAttendees();
                setActiveTab('checkin');
              }}
            />
          </TabsContent>

          <TabsContent value="checkin" className="space-y-6">
            <CheckInScanner onCheckIn={loadAttendees} />
          </TabsContent>

          <TabsContent value="admin" className="space-y-6">
            <AdminDashboard
              attendees={attendees}
              onRefresh={loadAttendees}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
