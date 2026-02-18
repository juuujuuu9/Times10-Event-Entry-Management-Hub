import { useState, useRef, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Loader2,
  QrCode,
  Users,
  Search,
  Download,
  RotateCcw,
  Trash2,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import Fuse from 'fuse.js';
import type { Attendee } from '@/types/attendee';
import { apiService } from '@/services/api';
import { QR_GENERATION } from '@/config/qr';
import QRCode from 'qrcode';

function formatNameLastFirst(attendee: Attendee): string {
  return `${attendee.lastName}, ${attendee.firstName}`;
}

function getInitials(attendee: Attendee): string {
  const f = attendee.firstName?.charAt(0) ?? '';
  const l = attendee.lastName?.charAt(0) ?? '';
  return (f + l).toUpperCase() || '?';
}

function formatRelativeTime(checkedInAt: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(checkedInAt).getTime()) / 1000
  );
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return new Date(checkedInAt).toLocaleDateString();
}

interface AdminDashboardProps {
  attendees: Attendee[];
  /** When set, show Import CSV (event-scoped). */
  eventId?: string;
  onRefresh: () => void;
}

export function AdminDashboard({
  attendees,
  eventId,
  onRefresh,
}: AdminDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(
    null
  );
  const [showQR, setShowQR] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [sortDescending, setSortDescending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [density, setDensity] = useState<'comfortable' | 'compact'>(() => {
    if (typeof window === 'undefined') return 'comfortable';
    return (localStorage.getItem('table-density') as 'comfortable' | 'compact') || 'comfortable';
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const fuse = useRef(
    new Fuse<Attendee>([], {
      keys: ['firstName', 'lastName', 'email', 'company'],
      threshold: 0.3,
    })
  ).current;
  useEffect(() => {
    fuse.setCollection(attendees);
  }, [attendees]);

  const recentCheckIns = [...attendees]
    .filter((a) => a.checkedIn && a.checkedInAt)
    .sort(
      (a, b) =>
        new Date(b.checkedInAt!).getTime() - new Date(a.checkedInAt!).getTime()
    )
    .slice(0, 10);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') onRefresh();
    }, 30000);
    return () => clearInterval(id);
  }, [onRefresh]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, []);

  useEffect(() => {
    localStorage.setItem('table-density', density);
  }, [density]);

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedAttendees.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedAttendees.map((a) => a.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} attendee(s)?`)) return;
    for (const id of selectedIds) {
      try {
        await apiService.deleteAttendee(id);
      } catch {
        toast.error(`Failed to delete attendee`);
      }
    }
    toast.success(`Deleted ${selectedIds.size} attendee(s)`);
    setSelectedIds(new Set());
    onRefresh();
  };

  const handleBulkExport = () => {
    const toExport = sortedAttendees.filter((a) => selectedIds.has(a.id));
    if (toExport.length === 0) return;
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Company', 'Dietary Restrictions', 'Checked In', 'Check-in Time', 'Registration Date'];
    const csvContent = [
      headers.join(','),
      ...toExport.map((a) =>
        [a.firstName, a.lastName, a.email, a.phone ?? '', a.company ?? '', a.dietaryRestrictions ?? '', a.checkedIn ? 'Yes' : 'No', a.checkedInAt ? new Date(a.checkedInAt).toLocaleString() : '', new Date(a.rsvpAt).toLocaleDateString()]
          .map((f) => `"${f}"`)
          .join(',')
      ),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `event-attendees-selected-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${toExport.length} attendee(s)`);
  };

  const filteredAttendees = searchTerm.trim()
    ? fuse.search(searchTerm).map((r) => r.item)
    : attendees;

  const sortedAttendees = [...filteredAttendees].sort((a, b) => {
    const cmp = a.lastName.localeCompare(b.lastName, undefined, { sensitivity: 'base' })
      || a.firstName.localeCompare(b.firstName, undefined, { sensitivity: 'base' });
    return sortDescending ? -cmp : cmp;
  });

  const exportToCSV = () => {
    const headers = [
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Company',
      'Dietary Restrictions',
      'Checked In',
      'Check-in Time',
      'Registration Date',
    ];
    const csvContent = [
      headers.join(','),
      ...sortedAttendees.map((attendee) =>
        [
          attendee.firstName,
          attendee.lastName,
          attendee.email,
          attendee.phone ?? '',
          attendee.company ?? '',
          attendee.dietaryRestrictions ?? '',
          attendee.checkedIn ? 'Yes' : 'No',
          attendee.checkedInAt
            ? new Date(attendee.checkedInAt).toLocaleString()
            : '',
          new Date(attendee.rsvpAt).toLocaleDateString(),
        ]
          .map((field) => `"${field}"`)
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `event-attendees-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this attendee?')) return;
    setDeletingId(id);
    try {
      await apiService.deleteAttendee(id);
      toast.success('Attendee deleted');
      onRefresh();
    } catch {
      toast.error('Failed to delete attendee');
    } finally {
      setDeletingId(null);
    }
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !eventId) return;
    e.target.value = '';
    setImporting(true);
    try {
      const { imported, skipped } = await apiService.importAttendeesCSV(eventId, file);
      toast.success(`Imported ${imported} attendee(s)${skipped > 0 ? `, ${skipped} skipped (duplicate email)` : ''}`);
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const loadQRForAttendee = async (attendee: Attendee) => {
    const { qrPayload } = await apiService.getQRPayload(attendee.id);
    const url = await QRCode.toDataURL(qrPayload, {
      width: QR_GENERATION.width,
      margin: QR_GENERATION.margin,
      errorCorrectionLevel: QR_GENERATION.errorCorrectionLevel,
    });
    setQrDataUrl(url);
  };

  return (
    <div className="space-y-6">
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          ref={searchInputRef}
          placeholder="Search attendees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-20"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Attendees
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendees.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Checked In</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {attendees.filter((a) => a.checkedIn).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {attendees.filter((a) => !a.checkedIn).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Check-in Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-blue-600">
              {attendees.length > 0
                ? Math.round(
                    (attendees.filter((a) => a.checkedIn).length /
                      attendees.length) *
                      100
                  )
                : 0}
              %
            </div>
            {attendees.length > 0 && (
              <div className="w-full overflow-hidden rounded-full bg-muted h-2">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-300"
                  style={{
                    width: `${(attendees.filter((a) => a.checkedIn).length / attendees.length) * 100}%`,
                  }}
                />
              </div>
            )}
            {attendees.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {attendees.filter((a) => a.checkedIn).length} of {attendees.length} checked in
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {recentCheckIns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Recent check-ins
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Latest check-in activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recentCheckIns.map((a) => {
                const isRecent =
                  a.checkedInAt &&
                  Date.now() - new Date(a.checkedInAt).getTime() < 5 * 60 * 1000;
                return (
                  <li
                    key={a.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 ${
                        isRecent ? 'bg-green-500' : 'bg-transparent'
                      }`}
                      aria-hidden
                    />
                    <span className="font-medium">
                      {a.firstName} {a.lastName}
                    </span>
                    <span className="text-muted-foreground">
                      {a.checkedInAt && formatRelativeTime(a.checkedInAt)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
        {eventId && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleImportCSV}
              disabled={importing}
            />
            <Button
              variant="outline"
              disabled={importing}
              onClick={() => fileInputRef.current?.click()}
            >
              {importing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {importing ? 'Importing…' : 'Import CSV'}
            </Button>
          </>
        )}
        <Button onClick={exportToCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
        <Button onClick={onRefresh} variant="outline">
          <RotateCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="flex-row flex-wrap gap-4">
          <div>
            <CardTitle className="text-2xl font-semibold">Attendee List</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {filteredAttendees.length} of {attendees.length} attendees
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-muted-foreground">Density:</span>
            <div className="flex rounded-md border overflow-hidden">
              <button
                type="button"
                onClick={() => setDensity('comfortable')}
                className={`px-2 py-1 text-xs font-medium ${
                  density === 'comfortable'
                    ? 'bg-muted'
                    : 'hover:bg-muted/50'
                }`}
              >
                Comfortable
              </button>
              <button
                type="button"
                onClick={() => setDensity('compact')}
                className={`px-2 py-1 text-xs font-medium border-l ${
                  density === 'compact'
                    ? 'bg-muted'
                    : 'hover:bg-muted/50'
                }`}
              >
                Compact
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sortedAttendees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Users className="h-12 w-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                No attendees yet
              </h3>
              <p className="text-sm text-slate-500 mb-6 max-w-sm">
                Import from CSV or add manually to get started.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                {eventId && (
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={importing}
                    >
                      {importing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      {importing ? 'Importing…' : 'Import CSV'}
                    </Button>
                )}
                <Button variant="outline" asChild>
                  <a href="/">{eventId ? 'Add Attendee' : 'Go to RSVP'}</a>
                </Button>
              </div>
            </div>
          ) : (
          <div className="space-y-2">
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 py-2 px-3 rounded-md bg-muted">
                <span className="text-sm font-medium">
                  {selectedIds.size} selected
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkExport}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Clear
                </Button>
              </div>
            )}
          <div className="overflow-auto h-[400px] w-full min-w-0 relative">
            <Table className="min-w-[700px] w-full">
              <TableHeader>
                <TableRow className="sticky top-0 z-10 bg-card">
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === sortedAttendees.length && sortedAttendees.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-input"
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-2 h-8 font-semibold"
                      onClick={() => setSortDescending((d) => !d)}
                    >
                      Name
                      {sortDescending ? (
                        <ArrowDown className="ml-1 h-4 w-4" />
                      ) : (
                        <ArrowUp className="ml-1 h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAttendees.map((attendee) => (
                  <TableRow
                    key={attendee.id}
                    className={`group ${density === 'compact' ? '' : ''}`}
                  >
                    <TableCell className={density === 'compact' ? 'py-1' : 'py-3'}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(attendee.id)}
                        onChange={() => toggleSelect(attendee.id)}
                        className="rounded border-input"
                        aria-label={`Select ${formatNameLastFirst(attendee)}`}
                      />
                    </TableCell>
                    <TableCell className={`font-medium ${density === 'compact' ? 'py-1' : 'py-3'}`}>
                      <div className="flex items-center gap-2">
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium"
                          aria-hidden
                        >
                          {getInitials(attendee)}
                        </span>
                        {formatNameLastFirst(attendee)}
                      </div>
                    </TableCell>
                    <TableCell className={density === 'compact' ? 'py-1' : 'py-3'}>{attendee.email}</TableCell>
                    <TableCell className={density === 'compact' ? 'py-1' : 'py-3'}>{attendee.company || '-'}</TableCell>
                    <TableCell className={density === 'compact' ? 'py-1' : 'py-3'}>
                      <Badge
                        variant={attendee.checkedIn ? 'success' : 'muted'}
                        className="transition-colors duration-200"
                      >
                        {attendee.checkedIn ? 'Checked In' : 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell className={density === 'compact' ? 'py-1' : 'py-3'}>
                      {new Date(attendee.rsvpAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className={density === 'compact' ? 'py-1' : 'py-3'}>
                      <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            setSelectedAttendee(attendee);
                            await loadQRForAttendee(attendee);
                            setShowQR(true);
                          }}
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(attendee.id)}
                          disabled={deletingId === attendee.id}
                        >
                          {deletingId === attendee.id ? (
                            <Loader2 className="h-4 w-4 text-red-600 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-red-600" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code</DialogTitle>
            <DialogDescription>
              QR code for {selectedAttendee && formatNameLastFirst(selectedAttendee)}
            </DialogDescription>
          </DialogHeader>
          {selectedAttendee && (
            <div className="text-center space-y-4">
              <img
                src={qrDataUrl}
                alt="QR Code"
                className="mx-auto"
              />
              <div className="text-sm text-slate-600">
                <p>{selectedAttendee.email}</p>
                <p>ID: {selectedAttendee.id}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
