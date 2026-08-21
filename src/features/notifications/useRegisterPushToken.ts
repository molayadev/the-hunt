import { useEffect } from 'react';
import { db, doc, registerForPush, serverTimestamp, setDoc } from '../../shared/lib/firebase';

export function useRegisterPushToken(uid: string | null, isEnabled: boolean): void {
  useEffect(() => {
    if (!uid || !isEnabled) return undefined;

    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    registerForPush((installationId) => {
      void setDoc(doc(db, `users/${uid}/pushTokens/${installationId}`), {
        platform: 'web',
        createdAt: serverTimestamp(),
        lastSeenAt: serverTimestamp(),
      });
    })
      .then((unsub) => {
        if (cancelled) {
          unsub?.();
          return;
        }
        unsubscribe = unsub;
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [uid, isEnabled]);
}
