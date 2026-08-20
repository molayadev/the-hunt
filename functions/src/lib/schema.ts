// Formas de los documentos de Firestore que solo tocan las Cloud Functions
// (Admin SDK). Ver PLAN.md §3. El cliente nunca lee estas colecciones
// directamente: firestore.rules se lo impide.

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
  readonly recentFailures?: readonly number[]; // solo si attemptPolicy.scope === 'hunt'
  readonly completedAt?: number;
}

export type CardStateDoc = 'unlocked' | 'solved';

export interface CardDoc {
  readonly order: number;
  readonly title: string;
  readonly clue: string;
  readonly challenge: ChallengeDoc;
  readonly state: CardStateDoc;
  readonly recentFailures: readonly number[]; // acotado a maxAttempts
  readonly prize?: PrizeDoc;
}
