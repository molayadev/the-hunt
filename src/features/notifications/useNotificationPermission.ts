export type NotificationPermissionStatus = 'default' | 'granted' | 'denied' | 'unsupported';

export interface UseNotificationPermissionOptions {
  readonly requestPermission?: () => Promise<NotificationPermission>;
  readonly initialStatus?: NotificationPermissionStatus;
}

export interface NotificationPermissionState {
  readonly status: NotificationPermissionStatus;
  readonly requestAccess: () => void;
}

export function useNotificationPermission(
  options: UseNotificationPermissionOptions = {},
): NotificationPermissionState {
  return {
    status: 'default',
    requestAccess: () => {
      void options.requestPermission;
    },
  };
}
