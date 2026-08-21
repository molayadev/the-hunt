import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AnswerForm } from './AnswerForm';
import type { Challenge } from '../../shared/types/card';

const textChallenge: Challenge = { type: 'text', question: '¿Qué edificio es?' };

const singleOptionChallenge: Challenge = {
  type: 'single_option',
  question: '¿De qué color es la placa?',
  options: [
    { id: 'a', kind: 'text', text: 'Roja' },
    { id: 'b', kind: 'text', text: 'Verde' },
    { id: 'c', kind: 'text', text: 'Azul' },
  ],
};

const multipleOptionChallenge: Challenge = {
  type: 'multiple_option',
  question: '¿Qué lleva la estatua?',
  options: [
    { id: 'x', kind: 'text', text: 'Libro' },
    { id: 'y', kind: 'text', text: 'Espada' },
    { id: 'z', kind: 'text', text: 'Escudo' },
  ],
};

const imageOptionChallenge: Challenge = {
  type: 'single_option',
  question: '¿Cuál es la fuente?',
  options: [
    { id: 'p1', kind: 'image', imageUrl: 'https://example.com/fuente.jpg', alt: 'La Fuente' },
    { id: 'p2', kind: 'image', imageUrl: 'https://example.com/roble.jpg', alt: 'El Roble' },
  ],
};

describe('AnswerForm — text challenges', () => {
  it('disables "Comprobar" while the field is empty', () => {
    render(<AnswerForm challenge={textChallenge} onSubmit={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Comprobar' })).toBeDisabled();
  });

  it('submits {kind: "text", value} with the raw value entered', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<AnswerForm challenge={textChallenge} onSubmit={onSubmit} />);
    await user.type(screen.getByRole('textbox'), '¡La Torre!');
    await user.click(screen.getByRole('button', { name: 'Comprobar' }));
    expect(onSubmit).toHaveBeenCalledWith({ kind: 'text', value: '¡La Torre!' });
  });

  it('previews the normalized answer while typing', async () => {
    const user = userEvent.setup();
    render(<AnswerForm challenge={textChallenge} onSubmit={vi.fn()} />);
    await user.type(screen.getByRole('textbox'), '¡La Torre!');
    expect(screen.getByText(/la torre/)).toBeInTheDocument();
  });

  it('announces an error via aria-live="polite"', () => {
    render(<AnswerForm challenge={textChallenge} onSubmit={vi.fn()} errorMessage="Mal." />);
    expect(screen.getByText('Mal.')).toHaveAttribute('aria-live', 'polite');
  });

  it('is disabled when out of attempts, regardless of field content', async () => {
    const user = userEvent.setup();
    render(<AnswerForm challenge={textChallenge} onSubmit={vi.fn()} disabled />);
    await user.type(screen.getByRole('textbox'), 'la torre');
    expect(screen.getByRole('button', { name: 'Comprobar' })).toBeDisabled();
  });
});

describe('AnswerForm — single_option challenges', () => {
  it('shows the question and one radio per option', () => {
    render(<AnswerForm challenge={singleOptionChallenge} onSubmit={vi.fn()} />);
    expect(screen.getByText('¿De qué color es la placa?')).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('disables "Comprobar" until an option is picked', () => {
    render(<AnswerForm challenge={singleOptionChallenge} onSubmit={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Comprobar' })).toBeDisabled();
  });

  it('selects only one option at a time and submits it', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<AnswerForm challenge={singleOptionChallenge} onSubmit={onSubmit} />);

    await user.click(screen.getByRole('radio', { name: 'Roja' }));
    await user.click(screen.getByRole('radio', { name: 'Verde' }));
    expect(screen.getByRole('radio', { name: 'Roja' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('radio', { name: 'Verde' })).toHaveAttribute('aria-checked', 'true');

    await user.click(screen.getByRole('button', { name: 'Comprobar' }));
    expect(onSubmit).toHaveBeenCalledWith({ kind: 'single_option', optionId: 'b' });
  });
});

describe('AnswerForm — multiple_option challenges', () => {
  it('shows one checkbox per option', () => {
    render(<AnswerForm challenge={multipleOptionChallenge} onSubmit={vi.fn()} />);
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
  });

  it('disables "Comprobar" until at least one option is picked', () => {
    render(<AnswerForm challenge={multipleOptionChallenge} onSubmit={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Comprobar' })).toBeDisabled();
  });

  it('toggles multiple options independently and submits all selected ids', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<AnswerForm challenge={multipleOptionChallenge} onSubmit={onSubmit} />);

    await user.click(screen.getByRole('checkbox', { name: 'Libro' }));
    await user.click(screen.getByRole('checkbox', { name: 'Espada' }));
    expect(screen.getByRole('checkbox', { name: 'Libro' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('checkbox', { name: 'Escudo' })).toHaveAttribute(
      'aria-checked',
      'false',
    );

    await user.click(screen.getByRole('button', { name: 'Comprobar' }));
    expect(onSubmit).toHaveBeenCalledWith({ kind: 'multiple_option', optionIds: ['x', 'y'] });
  });

  it('deselects an option on a second click', async () => {
    const user = userEvent.setup();
    render(<AnswerForm challenge={multipleOptionChallenge} onSubmit={vi.fn()} />);
    const libro = screen.getByRole('checkbox', { name: 'Libro' });
    await user.click(libro);
    await user.click(libro);
    expect(libro).toHaveAttribute('aria-checked', 'false');
  });
});

describe('AnswerForm — image options', () => {
  it('renders an image for image-kind options instead of text', () => {
    render(<AnswerForm challenge={imageOptionChallenge} onSubmit={vi.fn()} />);
    const image = screen.getByRole('img', { name: 'La Fuente' });
    expect(image).toHaveAttribute('src', 'https://example.com/fuente.jpg');
  });
});
