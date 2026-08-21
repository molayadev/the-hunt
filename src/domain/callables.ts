// Shared contract between the player client and Cloud Functions (linked into
// functions/src/domain). A breaking change here breaks the route-builder app.
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

export interface StartHuntInput {
  readonly huntId: string;
  readonly clientRequestId: string;
}

// Joining a hunt unlocks its first station automatically: a player has no
// way to know where a physical QR code is until they've been pointed at
// something, so the entry point can't itself require scanning one.
export type StartHuntResult = Envelope &
  (
    | {
        readonly ok: true;
        readonly huntId: string;
        readonly stationId: string;
        readonly alreadyUnlocked: boolean;
      }
    | { readonly ok: false; readonly reason: 'hunt_not_live' | 'no_stations' }
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
