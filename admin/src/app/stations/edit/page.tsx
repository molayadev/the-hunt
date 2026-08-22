'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { AuthGate } from '@/features/auth/AuthGate';
import { saveStation } from '@/features/stations/saveStation';
import { StationForm } from '@/features/stations/StationForm';
import { useStation } from '@/features/stations/useStation';

export default function EditStationPage() {
  return (
    <AuthGate>
      <Suspense
        fallback={
          <main className="p-6">
            <p className="text-neutral-500">Cargando…</p>
          </main>
        }
      >
        <EditStationForm />
      </Suspense>
    </AuthGate>
  );
}

function EditStationForm() {
  const searchParams = useSearchParams();
  const huntId = searchParams.get('huntId');
  const stationId = searchParams.get('stationId');
  const router = useRouter();
  const { values, isLoading } = useStation(huntId, stationId);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!huntId) router.replace('/hunts');
  }, [huntId, router]);

  if (!huntId) return null;

  if (stationId && isLoading) {
    return (
      <main className="p-6">
        <p className="text-neutral-500">Cargando…</p>
      </main>
    );
  }

  if (stationId && !values) {
    return (
      <main className="p-6">
        <p className="text-red-600">Esta estación ya no existe.</p>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-4 p-6">
      <Link href={`/stations?huntId=${huntId}`} className="text-sm text-neutral-500 underline">
        ← Estaciones
      </Link>
      <h1 className="text-xl font-semibold">{stationId ? 'Editar estación' : 'Nueva estación'}</h1>
      {error != null && (
        <p role="alert" className="text-red-600">
          No se ha podido guardar. Inténtalo de nuevo.
        </p>
      )}
      {values && (
        <StationForm
          key={stationId ?? 'new'}
          initialValues={values}
          isPending={isPending}
          onSubmit={(formValues) => {
            setIsPending(true);
            setError(null);
            saveStation(huntId, stationId, formValues)
              .then(() => {
                router.push(`/stations?huntId=${huntId}`);
              })
              .catch((caught: unknown) => {
                setError(caught);
              })
              .finally(() => {
                setIsPending(false);
              });
          }}
        />
      )}
    </main>
  );
}
