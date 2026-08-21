import { describe, expect, it } from 'vitest';
import { dequeueScan, enqueueScan } from './queue';
import type { QueuedScan } from './queue';

describe('enqueueScan', () => {
  it('adds a new scan to an empty queue', () => {
    const scan: QueuedScan = { token: 'qr-1', clientRequestId: 'req-1', queuedAt: 1000 };
    expect(enqueueScan([], scan)).toEqual([scan]);
  });

  it('appends a scan for a different token', () => {
    const first: QueuedScan = { token: 'qr-1', clientRequestId: 'req-1', queuedAt: 1000 };
    const second: QueuedScan = { token: 'qr-2', clientRequestId: 'req-2', queuedAt: 2000 };
    expect(enqueueScan([first], second)).toEqual([first, second]);
  });

  it('scanning the same token twice while queued does not duplicate or replace the entry', () => {
    const first: QueuedScan = { token: 'qr-1', clientRequestId: 'req-1', queuedAt: 1000 };
    const duplicate: QueuedScan = { token: 'qr-1', clientRequestId: 'req-2', queuedAt: 2000 };
    expect(enqueueScan([first], duplicate)).toEqual([first]);
  });
});

describe('dequeueScan', () => {
  it('removes the scan with the matching clientRequestId', () => {
    const a: QueuedScan = { token: 'qr-1', clientRequestId: 'req-1', queuedAt: 1000 };
    const b: QueuedScan = { token: 'qr-2', clientRequestId: 'req-2', queuedAt: 2000 };
    expect(dequeueScan([a, b], 'req-1')).toEqual([b]);
  });

  it('leaves the queue untouched if the id is not present', () => {
    const a: QueuedScan = { token: 'qr-1', clientRequestId: 'req-1', queuedAt: 1000 };
    expect(dequeueScan([a], 'req-missing')).toEqual([a]);
  });
});
