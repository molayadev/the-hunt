import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    hookTimeout: 20_000,
    testTimeout: 20_000,
    // All files share one Firestore emulator instance (real external state,
    // not per-test); running in parallel lets one file's
    // clearFirestoreEmulator() wipe another file's data mid-run.
    fileParallelism: false,
  },
});
