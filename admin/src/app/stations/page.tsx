'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { AuthGate } from '@/features/auth/AuthGate';
import { useHunt } from '@/features/hunts/useHunt';
import { deleteStation } from '@/features/stations/deleteStation';
import { QrCodeCard } from '@/features/stations/QrCodeCard';
import { useStations } from '@/features/stations/useStations';

export default function StationsPage() {
  return (
    <AuthGate>
      <Suspense
        fallback={
          <main className="p-6">
            <p className="text-neutral-500">Cargando…</p>
          </main>
        }
      >
        <StationsList />
      </Suspense>
    </AuthGate>
  );
}

function StationsList() {
  const searchParams = useSearchParams();
  const huntId = searchParams.get('huntId');
  const router = useRouter();
  const { hunt } = useHunt(huntId);
  const { stations, isLoading } = useStations(huntId);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!huntId) router.replace('/hunts');
  }, [huntId, router]);

  if (!huntId) return null;

  return (
    <main className="flex flex-col gap-4 p-6">
      <Link href={`/hunts/edit?id=${huntId}`} className="text-sm text-neutral-500 underline">
        ← {hunt?.title ?? 'Volver a la ruta'}
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Estaciones</h1>
        <Link
          href={`/stations/edit?huntId=${huntId}`}
          className="rounded-md bg-neutral-900 px-4 py-2 font-semibold text-white"
        >
          + Nueva estación
        </Link>
      </div>

      {isLoading && <p className="text-neutral-500">Cargando…</p>}
      {!isLoading && stations.length === 0 && (
        <p className="text-neutral-500">Todavía no hay estaciones. Crea la primera.</p>
      )}

      <ul className="flex flex-col gap-3">
        {stations.map((station) => (
          <li
            key={station.id}
            className="flex items-center justify-between gap-4 rounded-md border border-neutral-200 p-4"
          >
            <Link
              href={`/stations/edit?huntId=${huntId}&stationId=${station.id}`}
              className="flex-1"
            >
              <p className="font-semibold">
                {station.order}. {station.title}
              </p>
              <p className="text-sm text-neutral-500">
                {station.challenge.type} · desbloqueo: {station.unlock ?? 'qr'}
                {station.location ? ' · con ubicación' : ''}
              </p>
            </Link>

            {(station.unlock ?? 'qr') === 'qr' && (
              <QrCodeCard
                token={`${huntId}-${station.id}`}
                stationTitle={station.title}
                icon={hunt?.icon}
              />
            )}

            {pendingDeleteId === station.id ? (
              <div className="flex flex-col gap-1 text-sm">
                <span>¿Seguro?</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      void deleteStation(huntId, station.id);
                      setPendingDeleteId(null);
                    }}
                    className="text-red-600 underline"
                  >
                    Sí, borrar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingDeleteId(null);
                    }}
                    className="text-neutral-500 underline"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setPendingDeleteId(station.id);
                }}
                className="text-sm text-red-600 underline"
              >
                Borrar
              </button>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
