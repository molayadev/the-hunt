import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { StationDetailModal } from './StationDetailModal';
import type { Card } from '../../shared/types/card';
import type { HuntSummary } from '../../shared/types/hunt';

const hunt: HuntSummary = {
  id: 'hunt-1',
  title: 'Ruta E2E',
  status: 'live',
  visibility: 'code',
  stationCount: 3,
  attemptPolicy: { maxAttempts: 3, windowHours: 24, scope: 'station' },
  language: 'es',
};

const lockedCard: Card = {
  id: 'c',
  order: 3,
  title: 'El Quiosco',
  clue: 'Donde suena la música.',
  state: 'revealed',
};

const unlockedCard: Card = {
  id: 'b',
  order: 2,
  title: 'El Roble Viejo',
  clue: 'Junto al tronco.',
  state: 'unlocked',
  challenge: { type: 'text', question: '¿De qué color es la placa?' },
  recentFailures: [],
};

const solvedCard: Card = {
  id: 'a',
  order: 1,
  title: 'La Fuente',
  clue: 'Donde el agua nunca para.',
  state: 'solved',
  challenge: { type: 'text', question: '¿Qué forma tiene?' },
  recentFailures: [],
  prize: { kind: 'digital', title: 'Pista secreta' },
};

function renderModal(card: Card, onClose = vi.fn()) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <StationDetailModal card={card} huntId={hunt.id} hunt={hunt} onClose={onClose} />
    </QueryClientProvider>,
  );
}

describe('StationDetailModal', () => {
  it('always shows the title and clue', () => {
    renderModal(unlockedCard);
    expect(screen.getByRole('heading', { name: unlockedCard.title })).toBeInTheDocument();
    expect(screen.getByText(unlockedCard.clue)).toBeInTheDocument();
  });

  it('a locked (revealed) card shows the scan hint and no answer form', () => {
    renderModal(lockedCard);
    expect(screen.getByText(/escanea su código qr/i)).toBeInTheDocument();
    expect(screen.queryByLabelText('Tu respuesta')).not.toBeInTheDocument();
  });

  it('an unlocked card shows the attempt hearts and an answer form', () => {
    renderModal(unlockedCard);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByLabelText('Tu respuesta')).toBeInTheDocument();
  });

  it('a solved card shows a star and the prize, with no answer form', () => {
    renderModal(solvedCard);
    expect(screen.getByText('★')).toBeInTheDocument();
    expect(screen.getByText('Pista secreta')).toBeInTheDocument();
    expect(screen.queryByLabelText('Tu respuesta')).not.toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn();
    renderModal(unlockedCard, onClose);
    await userEvent.click(screen.getByRole('button', { name: /cerrar/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose on Escape', async () => {
    const onClose = vi.fn();
    renderModal(unlockedCard, onClose);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});
