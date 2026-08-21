export interface OfflineQueueBannerProps {
  readonly queuedCount: number;
}

export function OfflineQueueBanner({ queuedCount }: OfflineQueueBannerProps) {
  if (queuedCount === 0) return null;

  return (
    <p role="status" className="rounded-md bg-card px-3 py-2 text-sm text-muted-foreground">
      En cola — se aplicará al recuperar señal ({queuedCount})
    </p>
  );
}
