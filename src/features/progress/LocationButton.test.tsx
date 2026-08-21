import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LocationButton } from './LocationButton';
import type { StationLocation } from '../../shared/types/card';

const location: StationLocation = {
  mapsUrl: 'https://maps.app.goo.gl/example',
  hint: 'Bajo el reloj de la plaza principal.',
};

describe('LocationButton', () => {
  it('links to the maps URL', () => {
    render(<LocationButton location={location} />);
    expect(screen.getByRole('link', { name: /ver ubicación/i })).toHaveAttribute(
      'href',
      'https://maps.app.goo.gl/example',
    );
  });

  it('shows the riddle-style hint text', () => {
    render(<LocationButton location={location} />);
    expect(screen.getByText('Bajo el reloj de la plaza principal.')).toBeInTheDocument();
  });
});
