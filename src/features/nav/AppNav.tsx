import { Link } from '@tanstack/react-router';

export function AppNav() {
  return (
    <nav className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
      <Link to="/" className="font-display text-lg font-semibold text-primary">
        Rastro
      </Link>
      <Link to="/scan" className="text-sm font-semibold text-primary underline">
        Escanear
      </Link>
    </nav>
  );
}
