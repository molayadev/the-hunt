import { describe, expect, it } from 'vitest';
import { normalizeJoinCode } from './joinCode';

describe('normalizeJoinCode', () => {
  it('trims whitespace and uppercases', () => {
    expect(normalizeJoinCode('  abc123  ')).toBe('ABC123');
  });

  it('collapses internal whitespace', () => {
    expect(normalizeJoinCode('ab c 123')).toBe('ABC123');
  });

  it('an empty or whitespace-only code normalizes to an empty string', () => {
    expect(normalizeJoinCode('')).toBe('');
    expect(normalizeJoinCode('   ')).toBe('');
  });

  it('is idempotent', () => {
    const once = normalizeJoinCode(' Cumple-2026 ');
    expect(normalizeJoinCode(once)).toBe(once);
  });
});
