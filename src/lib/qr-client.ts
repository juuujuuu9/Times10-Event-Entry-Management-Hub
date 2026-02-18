import QRCode from 'qrcode';

interface QRCodeOptions {
  width?: number;
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  color?: {
    dark?: string;
    light?: string;
  };
}

const DEFAULT_OPTIONS: Required<QRCodeOptions> = {
  width: 280,
  margin: 4,
  errorCorrectionLevel: 'H',
  color: {
    dark: '#000000',
    light: '#FFFFFF',
  },
};

/**
 * Generate a QR code as a base64 data URL.
 * This is isomorphic and can run on both server and client.
 * Optimized for phone-to-phone scanning with high contrast colors.
 */
export async function generateQRCodeBase64(
  payload: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  return QRCode.toDataURL(payload, {
    width: opts.width,
    margin: opts.margin,
    errorCorrectionLevel: opts.errorCorrectionLevel,
    color: opts.color,
    type: 'image/png',
  });
}
