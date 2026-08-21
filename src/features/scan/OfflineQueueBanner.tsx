export interface OfflineQueueBannerProps {
  readonly queuedCount: number;
}

export function OfflineQueueBanner(props: OfflineQueueBannerProps) {
  return <p>{props.queuedCount}</p>;
}
