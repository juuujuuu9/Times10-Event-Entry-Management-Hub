import { useState, useRef, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, X, RotateCcw, CheckCircle2, QrCode, Copy, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { CheckInResult } from '@/types/attendee';
import { apiService } from '@/services/api';
import { QR_SCANNER } from '@/config/qr';
import {
  preloadScannerSounds,
  provideFeedback,
  type FeedbackType,
} from '@/lib/feedback';

interface CheckInScannerProps {
  onCheckIn?: () => void;
  standalone?: boolean;
}

function feedbackTypeFromResult(result: CheckInResult): FeedbackType {
  if (result.success) return 'success';
  if (result.alreadyCheckedIn) return 'alreadyCheckedIn';
  return 'error';
}

export function CheckInScanner({ onCheckIn, standalone = false }: CheckInScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<CheckInResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [copyFlash, setCopyFlash] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const processingRef = useRef(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<{ stop: () => Promise<void> } | null>(null);

  useEffect(() => {
    preloadScannerSounds();
  }, []);

  useEffect(() => {
    if (!announcement) return;
    const t = setTimeout(() => setAnnouncement(''), 2000);
    return () => clearTimeout(t);
  }, [announcement]);

  const startScanning = async () => {
    try {
      setScanning(true);
      setCameraError(null);
      setScanResult(null);

      const Html5Qrcode = await import('html5-qrcode');
      const html5QrCode = new Html5Qrcode.Html5Qrcode('reader');
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: QR_SCANNER.fps,
        qrbox: QR_SCANNER.qrbox,
        aspectRatio: QR_SCANNER.aspectRatio,
        showTorchButtonIfSupported: QR_SCANNER.showTorchButtonIfSupported,
      };

      const CONTINUOUS_MS = 150;

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText: string) => {
          if (processingRef.current) return;
          setTimeout(async () => {
            if (processingRef.current) return;
            processingRef.current = true;
            if (!standalone) stopScanning();

            try {
              const result = await apiService.checkInAttendee(decodedText);
              setScanResult(result);
              const ftype = feedbackTypeFromResult(result);
              provideFeedback(ftype, result.message, setAnnouncement);

              if (result.success) {
                toast.success(result.message);
                onCheckIn?.();
              } else {
                toast.error(result.message);
              }
            } catch (error) {
              console.error('Check-in error:', error);
              provideFeedback('error', 'Check-in failed', setAnnouncement);
              setScanResult({
                success: false,
                message: 'Check-in failed',
              });
              toast.error('Check-in failed');
            } finally {
              if (!standalone) processingRef.current = false;
            }
          }, CONTINUOUS_MS);
        },
        () => {}
      );
    } catch (error) {
      console.error('Camera error:', error);
      setCameraError(
        'Unable to access camera. Please ensure you have granted camera permissions.'
      );
      setScanning(false);
    }
  };

  const stopScanning = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.stop().catch(console.error);
      html5QrCodeRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const handleScanNext = () => {
    setScanResult(null);
    processingRef.current = false;
  };

  const readerEl = (
    <div
      id="reader"
      ref={scannerRef}
      className="w-full border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50"
      style={{ minHeight: standalone ? 'min(70vh, 400px)' : '300px' }}
    >
      {!scanning && (
        <div className="text-center text-slate-500">
          <Camera className="h-12 w-12 mx-auto mb-2" />
          <p>
            {standalone
              ? 'Tap "Start Scanner" to activate camera'
              : 'Click "Start Scanning" to activate camera'}
          </p>
        </div>
      )}
    </div>
  );

  const ariaLiveEl = (
    <div
      role="status"
      aria-live="polite"
      aria-atomic
      className="sr-only"
      key={announcement}
    >
      {announcement}
    </div>
  );

  const handleMobileScannerAction = () => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/`;
    const isMobile =
      typeof window !== 'undefined' &&
      (window.matchMedia('(pointer: coarse)').matches ||
        window.matchMedia('(max-width: 768px)').matches);
    if (isMobile) {
      window.open(url, '_blank', 'noopener,noreferrer');
      toast.success('Opening scanner in new tab.');
    } else {
      navigator.clipboard.writeText(url).then(
        () => {
          setCopyFlash(true);
          setTimeout(() => setCopyFlash(false), 300);
          toast.success('Copied! Open this link on a mobile device for mobile scanning.');
        },
        () => toast.error('Could not copy link.')
      );
    }
  };

  const buttons = (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        {!scanning ? (
          <Button
            onClick={startScanning}
            className="flex-1"
            size={standalone ? 'lg' : 'default'}
          >
            <Camera className="h-4 w-4 mr-2" />
            {standalone ? 'Start Scanner' : 'Start Scanning'}
          </Button>
        ) : (
          <Button
            onClick={stopScanning}
            variant="destructive"
            className="flex-1"
            size={standalone ? 'lg' : 'default'}
          >
            <X className="h-4 w-4 mr-2" />
            Stop Scanning
          </Button>
        )}
        {!standalone && (
          <Button
            onClick={() => setScanResult(null)}
            variant="outline"
            disabled={scanning}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>
      {!standalone && (
        <Button
          onClick={handleMobileScannerAction}
          variant="outline"
          size="default"
          className={`w-full transition-colors duration-150 bg-slate-200 text-slate-600 border-slate-300 hover:bg-slate-300 ${
            copyFlash ? 'bg-red-500! text-white! border-red-500!' : ''
          }`}
        >
          <Copy className="h-4 w-4 mr-2 hidden md:inline-block" />
          Mobile Scanner
        </Button>
      )}
    </div>
  );

  const errorEl = cameraError && (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
      <p className="text-sm">{cameraError}</p>
    </div>
  );

  const resultOverlay =
    standalone && scanResult ? (
      <div
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center px-4 ${
          scanResult.success
            ? 'bg-green-500'
            : scanResult.alreadyCheckedIn
              ? 'bg-amber-500'
              : 'bg-red-500'
        }`}
      >
        <div className="text-white text-center max-w-sm">
          {scanResult.success ? (
            <CheckCircle2 className="h-20 w-20 mx-auto mb-4" aria-hidden />
          ) : scanResult.alreadyCheckedIn ? (
            <AlertCircle className="h-20 w-20 mx-auto mb-4" aria-hidden />
          ) : (
            <X className="h-20 w-20 mx-auto mb-4" aria-hidden />
          )}
          <p className="text-xl font-semibold mb-2">
            {scanResult.success
              ? 'Checked in'
              : scanResult.alreadyCheckedIn
                ? 'Already checked in'
                : 'Invalid code'}
          </p>
          <p className="text-white/90 text-lg">{scanResult.message}</p>
        </div>
        <Button
          onClick={handleScanNext}
          variant="secondary"
          size="lg"
          className="mt-8 min-w-[200px]"
        >
          Scan next
        </Button>
      </div>
    ) : null;

  if (standalone) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100">
        {ariaLiveEl}
        <div className="w-full max-w-md space-y-4 px-4">
          {readerEl}
          {buttons}
          {errorEl}
        </div>
        {resultOverlay}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {ariaLiveEl}
      <Card>
        <CardHeader>
          <CardTitle>QR Code Scanner</CardTitle>
          <CardDescription>
            Point your camera at the attendee's QR code to check them in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {readerEl}
            {buttons}
            {errorEl}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scan Results</CardTitle>
          <CardDescription>
            Results from the latest QR code scan
          </CardDescription>
        </CardHeader>
        <CardContent>
          {scanResult ? (
            <div
              className={`p-4 rounded-lg ${
                scanResult.success
                  ? 'bg-green-50 border border-green-200'
                  : scanResult.alreadyCheckedIn
                    ? 'bg-amber-50 border border-amber-200'
                    : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {scanResult.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : scanResult.alreadyCheckedIn ? (
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                ) : (
                  <X className="h-5 w-5 text-red-600" />
                )}
                <p
                  className={`font-medium ${
                    scanResult.success
                      ? 'text-green-800'
                      : scanResult.alreadyCheckedIn
                        ? 'text-amber-800'
                        : 'text-red-800'
                  }`}
                >
                  {scanResult.success
                    ? 'Check-in Successful!'
                    : scanResult.alreadyCheckedIn
                      ? 'Already Checked In'
                      : 'Check-in Failed'}
                </p>
              </div>
              <p
                className={`text-sm ${
                  scanResult.success
                    ? 'text-green-700'
                    : scanResult.alreadyCheckedIn
                      ? 'text-amber-700'
                      : 'text-red-700'
                }`}
              >
                {scanResult.message}
              </p>
              {(scanResult.success || scanResult.alreadyCheckedIn) &&
                scanResult.event && (
                  <p
                    className={`text-sm mt-1 ${
                      scanResult.success ? 'text-green-700' : 'text-amber-700'
                    }`}
                  >
                    Event: {scanResult.event.name}
                  </p>
                )}
              {scanResult.attendee && (
                <div className="mt-4 pt-4 border-t border-current border-opacity-20">
                  <p className="text-sm font-medium mb-2">Attendee Details:</p>
                  <div className="text-sm space-y-1">
                    <p>
                      <strong>Name:</strong>{' '}
                      {scanResult.attendee.firstName}{' '}
                      {scanResult.attendee.lastName}
                    </p>
                    <p>
                      <strong>Email:</strong> {scanResult.attendee.email}
                    </p>
                    {scanResult.attendee.company && (
                      <p>
                        <strong>Company:</strong> {scanResult.attendee.company}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-slate-500 py-8">
              <QrCode className="h-12 w-12 mx-auto mb-2" />
              <p>No scan results yet</p>
              <p className="text-sm">Start scanning to see results here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
