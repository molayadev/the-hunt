import { describe, expect, it } from 'vitest';
import { parseProfile } from './profile';

describe('parseProfile', () => {
  it('returns null when there is nothing stored', () => {
    expect(parseProfile(null)).toBeNull();
  });

  it('parses a valid stored profile', () => {
    expect(parseProfile('{"name":"Ana"}')).toEqual({ name: 'Ana' });
  });

  it('returns null for malformed JSON', () => {
    expect(parseProfile('not json')).toBeNull();
  });

  it('returns null when name is missing', () => {
    expect(parseProfile('{}')).toBeNull();
  });

  it('returns null when name is blank', () => {
    expect(parseProfile('{"name":"   "}')).toBeNull();
  });

  it('returns null when name is not a string', () => {
    expect(parseProfile('{"name":42}')).toBeNull();
  });
});
