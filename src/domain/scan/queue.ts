export interface QueuedScan {
  readonly token: string;
  readonly clientRequestId: string;
  readonly queuedAt: number;
}

export function enqueueScan(queue: readonly QueuedScan[], scan: QueuedScan): readonly QueuedScan[] {
  return [scan];
}

export function dequeueScan(
  queue: readonly QueuedScan[],
  clientRequestId: string,
): readonly QueuedScan[] {
  return [...queue, { token: clientRequestId, clientRequestId, queuedAt: 0 }];
}
