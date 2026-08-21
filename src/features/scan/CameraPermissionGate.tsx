import type { ReactNode } from 'react';
import type { CameraPermissionStatus } from './useCameraPermission';

export interface CameraPermissionGateProps {
  readonly status: CameraPermissionStatus;
  readonly onRequestAccess: () => void;
  readonly children: ReactNode;
}

export function CameraPermissionGate(props: CameraPermissionGateProps) {
  return <div>{props.status}</div>;
}
