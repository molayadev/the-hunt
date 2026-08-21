import { createFileRoute } from '@tanstack/react-router';
import { useSession } from '../../features/auth/session';
import { useNotificationPermission } from '../../features/notifications/useNotificationPermission';
import { useRegisterPushToken } from '../../features/notifications/useRegisterPushToken';

export const Route = createFileRoute('/account')({
  component: AccountScreen,
});

function AccountScreen() {
  const { uid } = useSession();
  const { status, requestAccess } = useNotificationPermission();
  useRegisterPushToken(uid, status === 'granted');

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="font-display text-3xl font-semibold text-primary">Cuenta</h1>
      {status === 'unsupported' && (
        <p className="text-muted-foreground">
          Las notificaciones no están disponibles en este dispositivo.
        </p>
      )}
      {status === 'default' && (
        <button
          type="button"
          onClick={requestAccess}
          className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground"
        >
          Activar notificaciones
        </button>
      )}
      {status === 'granted' && <p className="text-muted-foreground">Notificaciones activadas.</p>}
      {status === 'denied' && (
        <p className="text-muted-foreground">
          Notificaciones bloqueadas. Puedes activarlas desde los ajustes del navegador.
        </p>
      )}
    </main>
  );
}
