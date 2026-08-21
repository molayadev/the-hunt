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

export function useOfflineScanQueue(options: UseOfflineScanQueueOptions): OfflineScanQueue {
  return {
    queue: [],
    enqueueToken: () => {
      void options.store.getAll();
    },
  };
}
