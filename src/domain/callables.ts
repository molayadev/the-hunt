// Contratos compartidos entre el cliente (vía shared/lib/callables.ts) y las
// Cloud Functions (vía el symlink functions/src/domain). Ver PLAN.md §8.3.
// BREAKING CHANGE en este fichero implica romper la app de creación de rutas.

export interface Envelope {
  readonly serverNow: string;
}

export type StationId = string;

export interface Prize {
  readonly kind: 'digital' | 'physical';
  readonly title: string;
  readonly payload?: string;
  readonly redeemInstructions?: string;
}

export interface RedeemQrInput {
  readonly token: string;
  readonly clientRequestId: string;
}

export type RedeemQrResult = Envelope &
  (
    | {
        readonly ok: true;
        readonly huntId: string;
        readonly stationId: string;
        readonly alreadyUnlocked: boolean;
      }
    | { readonly ok: false; readonly reason: 'invalid_token' | 'hunt_not_live' }
  );

export type AnswerInput =
  | { readonly kind: 'option'; readonly optionId: string }
  | { readonly kind: 'text'; readonly value: string };

export interface SubmitAnswerInput {
  readonly huntId: string;
  readonly stationId: string;
  readonly answer: AnswerInput;
  readonly clientRequestId: string;
}

export type SubmitAnswerResult = Envelope &
  (
    | {
        readonly ok: true;
        readonly solved: true;
        readonly prize: Prize;
        readonly revealed: readonly StationId[];
        readonly completionPct: number;
      }
    | {
        readonly ok: false;
        readonly solved: false;
        readonly attemptsLeft: number;
        readonly retryAt: string | null;
      }
  );
