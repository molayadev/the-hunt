import { createFileRoute, Link } from '@tanstack/react-router';
import { useSession } from '../../features/auth/session';
import { StationCard } from '../../features/hunt/StationCard';
import { ProgressConstellation } from '../../features/progress/ProgressConstellation';
import { useHuntProgress } from '../../features/progress/useHuntProgress';
import type { ConstellationStation } from '../../features/progress/ProgressConstellation';

export const Route = createFileRoute('/h/$huntId')({
  component: HuntScreen,
});

function HuntScreen() {
  const { huntId } = Route.useParams();
  const { uid } = useSession();
  const { summary, cards, isLoading } = useHuntProgress(uid, huntId);

  if (isLoading) {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <p className="text-muted-foreground">Cargando…</p>
      </main>
    );
  }

  const constellationStations: ConstellationStation[] = cards.map((card) => ({
    id: card.id,
    order: card.order,
    solved: card.state === 'solved',
  }));

  return (
    <main className="flex min-h-svh flex-col items-center gap-6 p-6">
      <ProgressConstellation
        stations={constellationStations}
        totalCount={summary?.totalCount ?? 0}
        solvedCount={summary?.solvedCount ?? 0}
        completionPct={summary?.completionPct ?? 0}
      />
      <Link
        to="/h/$huntId/prizes"
        params={{ huntId }}
        className="text-sm font-semibold text-primary underline"
      >
        Ver mis premios
      </Link>
      <div className="flex w-full max-w-sm flex-col gap-3">
        {[...cards]
          .sort((a, b) => a.order - b.order)
          .map((card) => (
            <StationCard key={card.id} card={card} />
          ))}
      </div>
    </main>
  );
}
