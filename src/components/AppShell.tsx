import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Calendar } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <Toaster position="top-center" richColors />

      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-foreground">
                  Event RSVP & Check-in
                </h1>
                <p className="text-xs text-muted-foreground">
                  Manage your event attendees
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Loading...</span>
          </div>
        )}

        {error && (
          <div className="bg-[var(--red-2)] border border-[var(--red-6)] text-[var(--red-11)] px-4 py-3 rounded-lg mb-6">
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
              className="absolute inset-0 rounded-full border border-border bg-card shadow-sm"
              aria-hidden
            />
            {/* Sliding active segment (reference: tinted block behind active tab) */}
            <div
              className="absolute top-2 bottom-2 rounded-full border border-border bg-muted transition-[transform] duration-200 ease-out"
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
                className="border-0 bg-transparent text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:shadow-none"
              >
                RSVP Form
              </TabsTrigger>
              <TabsTrigger
                value="checkin"
                className="border-0 bg-transparent text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:shadow-none"
              >
                Check-in
              </TabsTrigger>
              <TabsTrigger
                value="admin"
                className="border-0 bg-transparent text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:shadow-none"
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
