import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PasswordUnlockForm } from './PasswordUnlockForm';

describe('PasswordUnlockForm', () => {
  it('disables the submit button while the field is empty', () => {
    render(<PasswordUnlockForm onSubmit={vi.fn()} />);
    expect(screen.getByRole('button', { name: /desbloquear/i })).toBeDisabled();
  });

  it('submits the trimmed password entered', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PasswordUnlockForm onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText(/palabra clave/i), '  faro2026  ');
    await user.click(screen.getByRole('button', { name: /desbloquear/i }));
    expect(onSubmit).toHaveBeenCalledWith('faro2026');
  });

  it('shows an error message via aria-live="polite"', () => {
    render(<PasswordUnlockForm onSubmit={vi.fn()} errorMessage="Palabra clave incorrecta." />);
    expect(screen.getByText('Palabra clave incorrecta.')).toHaveAttribute('aria-live', 'polite');
  });

  it('is disabled regardless of field content when disabled is set', async () => {
    const user = userEvent.setup();
    render(<PasswordUnlockForm onSubmit={vi.fn()} disabled />);
    await user.type(screen.getByLabelText(/palabra clave/i), 'faro2026');
    expect(screen.getByRole('button', { name: /desbloquear/i })).toBeDisabled();
  });
});
