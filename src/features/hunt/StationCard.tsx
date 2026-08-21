import type { Card } from '../../shared/types/card';

export interface StationCardProps {
  readonly card: Card;
  readonly onSolve?: () => void;
}

export function StationCard({ card, onSolve }: StationCardProps) {
  return (
    <article className="flex flex-col gap-2 rounded-md border border-border bg-card p-4">
      <header className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Estación {card.order}</span>
        {card.state === 'solved' && (
          <span aria-label="resuelta" className="text-primary">
            ✓
          </span>
        )}
      </header>
      <h3 className="font-display text-lg font-semibold text-foreground">{card.title}</h3>
      <p className="text-sm text-muted-foreground">{card.clue}</p>
      {card.state === 'unlocked' && (
        <button
          type="button"
          onClick={onSolve}
          className="self-start rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
        >
          Resolver
        </button>
      )}
      {card.state === 'solved' && (
        <p className="text-sm font-semibold text-primary">{card.prize.title}</p>
      )}
    </article>
  );
}
