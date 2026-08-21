import { FieldValue } from 'firebase-admin/firestore';
import { isCorrectAnswer } from '../domain/answer/normalize';
import type { UnlockWithPasswordInput, UnlockWithPasswordResult } from '../domain/callables';
import { requiresPriorMembership } from '../domain/hunt/requiresPriorMembership';
import { withServerNow } from '../lib/envelope';
import { db } from '../lib/firestore';
import type { HuntDoc, StationAnswerDoc } from '../lib/schema';
import { unlockStationInTransaction } from '../lib/unlockStation';

export async function unlockWithPasswordHandler(
  input: UnlockWithPasswordInput,
  uid: string,
): Promise<UnlockWithPasswordResult> {
  return db.runTransaction(async (tx) => {
    const huntRef = db.doc(`hunts/${input.huntId}`);
    const huntSnap = await tx.get(huntRef);
    const huntData = huntSnap.data() as HuntDoc | undefined;
    if (!huntSnap.exists || huntData?.status !== 'live') {
      return withServerNow({ ok: false, reason: 'hunt_not_live' } as const);
    }

    const progressId = `${uid}_${input.huntId}`;
    const progressRef = db.doc(`progress/${progressId}`);
    const eventRef = db.doc(`progress/${progressId}/events/${input.clientRequestId}`);
    const answerRef = db.doc(`hunts/${input.huntId}/stations/${input.stationId}/secret/answer`);
    const [eventSnap, progressSnap, answerSnap] = await Promise.all([
      tx.get(eventRef),
      tx.get(progressRef),
      tx.get(answerRef),
    ]);

    if (eventSnap.exists) {
      const eventData = eventSnap.data() as { alreadyUnlocked: boolean };
      return withServerNow({
        ok: true,
        stationId: input.stationId,
        alreadyUnlocked: eventData.alreadyUnlocked,
      } as const);
    }

    if (!progressSnap.exists && requiresPriorMembership(huntData.visibility)) {
      return withServerNow({ ok: false, reason: 'private_hunt' } as const);
    }

    const secret = answerSnap.data() as StationAnswerDoc | undefined;
    const correct = isCorrectAnswer(input.password, secret?.acceptedPasswords ?? []);
    if (!correct) {
      return withServerNow({ ok: false, reason: 'incorrect_password' } as const);
    }

    const { alreadyUnlocked } = await unlockStationInTransaction({
      tx,
      uid,
      huntId: input.huntId,
      stationId: input.stationId,
      huntData,
    });

    tx.set(eventRef, {
      type: 'unlock_password',
      at: FieldValue.serverTimestamp(),
      alreadyUnlocked,
    });

    return withServerNow({ ok: true, stationId: input.stationId, alreadyUnlocked } as const);
  });
}
