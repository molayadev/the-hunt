/// <reference lib="webworker" />
import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';
import { precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'demo-rastro.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'demo-rastro',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'demo-rastro.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '0',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:0:web:0',
};

const messaging = getMessaging(initializeApp(firebaseConfig));

onBackgroundMessage(messaging, (payload) => {
  const title = payload.notification?.title ?? 'Rastro';
  const body = payload.notification?.body;
  void self.registration.showNotification(title, {
    icon: '/icons/icon-192.png',
    ...(body !== undefined && { body }),
  });
});
