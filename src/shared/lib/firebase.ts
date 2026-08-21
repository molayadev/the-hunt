import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';
import {
  collection,
  connectFirestoreEmulator,
  doc,
  getDocs,
  initializeFirestore,
  limit,
  onSnapshot,
  persistentLocalCache,
  persistentMultipleTabManager,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { isSupported as isMessagingSupported } from 'firebase/messaging';
import type { Unsubscribe } from 'firebase/messaging';

export { onAuthStateChanged, signInAnonymously, httpsCallable };
export { collection, doc, getDocs, limit, onSnapshot, query, serverTimestamp, setDoc, where };

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'demo-rastro.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'demo-rastro',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'demo-rastro.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '0',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:0:web:0',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
export const functions = getFunctions(app);

const useEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATORS !== 'false';

if (useEmulators && import.meta.env.DEV) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
}

// Uses register()/onRegistered() (Firebase Installation ID-based messaging), the
// documented replacement for the deprecated getToken() single-shot token API.
export async function registerForPush(
  onRegisteredId: (id: string) => void,
): Promise<Unsubscribe | null> {
  if (!(await isMessagingSupported())) return null;
  const { getMessaging, onRegistered, register } = await import('firebase/messaging');
  const messaging = getMessaging(app);
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  const unsubscribe = onRegistered(messaging, onRegisteredId);
  await register(messaging, vapidKey === undefined ? {} : { vapidKey });
  return unsubscribe;
}
