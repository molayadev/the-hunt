import { expect, test } from '@playwright/test';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

declare global {
  interface Window {
    __rastroTestBridge?: { getUid: () => string | null };
  }
}

const EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080';
const PROJECT_ID = process.env.GCLOUD_PROJECT ?? 'demo-rastro';
process.env.FIRESTORE_EMULATOR_HOST = EMULATOR_HOST;
process.env.GCLOUD_PROJECT = PROJECT_ID;

const adminApp = getApps()[0] ?? initializeApp({ projectId: PROJECT_ID });
const db = getFirestore(adminApp);

const HUNT_ID = 'e2e-hunt';
const JOIN_CODE = 'E2ECODE';
const STATION_A = 'e2e-station-a';
const STATION_B = 'e2e-station-b';
const STATION_C = 'e2e-station-c';

async function clearEmulatorFirestore() {
  const response = await fetch(
    `http://${EMULATOR_HOST}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
    { method: 'DELETE' },
  );
  if (!response.ok)
    throw new Error(`Failed to clear the Firestore emulator: ${String(response.status)}`);
}

async function seedHunt() {
  await db.doc(`hunts/${HUNT_ID}`).set({
    title: 'Ruta E2E',
    status: 'live',
    visibility: 'code',
    joinCode: JOIN_CODE,
    stationCount: 3,
    attemptPolicy: { maxAttempts: 3, windowHours: 1, scope: 'station' },
  });

  const stations = [
    { id: STATION_A, order: 1, title: 'Estación A', clue: 'Primera pista' },
    { id: STATION_B, order: 2, title: 'Estación B', clue: 'Segunda pista' },
    { id: STATION_C, order: 3, title: 'Estación C', clue: 'Tercera pista' },
  ];
  for (const station of stations) {
    await db.doc(`hunts/${HUNT_ID}/stations/${station.id}`).set({
      order: station.order,
      title: station.title,
      clue: station.clue,
      challenge: { type: 'text', question: '¿Cuál es la respuesta?' },
      prize: { kind: 'digital', title: `Premio de ${station.title}` },
    });
  }
  await db.doc(`hunts/${HUNT_ID}/stations/${STATION_B}/secret/answer`).set({
    acceptedAnswers: ['respuesta correcta'],
  });
}

async function seedUnlockedStation(uid: string) {
  const progressId = `${uid}_${HUNT_ID}`;
  await db.doc(`progress/${progressId}`).set({
    uid,
    huntId: HUNT_ID,
    solvedStationIds: [],
    unlockedStationIds: [STATION_B],
    revealedStationIds: [],
    solvedCount: 0,
    totalCount: 3,
    completionPct: 0,
  });
  await db.doc(`progress/${progressId}/cards/${STATION_B}`).set({
    order: 2,
    title: 'Estación B',
    clue: 'Segunda pista',
    challenge: { type: 'text', question: '¿Cuál es la respuesta?' },
    state: 'unlocked',
    recentFailures: [],
  });
}

test.describe('scan → solve → unlock happy path', () => {
  test.beforeEach(async () => {
    await clearEmulatorFirestore();
    await seedHunt();
  });

  test('joining, then solving a station (simulating an already-scanned QR) reveals its neighbours and shows the prize', async ({
    page,
  }) => {
    await page.goto('/join');
    await page.getByLabel('Código de la ruta').fill(JOIN_CODE);
    await page.getByRole('button', { name: 'Unirse' }).click();

    await expect(page).toHaveURL(new RegExp(`/h/${HUNT_ID}$`));

    const uid = await page.waitForFunction(() => window.__rastroTestBridge?.getUid() ?? null, {
      timeout: 10_000,
    });
    const resolvedUid = await uid.jsonValue();
    expect(resolvedUid).toBeTruthy();
    if (!resolvedUid) throw new Error('unreachable: asserted above');

    // Simulates having already scanned station B's QR code: the camera
    // itself can't be driven in CI, so this seeds the same Firestore state
    // redeemQr would have written, and the rest of the flow runs for real.
    await seedUnlockedStation(resolvedUid);

    await page.goto(`/h/${HUNT_ID}/s/${STATION_B}`);
    await expect(page.getByRole('heading', { name: 'Estación B' })).toBeVisible();
    await expect(page.getByText('Segunda pista')).toBeVisible();

    await page.getByLabel('Tu respuesta').fill('¡Respuesta Correcta!');
    await page.getByRole('button', { name: 'Comprobar' }).click();

    await expect(page.getByText(/¡Resuelta!/)).toBeVisible();
    await expect(page.getByText('Premio de Estación B')).toBeVisible();

    await page.goto(`/h/${HUNT_ID}`);
    await expect(page.getByText('1 de 3 · 33%')).toBeVisible();
    await expect(page.getByText('Estación A')).toBeVisible();
    await expect(page.getByText('Estación C')).toBeVisible();
  });
});
