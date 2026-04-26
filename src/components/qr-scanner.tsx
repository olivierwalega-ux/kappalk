import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QrScannerProps {
  onResult: (text: string) => void;
  onError?: (msg: string) => void;
  paused?: boolean;
}

export function QrScanner({ onResult, onError, paused }: QrScannerProps) {
  const containerId = "kapp-qr-reader";
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handledRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    handledRef.current = false;

    const start = async () => {
      try {
        const scanner = new Html5Qrcode(containerId, { verbose: false });
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1 },
          (decodedText) => {
            if (handledRef.current) return;
            handledRef.current = true;
            onResult(decodedText);
          },
          () => {
            // ignore per-frame decode errors
          },
        );
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Brak dostępu do kamery";
        onError?.(msg);
      }
    };

    start();

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      if (s) {
        s.stop()
          .then(() => s.clear())
          .catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [onResult, onError]);

  // Pause/resume scanning when modal opens (avoid duplicate handling)
  useEffect(() => {
    const s = scannerRef.current;
    if (!s) return;
    if (paused) {
      handledRef.current = true;
    } else {
      // Allow new scans again when un-paused
      setTimeout(() => {
        handledRef.current = false;
      }, 300);
    }
  }, [paused]);

  return (
    <div className="relative h-full w-full">
      <div id={containerId} className="h-full w-full overflow-hidden rounded-3xl [&>video]:!h-full [&>video]:!w-full [&>video]:object-cover" />
    </div>
  );
}
