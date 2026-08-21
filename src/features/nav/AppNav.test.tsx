import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppNav } from './AppNav';

function renderAppNav() {
  const rootRoute = createRootRoute({ component: AppNav });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  render(<RouterProvider router={router} />);
}

describe('AppNav', () => {
  it('links back to the home screen', () => {
    renderAppNav();
    expect(screen.getByRole('link', { name: /rastro/i })).toHaveAttribute('href', '/');
  });

  it('links to the scan screen', () => {
    renderAppNav();
    expect(screen.getByRole('link', { name: /escanear/i })).toHaveAttribute('href', '/scan');
  });
});
