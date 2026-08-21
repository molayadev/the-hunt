import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { StationDetailModal } from './StationDetailModal';
import type { StationDetailModalProps } from './StationDetailModal';
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
  unlock: 'qr',
};

const passwordLockedCard: Card = {
  id: 'd',
  order: 4,
  title: 'El Faro',
  clue: 'Busca la palabra grabada en la piedra.',
  state: 'revealed',
  unlock: 'password',
};

const cardWithLocation: Card = {
  ...lockedCard,
  location: { mapsUrl: 'https://maps.app.goo.gl/example', hint: 'Junto a la fuente.' },
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

function renderModal(card: Card, onClose: StationDetailModalProps['onClose'] = vi.fn()) {
  const queryClient = new QueryClient();
  const rootRoute = createRootRoute({
    component: () => (
      <QueryClientProvider client={queryClient}>
        <StationDetailModal card={card} huntId={hunt.id} hunt={hunt} onClose={onClose} />
      </QueryClientProvider>
    ),
  });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  return render(<RouterProvider router={router} />);
}

describe('StationDetailModal', () => {
  it('always shows the title and clue', async () => {
    renderModal(unlockedCard);
    expect(await screen.findByRole('heading', { name: unlockedCard.title })).toBeInTheDocument();
    expect(screen.getByText(unlockedCard.clue)).toBeInTheDocument();
  });

  it('a QR-locked card shows a link to the scan screen and no answer form', async () => {
    renderModal(lockedCard);
    expect(await screen.findByRole('link', { name: /escanear código qr/i })).toHaveAttribute(
      'href',
      '/scan',
    );
    expect(screen.queryByLabelText('Tu respuesta')).not.toBeInTheDocument();
  });

  it('a password-locked card shows the password form and no scan link', async () => {
    renderModal(passwordLockedCard);
    expect(await screen.findByLabelText(/palabra clave/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /escanear/i })).not.toBeInTheDocument();
  });

  it('a card with a location shows the location button', async () => {
    renderModal(cardWithLocation);
    expect(await screen.findByRole('link', { name: /ver ubicación/i })).toHaveAttribute(
      'href',
      'https://maps.app.goo.gl/example',
    );
  });

  it('an unlocked card shows the attempt hearts and an answer form', async () => {
    renderModal(unlockedCard);
    expect(await screen.findByRole('status')).toBeInTheDocument();
    expect(screen.getByLabelText('Tu respuesta')).toBeInTheDocument();
  });

  it('a solved card shows a star and the prize, with no answer form', async () => {
    renderModal(solvedCard);
    expect(await screen.findByText('★')).toBeInTheDocument();
    expect(screen.getByText('Pista secreta')).toBeInTheDocument();
    expect(screen.queryByLabelText('Tu respuesta')).not.toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn();
    renderModal(unlockedCard, onClose);
    await userEvent.click(await screen.findByRole('button', { name: /cerrar/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose on Escape', async () => {
    const onClose = vi.fn();
    renderModal(unlockedCard, onClose);
    await screen.findByRole('dialog');
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});
