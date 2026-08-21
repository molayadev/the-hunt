import type { Card, Prize } from '../../shared/types/card';

export interface WonPrize {
  readonly stationId: string;
  readonly stationTitle: string;
  readonly prize: Prize;
}

export function solvedPrizes(cards: readonly Card[]): readonly WonPrize[] {
  return cards
    .filter((card) => card.state === 'solved')
    .map((card) => ({ stationId: card.id, stationTitle: card.title, prize: card.prize }));
}
