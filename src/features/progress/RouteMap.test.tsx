import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RouteMap } from './RouteMap';
import type { RouteMapNode } from './RouteMap';

const nodes: readonly RouteMapNode[] = [
  { order: 1, state: 'solved', id: 'a', title: 'La Fuente' },
  { order: 2, state: 'unlockable', id: 'b', title: 'El Roble Viejo' },
  { order: 3, state: 'locked', id: 'c', title: 'El Quiosco' },
  { order: 4, state: 'unknown' },
];

describe('RouteMap', () => {
  it('exposes each discovered station by name and state', () => {
    render(<RouteMap nodes={nodes} onSelect={vi.fn()} />);
    expect(screen.getByRole('button', { name: /la fuente.*resuelta/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /el roble viejo.*resolver/i })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /el quiosco.*bloqueada/i })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /estación 4.*sin descubrir/i })).toBeInTheDocument();
  });

  it('selects an unlockable station on click', async () => {
    const onSelect = vi.fn();
    render(<RouteMap nodes={nodes} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: /el roble viejo/i }));
    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('selects a solved station on click, to review its detail', async () => {
    const onSelect = vi.fn();
    render(<RouteMap nodes={nodes} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: /la fuente/i }));
    expect(onSelect).toHaveBeenCalledWith('a');
  });

  it('does not select a locked or undiscovered station on click', async () => {
    const onSelect = vi.fn();
    render(<RouteMap nodes={nodes} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('img', { name: /el quiosco/i }));
    await userEvent.click(screen.getByRole('img', { name: /sin descubrir/i }));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('selects an unlockable station with the keyboard', async () => {
    const onSelect = vi.fn();
    render(<RouteMap nodes={nodes} onSelect={onSelect} />);
    const node = screen.getByRole('button', { name: /el roble viejo/i });
    node.focus();
    await userEvent.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith('b');
  });
});
