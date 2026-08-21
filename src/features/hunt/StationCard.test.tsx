import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StationCard } from './StationCard';
import type { Card } from '../../shared/types/card';

const revealedCard: Card = {
  id: 'station-6',
  order: 6,
  title: 'Estación 6',
  clue: 'Busca donde el reloj marca las horas',
  state: 'revealed',
};

const unlockedCard: Card = {
  id: 'station-5',
  order: 5,
  title: 'Estación 5',
  clue: 'Pista de la estación 5',
  state: 'unlocked',
  challenge: { type: 'text', question: '¿Qué edificio es?', hint: 'Es de piedra' },
};

const solvedCard: Card = {
  id: 'station-4',
  order: 4,
  title: 'Estación 4',
  clue: 'Pista de la estación 4',
  state: 'solved',
  challenge: { type: 'text', question: '¿Qué edificio es?' },
  prize: { kind: 'digital', title: 'Pista extra' },
};

describe('StationCard', () => {
  it('a revealed card shows the clue but not the challenge question, anywhere in the DOM', () => {
    render(<StationCard card={revealedCard} />);
    expect(screen.getByText(revealedCard.clue)).toBeInTheDocument();
    expect(document.body.textContent).not.toContain('¿Qué edificio es?');
    expect(document.body.innerHTML).not.toContain('¿Qué edificio es?');
  });

  it('a revealed card shows no challenge or prize affordance', () => {
    render(<StationCard card={revealedCard} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('an unlocked card shows the clue and a call to action, but not the question text', () => {
    render(<StationCard card={unlockedCard} />);
    expect(screen.getByText(unlockedCard.clue)).toBeInTheDocument();
    expect(document.body.innerHTML).not.toContain('¿Qué edificio es?');
    expect(document.body.innerHTML).not.toContain('Es de piedra');
  });

  it('a solved card shows the prize title', () => {
    render(<StationCard card={solvedCard} />);
    expect(screen.getByText('Pista extra')).toBeInTheDocument();
  });
});
