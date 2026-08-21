import { createFileRoute } from '@tanstack/react-router';
import { useSession } from '../../features/auth/session';
import { useHunt } from '../../features/hunt/useHunt';
import { AnswerForm } from '../../features/attempts/AnswerForm';
import { AttemptMeter } from '../../features/attempts/AttemptMeter';
import { useStationSolver } from '../../features/attempts/useStationSolver';
import { useHuntProgress } from '../../features/progress/useHuntProgress';

export const Route = createFileRoute('/h/$huntId/s/$stationId')({
  component: StationScreen,
});

function StationScreen() {
  const { huntId, stationId } = Route.useParams();
  const { uid } = useSession();
  const hunt = useHunt(huntId);
  const { cards, isLoading } = useHuntProgress(uid, huntId);
  const card = cards.find((c) => c.id === stationId);
  const solver = useStationSolver(huntId, stationId, card, hunt);

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
            attemptsLeft={solver.attemptStatus.attemptsLeft}
            maxAttempts={solver.policy.maxAttempts}
            remainingMs={solver.attemptStatus.remainingMs}
          />
          <AnswerForm
            disabled={solver.attemptStatus.attemptsLeft === 0 || solver.isPending}
            errorMessage={solver.errorMessage}
            onSubmit={solver.submit}
          />
        </>
      )}
    </main>
  );
}
