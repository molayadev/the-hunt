import { useCallback, useState } from 'react';

export type CameraPermissionStatus = 'idle' | 'granted' | 'denied' | 'unsupported';

export interface UseCameraPermissionOptions {
  readonly getUserMedia?: (constraints: MediaStreamConstraints) => Promise<MediaStream>;
}

export interface CameraPermission {
  readonly status: CameraPermissionStatus;
  readonly stream: MediaStream | null;
  readonly requestAccess: () => void;
}

const CAMERA_CONSTRAINTS: MediaStreamConstraints = { video: { facingMode: 'environment' } };

type GetUserMedia = (constraints: MediaStreamConstraints) => Promise<MediaStream>;

// lib.dom.d.ts types navigator.mediaDevices as always defined, but it's genuinely
// absent outside secure contexts and in some older browsers — the annotation below
// restores that possibility so the checks that depend on it aren't "unnecessary".
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
const defaultGetUserMedia: GetUserMedia | undefined = navigator.mediaDevices?.getUserMedia.bind(
  navigator.mediaDevices,
);

export function useCameraPermission(options: UseCameraPermissionOptions = {}): CameraPermission {
  const getUserMedia = options.getUserMedia ?? defaultGetUserMedia;
  const [status, setStatus] = useState<CameraPermissionStatus>(
    getUserMedia ? 'idle' : 'unsupported',
  );
  const [stream, setStream] = useState<MediaStream | null>(null);

  const requestAccess = useCallback(() => {
    if (!getUserMedia) return;
    getUserMedia(CAMERA_CONSTRAINTS)
      .then((granted) => {
        setStream(granted);
        setStatus('granted');
      })
      .catch(() => {
        setStatus('denied');
      });
  }, [getUserMedia]);

  return { status, stream, requestAccess };
}
