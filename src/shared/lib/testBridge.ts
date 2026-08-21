import { auth } from './firebase';

declare global {
  interface Window {
    __rastroTestBridge?: { getUid: () => string | null };
  }
}

// Dev-only: import.meta.env.DEV is replaced with a literal at build time, so
// this whole block (and the window assignment) is dead-code-eliminated from
// production bundles. Lets e2e tests read the anonymous uid a real page
// session created, without touching production code.
if (import.meta.env.DEV) {
  window.__rastroTestBridge = {
    getUid: () => auth.currentUser?.uid ?? null,
  };
}
