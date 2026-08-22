'use client';

import { useEffect, useRef, useState } from 'react';
import { renderQrToCanvas } from './renderQr';

export interface QrCodeCardProps {
  readonly token: string;
  readonly stationTitle: string;
  readonly icon?: string;
}

const SIZE = 512;

export function QrCodeCard({ token, stationTitle, icon }: QrCodeCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsReady(false);
    renderQrToCanvas(canvas, token, icon, SIZE)
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

  function handleCopy() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) {
        setCopyStatus('error');
        return;
      }
      navigator.clipboard
        .write([new ClipboardItem({ 'image/png': blob })])
        .then(() => {
          setCopyStatus('copied');
          setTimeout(() => {
            setCopyStatus('idle');
          }, 2000);
        })
        .catch(() => {
          setCopyStatus('error');
        });
    }, 'image/png');
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas ref={canvasRef} className="h-28 w-28 rounded border border-neutral-200" />
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          disabled={!isReady}
          onClick={handleDownload}
          className="text-xs font-semibold text-neutral-900 underline disabled:opacity-50"
        >
          Descargar PNG — {stationTitle}
        </button>
        <button
          type="button"
          disabled={!isReady}
          onClick={handleCopy}
          className="text-xs font-semibold text-neutral-900 underline disabled:opacity-50"
        >
          {copyStatus === 'copied'
            ? 'Copiado ✓'
            : copyStatus === 'error'
              ? 'No se pudo copiar'
              : 'Copiar imagen'}
        </button>
      </div>
    </div>
  );
}
