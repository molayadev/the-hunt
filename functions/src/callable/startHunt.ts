import { FieldValue } from 'firebase-admin/firestore';
import type { StartHuntInput, StartHuntResult } from '../domain/callables';
import { withServerNow } from '../lib/envelope';
import { db } from '../lib/firestore';
import type { HuntDoc } from '../lib/schema';
import { unlockStationInTransaction } from '../lib/unlockStation';

export async function startHuntHandler(
  input: StartHuntInput,
  uid: string,
): Promise<StartHuntResult> {
  return db.runTransaction(async (tx) => {
    const huntRef = db.doc(`hunts/${input.huntId}`);
    const huntSnap = await tx.get(huntRef);
    const huntData = huntSnap.data() as HuntDoc | undefined;
    if (!huntSnap.exists || huntData?.status !== 'live') {
      return withServerNow({ ok: false, reason: 'hunt_not_live' } as const);
    }

    const progressId = `${uid}_${input.huntId}`;
    const eventRef = db.doc(`progress/${progressId}/events/${input.clientRequestId}`);
    const eventSnap = await tx.get(eventRef);
    if (eventSnap.exists) {
      const eventData = eventSnap.data() as { stationId: string; alreadyUnlocked: boolean };
      return withServerNow({
        ok: true,
        huntId: input.huntId,
        stationId: eventData.stationId,
        alreadyUnlocked: eventData.alreadyUnlocked,
      } as const);
    }

    const firstStationSnap = await tx.get(
      db.collection(`hunts/${input.huntId}/stations`).orderBy('order', 'asc').limit(1),
    );
    const firstStation = firstStationSnap.docs[0];
    if (!firstStation) {
      return withServerNow({ ok: false, reason: 'no_stations' } as const);
    }

    const { alreadyUnlocked } = await unlockStationInTransaction({
      tx,
      uid,
      huntId: input.huntId,
      stationId: firstStation.id,
      huntData,
    });

    tx.set(eventRef, {
      type: 'start',
      at: FieldValue.serverTimestamp(),
      stationId: firstStation.id,
      alreadyUnlocked,
    });

    return withServerNow({
      ok: true,
      huntId: input.huntId,
      stationId: firstStation.id,
      alreadyUnlocked,
    } as const);
  });
}
