import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ProfileNameForm } from './ProfileNameForm';

describe('ProfileNameForm', () => {
  it('disables the submit button while the field is empty', () => {
    render(<ProfileNameForm onSubmit={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled();
  });

  it('submits the entered name', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ProfileNameForm onSubmit={onSubmit} />);
    await user.type(screen.getByRole('textbox'), 'Ana');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(onSubmit).toHaveBeenCalledWith('Ana');
  });

  it('does not submit a blank name', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ProfileNameForm onSubmit={onSubmit} />);
    await user.type(screen.getByRole('textbox'), '   ');
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
