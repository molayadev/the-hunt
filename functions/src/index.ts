import type { CallableRequest } from 'firebase-functions/v2/https';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { redeemQrHandler } from './callable/redeemQr';
import { startHuntHandler } from './callable/startHunt';
import { submitAnswerHandler } from './callable/submitAnswer';
import type { RedeemQrInput, StartHuntInput, SubmitAnswerInput } from './domain/callables';

function requireUid(auth: CallableRequest['auth']): string {
  if (!auth) throw new HttpsError('unauthenticated', 'Sign-in required.');
  return auth.uid;
}

// The Functions emulator sets this automatically; real deployments never do.
// There is no App Check emulator wired up, and the client never initializes
// App Check against emulator credentials, so enforcing it locally would
// reject every callable — see PLAN.md §4.2 for why it stays on in production.
const isRunningInEmulator = process.env.FUNCTIONS_EMULATOR === 'true';

export const redeemQr = onCall<RedeemQrInput>(
  { enforceAppCheck: !isRunningInEmulator },
  (request) => redeemQrHandler(request.data, requireUid(request.auth)),
);

export const submitAnswer = onCall<SubmitAnswerInput>(
  { enforceAppCheck: !isRunningInEmulator },
  (request) => submitAnswerHandler(request.data, requireUid(request.auth)),
);

export const startHunt = onCall<StartHuntInput>(
  { enforceAppCheck: !isRunningInEmulator },
  (request) => startHuntHandler(request.data, requireUid(request.auth)),
);
