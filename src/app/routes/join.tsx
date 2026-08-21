import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { JoinForm } from '../../features/hunt/JoinForm';
import { HuntNotFoundError, useJoinHuntByCode } from '../../features/hunt/useJoinHuntByCode';

export const Route = createFileRoute('/join')({
  component: JoinScreen,
});

function errorMessageFor(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof HuntNotFoundError) {
    return 'Ese código no pertenece a ninguna ruta activa. Comprueba que esté bien escrito.';
  }
  return 'No se ha podido comprobar el código. Inténtalo de nuevo.';
}

function JoinScreen() {
  const navigate = useNavigate();
  const { mutate, error, isPending } = useJoinHuntByCode();

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="font-display text-3xl font-semibold text-primary">Unirse a una ruta</h1>
      <JoinForm
        isPending={isPending}
        errorMessage={errorMessageFor(error)}
        onSubmit={(code) => {
          mutate(code, {
            onSuccess: (hunt) => {
              void navigate({ to: '/h/$huntId', params: { huntId: hunt.id } });
            },
          });
        }}
      />
    </main>
  );
}
