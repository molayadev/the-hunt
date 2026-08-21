import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AttemptHearts } from './AttemptHearts';

describe('AttemptHearts', () => {
  it('announces how many attempts remain out of the total', () => {
    render(<AttemptHearts attemptsLeft={2} maxAttempts={3} />);
    expect(screen.getByLabelText('2 de 3 intentos restantes')).toBeInTheDocument();
  });

  it('renders one heart per maxAttempts, with attemptsLeft of them filled', () => {
    render(<AttemptHearts attemptsLeft={2} maxAttempts={3} />);
    const hearts = screen.getAllByTestId(/^heart-/);
    expect(hearts).toHaveLength(3);
    expect(hearts.filter((h) => h.dataset.filled === 'true')).toHaveLength(2);
  });

  it('renders no filled hearts when no attempts remain', () => {
    render(<AttemptHearts attemptsLeft={0} maxAttempts={3} />);
    const hearts = screen.getAllByTestId(/^heart-/);
    expect(hearts.filter((h) => h.dataset.filled === 'true')).toHaveLength(0);
  });
});
