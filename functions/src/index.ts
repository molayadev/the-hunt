import type { CallableRequest } from 'firebase-functions/v2/https';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { redeemQrHandler } from './callable/redeemQr';
import { submitAnswerHandler } from './callable/submitAnswer';
import type { RedeemQrInput, SubmitAnswerInput } from './domain/callables';

function requireUid(auth: CallableRequest['auth']): string {
  if (!auth) throw new HttpsError('unauthenticated', 'Sign-in required.');
  return auth.uid;
}

export const redeemQr = onCall<RedeemQrInput>({ enforceAppCheck: true }, (request) =>
  redeemQrHandler(request.data, requireUid(request.auth)),
);

export const submitAnswer = onCall<SubmitAnswerInput>({ enforceAppCheck: true }, (request) =>
  submitAnswerHandler(request.data, requireUid(request.auth)),
);
