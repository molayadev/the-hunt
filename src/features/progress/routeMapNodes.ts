import type { Card } from '../../shared/types/card';
import type { RouteMapNode } from './RouteMap';

export function toRouteMapNodes(cards: readonly Card[], totalCount: number): RouteMapNode[] {
  const cardsByOrder = new Map(cards.map((card) => [card.order, card] as const));

  return Array.from({ length: totalCount }, (_, index) => {
    const order = index + 1;
    const card = cardsByOrder.get(order);
    if (!card) return { order, state: 'unknown' as const };
    if (card.state === 'revealed') {
      return { order, state: 'locked' as const, id: card.id, title: card.title };
    }
    if (card.state === 'unlocked') {
      return { order, state: 'unlockable' as const, id: card.id, title: card.title };
    }
    return { order, state: 'solved' as const, id: card.id, title: card.title };
  });
}
