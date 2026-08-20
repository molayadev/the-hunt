import { describe, expect, it } from 'vitest';
import { attemptsLeft, retryAt, trimFailures } from './window';
import type { AttemptPolicy } from './window';

const policy: AttemptPolicy = { maxAttempts: 3, windowMs: 24 * 60 * 60 * 1000 };
const HOUR = 60 * 60 * 1000;
const MIN = 60 * 1000;
const now = Date.parse('2026-08-20T12:00:00.000Z');

describe('attemptsLeft', () => {
  it('with no failures returns the maximum attempts', () => {
    expect(attemptsLeft([], now, policy)).toBe(3);
  });

  it('three failures a minute ago exhaust the attempts', () => {
    const failures = [now - MIN, now - MIN, now - MIN];
    expect(attemptsLeft(failures, now, policy)).toBe(0);
  });

  it('failures expire one at a time, not all at once', () => {
    const failures = [now - (24 * HOUR + MIN), now - HOUR, now - MIN];
    expect(attemptsLeft(failures, now, policy)).toBe(1);
  });

  it('a failure right at the window boundary no longer counts', () => {
    const failures = [now - policy.windowMs];
    expect(attemptsLeft(failures, now, policy)).toBe(3);
  });

  it('never returns negative even with more failures than the maximum', () => {
    const failures = Array.from({ length: 10 }, (_, i) => now - i * MIN);
    expect(attemptsLeft(failures, now, policy)).toBe(0);
  });

  it('a failure with a future timestamp does not increase available attempts', () => {
    const failures = [now + HOUR, now + HOUR, now + HOUR];
    expect(attemptsLeft(failures, now, policy)).toBe(0);
  });
});

describe('retryAt', () => {
  it('returns null when attempts are available', () => {
    expect(retryAt([], now, policy)).toBeNull();
  });

  it('with no attempts left, returns the oldest failure in the window plus 24h', () => {
    const oldest = now - 10 * HOUR;
    const failures = [oldest, now - 5 * HOUR, now - MIN];
    expect(retryAt(failures, now, policy)).toBe(oldest + policy.windowMs);
  });

  it('with a zero-attempt policy and no recorded failures, there is nothing to wait for', () => {
    const zeroAttempts: AttemptPolicy = { maxAttempts: 0, windowMs: policy.windowMs };
    expect(retryAt([], now, zeroAttempts)).toBeNull();
  });
});

describe('trimFailures', () => {
  it('keeps the N most recent and discards the rest', () => {
    const failures = [now - 4 * HOUR, now - 3 * HOUR, now - 2 * HOUR, now - HOUR];
    const trimmed = trimFailures(failures, policy);
    expect(trimmed).toHaveLength(3);
    expect(trimmed).toEqual([now - HOUR, now - 2 * HOUR, now - 3 * HOUR]);
  });
});
