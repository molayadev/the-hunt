import { describe, expect, it } from 'vitest';
import { solvedPrizes } from './solvedPrizes';
import type { Card } from '../../shared/types/card';

const revealed: Card = { id: 's1', order: 1, title: 'Estación 1', clue: 'clue', state: 'revealed' };
const unlocked: Card = {
  id: 's2',
  order: 2,
  title: 'Estación 2',
  clue: 'clue',
  state: 'unlocked',
  challenge: { type: 'qr_only' },
};
const solvedDigital: Card = {
  id: 's3',
  order: 3,
  title: 'Estación 3',
  clue: 'clue',
  state: 'solved',
  challenge: { type: 'qr_only' },
  prize: { kind: 'digital', title: 'Pista extra' },
};
const solvedPhysical: Card = {
  id: 's4',
  order: 4,
  title: 'Estación 4',
  clue: 'clue',
  state: 'solved',
  challenge: { type: 'qr_only' },
  prize: { kind: 'physical', title: 'Pegatina', redeemInstructions: 'Enséñasela al organizador' },
};

describe('solvedPrizes', () => {
  it('returns nothing when no station is solved', () => {
    expect(solvedPrizes([revealed, unlocked])).toEqual([]);
  });

  it('extracts the prize and station title for every solved card', () => {
    expect(solvedPrizes([revealed, unlocked, solvedDigital, solvedPhysical])).toEqual([
      { stationId: 's3', stationTitle: 'Estación 3', prize: solvedDigital.prize },
      { stationId: 's4', stationTitle: 'Estación 4', prize: solvedPhysical.prize },
    ]);
  });

  it('preserves the order the cards were given in', () => {
    const result = solvedPrizes([solvedPhysical, solvedDigital]);
    expect(result.map((won) => won.stationId)).toEqual(['s4', 's3']);
  });
});
