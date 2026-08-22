'use client';

import { useEffect, useState } from 'react';
import type { HuntDoc } from '@rastro/schema';
import { db, doc, getDoc } from '@/lib/firebase';

export interface UseHuntResult {
  readonly hunt: (HuntDoc & { readonly id: string }) | null;
  readonly isLoading: boolean;
}

export function useHunt(huntId: string | null): UseHuntResult {
  const [hunt, setHunt] = useState<UseHuntResult['hunt']>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!huntId) return;
    // Standard fetch-on-mount: the loading flag has to flip before the
    // async getDoc call starts, no external system to subscribe to instead.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    getDoc(doc(db, `hunts/${huntId}`))
      .then((snapshot) => {
        setHunt(snapshot.exists() ? { id: snapshot.id, ...(snapshot.data() as HuntDoc) } : null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [huntId]);

  return { hunt: huntId ? hunt : null, isLoading: huntId ? isLoading : false };
}
