import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ManualTokenEntry } from './ManualTokenEntry';

describe('ManualTokenEntry', () => {
  it('submits the trimmed token typed in the input', async () => {
    const onSubmit = vi.fn();
    render(<ManualTokenEntry onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/código de la estación/i), '  station-a  ');
    await userEvent.click(screen.getByRole('button', { name: /desbloquear/i }));

    expect(onSubmit).toHaveBeenCalledWith('station-a');
  });

  it('clears the input after a successful submit', async () => {
    render(<ManualTokenEntry onSubmit={vi.fn()} />);

    const input = screen.getByLabelText(/código de la estación/i);
    await userEvent.type(input, 'station-a');
    await userEvent.click(screen.getByRole('button', { name: /desbloquear/i }));

    expect(input).toHaveValue('');
  });

  it('does not submit a blank token', async () => {
    const onSubmit = vi.fn();
    render(<ManualTokenEntry onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole('button', { name: /desbloquear/i }));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
