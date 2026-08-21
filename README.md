# Rastro

App de búsqueda del tesoro por QR. Ruta no lineal, progreso persistente, premios digitales y físicos.

Ver [PLAN.md](./PLAN.md) para el diseño técnico completo: modelo de dominio, reglas de negocio, seguridad y roadmap.

## Requisitos

- Node.js 22 (ver [.nvmrc](./.nvmrc))
- Java 11+ (lo pide el emulador de Firestore)

## Desarrollo local

El proyecto está pensado para funcionar completamente en local, sin ningún proyecto de Firebase real ni credenciales: usa el [Firebase Local Emulator Suite](https://firebase.google.com/docs/emulator-suite) con el proyecto de demostración `demo-rastro`.

```bash
npm install
npm run emulators   # terminal 1 — Auth, Firestore y Functions emulados
npm run dev          # terminal 2 — Vite en http://localhost:5173
```

El cliente (`src/shared/lib/firebase.ts`) se conecta automáticamente a los emuladores cuando `import.meta.env.DEV` es verdadero. No hace falta ningún fichero `.env` para desarrollar.

La UI de los emuladores queda en `http://127.0.0.1:4000`.

### Comandos útiles

| Comando                           | Qué hace                                                                                 |
| --------------------------------- | ---------------------------------------------------------------------------------------- |
| `npm run dev`                     | Servidor de desarrollo Vite                                                              |
| `npm run emulators`               | Firebase Auth + Firestore + Functions emulados                                           |
| `npm run build`                   | Build de producción (`tsc -b && vite build`)                                             |
| `npm run lint` / `npm run format` | ESLint / Prettier                                                                        |
| `npm run typecheck`               | `tsc -b --noEmit`                                                                        |
| `npm test`                        | Tests de dominio y componentes (Vitest)                                                  |
| `npm run test:rules`              | Tests de `firestore.rules` contra el emulador                                            |
| `npm run test:functions`          | Tests de Cloud Functions contra el emulador                                              |
| `npm run test:e2e`                | Playwright de extremo a extremo (necesita `npm run emulators` y `npm run dev` corriendo) |

## Variables de entorno (solo para build de producción)

Los emuladores no necesitan ninguna variable de entorno. Estas variables solo hacen falta para construir un build que apunte a un proyecto de Firebase **real** (despliegues, o `npm run dev` contra un proyecto real con `VITE_USE_FIREBASE_EMULATORS=false`):

| Variable                            | Descripción                                                                                         |
| ----------------------------------- | --------------------------------------------------------------------------------------------------- |
| `VITE_FIREBASE_API_KEY`             | Config del SDK web, panel de Firebase → Configuración del proyecto → Tus apps                       |
| `VITE_FIREBASE_AUTH_DOMAIN`         | ídem                                                                                                |
| `VITE_FIREBASE_PROJECT_ID`          | ID del proyecto de Firebase                                                                         |
| `VITE_FIREBASE_STORAGE_BUCKET`      | ídem                                                                                                |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ídem                                                                                                |
| `VITE_FIREBASE_APP_ID`              | ídem                                                                                                |
| `VITE_FIREBASE_VAPID_KEY`           | Opcional. Clave VAPID para notificaciones push (Firebase → Cloud Messaging → Certificados web push) |
| `VITE_USE_FIREBASE_EMULATORS`       | `false` para conectar a los servicios reales en vez de a los emuladores                             |

Estos valores del SDK web **no son secretos** (Firebase los expone públicamente por diseño; la seguridad real vive en `firestore.rules` y en App Check), así que basta con copiarlos del panel de Firebase a un `.env.local` (ignorado por git) para probar contra un proyecto real en local.

## Despliegue

Dos workflows en `.github/workflows/`:

- **`pr-deploy.yaml`** — en cada PR, construye el cliente y lo despliega a un [canal de vista previa](https://firebase.google.com/docs/hosting/test-preview-deploy) temporal de Firebase Hosting (expira en 7 días). Comenta la URL en el PR automáticamente. Solo despliega Hosting: Functions y Firestore rules siguen apuntando al proyecto real ya desplegado.
- **`main.yaml`** — en cada push a `main` (tras un merge), construye y despliega Hosting + Functions + Firestore rules/índices al proyecto de producción.

### Configurar el proyecto de Firebase

1. Crea un proyecto en la [consola de Firebase](https://console.firebase.google.com/).
2. Activa Authentication (método anónimo), Firestore y Functions (plan Blaze, necesario para Functions gen2).
3. Registra una app web y copia su configuración — son los valores `VITE_FIREBASE_*` de la tabla de arriba.
4. Crea una cuenta de servicio con los roles **Firebase Hosting Admin**, **Cloud Functions Admin**, **Cloud Datastore Owner** (o **Editor** del proyecto, más simple) y descarga su clave JSON: IAM y administración → Cuentas de servicio → Añadir clave.
5. (Recomendado, §4.2 del plan) Activa **App Check** con reCAPTCHA Enterprise para las callables.

### Secrets a configurar en GitHub

En _Settings → Secrets and variables → Actions_ del repositorio:

| Secret                              | Valor                                                            |
| ----------------------------------- | ---------------------------------------------------------------- |
| `FIREBASE_PROJECT_ID`               | El ID del proyecto de Firebase                                   |
| `FIREBASE_SERVICE_ACCOUNT`          | El contenido completo del JSON de la cuenta de servicio (paso 4) |
| `VITE_FIREBASE_API_KEY`             | De la config de la app web                                       |
| `VITE_FIREBASE_AUTH_DOMAIN`         | ídem                                                             |
| `VITE_FIREBASE_STORAGE_BUCKET`      | ídem                                                             |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ídem                                                             |
| `VITE_FIREBASE_APP_ID`              | ídem                                                             |

`GITHUB_TOKEN` no hace falta configurarlo: GitHub Actions lo provee automáticamente y `pr-deploy.yaml` lo usa para comentar la URL de la preview en el PR.

## Modelo de datos y contrato con la app de creación de rutas

Rastro (este repo) es solo el cliente jugador. Una **app hermana de creación de rutas**, aún no construida, escribe en la misma base de Firestore: crea `hunts/{huntId}`, sus `stations/{stationId}` (con la pista, el reto y la respuesta secreta) y los `qrTokens/{token}` que apuntan a cada estación. Cualquier cambio en las formas de estos documentos es, en la práctica, un cambio de API entre las dos apps — ver PLAN.md §3 y §13.8.

**Fuente de la verdad de los tipos** (no hay paquete `@rastro/schema` compartido todavía; sincronizar a mano contra estos ficheros):

| Colección                                           | Quién la escribe                                      | Forma del documento                                                                                                                    |
| --------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `hunts/{huntId}`                                    | App de creación (nunca el cliente jugador)            | [`HuntDoc`](functions/src/lib/schema.ts)                                                                                               |
| `hunts/{huntId}/stations/{stationId}`               | App de creación                                       | [`StationDoc`](functions/src/lib/schema.ts) — el cliente **nunca** puede leerlo directamente (`firestore.rules`)                       |
| `hunts/{huntId}/stations/{stationId}/secret/answer` | App de creación                                       | [`StationAnswerDoc`](functions/src/lib/schema.ts) — respuestas ya normalizadas con [`normalizeAnswer`](src/domain/answer/normalize.ts) |
| `qrTokens/{token}`                                  | App de creación                                       | [`QrTokenDoc`](functions/src/lib/schema.ts)                                                                                            |
| `progress/{uid}_{huntId}` y su subcolección `cards` | Solo las Cloud Functions (`redeemQr`, `submitAnswer`) | [`ProgressDoc`](functions/src/lib/schema.ts) / [`CardDoc`](functions/src/lib/schema.ts)                                                |

**Contrato de las callables** que el cliente invoca — tipos en [`src/domain/callables.ts`](src/domain/callables.ts), implementación en [`functions/src/callable/`](functions/src/callable/):

- `redeemQr({ token, clientRequestId }) → RedeemQrResult` — desbloquea una estación a partir de un `qrTokens/{token}` válido.
- `submitAnswer({ huntId, stationId, answer, clientRequestId }) → SubmitAnswerResult` — valida la respuesta en servidor, nunca en el cliente.

Cualquier cambio en estos tipos que rompa la compatibilidad debe ir marcado `BREAKING CHANGE:` en el commit (ver PLAN.md §11.2) y coordinarse con quien mantenga la app de creación de rutas.
