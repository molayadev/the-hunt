'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { AuthGate } from '@/features/auth/AuthGate';
import { useAdminSession } from '@/features/auth/useAdminSession';
import { HuntForm } from '@/features/hunts/HuntForm';
import { saveHunt } from '@/features/hunts/saveHunt';
import type { HuntFormValues } from '@/features/hunts/saveHunt';
import { useHunt } from '@/features/hunts/useHunt';

const EMPTY_VALUES: HuntFormValues = {
  title: '',
  tagline: '',
  icon: '',
  language: 'es',
  status: 'draft',
  visibility: 'code',
  joinCode: '',
  stationCount: 0,
  maxAttempts: 3,
  windowHours: 24,
  scope: 'station',
};

export default function EditHuntPage() {
  return (
    <AuthGate>
      <Suspense
        fallback={
          <main className="p-6">
            <p className="text-neutral-500">Cargando…</p>
          </main>
        }
      >
        <EditHuntForm />
      </Suspense>
    </AuthGate>
  );
}

function EditHuntForm() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const router = useRouter();
  const session = useAdminSession();
  const { hunt, isLoading } = useHunt(id);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<unknown>(null);

  if (id && isLoading) {
    return (
      <main className="p-6">
        <p className="text-neutral-500">Cargando…</p>
      </main>
    );
  }

  const initialValues: HuntFormValues = hunt
    ? {
        title: hunt.title,
        tagline: hunt.tagline ?? '',
        icon: hunt.icon ?? '',
        language: hunt.language,
        status: hunt.status,
        visibility: hunt.visibility,
        joinCode: hunt.joinCode ?? '',
        stationCount: hunt.stationCount,
        maxAttempts: hunt.attemptPolicy.maxAttempts,
        windowHours: hunt.attemptPolicy.windowHours,
        scope: hunt.attemptPolicy.scope,
      }
    : EMPTY_VALUES;

  return (
    <main className="flex flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold">{id ? 'Editar ruta' : 'Nueva ruta'}</h1>
      {error != null && (
        <p role="alert" className="text-red-600">
          No se ha podido guardar. Inténtalo de nuevo.
        </p>
      )}
      <HuntForm
        key={id ?? 'new'}
        initialValues={initialValues}
        isPending={isPending}
        onSubmit={(values) => {
          if (!session.uid) return;
          setIsPending(true);
          setError(null);
          saveHunt(id, values, hunt?.createdBy ?? session.uid)
            .then(() => {
              router.push('/hunts');
            })
            .catch((caught: unknown) => {
              setError(caught);
            })
            .finally(() => {
              setIsPending(false);
            });
        }}
      />
    </main>
  );
}
