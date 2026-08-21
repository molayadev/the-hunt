import { useEffect, useRef } from 'react';
import { useQrDecoder } from './useQrDecoder';

export interface QrViewfinderProps {
  readonly stream: MediaStream;
  readonly onDecode: (value: string) => void;
}

export function QrViewfinder({ stream, onDecode }: QrViewfinderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    video.play().catch(() => undefined);
  }, [stream]);

  useQrDecoder(videoRef, true, onDecode);

  return (
    <video
      ref={videoRef}
      playsInline
      muted
      className="h-full w-full object-cover"
      aria-label="Buscador de código QR"
    />
  );
}
