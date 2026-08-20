export async function clearFirestoreEmulator(): Promise<void> {
  const host = process.env.FIRESTORE_EMULATOR_HOST;
  const projectId = process.env.GCLOUD_PROJECT ?? 'demo-rastro';
  if (!host) {
    throw new Error(
      'FIRESTORE_EMULATOR_HOST is not set. Run the tests via "npm run test:functions".',
    );
  }
  const response = await fetch(
    `http://${host}/emulator/v1/projects/${projectId}/databases/(default)/documents`,
    { method: 'DELETE' },
  );
  if (!response.ok) {
    throw new Error(`Failed to clear the Firestore emulator: ${String(response.status)}`);
  }
}
