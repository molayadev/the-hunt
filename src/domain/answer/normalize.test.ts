import { describe, expect, it } from 'vitest';
import { isCorrectAnswer, normalizeAnswer } from './normalize';

describe('normalizeAnswer', () => {
  it('trims whitespace, lowercases and strips accents', () => {
    expect(normalizeAnswer('  Café  ')).toBe(normalizeAnswer('cafe'));
    expect(normalizeAnswer('  Café  ')).toBe('cafe');
  });

  it('strips punctuation', () => {
    expect(normalizeAnswer('¡La Torre!')).toBe('la torre');
  });

  it('collapses multiple spaces into one', () => {
    expect(normalizeAnswer('la    torre   del   reloj')).toBe('la torre del reloj');
  });

  it('an empty string or punctuation-only string normalizes to an empty string', () => {
    expect(normalizeAnswer('¡¡¡!!!')).toBe('');
    expect(normalizeAnswer('   ')).toBe('');
  });
});

describe('normalizeAnswer — pending decision on ñ/ç (PLAN.md §5.2, §13.1)', () => {
  it('"año" normalizes the same as "ano" (current behaviour: NFD strips ñ to n)', () => {
    expect(normalizeAnswer('año')).toBe(normalizeAnswer('ano'));
  });

  // eslint-disable-next-line vitest/no-disabled-tests -- alternative behaviour, pending product decision (PLAN.md §5.2): flip with the test above once ñ/ç are sentinel-protected before normalizing.
  it.skip('"año" does NOT normalize the same as "ano" (alternative: preserve ñ)', () => {
    expect(normalizeAnswer('año')).not.toBe(normalizeAnswer('ano'));
  });
});

describe('isCorrectAnswer', () => {
  it('the comparison is an exact match: "oro" does not validate "oropel"', () => {
    expect(isCorrectAnswer('oropel', ['oro'])).toBe(false);
  });

  it('accepts any variant listed in acceptedAnswers', () => {
    const accepted = ['la torre', 'torre', 'torre del reloj'];
    expect(isCorrectAnswer('Torre', accepted)).toBe(true);
    expect(isCorrectAnswer('¡LA TORRE!', accepted)).toBe(true);
    expect(isCorrectAnswer('la campana', accepted)).toBe(false);
  });

  it('an empty answer never validates, not even against an empty list', () => {
    expect(isCorrectAnswer('', [])).toBe(false);
    expect(isCorrectAnswer('   ', [''])).toBe(false);
  });
});
