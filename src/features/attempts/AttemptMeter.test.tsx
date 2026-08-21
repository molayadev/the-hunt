import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AttemptMeter } from './AttemptMeter';

describe('AttemptMeter', () => {
  it('shows the attempts left out of the maximum', () => {
    render(<AttemptMeter attemptsLeft={2} maxAttempts={3} remainingMs={null} />);
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('with no attempts left, shows a countdown until the next one and no attempts-left count', () => {
    render(
      <AttemptMeter
        attemptsLeft={0}
        maxAttempts={3}
        remainingMs={4 * 60 * 60 * 1000 + 12 * 60 * 1000}
      />,
    );
    expect(screen.getByText(/4h 12min/)).toBeInTheDocument();
    expect(screen.queryByText('0 / 3')).not.toBeInTheDocument();
  });
});
