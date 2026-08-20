import { afterEach, describe, expect, it, vi } from 'vitest';
import { now, syncClock } from './clock';

describe('syncClock / now', () => {
  afterEach(() => {
    syncClock(new Date(Date.now()).toISOString());
    vi.useRealTimers();
  });

  it('sin sincronizar, now() sigue el reloj local', () => {
    const local = Date.parse('2026-08-20T12:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(local);
    syncClock(new Date(local).toISOString());
    expect(now()).toBe(local);
  });

  it('corrige el reloj local hacia el reloj del servidor', () => {
    const local = Date.parse('2026-08-20T12:00:00.000Z');
    const server = Date.parse('2026-08-20T12:05:00.000Z'); // servidor 5 min por delante
    vi.useFakeTimers();
    vi.setSystemTime(local);
    syncClock(new Date(server).toISOString());
    expect(now()).toBe(server);
  });

  it('el offset se mantiene al avanzar el tiempo local', () => {
    const local = Date.parse('2026-08-20T12:00:00.000Z');
    const server = Date.parse('2026-08-20T11:58:00.000Z'); // servidor 2 min por detrás
    vi.useFakeTimers();
    vi.setSystemTime(local);
    syncClock(new Date(server).toISOString());
    vi.advanceTimersByTime(60_000);
    expect(now()).toBe(server + 60_000);
  });
});
