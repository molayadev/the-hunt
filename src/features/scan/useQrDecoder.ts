import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import jsQR from 'jsqr';

interface BarcodeDetectorLike {
  detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>;
}

declare global {
  interface Window {
    BarcodeDetector?: new (options: { formats: string[] }) => BarcodeDetectorLike;
  }
}

async function decodeFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  detector: BarcodeDetectorLike | null,
): Promise<string | null> {
  if (detector) {
    const results = await detector.detect(video);
    return results[0]?.rawValue ?? null;
  }

  const context = canvas.getContext('2d');
  if (!context) return null;
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const result = jsQR(imageData.data, imageData.width, imageData.height);
  return result?.data ?? null;
}

export function useQrDecoder(
  videoRef: RefObject<HTMLVideoElement | null>,
  isActive: boolean,
  onDecode: (value: string) => void,
): void {
  const onDecodeRef = useRef(onDecode);
  onDecodeRef.current = onDecode;

  useEffect(() => {
    if (!isActive) return undefined;

    const video = videoRef.current;
    if (!video) return undefined;

    const canvas = document.createElement('canvas');
    const detector = window.BarcodeDetector
      ? new window.BarcodeDetector({ formats: ['qr_code'] })
      : null;

    let lastDecoded: string | null = null;
    let frameId: number;
    let cancelled = false;

    async function tick() {
      if (cancelled || !video) return;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const value = await decodeFrame(video, canvas, detector);
        if (value && value !== lastDecoded) {
          lastDecoded = value;
          onDecodeRef.current(value);
        }
      }
      frameId = requestAnimationFrame(() => {
        void tick();
      });
    }

    void tick();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
    };
  }, [videoRef, isActive]);
}
