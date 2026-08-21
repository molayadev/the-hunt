import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HuntIcon } from './HuntIcon';

describe('HuntIcon', () => {
  it('renders an image when the icon is a URL', () => {
    render(<HuntIcon icon="https://example.com/badge.png" title="Ruta del Parque" />);
    expect(screen.getByRole('img', { name: 'Ruta del Parque' })).toHaveAttribute(
      'src',
      'https://example.com/badge.png',
    );
  });

  it('renders the raw value as text when the icon is an emoji', () => {
    render(<HuntIcon icon="🌳" title="Ruta del Parque" />);
    expect(screen.getByText('🌳')).toBeInTheDocument();
  });

  it('renders nothing when there is no icon', () => {
    const { container } = render(<HuntIcon icon={undefined} title="Ruta del Parque" />);
    expect(container).toBeEmptyDOMElement();
  });
});
