'use client';

import QRCode from 'qrcode';
import { useEffect, useRef, useState } from 'react';

export interface QrCodeCardProps {
  readonly token: string;
  readonly stationTitle: string;
  readonly icon?: string;
}

const SIZE = 512;
// 22% of the QR's width — well under the ~30% tile tolerance that
// errorCorrectionLevel 'H' guarantees, so a centered logo this size never
// makes the code unreadable.
const LOGO_RATIO = 0.22;

function isUrl(value: string): boolean {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

async function drawLogo(canvas: HTMLCanvasElement, icon: string | undefined): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx || !icon) return;

  const logoSize = canvas.width * LOGO_RATIO;
  const x = (canvas.width - logoSize) / 2;
  const y = (canvas.height - logoSize) / 2;

  // White backing so the logo reads cleanly against the QR modules under it.
  const pad = logoSize * 0.12;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x - pad, y - pad, logoSize + pad * 2, logoSize + pad * 2);

  if (isUrl(icon)) {
    await new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, x, y, logoSize, logoSize);
        resolve();
      };
      // A logo that fails to load (e.g. no CORS headers) just leaves the
      // white square — the QR itself still scans fine either way.
      img.onerror = () => {
        resolve();
      };
      img.src = icon;
    });
  } else {
    ctx.font = `${String(logoSize * 0.85)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, canvas.width / 2, canvas.height / 2 + logoSize * 0.05);
  }
}

export function QrCodeCard({ token, stationTitle, icon }: QrCodeCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsReady(false);
    QRCode.toCanvas(canvas, token, {
      width: SIZE,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then(() => drawLogo(canvas, icon))
      .then(() => {
        setIsReady(true);
      })
      .catch(() => undefined);
  }, [token, icon]);

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `qr-${token}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas ref={canvasRef} className="h-28 w-28 rounded border border-neutral-200" />
      <button
        type="button"
        disabled={!isReady}
        onClick={handleDownload}
        className="text-xs font-semibold text-neutral-900 underline disabled:opacity-50"
      >
        Descargar QR — {stationTitle}
      </button>
    </div>
  );
}
