import { describe, expect, it } from 'vitest';
import { isCorrectOptionSet } from './optionSet';

describe('isCorrectOptionSet', () => {
  it('accepts the exact same set, regardless of order', () => {
    expect(isCorrectOptionSet(['a', 'b'], ['b', 'a'])).toBe(true);
  });

  it('rejects a missing option', () => {
    expect(isCorrectOptionSet(['a'], ['a', 'b'])).toBe(false);
  });

  it('rejects an extra option', () => {
    expect(isCorrectOptionSet(['a', 'b', 'c'], ['a', 'b'])).toBe(false);
  });

  it('rejects an empty selection', () => {
    expect(isCorrectOptionSet([], ['a'])).toBe(false);
  });

  it('ignores duplicate ids within the selection', () => {
    expect(isCorrectOptionSet(['a', 'a', 'b'], ['a', 'b'])).toBe(true);
  });
});
