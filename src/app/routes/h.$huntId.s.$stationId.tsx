import { createFileRoute } from '@tanstack/react-router';
import { useSession } from '../../features/auth/session';
import { useHunt } from '../../features/hunt/useHunt';
import { AnswerForm } from '../../features/attempts/AnswerForm';
import { AttemptMeter } from '../../features/attempts/AttemptMeter';
import { useAttemptStatus } from '../../features/attempts/useAttemptStatus';
import { useSubmitAnswer } from '../../features/attempts/useSubmitAnswer';
import { useHuntProgress } from '../../features/progress/useHuntProgress';
import type { AttemptPolicy } from '../../domain/attempts/window';

export const Route = createFileRoute('/h/$huntId/s/$stationId')({
  component: StationScreen,
});

const NO_ATTEMPTS_POLICY: AttemptPolicy = { maxAttempts: 0, windowMs: 0 };

function errorMessageFor(isOk: boolean | undefined, submitError: unknown): string | null {
  if (submitError) {
    const code = (submitError as { code?: string }).code;
    if (code === 'resource-exhausted') {
      return 'Sin intentos disponibles. Vuelve a intentarlo más tarde.';
    }
    return 'No se ha podido comprobar la respuesta. Inténtalo de nuevo.';
  }
  if (isOk === false) return 'Respuesta incorrecta. Inténtalo de nuevo.';
  return null;
}

function StationScreen() {
  const { huntId, stationId } = Route.useParams();
  const { uid } = useSession();
  const hunt = useHunt(huntId);
  const { cards, isLoading } = useHuntProgress(uid, huntId);
  const card = cards.find((c) => c.id === stationId);

  const policy: AttemptPolicy = hunt
    ? {
        maxAttempts: hunt.attemptPolicy.maxAttempts,
        windowMs: hunt.attemptPolicy.windowHours * 3_600_000,
      }
    : NO_ATTEMPTS_POLICY;
  const failures = card && card.state !== 'revealed' ? card.recentFailures : [];
  const attemptStatus = useAttemptStatus(failures, policy);

  const { mutate, data: result, error, isPending } = useSubmitAnswer();

  if (isLoading || !card) {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <p className="text-muted-foreground">Cargando…</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-svh flex-col gap-4 p-6">
      <h1 className="font-display text-2xl font-semibold text-foreground">{card.title}</h1>
      <p className="text-muted-foreground">{card.clue}</p>

      {card.state === 'revealed' && (
        <p className="text-sm text-muted-foreground">
          Aún no has desbloqueado esta estación. Busca su código QR.
        </p>
      )}

      {card.state === 'solved' && (
        <p className="font-display text-lg font-semibold text-primary">
          ¡Resuelta! Premio: {card.prize.title}
        </p>
      )}

      {card.state === 'unlocked' && (
        <>
          <AttemptMeter
            attemptsLeft={attemptStatus.attemptsLeft}
            maxAttempts={policy.maxAttempts}
            remainingMs={attemptStatus.remainingMs}
          />
          <AnswerForm
            disabled={attemptStatus.attemptsLeft === 0 || isPending}
            errorMessage={errorMessageFor(result?.ok, error)}
            onSubmit={(value) => {
              mutate({
                huntId,
                stationId,
                answer: { kind: 'text', value },
                clientRequestId: crypto.randomUUID(),
              });
            }}
          />
        </>
      )}
    </main>
  );
}
