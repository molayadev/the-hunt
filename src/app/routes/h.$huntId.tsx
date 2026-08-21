import { createFileRoute, Link, Outlet, useMatches } from '@tanstack/react-router';
import { useState } from 'react';
import { useSession } from '../../features/auth/session';
import { StationCard } from '../../features/hunt/StationCard';
import { useHunt } from '../../features/hunt/useHunt';
import { RouteMap } from '../../features/progress/RouteMap';
import { toRouteMapNodes } from '../../features/progress/routeMapNodes';
import { StationDetailModal } from '../../features/progress/StationDetailModal';
import { useHuntProgress } from '../../features/progress/useHuntProgress';

export const Route = createFileRoute('/h/$huntId')({
  component: HuntScreen,
});

type ViewMode = 'map' | 'list';

function HuntScreen() {
  const { huntId } = Route.useParams();
  const { uid } = useSession();
  const matches = useMatches();
  const hunt = useHunt(huntId);
  const { summary, cards, isLoading } = useHuntProgress(uid, huntId);
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  const isChildRouteActive = matches[matches.length - 1]?.routeId !== Route.id;
  if (isChildRouteActive) return <Outlet />;

  if (isLoading) {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <p className="text-muted-foreground">Cargando…</p>
      </main>
    );
  }

  const totalCount = summary?.totalCount ?? hunt?.stationCount ?? 0;
  const solvedCount = summary?.solvedCount ?? 0;
  const completionPct = summary?.completionPct ?? 0;
  const selectedCard = cards.find((card) => card.id === selectedStationId);

  return (
    <main className="flex min-h-svh flex-col items-center gap-6 p-6">
      {hunt && (
        <header className="flex max-w-sm flex-col items-center gap-1 text-center">
          <h1 className="font-display text-2xl font-semibold text-foreground">{hunt.title}</h1>
          {hunt.tagline && <p className="text-sm text-muted-foreground">{hunt.tagline}</p>}
        </header>
      )}

      <p className="text-sm text-muted-foreground">
        {solvedCount} de {totalCount} · {completionPct}%
      </p>
      {completionPct === 100 && (
        <p className="font-display text-lg font-semibold text-primary">¡Ruta completada!</p>
      )}

      <div className="flex gap-2 text-sm">
        <button
          type="button"
          aria-pressed={viewMode === 'map'}
          onClick={() => {
            setViewMode('map');
          }}
          className={
            viewMode === 'map'
              ? 'rounded-md bg-primary px-3 py-1.5 font-semibold text-primary-foreground'
              : 'rounded-md border border-border px-3 py-1.5 text-muted-foreground'
          }
        >
          Mapa
        </button>
        <button
          type="button"
          aria-pressed={viewMode === 'list'}
          onClick={() => {
            setViewMode('list');
          }}
          className={
            viewMode === 'list'
              ? 'rounded-md bg-primary px-3 py-1.5 font-semibold text-primary-foreground'
              : 'rounded-md border border-border px-3 py-1.5 text-muted-foreground'
          }
        >
          Lista
        </button>
      </div>

      <Link
        to="/h/$huntId/prizes"
        params={{ huntId }}
        className="text-sm font-semibold text-primary underline"
      >
        Ver mis premios
      </Link>

      {cards.length === 0 && (
        <p className="max-w-sm text-center text-muted-foreground">
          Todavía no has desbloqueado ninguna estación.{' '}
          <Link to="/scan" className="font-semibold text-primary underline">
            Escanea el primer código QR
          </Link>{' '}
          para empezar.
        </p>
      )}

      {viewMode === 'map' ? (
        <RouteMap nodes={toRouteMapNodes(cards, totalCount)} onSelect={setSelectedStationId} />
      ) : (
        <div className="flex w-full max-w-sm flex-col gap-3">
          {[...cards]
            .sort((a, b) => a.order - b.order)
            .map((card) => (
              <StationCard
                key={card.id}
                card={card}
                onSolve={() => {
                  setSelectedStationId(card.id);
                }}
              />
            ))}
        </div>
      )}

      {selectedCard && (
        <StationDetailModal
          card={selectedCard}
          huntId={huntId}
          hunt={hunt}
          onClose={() => {
            setSelectedStationId(null);
          }}
        />
      )}
    </main>
  );
}
