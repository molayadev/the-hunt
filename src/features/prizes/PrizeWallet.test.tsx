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
});
