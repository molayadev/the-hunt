import { nodePosition } from '../../domain/progress/constellationLayout';

export interface ConstellationStation {
  readonly id: string;
  readonly order: number;
  readonly solved: boolean;
}

export interface ProgressConstellationProps {
  readonly stations: readonly ConstellationStation[];
  readonly totalCount: number;
  readonly solvedCount: number;
  readonly completionPct: number;
}

const RADIUS = 100;
const VIEWBOX_MARGIN = 24;
const VIEWBOX_SIZE = 2 * (RADIUS + VIEWBOX_MARGIN);

function isAdjacentAndSolved(a: ConstellationStation, b: ConstellationStation): boolean {
  return Math.abs(a.order - b.order) === 1 && a.solved && b.solved;
}

export function ProgressConstellation({
  stations,
  totalCount,
  solvedCount,
  completionPct,
}: ProgressConstellationProps) {
  const positioned = stations.map((station) => ({
    station,
    point: nodePosition(station.order - 1, totalCount, RADIUS),
  }));

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        viewBox={`${String(-VIEWBOX_SIZE / 2)} ${String(-VIEWBOX_SIZE / 2)} ${String(VIEWBOX_SIZE)} ${String(VIEWBOX_SIZE)}`}
        role="img"
        aria-label={`${String(solvedCount)} de ${String(totalCount)} estaciones resueltas`}
        className="w-full max-w-xs"
      >
        {positioned.map(({ station: a, point: pointA }) =>
          positioned
            .filter(({ station: b }) => b.order > a.order && isAdjacentAndSolved(a, b))
            .map(({ station: b, point: pointB }) => (
              <line
                key={`${a.id}-${b.id}`}
                x1={pointA.x}
                y1={pointA.y}
                x2={pointB.x}
                y2={pointB.y}
                stroke="var(--primary)"
                strokeWidth={2}
              />
            )),
        )}
        {positioned.map(({ station, point }) => (
          <circle
            key={station.id}
            cx={point.x}
            cy={point.y}
            r={8}
            fill={station.solved ? 'var(--primary)' : 'var(--muted)'}
            tabIndex={0}
            role="img"
            aria-label={`Estación ${String(station.order)}${station.solved ? ' — resuelta' : ''}`}
          />
        ))}
      </svg>
      <p className="text-sm text-muted-foreground">
        {solvedCount} de {totalCount} · {completionPct}%
      </p>
      {completionPct === 100 && (
        <p className="font-display text-lg font-semibold text-primary">¡Ruta completada!</p>
      )}
    </div>
  );
}
