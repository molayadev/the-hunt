import type { ReactNode } from 'react';
import type { CameraPermissionStatus } from './useCameraPermission';

export interface CameraPermissionGateProps {
  readonly status: CameraPermissionStatus;
  readonly onRequestAccess: () => void;
  readonly children: ReactNode;
}

export function CameraPermissionGate({
  status,
  onRequestAccess,
  children,
}: CameraPermissionGateProps) {
  if (status === 'granted') return <>{children}</>;

  if (status === 'unsupported') {
    return (
      <p className="p-6 text-center text-muted-foreground">
        La cámara no está disponible en este dispositivo. Puedes introducir el código a mano.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 p-6 text-center">
      <p className="text-muted-foreground">
        Necesitamos la cámara para escanear el código QR de la estación.
      </p>
      <button
        type="button"
        onClick={onRequestAccess}
        className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground"
      >
        Activar cámara
      </button>
    </div>
  );
}
