import { describe, expect, it } from 'vitest';
import { attemptsLeft, retryAt, trimFailures } from './window';
import type { AttemptPolicy } from './window';

const policy: AttemptPolicy = { maxAttempts: 3, windowMs: 24 * 60 * 60 * 1000 };
const HOUR = 60 * 60 * 1000;
const MIN = 60 * 1000;
const now = Date.parse('2026-08-20T12:00:00.000Z');

describe('attemptsLeft', () => {
  it('sin fallos devuelve el máximo de intentos', () => {
    expect(attemptsLeft([], now, policy)).toBe(3);
  });

  it('tres fallos hace 1 minuto agotan los intentos', () => {
    const failures = [now - MIN, now - MIN, now - MIN];
    expect(attemptsLeft(failures, now, policy)).toBe(0);
  });

  it('caducan de uno en uno, no en bloque', () => {
    const failures = [now - (24 * HOUR + MIN), now - HOUR, now - MIN];
    expect(attemptsLeft(failures, now, policy)).toBe(1);
  });

  it('un fallo justo en el borde exacto de la ventana ya no cuenta', () => {
    const failures = [now - policy.windowMs];
    expect(attemptsLeft(failures, now, policy)).toBe(3);
  });

  it('nunca devuelve negativo aunque haya más fallos que el máximo', () => {
    const failures = Array.from({ length: 10 }, (_, i) => now - i * MIN);
    expect(attemptsLeft(failures, now, policy)).toBe(0);
  });

  it('un fallo con timestamp futuro no aumenta los intentos disponibles', () => {
    const failures = [now + HOUR, now + HOUR, now + HOUR];
    expect(attemptsLeft(failures, now, policy)).toBe(0);
  });
});

describe('retryAt', () => {
  it('devuelve null si hay intentos disponibles', () => {
    expect(retryAt([], now, policy)).toBeNull();
  });

  it('sin intentos, devuelve el fallo más antiguo dentro de la ventana más 24h', () => {
    const oldest = now - 10 * HOUR;
    const failures = [oldest, now - 5 * HOUR, now - MIN];
    expect(retryAt(failures, now, policy)).toBe(oldest + policy.windowMs);
  });

  it('con una política de 0 intentos y sin fallos registrados, no hay nada que esperar', () => {
    const zeroAttempts: AttemptPolicy = { maxAttempts: 0, windowMs: policy.windowMs };
    expect(retryAt([], now, zeroAttempts)).toBeNull();
  });
});

describe('trimFailures', () => {
  it('conserva los N más recientes y descarta el resto', () => {
    const failures = [now - 4 * HOUR, now - 3 * HOUR, now - 2 * HOUR, now - HOUR];
    const trimmed = trimFailures(failures, policy);
    expect(trimmed).toHaveLength(3);
    expect(trimmed).toEqual([now - HOUR, now - 2 * HOUR, now - 3 * HOUR]);
  });
});
