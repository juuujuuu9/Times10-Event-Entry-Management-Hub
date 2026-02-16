export const QR_GENERATION = {
  width: 200,
  margin: 2,
  errorCorrectionLevel: 'M' as const,
  scale: 4,
};

export const QR_SCANNER = {
  fps: 10,
  qrbox: { width: 250, height: 250 },
  aspectRatio: 1.0,
  showTorchButtonIfSupported: true,
};
