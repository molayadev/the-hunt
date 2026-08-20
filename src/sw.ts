/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

// Firebase Messaging (onBackgroundMessage) se añade en la fase de
// notificaciones (ver PLAN.md §10.1 y Fase 4 del roadmap) — un único SW
// evita dos service workers compitiendo por el mismo scope.
