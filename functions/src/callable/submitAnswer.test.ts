import { randomUUID } from 'node:crypto';
import { HttpsError } from 'firebase-functions/v2/https';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../lib/firestore';
import { clearFirestoreEmulator } from '../test/emulator';
import { submitAnswerHandler } from './submitAnswer';

const UID = 'player-1';
const HUNT_ID = 'hunt-1';
const STATION_ID = 'station-5';
const NEXT_STATION_ID = 'station-6';
const PREV_STATION_ID = 'station-4';

beforeEach(async () => {
  await clearFirestoreEmulator();
});

async function seedHunt(
  overrides: { maxAttempts?: number; windowHours?: number; scope?: 'station' | 'hunt' } = {},
) {
  await db.doc(`hunts/${HUNT_ID}`).set({
    title: 'Cumpleaños de prueba',
    status: 'live',
    stationCount: 3,
    attemptPolicy: {
      maxAttempts: overrides.maxAttempts ?? 3,
      windowHours: overrides.windowHours ?? 24,
      scope: overrides.scope ?? 'station',
    },
  });

  const stations = [
    { id: PREV_STATION_ID, order: 4 },
    { id: STATION_ID, order: 5 },
    { id: NEXT_STATION_ID, order: 6 },
  ];
  for (const s of stations) {
    await db.doc(`hunts/${HUNT_ID}/stations/${s.id}`).set({
      order: s.order,
      title: `Estación ${String(s.order)}`,
      clue: `Pista de la estación ${String(s.order)}`,
      challenge: { type: 'text', question: '¿Qué edificio es?' },
      prize: { kind: 'digital', title: 'Premio digital' },
    });
  }
  await db.doc(`hunts/${HUNT_ID}/stations/${STATION_ID}/secret/answer`).set({
    acceptedAnswers: ['la torre', 'torre'],
  });

  await db.doc(`progress/${UID}_${HUNT_ID}/cards/${STATION_ID}`).set({
    order: 5,
    title: 'Estación 5',
    clue: 'Pista de la estación 5',
    challenge: { type: 'text', question: '¿Qué edificio es?' },
    state: 'unlocked',
    recentFailures: [],
  });
}

const submit = (value: string, clientRequestId = randomUUID()) =>
  submitAnswerHandler(
    { huntId: HUNT_ID, stationId: STATION_ID, answer: { kind: 'text', value }, clientRequestId },
    UID,
  );

describe('submitAnswerHandler', () => {
  it('a correct answer solves the station, issues the prize, reveals neighbours and recalculates progress', async () => {
    await seedHunt();
    const result = await submit('la torre');
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected ok result');
    expect(result.solved).toBe(true);
    expect(result.prize).toEqual({ kind: 'digital', title: 'Premio digital' });
    expect(new Set(result.revealed)).toEqual(new Set([PREV_STATION_ID, NEXT_STATION_ID]));
    expect(result.completionPct).toBe(33);

    const card = await db.doc(`progress/${UID}_${HUNT_ID}/cards/${STATION_ID}`).get();
    expect(card.data()?.state).toBe('solved');

    const progress = await db.doc(`progress/${UID}_${HUNT_ID}`).get();
    expect(progress.data()?.solvedStationIds).toEqual([STATION_ID]);
    expect(new Set(progress.data()?.revealedStationIds as string[])).toEqual(
      new Set([PREV_STATION_ID, NEXT_STATION_ID]),
    );
  });

  it('a correct answer writes revealed cards for newly revealed neighbours, with clue but no challenge', async () => {
    await seedHunt();
    await submit('la torre');

    const nextCard = await db.doc(`progress/${UID}_${HUNT_ID}/cards/${NEXT_STATION_ID}`).get();
    expect(nextCard.data()).toEqual({
      order: 6,
      title: 'Estación 6',
      clue: 'Pista de la estación 6',
      state: 'revealed',
      unlock: 'qr',
    });

    const prevCard = await db.doc(`progress/${UID}_${HUNT_ID}/cards/${PREV_STATION_ID}`).get();
    expect(prevCard.data()).toEqual({
      order: 4,
      title: 'Estación 4',
      clue: 'Pista de la estación 4',
      state: 'revealed',
      unlock: 'qr',
    });
  });

  it('a neighbour with unlock: "none" skips revealed and unlocks straight away', async () => {
    await seedHunt();
    await db.doc(`hunts/${HUNT_ID}/stations/${NEXT_STATION_ID}`).update({ unlock: 'none' });

    await submit('la torre');

    const nextCard = await db.doc(`progress/${UID}_${HUNT_ID}/cards/${NEXT_STATION_ID}`).get();
    expect(nextCard.data()).toMatchObject({
      state: 'unlocked',
      challenge: { type: 'text', question: '¿Qué edificio es?' },
      recentFailures: [],
    });

    const progress = await db.doc(`progress/${UID}_${HUNT_ID}`).get();
    expect(progress.data()?.unlockedStationIds).toContain(NEXT_STATION_ID);
  });

  it('a revealed neighbour carries its location when the station has one', async () => {
    await seedHunt();
    await db.doc(`hunts/${HUNT_ID}/stations/${NEXT_STATION_ID}`).update({
      location: { mapsUrl: 'https://maps.example/x', hint: 'Bajo el reloj' },
    });

    await submit('la torre');

    const nextCard = await db.doc(`progress/${UID}_${HUNT_ID}/cards/${NEXT_STATION_ID}`).get();
    expect(nextCard.data()?.location).toEqual({
      mapsUrl: 'https://maps.example/x',
      hint: 'Bajo el reloj',
    });
  });

  it('does not downgrade an already unlocked neighbour card back to revealed', async () => {
    await seedHunt();
    await db.doc(`progress/${UID}_${HUNT_ID}/cards/${NEXT_STATION_ID}`).set({
      order: 6,
      title: 'Estación 6',
      clue: 'Pista de la estación 6',
      challenge: { type: 'text', question: '¿Qué edificio es?' },
      state: 'unlocked',
      recentFailures: [],
    });

    await submit('la torre');

    const nextCard = await db.doc(`progress/${UID}_${HUNT_ID}/cards/${NEXT_STATION_ID}`).get();
    expect(nextCard.data()?.state).toBe('unlocked');
  });

  it('a correct answer with different capitalization and accents is valid', async () => {
    await seedHunt();
    const result = await submit('¡LA TÓRRE!');
    expect(result.ok).toBe(true);
  });

  it('an incorrect answer records a failure, reveals nothing and never leaks the correct answer', async () => {
    await seedHunt();
    const result = await submit('el ayuntamiento');
    expect(result).toMatchObject({ ok: false, solved: false });
    expect(JSON.stringify(result)).not.toContain('torre');

    const card = await db.doc(`progress/${UID}_${HUNT_ID}/cards/${STATION_ID}`).get();
    expect(card.data()?.recentFailures).toHaveLength(1);

    const progress = await db.doc(`progress/${UID}_${HUNT_ID}`).get();
    expect(progress.exists).toBe(false);
  });

  it('with no attempts left throws resource-exhausted with retryAt, without recording another failure', async () => {
    await seedHunt({ maxAttempts: 1 });
    await submit('mal 1');

    await expect(submit('mal 2')).rejects.toMatchObject({
      code: 'resource-exhausted',
    });

    const card = await db.doc(`progress/${UID}_${HUNT_ID}/cards/${STATION_ID}`).get();
    expect(card.data()?.recentFailures).toHaveLength(1);
  });

  it('the resource-exhausted error includes retryAt in its details', async () => {
    await seedHunt({ maxAttempts: 1 });
    await submit('mal 1');

    const error: unknown = await submit('mal 2').catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(HttpsError);
    const httpsError = error as HttpsError;
    expect(httpsError.code).toBe('resource-exhausted');
    expect(typeof (httpsError.details as { retryAt: string }).retryAt).toBe('string');
  });

  it('with the client clock skewed ahead, the server still rejects', async () => {
    await seedHunt({ maxAttempts: 1 });
    await submit('mal 1');

    await expect(submit('mal 2')).rejects.toMatchObject({ code: 'resource-exhausted' });
  });

  it('on a station that is not unlocked returns permission-denied', async () => {
    await seedHunt();
    await expect(
      submitAnswerHandler(
        {
          huntId: HUNT_ID,
          stationId: NEXT_STATION_ID,
          answer: { kind: 'text', value: 'lo que sea' },
          clientRequestId: randomUUID(),
        },
        UID,
      ),
    ).rejects.toMatchObject({ code: 'permission-denied' });
  });

  it('two concurrent submissions with 1 attempt left: only one is processed', async () => {
    await seedHunt({ maxAttempts: 1 });
    const results = await Promise.allSettled([submit('mal a'), submit('mal b')]);
    const card = await db.doc(`progress/${UID}_${HUNT_ID}/cards/${STATION_ID}`).get();
    expect(card.data()?.recentFailures).toHaveLength(1);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    expect(fulfilled.length).toBeGreaterThanOrEqual(1);
  });

  it('a retry with the same clientRequestId returns the same result without recording a new failure', async () => {
    await seedHunt();
    const clientRequestId = randomUUID();
    const first = await submit('mal', clientRequestId);
    const second = await submit('mal', clientRequestId);
    expect({ ...second, serverNow: undefined }).toEqual({ ...first, serverNow: undefined });

    const card = await db.doc(`progress/${UID}_${HUNT_ID}/cards/${STATION_ID}`).get();
    expect(card.data()?.recentFailures).toHaveLength(1);
  });

  it('every call returns serverNow', async () => {
    await seedHunt();
    const result = await submit('la torre');
    expect(result.serverNow).toBeTypeOf('string');
    expect(Number.isNaN(Date.parse(result.serverNow))).toBe(false);
  });
});
