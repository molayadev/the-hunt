import { describe, expect, it } from 'vitest';
import { formatCountdown } from './formatCountdown';

describe('formatCountdown', () => {
  it('formats hours and minutes', () => {
    expect(formatCountdown(4 * 60 * 60 * 1000 + 12 * 60 * 1000)).toBe('4h 12min');
  });

  it('formats minutes only when under an hour', () => {
    expect(formatCountdown(58 * 60 * 1000)).toBe('58min');
  });

  it('formats seconds only when under a minute', () => {
    expect(formatCountdown(12 * 1000)).toBe('12s');
  });

  it('never goes negative', () => {
    expect(formatCountdown(-5000)).toBe('0s');
  });

  it('zero is 0s', () => {
    expect(formatCountdown(0)).toBe('0s');
  });
});
