import { useEffect, useState } from 'react';
import { db, doc, onSnapshot } from '../../shared/lib/firebase';
import type { HuntSummary } from '../../shared/types/hunt';

export function useHunt(huntId: string): HuntSummary | null {
  const [hunt, setHunt] = useState<HuntSummary | null>(null);

  useEffect(
    () =>
      onSnapshot(doc(db, `hunts/${huntId}`), (snapshot) => {
        setHunt(
          snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as HuntSummary) : null,
        );
      }),
    [huntId],
  );

  return hunt;
}
