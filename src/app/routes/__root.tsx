import { createRootRoute, Outlet } from '@tanstack/react-router';
import { AppNav } from '../../features/nav/AppNav';

export const Route = createRootRoute({
  component: () => (
    <>
      <AppNav />
      <Outlet />
    </>
  ),
});
