import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TorchToggle } from './TorchToggle';

describe('TorchToggle', () => {
  it('renders nothing when the torch is unsupported', () => {
    const { container } = render(
      <TorchToggle isSupported={false} isOn={false} onToggle={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('when supported, calls onToggle when clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<TorchToggle isSupported isOn={false} onToggle={onToggle} />);
    await user.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('reflects the on state as pressed', () => {
    render(<TorchToggle isSupported isOn onToggle={vi.fn()} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });
});
