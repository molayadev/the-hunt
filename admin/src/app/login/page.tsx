'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LoginForm } from '@/features/auth/LoginForm';
import { useAdminSession } from '@/features/auth/useAdminSession';
import { auth, signInWithEmailAndPassword } from '@/lib/firebase';

function errorMessageFor(error: unknown): string | null {
  if (!error) return null;
  return 'No se ha podido entrar. Comprueba el email y la contraseña.';
}

export default function LoginPage() {
  const session = useAdminSession();
  const router = useRouter();
  const [error, setError] = useState<unknown>(null);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (session.status === 'admin' || session.status === 'not-admin') router.replace('/');
  }, [session.status, router]);

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">Rastro — Admin</h1>
      <LoginForm
        isPending={isPending}
        errorMessage={errorMessageFor(error)}
        onSubmit={(email, password) => {
          setIsPending(true);
          setError(null);
          signInWithEmailAndPassword(auth, email, password)
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
