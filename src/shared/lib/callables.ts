import type {
  RedeemQrInput,
  RedeemQrResult,
  SubmitAnswerInput,
  SubmitAnswerResult,
} from '../../domain/callables';
import { functions, httpsCallable } from './firebase';

export const redeemQr = httpsCallable<RedeemQrInput, RedeemQrResult>(functions, 'redeemQr');

export const submitAnswer = httpsCallable<SubmitAnswerInput, SubmitAnswerResult>(
  functions,
  'submitAnswer',
);
