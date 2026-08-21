import { useEffect, useState } from 'react';
import { collection, db, getDoc, doc, onSnapshot, query, where } from '../../shared/lib/firebase';

export interface MyHuntEntry {
  readonly huntId: string;
  readonly title: string;
  readonly solvedCount: number;
  readonly totalCount: number;
  readonly completionPct: number;
}

interface ProgressSummaryDoc {
  readonly huntId: string;
  readonly solvedCount: number;
  readonly totalCount: number;
  readonly completionPct: number;
}

export function useMyHunts(uid: string | null) {
  const [hunts, setHunts] = useState<readonly MyHuntEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!uid) return undefined;

    const progressQuery = query(collection(db, 'progress'), where('uid', '==', uid));

    const unsubscribe = onSnapshot(progressQuery, (snapshot) => {
      Promise.all(
        snapshot.docs.map(async (progressSnap) => {
          const data = progressSnap.data() as ProgressSummaryDoc;
          const huntSnap = await getDoc(doc(db, `hunts/${data.huntId}`));
          const title = (huntSnap.data() as { title?: string } | undefined)?.title ?? data.huntId;
          return {
            huntId: data.huntId,
            title,
            solvedCount: data.solvedCount,
            totalCount: data.totalCount,
            completionPct: data.completionPct,
          };
        }),
      )
        .then((entries) => {
          setHunts(entries);
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
        });
    });

    return unsubscribe;
  }, [uid]);

  return { hunts, isLoading };
}
