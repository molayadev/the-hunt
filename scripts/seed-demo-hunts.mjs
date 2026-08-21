// Seeds two playable demo hunts into the Firestore emulator, since there is
// no route-creation app yet to produce real ones. Run with the emulators up
// (`npm run emulators` in another terminal), then `npm run seed:demo`. See
// the README for the join codes, stations and answers this writes.
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080';
const PROJECT_ID = process.env.GCLOUD_PROJECT ?? 'demo-rastro';
process.env.FIRESTORE_EMULATOR_HOST = EMULATOR_HOST;
process.env.GCLOUD_PROJECT = PROJECT_ID;

const app = getApps()[0] ?? initializeApp({ projectId: PROJECT_ID });
const db = getFirestore(app);

const HUNTS = [
  {
    id: 'demo-parque',
    joinCode: 'PARQUE2026',
    title: 'Ruta del Parque',
    tagline: 'Un paseo por el parque en busca de cuatro secretos escondidos.',
    language: 'es',
    stations: [
      {
        id: 'fuente',
        order: 1,
        title: 'La Fuente',
        clue: 'Busca el punto donde el agua nunca deja de moverse.',
        challenge: { type: 'text', question: '¿Qué forma tiene la fuente?' },
        acceptedAnswers: ['circular', 'redonda'],
        prize: {
          kind: 'digital',
          title: 'Pista secreta',
          payload: 'https://example.com/pista-secreta',
        },
      },
      {
        id: 'roble',
        order: 2,
        title: 'El Roble Viejo',
        clue: 'El árbol más alto del parque guarda un secreto en su base.',
        challenge: {
          type: 'single_option',
          question: '¿De qué color es la placa que hay en el tronco?',
          options: [
            { id: 'a', kind: 'text', text: 'Roja' },
            { id: 'b', kind: 'text', text: 'Verde' },
            { id: 'c', kind: 'text', text: 'Azul' },
          ],
        },
        correctOptionId: 'b',
        prize: {
          kind: 'physical',
          title: 'Pegatina de hoja',
          redeemInstructions: 'Muestra la pantalla al organizador junto al roble.',
        },
      },
      {
        id: 'quiosco',
        order: 3,
        title: 'El Quiosco',
        clue: 'Donde suena la música los domingos.',
        challenge: { type: 'text', question: '¿Qué día suena la música en el quiosco?' },
        acceptedAnswers: ['domingo', 'domingos'],
        prize: {
          kind: 'digital',
          title: 'Cupón de helado',
          payload: 'https://example.com/cupon-helado',
        },
      },
      {
        id: 'estatua',
        order: 4,
        title: 'La Estatua',
        clue: 'Mira a quien vigila la entrada principal.',
        challenge: {
          type: 'multiple_option',
          question: '¿Qué lleva la estatua encima?',
          options: [
            { id: 'libro', kind: 'text', text: 'Un libro' },
            { id: 'espada', kind: 'text', text: 'Una espada' },
            { id: 'escudo', kind: 'text', text: 'Un escudo' },
            { id: 'corona', kind: 'text', text: 'Una corona' },
          ],
        },
        correctOptionIds: ['libro', 'espada'],
        prize: {
          kind: 'physical',
          title: 'Medalla de bronce',
          redeemInstructions: 'https://maps.app.goo.gl/exampleParkGift',
        },
      },
    ],
  },
  {
    id: 'demo-city',
    joinCode: 'CITYTRAIL',
    title: 'City Trail',
    tagline: 'A short walk through downtown landmarks, three stops, three secrets.',
    language: 'en',
    stations: [
      {
        id: 'clocktower',
        order: 1,
        title: 'Old Clock Tower',
        clue: 'Time never stops here.',
        challenge: { type: 'text', question: 'How many clock faces does the tower have?' },
        acceptedAnswers: ['four', '4'],
        prize: {
          kind: 'digital',
          title: 'Bonus riddle',
          payload: 'https://example.com/bonus-riddle',
        },
      },
      {
        id: 'market',
        order: 2,
        title: 'Market Square',
        clue: 'Where the town has traded for centuries.',
        challenge: {
          type: 'multiple_choice',
          question: 'What is sold every Saturday morning?',
          options: [
            { id: 'a', text: 'Flowers' },
            { id: 'b', text: 'Fish' },
            { id: 'c', text: 'Books' },
          ],
        },
        correctOptionId: 'a',
        prize: {
          kind: 'physical',
          title: 'Postcard',
          redeemInstructions: 'Show this screen to the market info booth.',
        },
      },
      {
        id: 'bridge',
        order: 3,
        title: 'Riverside Bridge',
        clue: 'Cross the water to find the last clue.',
        challenge: { type: 'text', question: 'How many arches does the bridge have?' },
        acceptedAnswers: ['three', '3'],
        prize: {
          kind: 'physical',
          title: 'Keychain',
          redeemInstructions: 'https://maps.app.goo.gl/exampleBridgeGift',
        },
      },
    ],
  },
];

async function seedHunt(hunt) {
  await db.doc(`hunts/${hunt.id}`).set({
    title: hunt.title,
    tagline: hunt.tagline,
    status: 'live',
    visibility: 'code',
    joinCode: hunt.joinCode,
    stationCount: hunt.stations.length,
    attemptPolicy: { maxAttempts: 3, windowHours: 24, scope: 'station' },
    language: hunt.language,
    createdBy: 'seed-script',
  });

  for (const station of hunt.stations) {
    await db.doc(`hunts/${hunt.id}/stations/${station.id}`).set({
      order: station.order,
      title: station.title,
      clue: station.clue,
      challenge: station.challenge,
      prize: station.prize,
    });

    if (station.acceptedAnswers) {
      await db.doc(`hunts/${hunt.id}/stations/${station.id}/secret/answer`).set({
        acceptedAnswers: station.acceptedAnswers,
      });
    }
    if (station.correctOptionId) {
      await db.doc(`hunts/${hunt.id}/stations/${station.id}/secret/answer`).set({
        correctOptionId: station.correctOptionId,
      });
    }
    if (station.correctOptionIds) {
      await db.doc(`hunts/${hunt.id}/stations/${station.id}/secret/answer`).set({
        correctOptionIds: station.correctOptionIds,
      });
    }

    const token = `${hunt.id}-${station.id}`;
    await db.doc(`qrTokens/${token}`).set({
      huntId: hunt.id,
      stationId: station.id,
      active: true,
      channel: 'physical',
      redeemCount: 0,
    });
  }
}

for (const hunt of HUNTS) {
  await seedHunt(hunt);
  const tokens = hunt.stations.map((s) => `${hunt.id}-${s.id}`).join(', ');
  console.log(`Seeded "${hunt.title}" — join code ${hunt.joinCode} — tokens: ${tokens}`);
}
console.log('Done.');
