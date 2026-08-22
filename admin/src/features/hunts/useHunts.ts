'use client';

import { useEffect, useState } from 'react';
import type { HuntDoc } from '@rastro/schema';
import { collection, db, onSnapshot, orderBy, query } from '@/lib/firebase';

export interface HuntListItem extends HuntDoc {
  readonly id: string;
}

export function useHunts(): {
  readonly hunts: readonly HuntListItem[];
  readonly isLoading: boolean;
} {
  const [hunts, setHunts] = useState<readonly HuntListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(
    () =>
      onSnapshot(query(collection(db, 'hunts'), orderBy('title')), (snapshot) => {
        setHunts(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as HuntDoc) })));
        setIsLoading(false);
      }),
    [],
  );

  return { hunts, isLoading };
}
