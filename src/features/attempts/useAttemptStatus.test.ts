import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AttemptPolicy } from '../../domain/attempts/window';
import { useAttemptStatus } from './useAttemptStatus';

const policy: AttemptPolicy = { maxAttempts: 3, windowMs: 5000 };

describe('useAttemptStatus', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports the attempts left for the given failures at the current time', () => {
    vi.useFakeTimers();
    const now = Date.parse('2026-08-21T12:00:00.000Z');
    vi.setSystemTime(now);
    const { result } = renderHook(() =>
      useAttemptStatus([now - 1000, now - 1000, now - 1000], policy),
    );
    expect(result.current.attemptsLeft).toBe(0);
  });

  it('recovers an attempt as real time crosses retryAt, without remounting', () => {
    vi.useFakeTimers();
    const now = Date.parse('2026-08-21T12:00:00.000Z');
    vi.setSystemTime(now);
    const failures = [now - 4000, now - 3000, now - 1000];
    const { result } = renderHook(() => useAttemptStatus(failures, policy));
    expect(result.current.attemptsLeft).toBe(0);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.attemptsLeft).toBe(1);
  });

  it('retryAt is null once attempts are available', () => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.parse('2026-08-21T12:00:00.000Z'));
    const { result } = renderHook(() => useAttemptStatus([], policy));
    expect(result.current.retryAt).toBeNull();
  });
});
