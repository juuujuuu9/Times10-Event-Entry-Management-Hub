export const QR_GENERATION = {
  /**
   * Optimized for phone-to-phone scanning.
   * 280px = ~7cm, fits comfortably on small screens while remaining scannable.
   * Too large = moiré patterns and glare issues. Too small = hard to focus.
   */
  width: 280,
  /**
   * Quiet zone (margin) is critical for phone-to-phone:
   * - 4 modules = adequate isolation from screen bezels/UI
   * - Helps scanner distinguish QR from phone frame/reflections
   */
  margin: 4,
  /**
   * H = High (30% redundancy).
   * Essential for phone screens: handles glare, cracks, screen protectors,
   * and the inevitable thumb smudge over part of the code.
   */
  errorCorrectionLevel: 'H' as const,
  scale: 4,
  /**
   * Color contrast optimized for OLED/LCD screens.
   * Pure black/white avoids subpixel rendering issues.
   */
  color: {
    dark: '#000000',
    light: '#FFFFFF',
  },
};

export const QR_SCANNER = {
  fps: 10,
  qrbox: { width: 250, height: 250 },
  aspectRatio: 1.0,
  showTorchButtonIfSupported: true,
  /** Debounce between scans in continuous mode (ms). Higher reduces false positives. */
  debounceMs: 500,
};
