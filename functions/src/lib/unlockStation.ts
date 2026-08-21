import { FieldValue } from 'firebase-admin/firestore';
import type { Transaction } from 'firebase-admin/firestore';
import { db } from './firestore';
import type { CardDoc, HuntDoc, ProgressDoc, StationDoc } from './schema';

export interface UnlockStationParams {
  readonly tx: Transaction;
  readonly uid: string;
  readonly huntId: string;
  readonly stationId: string;
  readonly huntData: HuntDoc;
}

// Shared by redeemQr (a physical station QR) and startHunt (joining a hunt
// auto-unlocks its first station) — both boil down to "grant this uid this
// station's card", the only difference being how the stationId was found.
export async function unlockStationInTransaction({
  tx,
  uid,
  huntId,
  stationId,
  huntData,
}: UnlockStationParams): Promise<{ readonly alreadyUnlocked: boolean }> {
  const progressId = `${uid}_${huntId}`;
  const progressRef = db.doc(`progress/${progressId}`);
  const [progressSnap, stationSnap] = await Promise.all([
    tx.get(progressRef),
    tx.get(db.doc(`hunts/${huntId}/stations/${stationId}`)),
  ]);
  const progressData = progressSnap.data() as ProgressDoc | undefined;
  const station = stationSnap.data() as StationDoc;

  const existingUnlocked = progressData?.unlockedStationIds ?? [];
  const alreadyUnlocked = existingUnlocked.includes(stationId);

  if (!alreadyUnlocked) {
    const card: CardDoc = {
      order: station.order,
      title: station.title,
      clue: station.clue,
      challenge: station.challenge,
      state: 'unlocked',
      recentFailures: [],
    };
    tx.set(db.doc(`progress/${progressId}/cards/${stationId}`), card);

    if (progressSnap.exists) {
      tx.update(progressRef, {
        unlockedStationIds: FieldValue.arrayUnion(stationId),
        lastActivityAt: FieldValue.serverTimestamp(),
      });
    } else {
      const newProgress: Omit<ProgressDoc, 'completedAt' | 'recentFailures'> & {
        startedAt: FieldValue;
        lastActivityAt: FieldValue;
      } = {
        uid,
        huntId,
        solvedStationIds: [],
        unlockedStationIds: [stationId],
        revealedStationIds: [],
        solvedCount: 0,
        totalCount: huntData.stationCount,
        completionPct: 0,
        startedAt: FieldValue.serverTimestamp(),
        lastActivityAt: FieldValue.serverTimestamp(),
      };
      tx.set(progressRef, newProgress);
    }
  }

  return { alreadyUnlocked };
}
