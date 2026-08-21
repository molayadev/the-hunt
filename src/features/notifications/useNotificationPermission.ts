import { useCallback, useState } from 'react';

export type NotificationPermissionStatus = 'default' | 'granted' | 'denied' | 'unsupported';

type RequestPermission = () => Promise<NotificationPermission>;

export interface UseNotificationPermissionOptions {
  readonly requestPermission?: RequestPermission;
  readonly initialStatus?: NotificationPermissionStatus;
}

export interface NotificationPermissionState {
  readonly status: NotificationPermissionStatus;
  readonly requestAccess: () => void;
}

const defaultRequestPermission: RequestPermission | undefined =
  typeof Notification === 'undefined' ? undefined : () => Notification.requestPermission();

export function useNotificationPermission(
  options: UseNotificationPermissionOptions = {},
): NotificationPermissionState {
  const requestPermission = options.requestPermission ?? defaultRequestPermission;
  const [status, setStatus] = useState<NotificationPermissionStatus>(
    requestPermission ? (options.initialStatus ?? 'default') : 'unsupported',
  );

  const requestAccess = useCallback(() => {
    if (!requestPermission) return;
    requestPermission()
      .then((result) => {
        setStatus(result);
      })
      .catch(() => undefined);
  }, [requestPermission]);

  return { status, requestAccess };
}
