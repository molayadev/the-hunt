import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

let testEnv: RulesTestEnvironment;

const PLAYER_UID = 'player-1';
const OTHER_UID = 'player-2';
const HUNT_ID = 'hunt-1';
const STATION_ID = 'station-1';

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-rastro',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, `hunts/${HUNT_ID}`), {
      title: 'Cumpleaños de prueba',
      status: 'live',
      stationCount: 12,
    });
    await setDoc(doc(db, `hunts/${HUNT_ID}/stations/${STATION_ID}`), {
      order: 1,
      title: 'La torre',
      clue: 'Busca donde el reloj marca las horas',
      challenge: { type: 'text', question: '¿Qué edificio es?' },
    });
    await setDoc(doc(db, `qrTokens/qr-1`), {
      huntId: HUNT_ID,
      stationId: STATION_ID,
      active: true,
      channel: 'physical',
      redeemCount: 0,
    });
    await setDoc(doc(db, `progress/${PLAYER_UID}_${HUNT_ID}`), {
      uid: PLAYER_UID,
      huntId: HUNT_ID,
      solvedCount: 0,
      totalCount: 12,
      completionPct: 0,
    });
    await setDoc(doc(db, `progress/${PLAYER_UID}_${HUNT_ID}/cards/${STATION_ID}`), {
      order: 1,
      title: 'La torre',
      clue: 'Busca donde el reloj marca las horas',
      challenge: { type: 'text', question: '¿Qué edificio es?' },
      state: 'unlocked',
    });
  });
});

const playerDb = () => testEnv.authenticatedContext(PLAYER_UID).firestore();

describe('hunts/{huntId}/stations', () => {
  it('an authenticated player cannot get a station', async () => {
    await assertFails(getDoc(doc(playerDb(), `hunts/${HUNT_ID}/stations/${STATION_ID}`)));
  });

  it('an authenticated player cannot list the stations', async () => {
    await assertFails(getDocs(collection(playerDb(), `hunts/${HUNT_ID}/stations`)));
  });
});

describe('hunts/{huntId}', () => {
  it('the hunt document exposes no field with the list of station IDs', async () => {
    const snapshot = await assertSucceeds(getDoc(doc(playerDb(), `hunts/${HUNT_ID}`)));
    const data = snapshot.data();
    expect(data).toBeDefined();
    expect(data).not.toHaveProperty('stationIds');
    expect(data).toHaveProperty('stationCount');
  });
});

describe('qrTokens/{token}', () => {
  it('no one can read a qrToken, not even an authenticated player', async () => {
    await assertFails(getDoc(doc(playerDb(), 'qrTokens/qr-1')));
  });
});

describe('progress/{progressId}', () => {
  it("a player cannot read another player's progress", async () => {
    await assertFails(getDoc(doc(playerDb(), `progress/${OTHER_UID}_${HUNT_ID}`)));
  });

  it('a player cannot write their own completionPct or recentFailures', async () => {
    await assertFails(
      updateDoc(doc(playerDb(), `progress/${PLAYER_UID}_${HUNT_ID}`), { completionPct: 100 }),
    );
    await assertFails(
      updateDoc(doc(playerDb(), `progress/${PLAYER_UID}_${HUNT_ID}`), {
        recentFailures: [Date.now()],
      }),
    );
  });

  it('a player can read their own cards', async () => {
    await assertSucceeds(
      getDoc(doc(playerDb(), `progress/${PLAYER_UID}_${HUNT_ID}/cards/${STATION_ID}`)),
    );
  });

  it('a card in the unlocked state contains no field with the answer', async () => {
    const snapshot = await assertSucceeds(
      getDoc(doc(playerDb(), `progress/${PLAYER_UID}_${HUNT_ID}/cards/${STATION_ID}`)),
    );
    const data = snapshot.data();
    expect(data).toBeDefined();
    expect(data).not.toHaveProperty('answer');
    expect(data?.challenge).not.toHaveProperty('acceptedAnswers');
    expect(data?.challenge).not.toHaveProperty('correctOptionId');
  });
});
