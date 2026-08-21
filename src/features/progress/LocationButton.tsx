import type { StationLocation } from '../../shared/types/card';

export interface LocationButtonProps {
  readonly location: StationLocation;
}

export function LocationButton({ location }: LocationButtonProps) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-border bg-card p-3">
      <a
        href={location.mapsUrl}
        target="_blank"
        rel="noreferrer"
        className="self-start text-sm font-semibold text-primary underline"
      >
        📍 Ver ubicación
      </a>
      <p className="text-sm text-muted-foreground">{location.hint}</p>
    </div>
  );
}
