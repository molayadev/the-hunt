// Grants admin-app access to a Firebase Auth user by writing admins/{uid}.
// Usage: node scripts/grant-admin.mjs <uid> <email>
//
// Locally, create the user first via the Auth emulator UI
// (http://127.0.0.1:4000/auth → Add user), then run this with their uid.
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const [, , uid, email] = process.argv;
if (!uid || !email) {
  console.error('Usage: node scripts/grant-admin.mjs <uid> <email>');
  process.exit(1);
}

const EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080';
const PROJECT_ID = process.env.GCLOUD_PROJECT ?? 'demo-rastro';
process.env.FIRESTORE_EMULATOR_HOST = EMULATOR_HOST;
process.env.GCLOUD_PROJECT = PROJECT_ID;

const app = getApps()[0] ?? initializeApp({ projectId: PROJECT_ID });
const db = getFirestore(app);

await db.doc(`admins/${uid}`).set({ email, addedAt: new Date().toISOString() });
console.log(`Granted admin access to ${email} (${uid}).`);
