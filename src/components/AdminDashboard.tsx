import { useState } from 'react';
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
  CheckCircle2,
  QrCode,
  Users,
  Search,
  Download,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Attendee } from '@/types/attendee';
import { apiService } from '@/services/api';
import { QR_GENERATION } from '@/config/qr';
import QRCode from 'qrcode';

interface AdminDashboardProps {
  attendees: Attendee[];
  onDelete?: () => void;
  onRefresh: () => void;
}

export function AdminDashboard({
  attendees,
  onRefresh,
}: AdminDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(
    null
  );
  const [showQR, setShowQR] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const filteredAttendees = attendees.filter(
    (attendee) =>
      attendee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attendee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attendee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (attendee.company ?? '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

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
      ...filteredAttendees.map((attendee) =>
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
    try {
      await apiService.deleteAttendee(id);
      toast.success('Attendee deleted');
      onRefresh();
    } catch {
      toast.error('Failed to delete attendee');
    }
  };

  const loadQRForAttendee = async (attendee: Attendee) => {
    const qrData = JSON.stringify({ id: attendee.id, email: attendee.email });
    const url = await QRCode.toDataURL(qrData, {
      width: QR_GENERATION.width,
      margin: QR_GENERATION.margin,
      errorCorrectionLevel: QR_GENERATION.errorCorrectionLevel,
    });
    setQrDataUrl(url);
  };

  return (
    <div className="space-y-6">
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
          <CardContent>
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
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            placeholder="Search attendees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
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
        <CardHeader>
          <CardTitle>Attendee List</CardTitle>
          <CardDescription>
            {filteredAttendees.length} of {attendees.length} attendees
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto h-[400px] w-full min-w-0">
            <Table className="min-w-[700px] w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttendees.map((attendee) => (
                  <TableRow key={attendee.id}>
                    <TableCell className="font-medium">
                      {attendee.firstName} {attendee.lastName}
                    </TableCell>
                    <TableCell>{attendee.email}</TableCell>
                    <TableCell>{attendee.company || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={attendee.checkedIn ? 'default' : 'secondary'}
                      >
                        {attendee.checkedIn ? 'Checked In' : 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(attendee.rsvpAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
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
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code</DialogTitle>
            <DialogDescription>
              QR code for {selectedAttendee?.firstName}{' '}
              {selectedAttendee?.lastName}
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
