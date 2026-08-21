import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../lib/firestore';
import { clearFirestoreEmulator } from '../test/emulator';
import { redeemQrHandler } from './redeemQr';

const UID = 'player-1';
const HUNT_ID = 'hunt-1';
const STATION_ID = 'station-1';

beforeEach(async () => {
  await clearFirestoreEmulator();
});

async function seedLiveHuntWithToken(token: string, visibility: 'public' | 'code' = 'public') {
  await db.doc(`hunts/${HUNT_ID}`).set({
    title: 'Cumpleaños de prueba',
    status: 'live',
    visibility,
    stationCount: 12,
    attemptPolicy: { maxAttempts: 3, windowHours: 24, scope: 'station' },
  });
  await db.doc(`hunts/${HUNT_ID}/stations/${STATION_ID}`).set({
    order: 1,
    title: 'La torre',
    clue: 'Busca donde el reloj marca las horas',
    challenge: { type: 'text', question: '¿Qué edificio es?' },
    prize: { kind: 'digital', title: 'Pista extra' },
  });
  await db.doc(`qrTokens/${token}`).set({
    huntId: HUNT_ID,
    stationId: STATION_ID,
    active: true,
    channel: 'physical',
    redeemCount: 0,
  });
}

describe('redeemQrHandler', () => {
  it('a nonexistent token returns invalid_token and writes nothing', async () => {
    const result = await redeemQrHandler({ token: 'ghost', clientRequestId: randomUUID() }, UID);
    expect(result).toMatchObject({ ok: false, reason: 'invalid_token' });

    const progress = await db.doc(`progress/${UID}_${HUNT_ID}`).get();
    expect(progress.exists).toBe(false);
  });

  it('a token for a non-live hunt returns hunt_not_live', async () => {
    await seedLiveHuntWithToken('qr-draft');
    await db.doc(`hunts/${HUNT_ID}`).update({ status: 'draft' });

    const result = await redeemQrHandler({ token: 'qr-draft', clientRequestId: randomUUID() }, UID);
    expect(result).toMatchObject({ ok: false, reason: 'hunt_not_live' });
  });

  it('a valid token creates the card unlocked and records no failure', async () => {
    await seedLiveHuntWithToken('qr-1');

    const result = await redeemQrHandler({ token: 'qr-1', clientRequestId: randomUUID() }, UID);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected ok result');
    expect(result.stationId).toBe(STATION_ID);
    expect(result.alreadyUnlocked).toBe(false);

    const card = await db.doc(`progress/${UID}_${HUNT_ID}/cards/${STATION_ID}`).get();
    expect(card.exists).toBe(true);
    expect(card.data()?.state).toBe('unlocked');
    expect(card.data()?.recentFailures).toEqual([]);
  });

  it('a retry with the same clientRequestId returns the same response and a single unlock', async () => {
    await seedLiveHuntWithToken('qr-1');
    const clientRequestId = randomUUID();

    const first = await redeemQrHandler({ token: 'qr-1', clientRequestId }, UID);
    const second = await redeemQrHandler({ token: 'qr-1', clientRequestId }, UID);
    expect({ ...second, serverNow: undefined }).toEqual({ ...first, serverNow: undefined });

    const tokenAfter = await db.doc('qrTokens/qr-1').get();
    expect(tokenAfter.data()?.redeemCount).toBe(1);

    const events = await db.collection(`progress/${UID}_${HUNT_ID}/events`).get();
    expect(events.size).toBe(1);
  });

  it('returns serverNow', async () => {
    await seedLiveHuntWithToken('qr-1');
    const result = await redeemQrHandler({ token: 'qr-1', clientRequestId: randomUUID() }, UID);
    expect(result.serverNow).toBeTypeOf('string');
    expect(Number.isNaN(Date.parse(result.serverNow))).toBe(false);
  });

  it('a token for a private hunt the player has never joined returns private_hunt', async () => {
    await seedLiveHuntWithToken('qr-private', 'code');

    const result = await redeemQrHandler(
      { token: 'qr-private', clientRequestId: randomUUID() },
      UID,
    );
    expect(result).toMatchObject({ ok: false, reason: 'private_hunt' });

    const card = await db.doc(`progress/${UID}_${HUNT_ID}/cards/${STATION_ID}`).get();
    expect(card.exists).toBe(false);
  });

  it('a token for a private hunt the player already joined still unlocks the station', async () => {
    await seedLiveHuntWithToken('qr-private', 'code');
    await db.doc(`progress/${UID}_${HUNT_ID}`).set({
      uid: UID,
      huntId: HUNT_ID,
      solvedStationIds: [],
      unlockedStationIds: [],
      revealedStationIds: [],
      solvedCount: 0,
      totalCount: 12,
      completionPct: 0,
    });

    const result = await redeemQrHandler(
      { token: 'qr-private', clientRequestId: randomUUID() },
      UID,
    );
    expect(result).toMatchObject({ ok: true, stationId: STATION_ID });
  });

  it('a token for a public hunt the player has never joined unlocks it directly', async () => {
    await seedLiveHuntWithToken('qr-public', 'public');

    const result = await redeemQrHandler(
      { token: 'qr-public', clientRequestId: randomUUID() },
      UID,
    );
    expect(result).toMatchObject({ ok: true, stationId: STATION_ID });
  });
});
