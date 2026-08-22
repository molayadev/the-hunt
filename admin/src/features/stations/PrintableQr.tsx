'use client';

import { useEffect, useRef } from 'react';
import { renderQrToCanvas } from './renderQr';

export interface PrintableQrProps {
  readonly token: string;
  readonly order: number;
  readonly title: string;
  readonly icon?: string;
}

const SIZE = 640;

export function PrintableQr({ token, order, title, icon }: PrintableQrProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderQrToCanvas(canvas, token, icon, SIZE).catch(() => undefined);
  }, [token, icon]);

  return (
    <div className="flex flex-col items-center justify-center gap-2 p-4">
      <canvas ref={canvasRef} className="h-full max-h-[70mm] w-full max-w-[70mm]" />
      <p className="text-center text-sm font-semibold">
        {order}. {title}
      </p>
    </div>
  );
}
