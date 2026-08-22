'use client';

import Link from 'next/link';
import { AuthGate } from '@/features/auth/AuthGate';
import { useHunts } from '@/features/hunts/useHunts';

export default function HuntsPage() {
  return (
    <AuthGate>
      <HuntsList />
    </AuthGate>
  );
}

function HuntsList() {
  const { hunts, isLoading } = useHunts();

  return (
    <main className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Rutas</h1>
        <Link
          href="/hunts/edit"
          className="rounded-md bg-neutral-900 px-4 py-2 font-semibold text-white"
        >
          + Nueva ruta
        </Link>
      </div>

      {isLoading && <p className="text-neutral-500">Cargando…</p>}
      {!isLoading && hunts.length === 0 && (
        <p className="text-neutral-500">Todavía no hay rutas. Crea la primera.</p>
      )}

      <ul className="flex flex-col gap-2">
        {hunts.map((hunt) => (
          <li key={hunt.id}>
            <Link
              href={`/hunts/edit?id=${hunt.id}`}
              className="flex items-center justify-between rounded-md border border-neutral-200 p-4 hover:bg-neutral-50"
            >
              <div className="flex items-center gap-2">
                {hunt.icon && <span aria-hidden="true">{hunt.icon}</span>}
                <span className="font-semibold">{hunt.title}</span>
              </div>
              <span className="text-sm text-neutral-500">
                {hunt.status} · {hunt.stationCount} estaciones
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
