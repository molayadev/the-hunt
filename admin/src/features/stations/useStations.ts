'use client';

import { useEffect, useState } from 'react';
import type { StationDoc } from '@rastro/schema';
import { collection, db, onSnapshot, orderBy, query } from '@/lib/firebase';

export interface StationListItem extends StationDoc {
  readonly id: string;
}

export function useStations(huntId: string | null): {
  readonly stations: readonly StationListItem[];
  readonly isLoading: boolean;
} {
  const [stations, setStations] = useState<readonly StationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(huntId !== null);

  useEffect(() => {
    if (!huntId) return;
    // Standard fetch-on-mount: the loading flag has to flip before the
    // subscription's first snapshot arrives, no external system to
    // subscribe to instead.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    return onSnapshot(
      query(collection(db, `hunts/${huntId}/stations`), orderBy('order')),
      (snapshot) => {
        setStations(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as StationDoc) })));
        setIsLoading(false);
      },
    );
  }, [huntId]);

  return { stations: huntId ? stations : [], isLoading: huntId ? isLoading : false };
}
