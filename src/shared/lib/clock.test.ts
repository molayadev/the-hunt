import { afterEach, describe, expect, it, vi } from 'vitest';
import { now, syncClock } from './clock';

describe('syncClock / now', () => {
  afterEach(() => {
    syncClock(new Date(Date.now()).toISOString());
    vi.useRealTimers();
  });

  it('without syncing, now() follows the local clock', () => {
    const local = Date.parse('2026-08-20T12:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(local);
    syncClock(new Date(local).toISOString());
    expect(now()).toBe(local);
  });

  it('corrects the local clock toward the server clock', () => {
    const local = Date.parse('2026-08-20T12:00:00.000Z');
    const serverFiveMinutesAhead = Date.parse('2026-08-20T12:05:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(local);
    syncClock(new Date(serverFiveMinutesAhead).toISOString());
    expect(now()).toBe(serverFiveMinutesAhead);
  });

  it('keeps the offset as local time advances', () => {
    const local = Date.parse('2026-08-20T12:00:00.000Z');
    const server = Date.parse('2026-08-20T11:58:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(local);
    syncClock(new Date(server).toISOString());
    vi.advanceTimersByTime(60_000);
    expect(now()).toBe(server + 60_000);
  });
});
