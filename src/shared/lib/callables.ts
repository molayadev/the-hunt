import type {
  RedeemQrInput,
  RedeemQrResult,
  StartHuntInput,
  StartHuntResult,
  SubmitAnswerInput,
  SubmitAnswerResult,
  UnlockWithPasswordInput,
  UnlockWithPasswordResult,
} from '../../domain/callables';
import { functions, httpsCallable } from './firebase';

export const redeemQr = httpsCallable<RedeemQrInput, RedeemQrResult>(functions, 'redeemQr');

export const submitAnswer = httpsCallable<SubmitAnswerInput, SubmitAnswerResult>(
  functions,
  'submitAnswer',
);

export const startHunt = httpsCallable<StartHuntInput, StartHuntResult>(functions, 'startHunt');

export const unlockWithPassword = httpsCallable<UnlockWithPasswordInput, UnlockWithPasswordResult>(
  functions,
  'unlockWithPassword',
);
