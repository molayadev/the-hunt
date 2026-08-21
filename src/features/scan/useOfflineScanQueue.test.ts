import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useOfflineScanQueue } from './useOfflineScanQueue';
import type { ScanQueueStore } from './useOfflineScanQueue';
import type { QueuedScan } from '../../domain/scan/queue';

function createInMemoryStore(initial: QueuedScan[] = []): ScanQueueStore {
  let records = initial;
  return {
    getAll: () => Promise.resolve(records),
    add: (scan) => {
      records = [...records, scan];
      return Promise.resolve();
    },
    remove: (clientRequestId) => {
      records = records.filter((r) => r.clientRequestId !== clientRequestId);
      return Promise.resolve();
    },
  };
}

const okResult = {
  serverNow: '2026-08-21T00:00:00.000Z',
  ok: true,
  huntId: 'h',
  stationId: 's',
  alreadyUnlocked: false,
} as const;

describe('useOfflineScanQueue', () => {
  it('loads any scans already persisted in the store on mount', async () => {
    const persisted: QueuedScan = { token: 'qr-1', clientRequestId: 'req-1', queuedAt: 1 };
    const store = createInMemoryStore([persisted]);
    const redeem = vi.fn().mockResolvedValue(okResult);
    const { result } = renderHook(() =>
      useOfflineScanQueue({
        store,
        redeem,
        isOnline: false,
        createId: () => 'req-2',
        now: () => 2,
      }),
    );
    await waitFor(() => {
      expect(result.current.queue).toEqual([persisted]);
    });
  });

  it('enqueueing a token while offline persists it without calling redeem', async () => {
    const store = createInMemoryStore();
    const redeem = vi.fn().mockResolvedValue(okResult);
    const { result } = renderHook(() =>
      useOfflineScanQueue({
        store,
        redeem,
        isOnline: false,
        createId: () => 'req-1',
        now: () => 100,
      }),
    );

    act(() => {
      result.current.enqueueToken('qr-1');
    });

    await waitFor(() => {
      expect(result.current.queue).toEqual([
        { token: 'qr-1', clientRequestId: 'req-1', queuedAt: 100 },
      ]);
    });
    expect(redeem).not.toHaveBeenCalled();
    await expect(store.getAll()).resolves.toEqual([
      { token: 'qr-1', clientRequestId: 'req-1', queuedAt: 100 },
    ]);
  });

  it('while online, a queued scan is redeemed and removed from the queue on success', async () => {
    const persisted: QueuedScan = { token: 'qr-1', clientRequestId: 'req-1', queuedAt: 1 };
    const store = createInMemoryStore([persisted]);
    const redeem = vi.fn().mockResolvedValue(okResult);
    const { result } = renderHook(() =>
      useOfflineScanQueue({ store, redeem, isOnline: true, createId: () => 'req-2', now: () => 2 }),
    );

    await waitFor(() => {
      expect(redeem).toHaveBeenCalledWith({ token: 'qr-1', clientRequestId: 'req-1' });
    });
    await waitFor(() => {
      expect(result.current.queue).toEqual([]);
    });
    await expect(store.getAll()).resolves.toEqual([]);
  });

  it('a failed redeem leaves the scan in the queue for a later retry', async () => {
    const persisted: QueuedScan = { token: 'qr-1', clientRequestId: 'req-1', queuedAt: 1 };
    const store = createInMemoryStore([persisted]);
    const redeem = vi.fn().mockRejectedValue(new Error('network down'));
    const { result } = renderHook(() =>
      useOfflineScanQueue({ store, redeem, isOnline: true, createId: () => 'req-2', now: () => 2 }),
    );

    await waitFor(() => {
      expect(redeem).toHaveBeenCalled();
    });
    expect(result.current.queue).toEqual([persisted]);
  });
});
