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

| Comando                           | Qué hace                                       |
| --------------------------------- | ---------------------------------------------- |
| `npm run dev`                     | Servidor de desarrollo Vite                    |
| `npm run emulators`               | Firebase Auth + Firestore + Functions emulados |
| `npm run build`                   | Build de producción (`tsc -b && vite build`)   |
| `npm run lint` / `npm run format` | ESLint / Prettier                              |
| `npm run typecheck`               | `tsc -b --noEmit`                              |
| `npm test`                        | Tests de dominio y componentes (Vitest)        |
| `npm run test:rules`              | Tests de `firestore.rules` contra el emulador  |
| `npm run test:functions`          | Tests de Cloud Functions contra el emulador    |

## Variables de entorno (solo para build de producción)

Los emuladores no necesitan ninguna variable de entorno. Estas variables solo hacen falta para construir un build que apunte a un proyecto de Firebase **real** (despliegues, o `npm run dev` contra un proyecto real con `VITE_USE_FIREBASE_EMULATORS=false`):

| Variable                            | Descripción                                                                   |
| ----------------------------------- | ----------------------------------------------------------------------------- |
| `VITE_FIREBASE_API_KEY`             | Config del SDK web, panel de Firebase → Configuración del proyecto → Tus apps |
| `VITE_FIREBASE_AUTH_DOMAIN`         | ídem                                                                          |
| `VITE_FIREBASE_PROJECT_ID`          | ID del proyecto de Firebase                                                   |
| `VITE_FIREBASE_STORAGE_BUCKET`      | ídem                                                                          |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ídem                                                                          |
| `VITE_FIREBASE_APP_ID`              | ídem                                                                          |
| `VITE_USE_FIREBASE_EMULATORS`       | `false` para conectar a los servicios reales en vez de a los emuladores       |

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
