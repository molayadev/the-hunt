import { describe, expect, it } from 'vitest';
import { toRouteMapNodes } from './routeMapNodes';
import type { Card } from '../../shared/types/card';

const solved: Card = {
  id: 'a',
  order: 1,
  title: 'La Fuente',
  clue: 'clue a',
  state: 'solved',
  challenge: { type: 'text', question: '?' },
  recentFailures: [],
  prize: { kind: 'digital', title: 'Premio' },
};

const unlocked: Card = {
  id: 'b',
  order: 2,
  title: 'El Roble',
  clue: 'clue b',
  state: 'unlocked',
  challenge: { type: 'text', question: '?' },
  recentFailures: [],
};

const revealed: Card = {
  id: 'c',
  order: 3,
  title: 'El Quiosco',
  clue: 'clue c',
  state: 'revealed',
};

describe('toRouteMapNodes', () => {
  it('maps each card state to its map node state', () => {
    const nodes = toRouteMapNodes([solved, unlocked, revealed], 3);
    expect(nodes).toEqual([
      { order: 1, state: 'solved', id: 'a', title: 'La Fuente' },
      { order: 2, state: 'unlockable', id: 'b', title: 'El Roble' },
      { order: 3, state: 'locked', id: 'c', title: 'El Quiosco' },
    ]);
  });

  it('fills in unknown placeholders for stations with no card yet', () => {
    const nodes = toRouteMapNodes([solved], 3);
    expect(nodes).toEqual([
      { order: 1, state: 'solved', id: 'a', title: 'La Fuente' },
      { order: 2, state: 'unknown' },
      { order: 3, state: 'unknown' },
    ]);
  });

  it('returns an empty list when the total is unknown and no cards exist', () => {
    expect(toRouteMapNodes([], 0)).toEqual([]);
  });
});
