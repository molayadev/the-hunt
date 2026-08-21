import { describe, expect, it } from 'vitest';
import { isUrl } from './isUrl';

describe('isUrl', () => {
  it('recognizes an https URL', () => {
    expect(isUrl('https://maps.app.goo.gl/abc123')).toBe(true);
  });

  it('recognizes an http URL', () => {
    expect(isUrl('http://example.com')).toBe(true);
  });

  it('rejects plain instructions text', () => {
    expect(isUrl('Pregunta al organizador por el regalo')).toBe(false);
  });

  it('rejects a non-URL scheme', () => {
    expect(isUrl('javascript:alert(1)')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isUrl('')).toBe(false);
  });
});
