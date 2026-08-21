# Rastro — Plan técnico

> App de búsqueda del tesoro por QR. Ruta no lineal, progreso persistente, premios digitales y físicos.
> Cliente jugador (esta app) + panel de creación de rutas (app hermana, misma DB).

**Versión:** 0.4 · **Estado:** Fases 0-5 del roadmap completadas — app funcionalmente completa de extremo a extremo, verificada contra el emulador

> **Cambios en 0.4** — Fases 3, 4 y 5 completadas: cliente entero (unirse, estación, intentos, constelación, premios), campo (escaneo QR, cola offline, notificaciones), y cierre (e2e, code-splitting confirmado, contrato de datos documentado). El e2e destapó dos bugs reales — `<Outlet />` ausente y App Check bloqueando el emulador — ambos arreglados. Ver §12 para el detalle fase a fase.
>
> **Cambios en 0.3** — Se documenta el progreso real de implementación: Fases 0-2 del roadmap (§12) completadas, incluido el cierre de Fase 2 con App Check forzado en las dos callables. Se añade nota sobre el symlink `functions/src/domain` en Windows (§6.1). Se resuelve la pregunta abierta de acumulación de intentos (§13.1).
>
> **Cambios en 0.2** — Los intentos pasan de _token bucket con recarga a medianoche de Madrid_ a **ventana deslizante de 24 h**. Desaparecen la zona horaria, el DST y el estado `lastRefillDay`. Se añade reto de **respuesta libre con normalización** (case-insensitive) validado en servidor.

---

## 1. Resumen y decisiones de arquitectura

| Área                | Decisión                                                                    | Motivo                                                                                                      |
| ------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Bundler / framework | **Vite + React 19 + TypeScript strict**                                     | App autenticada sin SEO. SSR no aporta. Ciclo TDD de ~200 ms con Vitest compartiendo config con el bundler. |
| Routing             | **TanStack Router**                                                         | Rutas tipadas, `loader` integrado con TanStack Query, code splitting por ruta.                              |
| Estado servidor     | **TanStack Query**                                                          | Cache, reintentos, estado offline explícito. No Redux: casi todo el estado es servidor.                     |
| Estado cliente      | `useState` + Context puntual                                                | No hay estado global real salvo sesión y cola offline.                                                      |
| Backend             | **Firebase Auth (anónimo + link) · Firestore · Cloud Functions gen2 · FCM** |                                                                                                             |
| Toda mutación       | **Callable Functions**, nunca escritura directa desde cliente               | Las reglas de juego (intentos, desbloqueos, %) no son negociables desde el móvil.                           |
| Testing             | Vitest · RTL · MSW · Firebase Emulator Suite · Playwright                   |                                                                                                             |
| UI                  | shadcn/ui + Tailwind v4, tema amarillo/negro                                |                                                                                                             |
| Deploy              | Firebase Hosting (estático + CDN)                                           | Mismo proyecto que Functions y Firestore.                                                                   |

### 1.1 Por qué Vite y no Next.js

- La PWA es requisito de primera clase. En Next.js el service worker convive mal con el App Router y con `firebase-messaging-sw.js`; en Vite, `vite-plugin-pwa` en modo `injectManifest` da un único SW que controlamos entero (necesario, ver §10).
- No hay contenido público indexable: el jugador entra con sesión y todo lo que ve depende de su progreso.
- La lógica de servidor ya vive en Cloud Functions. Un servidor Next intermedio sería una tercera capa sin trabajo que hacer.

---

## 2. Modelo de dominio

### 2.1 Glosario

- **Hunt (Ruta)** — una búsqueda completa. Tiene N estaciones ordenadas y una política de intentos.
- **Station (Estación)** — un nodo de la ruta. Tiene una `clue` (la pista que _conduce hasta ella_), un reto y un premio.
- **QR Token** — cadena opaca impresa en el QR físico o publicada en redes. Apunta a una estación, pero no la revela.
- **Unlock (Desbloqueo)** — el jugador ha llegado a la estación (por QR o por resolver la anterior). Ve el reto.
- **Solve (Resolución)** — el jugador ha superado el reto. Obtiene el premio y revela las pistas vecinas.
- **Attempt Bucket** — saldo de intentos del jugador en esa ruta.
- **Card (Carta)** — copia personal y visible de una estación desbloqueada, dentro del progreso del jugador.

### 2.2 Invariantes (esto es lo que los tests protegen)

1. Una estación solo puede resolverse si está desbloqueada.
2. Resolver la estación **N** revela la `clue` de **N−1** y de **N+1**, si existen.
3. `completionPct = solvedCount / totalCount`. **Resolver la estación final no implica 100 %.**
4. La ruta se puede recorrer en cualquier orden y sigue siendo completable al 100 %.
5. Escanear un QR **nunca** consume intentos. Solo consume una respuesta fallida a un reto.
6. Los intentos disponibles son `maxAttempts` menos los fallos registrados en las últimas 24 h. Nunca negativo, nunca mayor que `maxAttempts`.
7. La ventana de intentos es un intervalo absoluto de 24 h. **No depende de zona horaria, calendario ni cambio de hora.**
8. Toda operación de desbloqueo o resolución es **idempotente** por `clientRequestId`. Un reintento de la cola offline no cuenta como fallo nuevo.
9. El cliente nunca puede leer una `clue`, una `question` o una respuesta de una estación no desbloqueada.
10. La respuesta correcta **nunca** viaja al cliente, ni siquiera tras resolver el reto.

### 2.3 Máquina de estados de una estación (por jugador)

```
        escanea QR                resuelve reto
LOCKED ─────────────► UNLOCKED ──────────────────► SOLVED
   ▲                     ▲  │                        │
   │  resuelve vecina    │  │ falla (−1 intento)     │ revela vecinas
   └─────────────────────┘  └────────────────────────┘
                            si balance == 0 → COOLDOWN (hasta mañana, Madrid)
```

`LOCKED` tiene dos sabores en la UI:

- **Desconocida** — ni siquiera se ha revelado su pista. Silueta sin título.
- **Pista revelada** — se sabe qué buscar, falta encontrarlo. Muestra `clue`.

---

## 3. Modelo de datos (Firestore)

```
/users/{uid}
  displayName, photoURL?, createdAt, isAnonymous
  /pushTokens/{token}   → { platform, createdAt, lastSeenAt }

/hunts/{huntId}                                    ← lectura pública (metadatos)
  title, tagline, coverUrl, status: draft|live|closed
  visibility: public|code, joinCode?
  stationCount: number                             ← solo el total, NUNCA la lista de IDs
  attemptPolicy: { maxAttempts: 3, windowHours: 24, scope: 'station'|'hunt' }
  createdBy: uid, createdAt, startsAt?, endsAt?

/hunts/{huntId}/stations/{stationId}               ← ✗ SIN ACCESO DE CLIENTE
  order: number
  title, clue, coverUrl?
  challenge:
    | { type: 'qr_only' }
    | { type: 'multiple_choice', question, options: [{id, text}] }
    | { type: 'text', question, placeholder?, hint? }
  prize: { kind: 'digital'|'physical', title, payload?, redeemInstructions? }

/hunts/{huntId}/stations/{stationId}/secret/answer ← ✗ SIN ACCESO DE CLIENTE
  correctOptionId?: string           // multiple_choice
  acceptedAnswers?: string[]         // text — ya normalizadas (ver §5.2)

/qrTokens/{token}                                  ← ✗ SIN ACCESO DE CLIENTE
  huntId, stationId, active: boolean, channel: 'physical'|'social', redeemCount

/progress/{uid}_{huntId}                           ← lectura del propio jugador, sin escritura
  uid, huntId
  solvedStationIds: string[]
  unlockedStationIds: string[]
  revealedStationIds: string[]
  solvedCount, totalCount, completionPct
  recentFailures?: Timestamp[]       // solo si attemptPolicy.scope === 'hunt'
  startedAt, lastActivityAt, completedAt?

/progress/{uid}_{huntId}/cards/{stationId}         ← copia visible al desbloquear
  order, title, clue, challenge (sin respuesta), state: 'unlocked'|'solved'
  recentFailures: Timestamp[]        // acotado a maxAttempts — solo importan los N últimos
  prize? (solo si state === 'solved')
  unlockedAt, solvedAt?

/progress/{uid}_{huntId}/events/{eventId}          ← append-only, auditoría y antitrampas
  type: 'scan'|'answer'|'unlock'|'solve', at, payload, clientRequestId

/redemptions/{redemptionId}
  uid, huntId, stationId, prizeKind, code?, status: 'issued'|'claimed', issuedAt
```

### 3.1 Notas de modelado

- **`progress` es de nivel raíz con ID compuesto** `{uid}_{huntId}`, no subcolección de `users`. Permite `collectionGroup` para rankings y hace la regla de seguridad un `resource.id.split('_')[0] == request.auth.uid` de una línea.
- **Duplicamos la estación en `cards`.** Es duplicación deliberada: el coste es una escritura por desbloqueo, y a cambio la regla de lectura no necesita ningún `get()` cruzado. Las reglas con `get()` son lentas, caras (cuentan como lectura), tienen tope de 10 por petición y son un imán de bugs.
- **`clue` es la pista que lleva _a_ esa estación.** Así, "revelar las vecinas de N" es literalmente copiar `stations[N-1].clue` y `stations[N+1].clue`. Sin campos `nextClue`/`prevClue` que duplican texto y se desincronizan.
- **Los eventos son append-only.** Sirven para depurar reclamaciones ("no me contó el premio") y para detectar patrones raros sin tocar el estado.
- **`hunts/{id}` expone `stationCount`, nunca `stationIds`.** El porcentaje y la constelación se pintan con un número y con los IDs que el jugador ya ha desbloqueado. En cuanto la lista completa de IDs llegue al cliente por cualquier vía, un ID opaco deja de ser opaco.

### 3.2 Por qué un ID aleatorio no basta como protección

Es tentador razonar que, si `stationId` es un UUID, nadie puede leer la estación sin haber escaneado el QR. En Firestore eso es falso por defecto: **no hace falta conocer el ID para leer el documento**. Una consulta de colección lo devuelve todo.

```ts
// Si `allow read` está abierto en /hunts/{id}/stations/{sid}, esto basta:
const todo = await getDocs(collection(db, `hunts/${huntId}/stations`));
// → todas las pistas y todas las preguntas de la ruta, sin adivinar un solo UUID
```

Las reglas distinguen `get` (por ID) de `list` (consulta). Para que el ID opaco proteja algo hay que escribir **explícitamente**:

```javascript
match /hunts/{huntId}/stations/{stationId} {
  allow get:  if isUnlockedBy(request.auth.uid, huntId, stationId);
  allow list: if false;    // ← sin esta línea, el UUID no protege nada
}
```

Aun con eso, este plan mantiene las estaciones **cerradas por completo** al cliente y espeja la carta en `cards`, por dos razones:

1. **Falla de forma segura.** Si el espejo tiene un bug, deja de verse algo y te enteras al instante. Si la regla `list` tiene un bug, el juego queda spoileable y nada se rompe: no hay señal.
2. **Offline.** Un jugador escanea en un portal sin cobertura, cierra la app y la reabre. Si la pregunta vino en la respuesta de la callable, se perdió. Si está en `cards`, la caché local de Firestore la sirve sin red y sin código extra. Este es el argumento decisivo: el juego se juega en la calle.

El coste es una escritura por desbloqueo. Barato.

---

## 4. Seguridad

### 4.1 Firestore Rules — postura

```
Cliente:  lee /hunts/{id}  ·  lee lo suyo bajo /progress/{uid}_*  ·  escribe nada
Function: todo (Admin SDK, se salta las reglas)
```

```javascript
// firestore.rules (esqueleto)
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    function isOwner(docId) {
      return request.auth != null && docId.split('_')[0] == request.auth.uid;
    }

    match /hunts/{huntId} {
      allow read: if resource.data.status == 'live';
      allow write: if false;
      match /stations/{document=**} { allow read, write: if false; }  // ← clave
    }

    match /qrTokens/{token} { allow read, write: if false; }

    match /progress/{progressId} {
      allow read: if isOwner(progressId);
      allow write: if false;
      match /cards/{stationId}  { allow read: if isOwner(progressId); allow write: if false; }
      match /events/{eventId}   { allow read: if isOwner(progressId); allow write: if false; }
    }

    match /users/{uid} {
      allow read, update: if request.auth.uid == uid;
      match /pushTokens/{token} { allow read, write: if request.auth.uid == uid; }
    }
  }
}
```

### 4.2 App Check — obligatorio

Las callable functions son invocables desde `curl` con un ID token robado o una sesión anónima creada a mano. Sin App Check, un script puede fuerza-brutear las opciones del quiz saltándose la UI. Se activa **reCAPTCHA Enterprise** en web y se exige `enforceAppCheck: true` en todas las callables.

### 4.3 Antitrampas por capas

1. Token opaco en el QR (no se puede enumerar la ruta).
2. Respuestas fuera del alcance del cliente.
3. Bucket de intentos en servidor, dentro de transacción.
4. App Check.
5. `redeemCount` por token — un QR físico compartido por WhatsApp es detectable (y aceptable: es parte del juego social; solo lo registramos).
6. _Opcional_: verificación de proximidad por geolocalización con radio configurable por estación. Recomendado **desactivado por defecto** — el GPS urbano es poco fiable y genera falsos negativos frustrantes en un cumpleaños.

---

## 5. Reglas de negocio críticas

### 5.1 Intentos: ventana deslizante de 24 h

No hay contador que recargar ni medianoche que calcular. Se registra el instante de cada fallo y se cuenta cuántos caen dentro de la ventana.

```ts
// src/domain/attempts/window.ts — sin estado, sin zona horaria
const WINDOW_MS = 24 * 60 * 60 * 1000;

export function attemptsLeft(failures: number[], now: number, policy: AttemptPolicy): number {
  const active = failures.filter((at) => now - at < policy.windowMs);
  return Math.max(0, policy.maxAttempts - active.length);
}

/** Instante en que se recupera el próximo intento. null si ya hay disponibles. */
export function retryAt(failures: number[], now: number, policy: AttemptPolicy): number | null {
  if (attemptsLeft(failures, now, policy) > 0) return null;
  const active = failures.filter((at) => now - at < policy.windowMs).sort((a, b) => a - b);
  return active[0] + policy.windowMs; // caduca el más antiguo
}

/** Solo importan los N últimos: el resto ya no puede influir en el cálculo. */
export const trimFailures = (failures: number[], policy: AttemptPolicy): number[] =>
  failures.sort((a, b) => b - a).slice(0, policy.maxAttempts);
```

**Por qué deslizante y no "bloqueado 24 h desde el tercer fallo":**

- Los intentos vuelven **de uno en uno** según caducan, no los tres de golpe. Fallar a las 10:00, 10:05 y 22:00 devuelve un intento a las 10:00 del día siguiente, otro a las 10:05 y el tercero a las 22:00. Más indulgente y más legible para el jugador.
- No hay estado de "desbloqueo" que escribir ni que sincronizar. La función es pura y sin memoria: solo timestamps dentro o fuera de la ventana.
- El bloqueo por reset tiene una deriva desagradable: cada tanda de fallos empuja la hora de desbloqueo más tarde, y en unos días el jugador acaba bloqueado justo en su franja de juego.

**Lo que este modelo cuesta:**

- Ya no hay acumulación. No se pueden ahorrar intentos no usados; el máximo instantáneo es siempre `maxAttempts`. Era un requisito inicial y desaparece a conciencia (ver §13.1).
- **Sigue habiendo estado en Firestore.** Es obligatorio: si el registro de fallos viviera solo en el dispositivo, borrar los datos del navegador daría intentos infinitos. Lo que cambia es la forma —tres timestamps en vez de un contador con fecha de recarga—, no el hecho de persistirlo.

### 5.2 Validación de la respuesta

La comprobación ocurre **siempre** en `submitAnswer`. La respuesta correcta no viaja al cliente en ningún momento, tampoco después de acertar.

```ts
// src/domain/answer/normalize.ts — compartido cliente/servidor
export function normalizeAnswer(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita tildes: "café" → "cafe"
    .replace(/[^\p{L}\p{N}\s]/gu, '') // quita puntuación: "¡Sí!" → "si"
    .replace(/\s+/g, ' '); // colapsa espacios
}
```

- `acceptedAnswers` se guarda **ya normalizada**, así la comparación es una igualdad exacta y el panel de creación aplica la misma función. La comparación de cadenas normalizadas nunca es un `includes`: "oro" no debe validar "oropel".
- Se admite un array de respuestas válidas — "la torre", "torre", "torre del reloj" — porque en un juego la frustración por una sinonimia no reconocida es peor que la laxitud.
- **Decisión pendiente:** `NFD` + quitar diacríticos convierte `ñ` en `n`, así que "año" valida "ano". En un juego suele ser deseable; si no lo es, hay que sustituir `ñ`/`ç` por centinelas antes de normalizar. Hay test para ambos comportamientos, uno de los dos se marca como `skip` según la decisión.
- El cliente puede normalizar para _previsualizar_ ("se comprobará: `torre del reloj`"), pero jamás para validar.

### 5.3 Consumo de intentos

| Acción                                   | Coste                                                       |
| ---------------------------------------- | ----------------------------------------------------------- |
| Escanear QR (válido o no)                | 0                                                           |
| Respuesta correcta                       | 0                                                           |
| Respuesta incorrecta                     | 1 fallo registrado con `serverTimestamp()`                  |
| Enviar sin intentos                      | rechazado con `resource-exhausted` + `retryAt`              |
| Reintento con `clientRequestId` ya visto | devuelve el resultado anterior, **no** registra fallo nuevo |

El timestamp lo pone el servidor, nunca el cliente.

### 5.4 Reloj del cliente

El cliente calcula por su cuenta si ya tiene intentos, y el servidor revalida. Para que ambos coincidan, no basta con revalidar: hay que corregir el reloj local.

```ts
// shared/lib/clock.ts
let offsetMs = 0; // serverNow - clientNow
export const syncClock = (serverNowIso: string) => {
  offsetMs = Date.parse(serverNowIso) - Date.now();
};
export const now = () => Date.now() + offsetMs; // ← domain/ recibe esto, nunca Date.now()
```

Toda callable devuelve `serverNow`. Sin esta corrección, quien adelante el reloj del móvil ve la UI desbloqueada, envía la respuesta y recibe un rechazo que no puede explicarse. El servidor sigue siendo la autoridad; el offset solo evita que la UI mienta.

### 5.5 Progreso

```ts
completionPct = Math.floor((solvedCount / totalCount) * 100);
isComplete = solvedCount === totalCount;
```

Nunca se redondea hacia arriba: 11 de 12 estaciones debe mostrar **91 %**, jamás 100 %. Es un requisito del producto, no un detalle de formato, y tiene test propio.

---

## 6. Estructura de carpetas

```
rastro/
├── src/
│   ├── app/                        # arranque: providers, router, error boundary
│   │   ├── router.tsx
│   │   ├── providers.tsx
│   │   └── routes/
│   ├── domain/                     # ← LÓGICA PURA. Sin React, sin Firebase, sin DOM.
│   │   ├── attempts/               #   Es donde vive la mayoría de los tests.
│   │   ├── progress/
│   │   ├── station/
│   │   └── time/
│   ├── features/
│   │   ├── auth/                   # sesión anónima, upgrade de cuenta
│   │   ├── hunt/                   # unirse a ruta, portada, mapa
│   │   ├── scan/                   # cámara, decodificación QR, cola offline
│   │   ├── station/                # carta, quiz, premio
│   │   ├── progress/               # constelación, porcentaje, historial
│   │   └── notifications/          # permiso FCM, registro de token
│   ├── shared/
│   │   ├── ui/                     # componentes shadcn generados
│   │   ├── lib/                    # firebase.ts, callables tipadas, utils
│   │   ├── hooks/
│   │   └── types/
│   └── test/                       # setup, factories, render con providers
├── functions/
│   ├── src/
│   │   ├── callable/               # redeemQr, submitAnswer, joinHunt…
│   │   ├── triggers/
│   │   ├── domain/                 # ← symlink o paquete compartido con src/domain
│   │   └── lib/
│   └── src/**/*.test.ts
├── e2e/                            # Playwright
├── firestore.rules
├── tests/rules/                    # tests de reglas con el emulador
├── eslint.config.js
├── vite.config.ts
└── firebase.json
```

**Regla estructural que hace cumplir ESLint (`eslint-plugin-boundaries`):**

```
app → features → shared → domain
                     domain no importa NADA hacia arriba
                     features no se importan entre sí (solo vía shared o app)
```

`domain/` es la pieza clave del plan: al no depender de React ni de Firebase, sus tests corren en milisegundos y se comparte tal cual con `functions/`. Cliente y servidor calculan el progreso con **el mismo código**, así que el optimistic update de la UI nunca discrepa del resultado real.

### 6.1 `functions/src/domain` en Windows

Es un symlink de directorio (`../../src/domain`), committeado como tal (modo git `120000`). En Windows esto falla de dos formas no obvias:

- **PowerShell `New-Item -ItemType SymbolicLink` exige privilegios de administrador**, incluso con Developer Mode activado (bug conocido del cmdlet). Usa `mklink /D` vía `cmd`, que sí respeta el modo sin elevación.
- **Un symlink de tipo archivo en vez de directorio se ve "correcto" pero rompe silenciosamente TypeScript/ESLint**: `Get-Item` lo muestra como `SymbolicLink`, pero `PSIsContainer: False` y cualquier intento de listar su contenido falla. Esto ocurre si el checkout de Git no pudo determinar que el destino era un directorio. Sospecha de esto si `npm run lint` en `functions/` produce decenas de errores `no-unsafe-*` en cascada sin motivo aparente: es la señal de que TypeScript no está resolviendo nada a través del symlink.

Diagnóstico rápido: `Get-Item functions/src/domain | Select LinkType, PSIsContainer`. Si `PSIsContainer` es `False`, hay que borrar y recrear con `cmd /c mklink /D functions\src\domain ..\..\src\domain`.

---

## 7. Estrategia TDD

### 7.1 Pirámide

| Nivel       | Herramienta                               | Qué prueba                                    | Velocidad |
| ----------- | ----------------------------------------- | --------------------------------------------- | --------- |
| Dominio     | Vitest puro                               | Invariantes de §2.2                           | ~ms       |
| Reglas      | `@firebase/rules-unit-testing` + emulador | Que el cliente no pueda leer/escribir de más  | ~s        |
| Functions   | Vitest + emulador                         | Transacciones, idempotencia, códigos de error | ~s        |
| Componentes | RTL + MSW                                 | Que la UI refleje el estado y sea accesible   | ~ms       |
| E2E         | Playwright + emulador                     | Un recorrido completo, incluido offline       | ~min      |

**Regla de reparto:** si un test necesita el emulador, casi siempre significa que hay lógica que debería estar en `domain/`. Extraerla y bajarla de nivel.

### 7.2 Ciclo

`red` → escribir el test que falla → commit `test(scope): …`
`green` → mínimo código para pasar → commit `feat(scope): …`
`refactor` → limpiar con tests en verde → commit `refactor(scope): …`

No se aceptan PRs cuyo primer commit no sea un test que falla. Se verifica en CI comparando el orden de los commits del PR.

### 7.3 Lista de tests iniciales (en este orden)

**Dominio — intentos (ventana deslizante)**

1. Sin fallos → 3 intentos.
2. Tres fallos hace 1 min → 0 intentos.
3. Tres fallos, el más antiguo hace 24 h 1 min → 1 intento (caducan de uno en uno, no en bloque).
4. Un fallo justo en el borde exacto de la ventana ya no cuenta (`>=` vs `>` explícito).
5. `retryAt` con intentos disponibles → `null`.
6. `retryAt` sin intentos → el fallo más antiguo dentro de la ventana + 24 h.
7. `attemptsLeft` nunca devuelve negativo aunque el registro tenga 10 fallos.
8. `trimFailures` conserva los 3 más recientes y descarta el resto.
9. Un fallo con timestamp futuro (reloj adelantado) no aumenta los intentos disponibles.

**Dominio — normalización de respuestas** 10. `"  Café  "` y `"cafe"` normalizan igual. 11. `"¡La Torre!"` → `"la torre"`. 12. Espacios múltiples se colapsan a uno. 13. La comparación es igualdad exacta: `"oro"` no valida contra `"oropel"`. 14. Un `acceptedAnswers` con varias variantes valida cualquiera de ellas. 15. Cadena vacía o solo puntuación → no valida nunca (no puede empatar con una respuesta vacía). 16. _(decisión §5.2)_ `"año"` valida / no valida `"ano"` — uno de los dos tests activo.

**Dominio — progreso** 17. Progreso vacío → 0 %. 18. **Resolver solo la estación final de 12 → 8 %, no 100 %.** 19. 11 de 12 → 91 % (nunca 100). 20. 12 de 12 → 100 % y `completedAt` presente. 21. Resolver la estación 5 revela pistas de la 4 y la 6. 22. Resolver la primera estación revela solo la 2 (no hay anterior). 23. Resolver en orden 7 → 3 → 11 acumula las seis pistas vecinas sin duplicados. 24. Aplicar el mismo evento `solve` dos veces deja el estado idéntico.

**Reglas** 25. Jugador autenticado no puede hacer `get` de `hunts/{id}/stations/{sid}`. 26. **Jugador autenticado no puede hacer `list` de `hunts/{id}/stations`** (test aparte del anterior: `get` y `list` son permisos distintos). 27. `hunts/{id}` no expone ningún campo con la lista de IDs de estación. 28. Jugador no puede leer `progress/{otroUid}_{huntId}`. 29. Jugador no puede escribir su propio `completionPct` ni `recentFailures`. 30. Nadie puede leer `qrTokens/{token}`. 31. Jugador sí puede leer sus propias `cards`. 32. Una `card` en estado `unlocked` no contiene ningún campo con la respuesta.

**Functions** 33. `redeemQr` con token inexistente → `not-found`, cero escrituras. 34. `redeemQr` con token de ruta no `live` → `failed-precondition`. 35. `redeemQr` válido → crea la card en `unlocked` y **no** registra ningún fallo. 36. `redeemQr` repetido con el mismo `clientRequestId` → misma respuesta, un desbloqueo, un evento. 37. `submitAnswer` correcta → `solved`, premio emitido, vecinas reveladas, `completionPct` recalculado. 38. `submitAnswer` correcta con distinta capitalización y tildes → válida. 39. `submitAnswer` incorrecta → un fallo con `serverTimestamp()`, sin revelar nada, sin filtrar la correcta. 40. `submitAnswer` sin intentos → `resource-exhausted` con `retryAt` en el payload. 41. `submitAnswer` sin intentos **no** registra un cuarto fallo (si no, la ventana se alarga sola indefinidamente). 42. `submitAnswer` con reloj de cliente adelantado → el servidor sigue rechazando. 43. `submitAnswer` sobre estación no desbloqueada → `permission-denied`. 44. Dos `submitAnswer` concurrentes con 1 intento → solo uno pasa (test de transacción). 45. Toda callable devuelve `serverNow`.

**Componentes** 46. `<StationCard>` bloqueada no renderiza el texto de la pista en el DOM (ni oculto por CSS). 47. `<AttemptMeter>` sin intentos muestra cuenta atrás hasta `retryAt` y deshabilita el envío. 48. `<AttemptMeter>` recupera un intento al cruzar `retryAt` sin recargar la página. 49. `<AnswerForm>` deshabilita "Comprobar" con el campo vacío. 50. `<AnswerForm>` tras fallo anuncia el error por `aria-live="polite"`. 51. `<AnswerForm>` previsualiza la respuesta normalizada mientras se escribe. 52. `<ProgressConstellation>` al 91 % no muestra el estado de completado. 53. `<ScanScreen>` sin permiso de cámara muestra CTA de permiso, no un error críptico.

**E2E** 54. Escanear → responder → premio → pista siguiente visible. 55. Escanear sin red → queda en cola con feedback → se aplica al reconectar. 56. Tres fallos → bloqueo → avanzar el reloj 24 h → un intento recuperado.

### 7.4 Utillaje

- `src/test/factories.ts` — `aHunt()`, `aStation()`, `aProgress()` con overrides. Nada de fixtures JSON gigantes.
- `vi.setSystemTime()` para todo lo temporal. Prohibido `new Date()` sin inyectar en `domain/`.
- MSW intercepta las callables en tests de componente; los tests de Functions usan el emulador real.
- Cobertura: **umbral 95 % en `src/domain` y `functions/src`**, sin umbral global (perseguir cobertura en la capa de UI produce tests basura).

---

## 8. Componentes

### 8.1 Rutas

```
/                       Portada — rutas activas del jugador
/join                   Introducir código o escanear para unirse
/h/$huntId              Mapa de constelación + progreso
/h/$huntId/s/$stationId Carta de estación (pista, reto, premio)
/h/$huntId/prizes       Premios obtenidos y cómo canjearlos
/scan                   Escáner a pantalla completa (modal-route)
/account                Sesión, notificaciones, upgrade de cuenta anónima
```

### 8.2 Árbol de componentes clave

```
<HuntScreen>
├── <ProgressConstellation>        ← elemento firma, ver §9
│   └── <StationNode> ×N           estados: unknown | revealed | unlocked | solved
├── <ProgressSummary>              "7 de 12 · 58 %"
├── <AttemptMeter>                 saldo + cuenta atrás si 0
└── <ScanFab>                      acción primaria, pulgar derecho

<StationScreen>
├── <StationHeader>                orden, título, estado
├── <ClueBlock>                    la pista que llevó aquí
├── <ChallengePanel>
│   ├── <QuizForm>                 opción múltiple
│   └── <AttemptMeter compact>
├── <PrizeReveal>                  solo si solved
└── <NeighbourClues>               pistas de N−1 y N+1

<ScanScreen>
├── <CameraPermissionGate>
├── <QrViewfinder>                 BarcodeDetector → fallback wasm
├── <TorchToggle>                  imprescindible: se juega de noche
└── <OfflineQueueBanner>
```

### 8.3 Contratos (definidos antes de implementar)

```ts
// shared/lib/callables.ts — cliente y functions comparten estos tipos
type Envelope = { serverNow: string }; // toda callable lo devuelve — ver §5.4

export type RedeemQrInput = { token: string; clientRequestId: string };
export type RedeemQrResult = Envelope &
  (
    | { ok: true; huntId: string; stationId: string; alreadyUnlocked: boolean }
    | { ok: false; reason: 'invalid_token' | 'hunt_not_live' }
  );

export type SubmitAnswerInput = {
  huntId: string;
  stationId: string;
  answer: { kind: 'option'; optionId: string } | { kind: 'text'; value: string };
  clientRequestId: string;
};
export type SubmitAnswerResult = Envelope &
  (
    | { ok: true; solved: true; prize: Prize; revealed: StationId[]; completionPct: number }
    | { ok: false; solved: false; attemptsLeft: number; retryAt: string | null }
  );
```

Nótese que la respuesta a un fallo **no incluye** cuál era la correcta, ni una pista sobre cuánto se acercó, ni cuántas opciones quedan por descartar. `attemptsLeft` y `retryAt` los calcula el servidor; el cliente los recalcula localmente entre llamadas para pintar la cuenta atrás, pero nunca son su fuente de verdad.

---

## 9. Tema y dirección visual

### 9.1 Tokens

Amarillo y negro, pero con una distinción que evita el efecto "cinta de obra": el amarillo es **acento y estado**, no superficie. Las superficies son negros escalonados; el texto largo va en gris cálido casi blanco. Amarillo reservado para: progreso, acción primaria, estado `solved`.

```css
/* src/index.css — shadcn tokens en OKLCH */
:root {
  --background: oklch(0.14 0.008 95); /* negro cálido, no #000 puro */
  --foreground: oklch(0.95 0.01 95);
  --card: oklch(0.18 0.01 95);
  --muted: oklch(0.24 0.01 95);
  --muted-foreground: oklch(0.68 0.012 95);
  --primary: oklch(0.86 0.185 95); /* amarillo señal */
  --primary-foreground: oklch(0.14 0.008 95); /* negro SOBRE amarillo */
  --accent: oklch(0.72 0.15 75); /* ámbar, estados intermedios */
  --destructive: oklch(0.58 0.19 25);
  --border: oklch(0.28 0.01 95);
  --ring: oklch(0.86 0.185 95);
  --radius: 0.75rem;
}
```

Contraste: amarillo señal sobre negro cálido ≈ **13:1**. Negro sobre amarillo ≈ 13:1. Ambos superan AAA. Prohibido por lint (`jsx-a11y` + revisión): amarillo sobre blanco, y párrafos largos en amarillo.

### 9.2 Tipografía

| Rol      | Fuente                                              | Uso                                                                                                                                         |
| -------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Display  | **Bricolage Grotesque** (variable, ancho ajustable) | Títulos de estación, número de orden. Se usa con moderación.                                                                                |
| Cuerpo   | **Inter Tight**                                     | Pistas, instrucciones. Altura de línea 1.6 para lectura al sol.                                                                             |
| Utilidad | **JetBrains Mono**                                  | Códigos de ruta, tokens, cuentas atrás. El mono aquí no es decorativo: son cadenas que se leen carácter a carácter y se dictan en voz alta. |

### 9.3 Elemento firma: la constelación

El progreso **no es una barra**. Una barra miente sobre este producto: implica linealidad, y la premisa es justamente que la ruta se recorre en desorden.

En su lugar, las estaciones se dibujan como nodos dispersos en un lienzo oscuro. Las líneas entre nodos vecinos aparecen solo cuando ambos extremos están resueltos. Un jugador que va salteado ve islas luminosas inconexas; el 100 % es el momento en que la figura se cierra. Comunica la verdad del juego — _puedes tener el tesoro final y seguir teniendo agujeros_ — mejor que cualquier porcentaje.

Riesgo asumido y justificado: es más caro de implementar y de hacer accesible que una barra. Mitigación: la constelación es SVG con `<title>` por nodo, navegable por teclado, y **siempre** acompañada del texto "7 de 12 · 58 %", que es lo que leen los lectores de pantalla.

### 9.4 Mobile-first, condiciones reales

Este juego se usa de pie, en la calle, quizá de noche, quizá con una copa en la otra mano.

- Objetivos táctiles ≥ 48 px. Acción primaria (escanear) en un FAB dentro del arco del pulgar.
- `env(safe-area-inset-*)` en toda la navegación inferior.
- Linterna en el escáner: `MediaStreamTrack.applyConstraints({ advanced: [{ torch: true }] })`.
- Vibración corta al decodificar un QR (`navigator.vibrate(40)`), respetando `prefers-reduced-motion`.
- La constelación se degrada a lista vertical por debajo de 360 px de ancho.
- Nada de hover como único canal de información.

### 9.5 Voz de la interfaz

Directa, sin infantilizar. Los errores dicen qué pasó y qué hacer:

> ✗ "Ha ocurrido un error"
> ✓ "Ese QR no pertenece a esta ruta. Comprueba que estés en la búsqueda correcta."

> ✗ "¡Ups! Sin intentos 😢"
> ✓ "Sin intentos. Vuelves a tener 3 a medianoche — faltan 4 h 12 min."

---

## 10. PWA y offline

### 10.1 Un solo service worker

**Este es el punto que más problemas da.** Firebase Messaging espera registrar `firebase-messaging-sw.js`; Workbox registra el suyo. Dos SW compitiendo por el mismo scope = notificaciones que llegan a veces. Solución: `injectManifest` y un único SW que hace ambas cosas.

```ts
// vite.config.ts
VitePWA({
  strategies: 'injectManifest',
  srcDir: 'src',
  filename: 'sw.ts',
  registerType: 'prompt', // no autoUpdate: no recargar bajo el usuario a mitad de un quiz
  manifest: {
    name: 'Rastro',
    short_name: 'Rastro',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#111010',
    theme_color: '#111010',
    icons: [/* 192, 512, maskable */],
  },
});
```

```ts
// src/sw.ts
import { precacheAndRoute } from 'workbox-precaching';
import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

precacheAndRoute(self.__WB_MANIFEST);
onBackgroundMessage(getMessaging(initializeApp(config)), (payload) => {
  /* … */
});
// + Background Sync para la cola de escaneos
```

### 10.2 Estrategia de red

| Recurso                               | Estrategia                                                 |
| ------------------------------------- | ---------------------------------------------------------- |
| App shell, fuentes, iconos            | Precache                                                   |
| Metadatos de ruta, imágenes de premio | Stale-while-revalidate                                     |
| Progreso y cartas                     | Persistencia offline de Firestore (`persistentLocalCache`) |
| Callables (escanear, responder)       | **Nunca cacheadas.** Cola offline explícita.               |

### 10.3 Cola offline

Escanear un QR en un sótano o en un parque sin cobertura es el escenario normal, no el borde.

1. El escaneo se guarda en IndexedDB con un `clientRequestId` (UUID v4).
2. La UI muestra estado **"En cola — se aplicará al recuperar señal"**. No un optimistic update: prometer un desbloqueo que puede fallar es peor que esperar.
3. Background Sync (o reintento al volver `online`) envía la cola en orden.
4. La idempotencia por `clientRequestId` hace que reintentar sea seguro (test 26).

Las respuestas al quiz **no** se encolan: consumen un recurso limitado y la resolución depende del estado del servidor. Si no hay red, el botón se deshabilita con un mensaje claro.

---

## 11. Calidad de código

### 11.1 ESLint 9 (flat config)

```js
// eslint.config.js
import js from '@eslint/js';
import ts from 'typescript-eslint';
import react from 'eslint-plugin-react';
import hooks from 'eslint-plugin-react-hooks';
import a11y from 'eslint-plugin-jsx-a11y';
import testingLibrary from 'eslint-plugin-testing-library';
import vitest from '@vitest/eslint-plugin';
import boundaries from 'eslint-plugin-boundaries';
import imports from 'eslint-plugin-import-x';

export default ts.config(
  js.configs.recommended,
  ...ts.configs.strictTypeChecked,
  ...ts.configs.stylisticTypeChecked,
  react.configs.flat.recommended,
  a11y.flatConfigs.recommended,
  {
    plugins: { 'react-hooks': hooks, boundaries, 'import-x': imports },
    settings: {
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app/*' },
        { type: 'features', pattern: 'src/features/*' },
        { type: 'shared', pattern: 'src/shared/*' },
        { type: 'domain', pattern: 'src/domain/*' },
      ],
    },
    rules: {
      ...hooks.configs.recommended.rules,
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: 'app', allow: ['features', 'shared', 'domain'] },
            { from: 'features', allow: ['shared', 'domain'] },
            { from: 'shared', allow: ['domain'] },
            { from: 'domain', allow: [] }, // ← domain no importa nada
          ],
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['firebase/*'],
              message: 'Firebase solo se importa desde shared/lib/firebase.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/domain/**'],
    rules: {
      'no-restricted-globals': [
        'error',
        {
          name: 'Date',
          message: 'Inyecta el instante como parámetro. domain/ debe ser determinista.',
        },
      ],
    },
  },
  {
    files: ['**/*.test.{ts,tsx}'],
    plugins: { 'testing-library': testingLibrary, vitest },
    rules: {
      ...testingLibrary.configs['flat/react'].rules,
      ...vitest.configs.recommended.rules,
      'testing-library/no-node-access': 'error',
      'testing-library/prefer-user-event': 'error',
    },
  },
);
```

Las dos reglas que más valor aportan aquí son las personalizadas: `boundaries` mantiene `domain/` puro (y por tanto compartible con Functions y rápido de testear), y prohibir `Date` dentro de `domain/` fuerza a inyectar el tiempo, que es lo que hace testeable toda la lógica de §5.

### 11.2 Hooks y commits

```
.husky/pre-commit   → lint-staged (eslint --fix, prettier, tsc --noEmit sobre lo tocado)
.husky/commit-msg   → commitlint
.husky/pre-push     → vitest run (solo dominio + componentes; el emulador va en CI)
```

```js
// commitlint.config.js
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'auth',
        'hunt',
        'station',
        'scan',
        'attempts',
        'progress',
        'prizes',
        'notifications',
        'ui',
        'theme',
        'pwa',
        'rules',
        'functions',
        'domain',
        'deps',
        'ci',
        'config',
      ],
    ],
    'subject-case': [2, 'always', 'sentence-case'],
    'body-max-line-length': [0],
  },
};
```

Tipos: `feat` `fix` `test` `refactor` `perf` `docs` `style` `build` `ci` `chore` `revert`.
`BREAKING CHANGE:` obligatorio ante cualquier cambio en el esquema de Firestore o en el contrato de una callable — la app de creación de rutas consume la misma DB y se rompe en silencio si no.

### 11.3 CI (GitHub Actions)

```
lint      → eslint + prettier --check + tsc --noEmit
unit      → vitest run --coverage (falla si domain < 95 %)
rules     → firebase emulators:exec "vitest run tests/rules"
functions → firebase emulators:exec "vitest run functions"
e2e       → playwright con emuladores (solo en PR a main)
tdd-order → falla si el PR no contiene ningún commit `test(...)`
```

---

## 12. Roadmap por commits

> **Estado real (v0.3):** Fases 0, 1 y 2 completadas. Fase 3 (cliente) es el siguiente trabajo.

### Fase 0 — Cimientos ✅

```
chore(config): Scaffold Vite + React + TypeScript strict
chore(config): Configure ESLint flat config with boundaries and a11y
chore(config): Add Prettier, husky, lint-staged and commitlint
chore(ci): Add GitHub Actions pipeline
build(pwa): Add vite-plugin-pwa with injectManifest strategy
feat(theme): Add shadcn/ui with yellow and black OKLCH tokens
```

### Fase 1 — Dominio puro (sin backend, todo testeable) ✅

```
test(attempts): Add failing specs for sliding 24h attempt window
feat(attempts): Implement attemptsLeft, retryAt and trimFailures
test(domain): Add failing specs for answer normalization and matching
feat(domain): Implement accent and punctuation insensitive answer matching
test(progress): Add failing specs for completion percentage and neighbour reveal
feat(progress): Implement progress reducer with idempotent events
```

### Fase 2 — Backend ✅

```
test(rules): Add failing specs denying client get and list on stations
feat(rules): Add Firestore security rules
feat(functions): Return serverNow envelope from every callable
feat(auth): Add server clock offset sync
test(functions): Add failing specs for redeemQr token resolution
feat(functions): Implement redeemQr callable with idempotency key
test(functions): Add failing specs for submitAnswer attempt accounting
feat(functions): Implement submitAnswer callable inside a transaction
feat(functions): Enforce App Check on all callables
```

### Fase 3 — Cliente ✅

```
feat(config): Initialize the Firebase client SDK ✅
feat(auth): Add anonymous sign-in session ✅ (falta account linking)
test(hunt): Add failing specs for join code normalization ✅
feat(hunt): Implement join code normalization ✅
feat(hunt): Implement join-by-code flow ✅
test(station): Add failing specs for locked station content leakage ✅
feat(station): Implement station card with clue and challenge panel ✅ (StationCard; AnswerForm cubre el reto)
test(attempts): Add failing specs for attempt meter countdown state ✅
feat(attempts): Implement attempt meter and quiz form ✅ (AttemptMeter + AnswerForm)
test(progress): Add failing specs for constellation completion state ✅
feat(progress): Implement progress constellation ✅
feat(hunt): Wire the hunt overview screen to live Firestore progress ✅
```

Verificado end-to-end contra el emulador: unirse por código navega a `/h/$huntId`; desbloquear/resolver una estación (sembrado directamente en Firestore para simular `redeemQr`/`submitAnswer`) actualiza `ProgressConstellation` y las `StationCard` en vivo, sin recargar.

**Pendiente de Fase 3 antes de cerrarla del todo:** vincular cuenta anónima a email (§13.5), pantalla de detalle de estación (`/h/$huntId/s/$stationId`) que combine `AnswerForm` + `AttemptMeter` para responder de verdad, y consumo real de `submitAnswer`/`redeemQr` desde el cliente (por ahora solo están sembrados datos directamente para probar).

### Fase 4 — Campo ✅

```
feat(scan): Add QR scanner with BarcodeDetector and wasm fallback ✅ (jsQR, no wasm en sí, mismo rol de fallback)
feat(scan): Add torch toggle and haptic feedback on decode ✅
test(scan): Add failing specs for offline scan queue idempotency ✅
feat(scan): Implement IndexedDB queue with background sync ✅ (reintento al reconectar en vez de la Background Sync API — más portable: iOS Safari no la soporta)
feat(notifications): Add FCM permission flow and token registration ✅ (register()/onRegistered(), reemplazo no-deprecado de getToken())
feat(prizes): Add prize wallet and redemption instructions ✅
```

Sin cámara real disponible para verificar el decodificado en vivo: `CameraPermissionGate` se verificó en el navegador (deniega sin error críptico), y `useQrDecoder`/`QrViewfinder` quedan como código de integración sin test dedicado, igual que `shared/lib/firebase.ts`.

### Fase 5 — Cierre ✅

```
test(e2e): Add failing scan-solve-unlock happy path ✅
perf(ui): Lazy-load scanner bundle behind route ✅ (ya lo daba gratis autoCodeSplitting de TanStack Router; confirmado en el build: scan-*.js es su propio chunk de ~135 kB)
docs(readme): Document data model and route creation contract ✅
```

El e2e destapó dos bugs reales que ningún test unitario podía ver: `h.$huntId.tsx` no renderizaba `<Outlet />`, así que `/h/$huntId/s/$stationId` y `/h/$huntId/prizes` nunca habían sido alcanzables por ninguna navegación real pese a compilar y pasar sus propios tests; y `enforceAppCheck: true` bloqueaba toda llamada real a `redeemQr`/`submitAnswer` en local, porque el cliente nunca inicializa App Check contra el emulador. Ambos arreglados — ver los commits `fix(hunt)` y `fix(functions)` correspondientes.

**Rastro está funcionalmente completo de extremo a extremo**: unirse por código, escanear (o simularlo), resolver, ver premios, notificaciones — todo verificado contra el emulador. Pendiente real, no cosmético: vincular cuenta anónima a email (§13.5), probar contra un proyecto de Firebase real desplegado, y decidir las preguntas abiertas de §13.

---

## 13. Preguntas abiertas

1. ~~**Acumulación.**~~ **Resuelta (v0.3): descartada.** La ventana deslizante (§5.1) la elimina por diseño: el máximo instantáneo es siempre `maxAttempts`, sin ahorro de intentos no usados. Implementado y testeado (`attemptsLeft`, `retryAt`, `trimFailures` en `src/domain/attempts/window.ts`). Revertir esto implicaría volver a un contador con recarga por calendario y recuperar la lógica de zona horaria que la v0.2 eliminó a propósito — no se recomienda salvo petición explícita.
2. **Alcance de los intentos: `station` o `hunt`.** Con `scope: 'station'` (mi recomendación, y el valor por defecto del plan), fallar tres veces en la estación 5 no impide seguir intentando la 8 — el jugador nunca se queda sin nada que hacer, que en una fiesta de un día importa mucho. Con `scope: 'hunt'` el bloqueo es total y el juego se detiene. Para el cumpleaños: `station`. Para la campaña del libro, quizá `hunt`.
3. **Duración de la ventana.** 24 h es correcto para una campaña de marketing de semanas. Para un cumpleaños de una tarde es letal: tres fallos y el invitado queda fuera del juego el resto de la fiesta. `windowHours` es configurable por ruta; para el evento de un día pondría 1 h, o `maxAttempts` alto.
4. **Premios físicos.** ¿Se canjean mostrando un código al organizador, o basta con que la app diga "te lo doy yo"? Cambia si `redemptions` necesita flujo de validación.
5. **Registro.** Propongo **auth anónima** por defecto: en una fiesta nadie quiere crear una cuenta. El riesgo es perder el progreso al borrar datos del navegador. Mitigación: instalar la PWA + ofrecer vincular email al llegar al 50 %.
6. **Pistas por redes sociales.** ¿Son los mismos `qrTokens` publicados como texto, o un canal aparte con reglas propias (p. ej. límite de canjes)? El campo `channel` ya lo contempla, falta decidir la política.
7. **Rutas simultáneas.** ¿Un jugador puede tener varias rutas abiertas? El modelo lo soporta; la UI de portada cambia bastante según la respuesta.
8. **Contrato con la app de creación.** Al compartir DB, el esquema es una API pública entre dos apps. Propongo extraer los tipos y validadores Zod a un paquete `@rastro/schema` versionado, consumido por ambas. Si no, la primera migración rompe algo en silencio.
9. **Idioma.** ¿Solo español, o se prevé i18n para el uso en marketing del libro? Meterlo después cuesta 10× más.
