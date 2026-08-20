import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    hookTimeout: 20_000,
    testTimeout: 20_000,
    // Todos los ficheros comparten el mismo emulador de Firestore (estado
    // externo real, no en memoria por test): en paralelo, un
    // clearFirestoreEmulator() de un fichero borra los datos de otro a
    // mitad de ejecución. Ver la propia sección de utillaje del plan
    // (§7.4) sobre no complicar la infra de tests más de lo necesario.
    fileParallelism: false,
  },
});
