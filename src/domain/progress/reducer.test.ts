import { describe, expect, it } from 'vitest';
import { applySolve, completionPct, emptyProgress, isComplete } from './reducer';

const stations12 = Array.from({ length: 12 }, (_, i) => `s${String(i + 1)}`);
const now = Date.parse('2026-08-20T12:00:00.000Z');

describe('completionPct', () => {
  it('progreso vacío → 0%', () => {
    expect(completionPct(emptyProgress, 12)).toBe(0);
  });

  it('una ruta sin estaciones no divide por cero', () => {
    expect(completionPct(emptyProgress, 0)).toBe(0);
  });

  it('resolver solo la estación final de 12 → 8%, no 100%', () => {
    const state = applySolve(
      emptyProgress,
      { type: 'solve', stationId: 's12' },
      stations12,
      12,
      now,
    );
    expect(completionPct(state, 12)).toBe(8);
    expect(isComplete(state, 12)).toBe(false);
  });

  it('11 de 12 → 91%, nunca 100', () => {
    let state = emptyProgress;
    for (const id of stations12.slice(0, 11)) {
      state = applySolve(state, { type: 'solve', stationId: id }, stations12, 12, now);
    }
    expect(completionPct(state, 12)).toBe(91);
    expect(isComplete(state, 12)).toBe(false);
  });

  it('12 de 12 → 100% y completedAt presente', () => {
    let state = emptyProgress;
    for (const id of stations12) {
      state = applySolve(state, { type: 'solve', stationId: id }, stations12, 12, now);
    }
    expect(completionPct(state, 12)).toBe(100);
    expect(isComplete(state, 12)).toBe(true);
    expect(state.completedAt).toBe(now);
  });
});

describe('vecinas reveladas', () => {
  it('resolver la estación 5 revela las pistas de la 4 y la 6', () => {
    const state = applySolve(
      emptyProgress,
      { type: 'solve', stationId: 's5' },
      stations12,
      12,
      now,
    );
    expect(state.revealedStationIds).toEqual(expect.arrayContaining(['s4', 's6']));
    expect(state.revealedStationIds).toHaveLength(2);
  });

  it('resolver una estación fuera de la lista ordenada no revela nada', () => {
    const state = applySolve(
      emptyProgress,
      { type: 'solve', stationId: 'ghost' },
      stations12,
      12,
      now,
    );
    expect(state.revealedStationIds).toEqual([]);
  });

  it('resolver la primera estación revela solo la 2 (no hay anterior)', () => {
    const state = applySolve(
      emptyProgress,
      { type: 'solve', stationId: 's1' },
      stations12,
      12,
      now,
    );
    expect(state.revealedStationIds).toEqual(['s2']);
  });

  it('resolver en orden 7 → 3 → 11 acumula las seis pistas vecinas sin duplicados', () => {
    let state = emptyProgress;
    for (const id of ['s7', 's3', 's11']) {
      state = applySolve(state, { type: 'solve', stationId: id }, stations12, 12, now);
    }
    expect(new Set(state.revealedStationIds)).toEqual(
      new Set(['s6', 's8', 's2', 's4', 's10', 's12']),
    );
    expect(state.revealedStationIds).toHaveLength(6);
  });
});

describe('idempotencia', () => {
  it('aplicar el mismo evento solve dos veces deja el estado idéntico', () => {
    const once = applySolve(emptyProgress, { type: 'solve', stationId: 's5' }, stations12, 12, now);
    const twice = applySolve(once, { type: 'solve', stationId: 's5' }, stations12, 12, now + 1000);
    expect(twice).toEqual(once);
  });
});
