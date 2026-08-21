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

// An option's presentation is per-option, not per-challenge: a single
// single_option/multiple_option question can mix text and image choices.
export type ChallengeOptionDoc =
  | { readonly id: string; readonly kind: 'text'; readonly text: string }
  | {
      readonly id: string;
      readonly kind: 'image';
      readonly imageUrl: string;
      readonly alt: string;
    };

export type ChallengeDoc =
  | { readonly type: 'qr_only' }
  | {
      readonly type: 'text';
      readonly question: string;
      readonly placeholder?: string;
      readonly hint?: string;
    }
  | {
      readonly type: 'single_option';
      readonly question: string;
      readonly options: readonly ChallengeOptionDoc[];
    }
  | {
      readonly type: 'multiple_option';
      readonly question: string;
      readonly options: readonly ChallengeOptionDoc[];
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
  readonly acceptedAnswers?: readonly string[]; // 'text'
  readonly correctOptionId?: string; // 'single_option'
  readonly correctOptionIds?: readonly string[]; // 'multiple_option' — exact set
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
