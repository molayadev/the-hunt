import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { isCorrectAnswer } from '../domain/answer/normalize';
import type { AttemptPolicy } from '../domain/attempts/window';
import { attemptsLeft, retryAt, trimFailures } from '../domain/attempts/window';
import type { SubmitAnswerInput, SubmitAnswerResult } from '../domain/callables';
import type { ProgressState } from '../domain/progress/reducer';
import { applySolve, completionPct, emptyProgress } from '../domain/progress/reducer';
import { withServerNow } from '../lib/envelope';
import { db } from '../lib/firestore';
import type { CardDoc, HuntDoc, ProgressDoc, StationAnswerDoc, StationDoc } from '../lib/schema';

const toIso = (at: number | null): string | null =>
  at === null ? null : new Date(at).toISOString();

// Igual que en redeemQr: el evento usa clientRequestId como ID de documento,
// y guarda el resultado ya calculado bajo `result` para poder devolverlo tal
// cual en un reintento sin volver a tocar el saldo de intentos (test 41).
export async function submitAnswerHandler(
  input: SubmitAnswerInput,
  uid: string,
): Promise<SubmitAnswerResult> {
  const progressId = `${uid}_${input.huntId}`;
  const progressRef = db.doc(`progress/${progressId}`);
  const cardRef = db.doc(`progress/${progressId}/cards/${input.stationId}`);
  const eventRef = db.doc(`progress/${progressId}/events/${input.clientRequestId}`);
  const huntRef = db.doc(`hunts/${input.huntId}`);
  const stationRef = db.doc(`hunts/${input.huntId}/stations/${input.stationId}`);
  const answerRef = db.doc(`hunts/${input.huntId}/stations/${input.stationId}/secret/answer`);

  return db.runTransaction(async (tx) => {
    const [eventSnap, cardSnap, huntSnap, progressSnap] = await Promise.all([
      tx.get(eventRef),
      tx.get(cardRef),
      tx.get(huntRef),
      tx.get(progressRef),
    ]);

    if (eventSnap.exists) {
      return (eventSnap.data() as { result: SubmitAnswerResult }).result;
    }

    if (!cardSnap.exists || (cardSnap.data() as CardDoc).state !== 'unlocked') {
      throw new HttpsError('permission-denied', 'La estación no está desbloqueada.');
    }

    const hunt = huntSnap.data() as HuntDoc;
    const policy: AttemptPolicy = {
      maxAttempts: hunt.attemptPolicy.maxAttempts,
      windowMs: hunt.attemptPolicy.windowHours * 60 * 60 * 1000,
    };
    const scope = hunt.attemptPolicy.scope;
    const card = cardSnap.data() as CardDoc;
    const progress = progressSnap.exists ? (progressSnap.data() as ProgressDoc) : undefined;
    const failures = scope === 'hunt' ? (progress?.recentFailures ?? []) : card.recentFailures;

    const now = Date.now();

    if (attemptsLeft(failures, now, policy) === 0) {
      // Rechazo puro: la petición no llega a procesarse, así que no hay
      // nada que hacer idempotente ni ningún fallo nuevo que registrar
      // (PLAN.md §5.3, tests 40-41). Por eso lanza en vez de devolver un
      // resultado — a diferencia de una respuesta incorrecta, que sí cuenta.
      throw new HttpsError('resource-exhausted', 'Sin intentos disponibles.', {
        retryAt: toIso(retryAt(failures, now, policy)),
      });
    }

    const answerSnap = await tx.get(answerRef);
    const secret = answerSnap.data() as StationAnswerDoc;
    const correct =
      input.answer.kind === 'option'
        ? input.answer.optionId === secret.correctOptionId
        : isCorrectAnswer(input.answer.value, secret.acceptedAnswers ?? []);

    if (!correct) {
      const newFailures = trimFailures([...failures, now], policy);
      tx.update(cardRef, { recentFailures: newFailures });
      if (scope === 'hunt') {
        tx.set(progressRef, { recentFailures: newFailures }, { merge: true });
      }
      const result = withServerNow({
        ok: false,
        solved: false,
        attemptsLeft: attemptsLeft(newFailures, now, policy),
        retryAt: toIso(retryAt(newFailures, now, policy)),
      } as const);
      tx.set(eventRef, { type: 'answer', at: FieldValue.serverTimestamp(), result });
      return result;
    }

    const stationsSnap = await tx.get(
      db.collection(`hunts/${input.huntId}/stations`).orderBy('order'),
    );
    const orderedStationIds = stationsSnap.docs.map((d) => d.id);

    const currentState: ProgressState = progress
      ? {
          solvedStationIds: progress.solvedStationIds,
          unlockedStationIds: progress.unlockedStationIds,
          revealedStationIds: progress.revealedStationIds,
          completedAt: progress.completedAt ?? null,
        }
      : emptyProgress;

    const nextState = applySolve(
      currentState,
      { type: 'solve', stationId: input.stationId },
      orderedStationIds,
      hunt.stationCount,
      now,
    );
    const newlyRevealed = nextState.revealedStationIds.filter(
      (id) => !currentState.revealedStationIds.includes(id),
    );
    const pct = completionPct(nextState, hunt.stationCount);

    const stationSnap = await tx.get(stationRef);
    const station = stationSnap.data() as StationDoc;

    tx.set(
      progressRef,
      {
        uid,
        huntId: input.huntId,
        solvedStationIds: nextState.solvedStationIds,
        unlockedStationIds: nextState.unlockedStationIds,
        revealedStationIds: nextState.revealedStationIds,
        solvedCount: nextState.solvedStationIds.length,
        totalCount: hunt.stationCount,
        completionPct: pct,
        ...(nextState.completedAt !== null ? { completedAt: nextState.completedAt } : {}),
        lastActivityAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    tx.update(cardRef, { state: 'solved', prize: station.prize });

    const result = withServerNow({
      ok: true,
      solved: true,
      prize: station.prize,
      revealed: newlyRevealed,
      completionPct: pct,
    } as const);
    tx.set(eventRef, { type: 'answer', at: FieldValue.serverTimestamp(), result });
    return result;
  });
}
