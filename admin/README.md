# Rastro — Admin

App de creación y gestión de rutas del tesoro (hunts) para [Rastro](../README.md). Next.js exportado como sitio estático (`output: 'export'`), sin servidor propio — habla directo con Firestore/Auth vía el SDK cliente, igual que el player app.

## Desarrollo local

Con los emuladores del proyecto raíz corriendo (`npm run emulators` desde la raíz del repo, no desde aquí):

```bash
npm run admin:dev   # desde la raíz — o "npm run dev" desde admin/
```

Se conecta automáticamente a los emuladores de Auth y Firestore. No hace falta ningún `.env` para desarrollar.

### Crear el primer administrador

El acceso a esta app está protegido: solo entra quien tenga un documento en `admins/{uid}`. No hay registro público, así que el primer admin se crea a mano:

1. Abre la UI del emulador de Auth (`http://127.0.0.1:4000/auth`) y crea un usuario con email y contraseña.
2. Copia su `uid`.
3. Desde la raíz del repo: `npm run grant-admin -- <uid> <email>`.
4. Entra en `http://localhost:3000/login` con ese email y contraseña.

Los admins que ya tienen acceso pueden dar de alta a otros repitiendo el paso 3 (o escribiendo directamente en `admins/{uid}` desde la UI del emulador de Firestore).

## Qué hay hecho y qué falta

Hecho:

- Login (email/contraseña) + verificación de acceso vía `admins/{uid}`.
- CRUD de hunts (título, descripción, icono, idioma, estado, visibilidad, código, política de intentos).

Pendiente (roadmap, no bloquea lo anterior):

- Gestión de estaciones (acertijos, respuestas secretas, premios, ubicación, método de desbloqueo).
- Subida de imágenes (Firebase Storage) para iconos y opciones tipo imagen.
- Generación de códigos QR (con el icono del hunt superpuesto) para las estaciones con `unlock: 'qr'`.

## Desplegar

Este sitio se despliega como un segundo Hosting site del mismo proyecto de Firebase (ver `firebase.json`, target `admin`). **Antes del primer deploy real** hace falta:

```bash
firebase hosting:sites:create <admin-site-id> --project <project-id>
firebase target:apply hosting player <project-id> --project <project-id>
firebase target:apply hosting admin <admin-site-id> --project <project-id>
```

Sin este paso, `firebase deploy --only hosting` falla porque `firebase.json` referencia dos targets (`player`, `admin`) que no están mapeados a ningún site real para ese proyecto — `.firebaserc` solo trae el mapeo de ejemplo para el proyecto de emulador `demo-rastro`.

Variables de entorno para el build de producción (mismas credenciales que el player app, con prefijo `NEXT_PUBLIC_` en vez de `VITE_`): `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=false`.
