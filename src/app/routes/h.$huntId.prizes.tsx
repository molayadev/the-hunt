import { createFileRoute } from '@tanstack/react-router';
import { useSession } from '../../features/auth/session';
import { PrizeWallet } from '../../features/prizes/PrizeWallet';
import { solvedPrizes } from '../../features/prizes/solvedPrizes';
import { useHuntProgress } from '../../features/progress/useHuntProgress';

export const Route = createFileRoute('/h/$huntId/prizes')({
  component: PrizesScreen,
});

function PrizesScreen() {
  const { huntId } = Route.useParams();
  const { uid } = useSession();
  const { cards, isLoading } = useHuntProgress(uid, huntId);

  if (isLoading) {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <p className="text-muted-foreground">Cargando…</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-svh flex-col gap-6 p-6">
      <h1 className="font-display text-2xl font-semibold text-primary">Tus premios</h1>
      <PrizeWallet prizes={solvedPrizes(cards)} />
    </main>
  );
}
