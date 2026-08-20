import { FieldValue } from 'firebase-admin/firestore';
import type { RedeemQrInput, RedeemQrResult } from '../domain/callables';
import { withServerNow } from '../lib/envelope';
import { db } from '../lib/firestore';
import type { CardDoc, HuntDoc, ProgressDoc, QrTokenDoc, StationDoc } from '../lib/schema';

// El evento de desbloqueo usa clientRequestId como ID de documento (no un ID
// aleatorio con un campo aparte): así la idempotencia es un simple
// "lee-y-si-no-existe-escribe" dentro de la transacción, sin necesitar una
// query. Ver PLAN.md §3 (events) y §5.3 (test 36).
export async function redeemQrHandler(input: RedeemQrInput, uid: string): Promise<RedeemQrResult> {
  return db.runTransaction(async (tx) => {
    const tokenRef = db.doc(`qrTokens/${input.token}`);
    const tokenSnap = await tx.get(tokenRef);
    if (!tokenSnap.exists) {
      return withServerNow({ ok: false, reason: 'invalid_token' } as const);
    }
    const tokenData = tokenSnap.data() as QrTokenDoc;

    const huntRef = db.doc(`hunts/${tokenData.huntId}`);
    const huntSnap = await tx.get(huntRef);
    const huntData = huntSnap.data() as HuntDoc | undefined;
    if (!huntSnap.exists || huntData?.status !== 'live') {
      return withServerNow({ ok: false, reason: 'hunt_not_live' } as const);
    }

    const progressId = `${uid}_${tokenData.huntId}`;
    const progressRef = db.doc(`progress/${progressId}`);
    const eventRef = db.doc(`progress/${progressId}/events/${input.clientRequestId}`);
    const eventSnap = await tx.get(eventRef);
    if (eventSnap.exists) {
      const eventData = eventSnap.data() as { alreadyUnlocked: boolean };
      return withServerNow({
        ok: true,
        huntId: tokenData.huntId,
        stationId: tokenData.stationId,
        alreadyUnlocked: eventData.alreadyUnlocked,
      } as const);
    }

    const [progressSnap, stationSnap] = await Promise.all([
      tx.get(progressRef),
      tx.get(db.doc(`hunts/${tokenData.huntId}/stations/${tokenData.stationId}`)),
    ]);
    const progressData = progressSnap.data() as ProgressDoc | undefined;
    const station = stationSnap.data() as StationDoc;

    const existingUnlocked = progressData?.unlockedStationIds ?? [];
    const alreadyUnlocked = existingUnlocked.includes(tokenData.stationId);

    if (!alreadyUnlocked) {
      const card: CardDoc = {
        order: station.order,
        title: station.title,
        clue: station.clue,
        challenge: station.challenge,
        state: 'unlocked',
        recentFailures: [],
      };
      tx.set(db.doc(`progress/${progressId}/cards/${tokenData.stationId}`), card);

      if (progressSnap.exists) {
        tx.update(progressRef, {
          unlockedStationIds: FieldValue.arrayUnion(tokenData.stationId),
          lastActivityAt: FieldValue.serverTimestamp(),
        });
      } else {
        const newProgress: Omit<ProgressDoc, 'completedAt' | 'recentFailures'> & {
          startedAt: FieldValue;
          lastActivityAt: FieldValue;
        } = {
          uid,
          huntId: tokenData.huntId,
          solvedStationIds: [],
          unlockedStationIds: [tokenData.stationId],
          revealedStationIds: [],
          solvedCount: 0,
          totalCount: huntData.stationCount,
          completionPct: 0,
          startedAt: FieldValue.serverTimestamp(),
          lastActivityAt: FieldValue.serverTimestamp(),
        };
        tx.set(progressRef, newProgress);
      }

      tx.update(tokenRef, { redeemCount: FieldValue.increment(1) });
    }

    tx.set(eventRef, {
      type: 'unlock',
      at: FieldValue.serverTimestamp(),
      stationId: tokenData.stationId,
      alreadyUnlocked,
    });

    return withServerNow({
      ok: true,
      huntId: tokenData.huntId,
      stationId: tokenData.stationId,
      alreadyUnlocked,
    } as const);
  });
}
