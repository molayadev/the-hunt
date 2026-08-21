import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProgressConstellation } from './ProgressConstellation';
import type { ConstellationStation } from './ProgressConstellation';

const stations: ConstellationStation[] = [
  { id: 's1', order: 1, solved: true },
  { id: 's2', order: 2, solved: false },
];

describe('ProgressConstellation', () => {
  it('always shows the readable "N of M · pct%" summary', () => {
    render(
      <ProgressConstellation
        stations={stations}
        totalCount={12}
        solvedCount={11}
        completionPct={91}
      />,
    );
    expect(screen.getByText('11 de 12 · 91%')).toBeInTheDocument();
  });

  it('at 91% does not show the completed state', () => {
    render(
      <ProgressConstellation
        stations={stations}
        totalCount={12}
        solvedCount={11}
        completionPct={91}
      />,
    );
    expect(screen.queryByText(/completad/i)).not.toBeInTheDocument();
  });

  it('at 100% shows the completed state', () => {
    render(
      <ProgressConstellation
        stations={stations}
        totalCount={12}
        solvedCount={12}
        completionPct={100}
      />,
    );
    expect(screen.getByText(/completad/i)).toBeInTheDocument();
  });

  it('renders one accessible node per known station', () => {
    render(
      <ProgressConstellation
        stations={stations}
        totalCount={12}
        solvedCount={11}
        completionPct={91}
      />,
    );
    expect(screen.getAllByTitle(/Estación/)).toHaveLength(2);
  });
});
