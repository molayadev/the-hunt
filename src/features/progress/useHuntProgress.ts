import { useEffect, useState } from 'react';
import { collection, db, doc, onSnapshot } from '../../shared/lib/firebase';
import type { Card } from '../../shared/types/card';

export interface HuntProgressSummary {
  readonly solvedCount: number;
  readonly totalCount: number;
  readonly completionPct: number;
}

export interface HuntProgress {
  readonly summary: HuntProgressSummary | null;
  readonly cards: readonly Card[];
  readonly isLoading: boolean;
}

export function useHuntProgress(uid: string | null, huntId: string): HuntProgress {
  const [summary, setSummary] = useState<HuntProgressSummary | null>(null);
  const [cards, setCards] = useState<readonly Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!uid) return undefined;
    const progressId = `${uid}_${huntId}`;

    const unsubscribeSummary = onSnapshot(doc(db, `progress/${progressId}`), (snapshot) => {
      setSummary(snapshot.exists() ? (snapshot.data() as HuntProgressSummary) : null);
      setIsLoading(false);
    });

    const unsubscribeCards = onSnapshot(
      collection(db, `progress/${progressId}/cards`),
      (snapshot) => {
        setCards(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Card));
      },
    );

    return () => {
      unsubscribeSummary();
      unsubscribeCards();
    };
  }, [uid, huntId]);

  return { summary, cards, isLoading };
}
