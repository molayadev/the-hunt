'use client';

import { useEffect, useState } from 'react';
import { auth, db, doc, getDoc, onAuthStateChanged } from '@/lib/firebase';

export type AdminSessionStatus = 'loading' | 'signed-out' | 'not-admin' | 'admin';

export interface AdminSession {
  readonly status: AdminSessionStatus;
  readonly uid: string | null;
  readonly email: string | null;
}

// Access to the admin app is gated on the existence of admins/{uid}, not on
// any role stored client-side — firestore.rules enforces the same check
// server-side, so this is UX only, never the real access boundary.
export function useAdminSession(): AdminSession {
  const [session, setSession] = useState<AdminSession>({
    status: 'loading',
    uid: null,
    email: null,
  });

  useEffect(
    () =>
      onAuthStateChanged(auth, (user) => {
        if (!user) {
          setSession({ status: 'signed-out', uid: null, email: null });
          return;
        }
        getDoc(doc(db, `admins/${user.uid}`))
          .then((snapshot) => {
            setSession({
              status: snapshot.exists() ? 'admin' : 'not-admin',
              uid: user.uid,
              email: user.email,
            });
          })
          .catch(() => {
            setSession({ status: 'not-admin', uid: user.uid, email: user.email });
          });
      }),
    [],
  );

  return session;
}
