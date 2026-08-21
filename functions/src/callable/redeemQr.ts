import { FieldValue } from 'firebase-admin/firestore';
import type { RedeemQrInput, RedeemQrResult } from '../domain/callables';
import { withServerNow } from '../lib/envelope';
import { db } from '../lib/firestore';
import type { HuntDoc, QrTokenDoc } from '../lib/schema';
import { unlockStationInTransaction } from '../lib/unlockStation';

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

    const { alreadyUnlocked } = await unlockStationInTransaction({
      tx,
      uid,
      huntId: tokenData.huntId,
      stationId: tokenData.stationId,
      huntData,
    });

    if (!alreadyUnlocked) {
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
