export interface QueuedScan {
  readonly token: string;
  readonly clientRequestId: string;
  readonly queuedAt: number;
}

export function enqueueScan(queue: readonly QueuedScan[], scan: QueuedScan): readonly QueuedScan[] {
  if (queue.some((queued) => queued.token === scan.token)) return queue;
  return [...queue, scan];
}

export function dequeueScan(
  queue: readonly QueuedScan[],
  clientRequestId: string,
): readonly QueuedScan[] {
  return queue.filter((queued) => queued.clientRequestId !== clientRequestId);
}
