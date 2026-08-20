import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routesDirectory: 'src/app/routes',
      generatedRouteTree: 'src/app/routeTree.gen.ts',
    }),
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectRegister: false,
      registerType: 'prompt',
      manifest: {
        name: 'Rastro',
        short_name: 'Rastro',
        description: 'Búsqueda del tesoro por QR',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#111010',
        theme_color: '#111010',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      injectManifest: {
        injectionPoint: 'self.__WB_MANIFEST',
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    // functions/** y tests/rules/** requieren el emulador de Firebase y
    // corren aparte en CI (ver package.json y §11.3 del plan).
    exclude: ['node_modules/**', 'functions/**', 'tests/rules/**', 'e2e/**'],
    coverage: {
      provider: 'v8',
      include: ['src/domain/**', 'functions/src/**'],
      thresholds: { lines: 95, statements: 95, branches: 95, functions: 95 },
    },
  },
});
