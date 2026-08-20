import { useEffect, useState } from 'react';
import { auth, onAuthStateChanged, signInAnonymously } from '../../shared/lib/firebase';

export interface Session {
  readonly uid: string | null;
  readonly isLoading: boolean;
}

export function useAnonymousAuthSession(): Session {
  const [session, setSession] = useState<Session>({ uid: null, isLoading: true });

  useEffect(
    () =>
      onAuthStateChanged(auth, (user) => {
        if (user) {
          setSession({ uid: user.uid, isLoading: false });
          return;
        }
        void signInAnonymously(auth);
      }),
    [],
  );

  return session;
}
