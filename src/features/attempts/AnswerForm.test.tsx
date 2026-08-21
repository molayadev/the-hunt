import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AnswerForm } from './AnswerForm';

describe('AnswerForm', () => {
  it('disables "Comprobar" while the field is empty', () => {
    render(<AnswerForm onSubmit={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Comprobar' })).toBeDisabled();
  });

  it('enables "Comprobar" once the field has text', async () => {
    const user = userEvent.setup();
    render(<AnswerForm onSubmit={vi.fn()} />);
    await user.type(screen.getByRole('textbox'), 'la torre');
    expect(screen.getByRole('button', { name: 'Comprobar' })).toBeEnabled();
  });

  it('submits the raw value entered', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<AnswerForm onSubmit={onSubmit} />);
    await user.type(screen.getByRole('textbox'), '¡La Torre!');
    await user.click(screen.getByRole('button', { name: 'Comprobar' }));
    expect(onSubmit).toHaveBeenCalledWith('¡La Torre!');
  });

  it('announces an error via aria-live="polite"', () => {
    render(<AnswerForm onSubmit={vi.fn()} errorMessage="Respuesta incorrecta." />);
    const alert = screen.getByText('Respuesta incorrecta.');
    expect(alert).toHaveAttribute('aria-live', 'polite');
  });

  it('previews the normalized answer while typing', async () => {
    const user = userEvent.setup();
    render(<AnswerForm onSubmit={vi.fn()} />);
    await user.type(screen.getByRole('textbox'), '¡La Torre!');
    expect(screen.getByText(/la torre/)).toBeInTheDocument();
  });

  it('is disabled when out of attempts, regardless of field content', async () => {
    const user = userEvent.setup();
    render(<AnswerForm onSubmit={vi.fn()} disabled />);
    await user.type(screen.getByRole('textbox'), 'la torre');
    expect(screen.getByRole('button', { name: 'Comprobar' })).toBeDisabled();
  });
});
