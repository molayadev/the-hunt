/** Borra todos los documentos del emulador de Firestore entre tests. */
export async function clearFirestoreEmulator(): Promise<void> {
  const host = process.env.FIRESTORE_EMULATOR_HOST;
  const projectId = process.env.GCLOUD_PROJECT ?? 'demo-rastro';
  if (!host) {
    throw new Error(
      'FIRESTORE_EMULATOR_HOST no está definido. Ejecuta los tests vía "npm run test:functions".',
    );
  }
  const response = await fetch(
    `http://${host}/emulator/v1/projects/${projectId}/databases/(default)/documents`,
    { method: 'DELETE' },
  );
  if (!response.ok) {
    throw new Error(`No se pudo limpiar el emulador de Firestore: ${String(response.status)}`);
  }
}
