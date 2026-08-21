import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../lib/firestore';
import { clearFirestoreEmulator } from '../test/emulator';
import { unlockWithPasswordHandler } from './unlockWithPassword';

const UID = 'player-1';
const HUNT_ID = 'hunt-1';
const STATION_ID = 'station-2';

beforeEach(async () => {
  await clearFirestoreEmulator();
});

async function seedHunt(visibility: 'public' | 'code' = 'public') {
  await db.doc(`hunts/${HUNT_ID}`).set({
    title: 'Cumpleaños de prueba',
    status: 'live',
    visibility,
    stationCount: 3,
    attemptPolicy: { maxAttempts: 3, windowHours: 24, scope: 'station' },
  });
  await db.doc(`hunts/${HUNT_ID}/stations/${STATION_ID}`).set({
    order: 2,
    title: 'El faro',
    clue: 'Busca la palabra grabada en la piedra.',
    challenge: { type: 'text', question: '¿Qué animal aparece en el escudo?' },
    prize: { kind: 'digital', title: 'Pista extra' },
    unlock: 'password',
  });
  await db.doc(`hunts/${HUNT_ID}/stations/${STATION_ID}/secret/answer`).set({
    acceptedAnswers: ['gaviota'],
    acceptedPasswords: ['faro2026'],
  });
}

describe('unlockWithPasswordHandler', () => {
  it('an incorrect password returns incorrect_password and writes nothing', async () => {
    await seedHunt();

    const result = await unlockWithPasswordHandler(
      { huntId: HUNT_ID, stationId: STATION_ID, password: 'wrong', clientRequestId: randomUUID() },
      UID,
    );
    expect(result).toMatchObject({ ok: false, reason: 'incorrect_password' });

    const card = await db.doc(`progress/${UID}_${HUNT_ID}/cards/${STATION_ID}`).get();
    expect(card.exists).toBe(false);
  });

  it('a correct password (case/accent insensitive) unlocks the station', async () => {
    await seedHunt();

    const result = await unlockWithPasswordHandler(
      {
        huntId: HUNT_ID,
        stationId: STATION_ID,
        password: '  FARO2026  ',
        clientRequestId: randomUUID(),
      },
      UID,
    );
    expect(result).toMatchObject({ ok: true, stationId: STATION_ID, alreadyUnlocked: false });

    const card = await db.doc(`progress/${UID}_${HUNT_ID}/cards/${STATION_ID}`).get();
    expect(card.data()?.state).toBe('unlocked');
  });

  it('a hunt that is not live returns hunt_not_live', async () => {
    await seedHunt();
    await db.doc(`hunts/${HUNT_ID}`).update({ status: 'draft' });

    const result = await unlockWithPasswordHandler(
      {
        huntId: HUNT_ID,
        stationId: STATION_ID,
        password: 'faro2026',
        clientRequestId: randomUUID(),
      },
      UID,
    );
    expect(result).toMatchObject({ ok: false, reason: 'hunt_not_live' });
  });

  it('a private hunt the player never joined returns private_hunt', async () => {
    await seedHunt('code');

    const result = await unlockWithPasswordHandler(
      {
        huntId: HUNT_ID,
        stationId: STATION_ID,
        password: 'faro2026',
        clientRequestId: randomUUID(),
      },
      UID,
    );
    expect(result).toMatchObject({ ok: false, reason: 'private_hunt' });
  });

  it('a retry with the same clientRequestId returns the same response and unlocks once', async () => {
    await seedHunt();
    const clientRequestId = randomUUID();

    const first = await unlockWithPasswordHandler(
      { huntId: HUNT_ID, stationId: STATION_ID, password: 'faro2026', clientRequestId },
      UID,
    );
    const second = await unlockWithPasswordHandler(
      { huntId: HUNT_ID, stationId: STATION_ID, password: 'faro2026', clientRequestId },
      UID,
    );
    expect({ ...second, serverNow: undefined }).toEqual({ ...first, serverNow: undefined });

    const events = await db.collection(`progress/${UID}_${HUNT_ID}/events`).get();
    expect(events.size).toBe(1);
  });

  it('returns serverNow', async () => {
    await seedHunt();
    const result = await unlockWithPasswordHandler(
      {
        huntId: HUNT_ID,
        stationId: STATION_ID,
        password: 'faro2026',
        clientRequestId: randomUUID(),
      },
      UID,
    );
    expect(result.serverNow).toBeTypeOf('string');
    expect(Number.isNaN(Date.parse(result.serverNow))).toBe(false);
  });
});
