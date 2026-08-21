import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../lib/firestore';
import { clearFirestoreEmulator } from '../test/emulator';
import { startHuntHandler } from './startHunt';

const UID = 'player-1';
const HUNT_ID = 'hunt-1';
const FIRST_STATION_ID = 'station-1';
const SECOND_STATION_ID = 'station-2';

beforeEach(async () => {
  await clearFirestoreEmulator();
});

async function seedLiveHunt() {
  await db.doc(`hunts/${HUNT_ID}`).set({
    title: 'Cumpleaños de prueba',
    status: 'live',
    stationCount: 2,
    attemptPolicy: { maxAttempts: 3, windowHours: 24, scope: 'station' },
  });
  await db.doc(`hunts/${HUNT_ID}/stations/${SECOND_STATION_ID}`).set({
    order: 2,
    title: 'El parque',
    clue: 'Segunda pista',
    challenge: { type: 'text', question: '¿Segunda pregunta?' },
    prize: { kind: 'digital', title: 'Segundo premio' },
  });
  await db.doc(`hunts/${HUNT_ID}/stations/${FIRST_STATION_ID}`).set({
    order: 1,
    title: 'La torre',
    clue: 'Busca donde el reloj marca las horas',
    challenge: { type: 'text', question: '¿Qué edificio es?' },
    prize: { kind: 'digital', title: 'Pista extra' },
  });
}

describe('startHuntHandler', () => {
  it('a hunt that is not live returns hunt_not_live', async () => {
    await seedLiveHunt();
    await db.doc(`hunts/${HUNT_ID}`).update({ status: 'draft' });

    const result = await startHuntHandler({ huntId: HUNT_ID, clientRequestId: randomUUID() }, UID);
    expect(result).toMatchObject({ ok: false, reason: 'hunt_not_live' });
  });

  it('a hunt with no stations returns no_stations', async () => {
    await db.doc(`hunts/${HUNT_ID}`).set({
      title: 'Ruta vacía',
      status: 'live',
      stationCount: 0,
      attemptPolicy: { maxAttempts: 3, windowHours: 24, scope: 'station' },
    });

    const result = await startHuntHandler({ huntId: HUNT_ID, clientRequestId: randomUUID() }, UID);
    expect(result).toMatchObject({ ok: false, reason: 'no_stations' });
  });

  it('unlocks the lowest-order station regardless of seeding order', async () => {
    await seedLiveHunt();

    const result = await startHuntHandler({ huntId: HUNT_ID, clientRequestId: randomUUID() }, UID);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected ok result');
    expect(result.stationId).toBe(FIRST_STATION_ID);
    expect(result.alreadyUnlocked).toBe(false);

    const card = await db.doc(`progress/${UID}_${HUNT_ID}/cards/${FIRST_STATION_ID}`).get();
    expect(card.exists).toBe(true);
    expect(card.data()?.state).toBe('unlocked');

    const progress = await db.doc(`progress/${UID}_${HUNT_ID}`).get();
    expect(progress.data()?.unlockedStationIds).toEqual([FIRST_STATION_ID]);
    expect(progress.data()?.totalCount).toBe(2);
  });

  it('a retry with the same clientRequestId returns the same response and a single unlock', async () => {
    await seedLiveHunt();
    const clientRequestId = randomUUID();

    const first = await startHuntHandler({ huntId: HUNT_ID, clientRequestId }, UID);
    const second = await startHuntHandler({ huntId: HUNT_ID, clientRequestId }, UID);
    expect({ ...second, serverNow: undefined }).toEqual({ ...first, serverNow: undefined });

    const events = await db.collection(`progress/${UID}_${HUNT_ID}/events`).get();
    expect(events.size).toBe(1);
  });

  it('starting an already-started hunt again reports alreadyUnlocked without duplicating state', async () => {
    await seedLiveHunt();
    await startHuntHandler({ huntId: HUNT_ID, clientRequestId: randomUUID() }, UID);

    const result = await startHuntHandler({ huntId: HUNT_ID, clientRequestId: randomUUID() }, UID);
    expect(result).toMatchObject({ ok: true, stationId: FIRST_STATION_ID, alreadyUnlocked: true });

    const progress = await db.doc(`progress/${UID}_${HUNT_ID}`).get();
    expect(progress.data()?.unlockedStationIds).toEqual([FIRST_STATION_ID]);
  });

  it('returns serverNow', async () => {
    await seedLiveHunt();
    const result = await startHuntHandler({ huntId: HUNT_ID, clientRequestId: randomUUID() }, UID);
    expect(result.serverNow).toBeTypeOf('string');
    expect(Number.isNaN(Date.parse(result.serverNow))).toBe(false);
  });
});
