export type CameraPermissionStatus = 'idle' | 'granted' | 'denied' | 'unsupported';

export interface UseCameraPermissionOptions {
  readonly getUserMedia?: (constraints: MediaStreamConstraints) => Promise<MediaStream>;
}

export interface CameraPermission {
  readonly status: CameraPermissionStatus;
  readonly stream: MediaStream | null;
  readonly requestAccess: () => void;
}

export function useCameraPermission(options: UseCameraPermissionOptions = {}): CameraPermission {
  return { status: 'idle', stream: null, requestAccess: () => options.getUserMedia };
}
