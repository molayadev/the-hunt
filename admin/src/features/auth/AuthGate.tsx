'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAdminSession } from './useAdminSession';
import { auth, signOut } from '@/lib/firebase';

export interface AuthGateProps {
  readonly children: ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const session = useAdminSession();
  const router = useRouter();

  useEffect(() => {
    if (session.status === 'signed-out') router.replace('/login');
  }, [session.status, router]);

  if (session.status === 'loading' || session.status === 'signed-out') {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <p className="text-neutral-500">Cargando…</p>
      </main>
    );
  }

  if (session.status === 'not-admin') {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="font-semibold">
          Tu cuenta ({session.email}) no tiene acceso de administrador.
        </p>
        <p className="text-sm text-neutral-500">
          Pide a alguien con acceso que te añada en la colección{' '}
          <code className="rounded bg-neutral-100 px-1">admins</code>.
        </p>
      </main>
    );
  }

  return (
    <>
      <nav className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
        <Link href="/hunts" className="font-semibold">
          Rastro — Admin
        </Link>
        <div className="flex items-center gap-3 text-sm text-neutral-500">
          <span>{session.email}</span>
          <button
            type="button"
            onClick={() => {
              void signOut(auth);
            }}
            className="underline"
          >
            Salir
          </button>
        </div>
      </nav>
      {children}
    </>
  );
}
