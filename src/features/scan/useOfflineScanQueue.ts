import { useCallback, useEffect, useState } from 'react';
import { dequeueScan, enqueueScan } from '../../domain/scan/queue';
import type { QueuedScan } from '../../domain/scan/queue';
import type { RedeemQrInput, RedeemQrResult } from '../../domain/callables';

export interface ScanQueueStore {
  getAll: () => Promise<readonly QueuedScan[]>;
  add: (scan: QueuedScan) => Promise<void>;
  remove: (clientRequestId: string) => Promise<void>;
}

export interface UseOfflineScanQueueOptions {
  readonly store: ScanQueueStore;
  readonly redeem: (input: RedeemQrInput) => Promise<RedeemQrResult>;
  readonly isOnline?: boolean;
  readonly createId?: () => string;
  readonly now?: () => number;
}

export interface OfflineScanQueue {
  readonly queue: readonly QueuedScan[];
  readonly enqueueToken: (token: string) => void;
}

export function useOfflineScanQueue({
  store,
  redeem,
  isOnline = navigator.onLine,
  createId = () => crypto.randomUUID(),
  now = () => Date.now(),
}: UseOfflineScanQueueOptions): OfflineScanQueue {
  const [queue, setQueue] = useState<readonly QueuedScan[]>([]);

  useEffect(() => {
    store
      .getAll()
      .then(setQueue)
      .catch(() => undefined);
  }, [store]);

  useEffect(() => {
    if (!isOnline) return;
    const next = queue[0];
    if (!next) return;

    let cancelled = false;
    redeem({ token: next.token, clientRequestId: next.clientRequestId })
      .then(() => {
        if (cancelled) return;
        void store.remove(next.clientRequestId);
        setQueue((current) => dequeueScan(current, next.clientRequestId));
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [isOnline, queue, redeem, store]);

  const enqueueToken = useCallback(
    (token: string) => {
      const scan: QueuedScan = { token, clientRequestId: createId(), queuedAt: now() };
      const next = enqueueScan(queue, scan);
      if (next === queue) return;
      setQueue(next);
      void store.add(scan);
    },
    [createId, now, store, queue],
  );

  return { queue, enqueueToken };
}
