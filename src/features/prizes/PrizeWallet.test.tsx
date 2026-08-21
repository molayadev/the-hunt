import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PrizeWallet } from './PrizeWallet';
import type { WonPrize } from './solvedPrizes';

const digital: WonPrize = {
  stationId: 's1',
  stationTitle: 'La torre',
  prize: { kind: 'digital', title: 'Pista extra' },
};

const physical: WonPrize = {
  stationId: 's2',
  stationTitle: 'La plaza',
  prize: {
    kind: 'physical',
    title: 'Pegatina',
    redeemInstructions: 'Enséñasela al organizador para recogerla.',
  },
};

const physicalWithMapLink: WonPrize = {
  stationId: 's3',
  stationTitle: 'El parque',
  prize: {
    kind: 'physical',
    title: 'Regalo escondido',
    redeemInstructions: 'https://maps.app.goo.gl/abc123',
  },
};

const digitalWithLink: WonPrize = {
  stationId: 's4',
  stationTitle: 'La biblioteca',
  prize: { kind: 'digital', title: 'Libro digital', payload: 'https://example.com/libro' },
};

describe('PrizeWallet', () => {
  it('shows an empty-state message when there are no prizes yet', () => {
    render(<PrizeWallet prizes={[]} />);
    expect(screen.getByText(/todavía no has ganado/i)).toBeInTheDocument();
  });

  it('lists each prize with its title and originating station', () => {
    render(<PrizeWallet prizes={[digital]} />);
    expect(screen.getByText('Pista extra')).toBeInTheDocument();
    expect(screen.getByText(/La torre/)).toBeInTheDocument();
  });

  it('shows redemption instructions for physical prizes', () => {
    render(<PrizeWallet prizes={[physical]} />);
    expect(screen.getByText('Enséñasela al organizador para recogerla.')).toBeInTheDocument();
  });

  it('does not show redemption instructions for digital prizes', () => {
    render(<PrizeWallet prizes={[digital]} />);
    expect(screen.queryByText(/organizador/i)).not.toBeInTheDocument();
  });

  it('renders a maps link for physical prizes whose redemption instructions are a URL', () => {
    render(<PrizeWallet prizes={[physicalWithMapLink]} />);
    const link = screen.getByRole('link', { name: /ver ubicación/i });
    expect(link).toHaveAttribute('href', 'https://maps.app.goo.gl/abc123');
  });

  it('renders a reward link for digital prizes whose payload is a URL', () => {
    render(<PrizeWallet prizes={[digitalWithLink]} />);
    const link = screen.getByRole('link', { name: /abrir/i });
    expect(link).toHaveAttribute('href', 'https://example.com/libro');
  });
});
