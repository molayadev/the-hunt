import '@testing-library/jest-dom/vitest';
// eslint-disable-next-line testing-library/no-manual-cleanup -- vite.config.ts sets test.globals: false, so RTL's own auto-cleanup (which self-registers via a global afterEach) never runs; this is the real registration, not a redundant one.
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
