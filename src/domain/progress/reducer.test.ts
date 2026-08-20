import { describe, expect, it } from 'vitest';
import { applySolve, completionPct, emptyProgress, isComplete } from './reducer';

const stations12 = Array.from({ length: 12 }, (_, i) => `s${String(i + 1)}`);
const now = Date.parse('2026-08-20T12:00:00.000Z');

describe('completionPct', () => {
  it('empty progress is 0%', () => {
    expect(completionPct(emptyProgress, 12)).toBe(0);
  });

  it('a hunt with no stations does not divide by zero', () => {
    expect(completionPct(emptyProgress, 0)).toBe(0);
  });

  it('solving only the final station of 12 is 8%, not 100%', () => {
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

  it('11 of 12 is 91%, never rounded up to 100', () => {
    let state = emptyProgress;
    for (const id of stations12.slice(0, 11)) {
      state = applySolve(state, { type: 'solve', stationId: id }, stations12, 12, now);
    }
    expect(completionPct(state, 12)).toBe(91);
    expect(isComplete(state, 12)).toBe(false);
  });

  it('12 of 12 is 100% and sets completedAt', () => {
    let state = emptyProgress;
    for (const id of stations12) {
      state = applySolve(state, { type: 'solve', stationId: id }, stations12, 12, now);
    }
    expect(completionPct(state, 12)).toBe(100);
    expect(isComplete(state, 12)).toBe(true);
    expect(state.completedAt).toBe(now);
  });
});

describe('neighbouring stations revealed', () => {
  it('solving station 5 reveals the clues for station 4 and station 6', () => {
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

  it('solving a station outside the ordered list reveals nothing', () => {
    const state = applySolve(
      emptyProgress,
      { type: 'solve', stationId: 'ghost' },
      stations12,
      12,
      now,
    );
    expect(state.revealedStationIds).toEqual([]);
  });

  it('solving the first station reveals only station 2 (no previous station)', () => {
    const state = applySolve(
      emptyProgress,
      { type: 'solve', stationId: 's1' },
      stations12,
      12,
      now,
    );
    expect(state.revealedStationIds).toEqual(['s2']);
  });

  it('solving in order 7, 3, 11 accumulates the six neighbouring clues without duplicates', () => {
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

describe('idempotency', () => {
  it('applying the same solve event twice leaves the state identical', () => {
    const once = applySolve(emptyProgress, { type: 'solve', stationId: 's5' }, stations12, 12, now);
    const twice = applySolve(once, { type: 'solve', stationId: 's5' }, stations12, 12, now + 1000);
    expect(twice).toEqual(once);
  });
});
