// Admin-SDK-only document shapes; firestore.rules blocks all direct client access.
export interface AttemptPolicyDoc {
  readonly maxAttempts: number;
  readonly windowHours: number;
  readonly scope: 'station' | 'hunt';
}

export interface HuntDoc {
  readonly title: string;
  readonly tagline?: string;
  readonly coverUrl?: string;
  readonly status: 'draft' | 'live' | 'closed';
  readonly visibility: 'public' | 'code';
  readonly joinCode?: string;
  readonly stationCount: number;
  readonly attemptPolicy: AttemptPolicyDoc;
  readonly createdBy: string;
  // A hunt is authored in a single fixed language; questions/answers are
  // never translated within one hunt. Offering the same hunt in another
  // language means the creation app makes a second hunt.
  readonly language: 'es' | 'en';
}

export type ChallengeDoc =
  | { readonly type: 'qr_only' }
  | {
      readonly type: 'multiple_choice';
      readonly question: string;
      readonly options: readonly { readonly id: string; readonly text: string }[];
    }
  | {
      readonly type: 'text';
      readonly question: string;
      readonly placeholder?: string;
      readonly hint?: string;
    };

export interface PrizeDoc {
  readonly kind: 'digital' | 'physical';
  readonly title: string;
  readonly payload?: string;
  readonly redeemInstructions?: string;
}

export interface StationDoc {
  readonly order: number;
  readonly title: string;
  readonly clue: string;
  readonly coverUrl?: string;
  readonly challenge: ChallengeDoc;
  readonly prize: PrizeDoc;
}

export interface StationAnswerDoc {
  readonly correctOptionId?: string;
  readonly acceptedAnswers?: readonly string[];
}

export interface QrTokenDoc {
  readonly huntId: string;
  readonly stationId: string;
  readonly active: boolean;
  readonly channel: 'physical' | 'social';
  readonly redeemCount: number;
}

export interface ProgressDoc {
  readonly uid: string;
  readonly huntId: string;
  readonly solvedStationIds: readonly string[];
  readonly unlockedStationIds: readonly string[];
  readonly revealedStationIds: readonly string[];
  readonly solvedCount: number;
  readonly totalCount: number;
  readonly completionPct: number;
  readonly recentFailures?: readonly number[]; // present only when attemptPolicy.scope === 'hunt'
  readonly completedAt?: number;
}

export type CardStateDoc = 'revealed' | 'unlocked' | 'solved';

interface CardBaseDoc {
  readonly order: number;
  readonly title: string;
  readonly clue: string;
}

export type CardDoc =
  | (CardBaseDoc & { readonly state: 'revealed' })
  | (CardBaseDoc & {
      readonly state: 'unlocked';
      readonly challenge: ChallengeDoc;
      readonly recentFailures: readonly number[]; // bounded to maxAttempts entries
    })
  | (CardBaseDoc & {
      readonly state: 'solved';
      readonly challenge: ChallengeDoc;
      readonly recentFailures: readonly number[];
      readonly prize: PrizeDoc;
    });
