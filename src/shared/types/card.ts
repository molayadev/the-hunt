// An option's presentation is per-option, not per-challenge: a single
// single_option/multiple_option question can mix text and image choices.
export type ChallengeOption =
  | { readonly id: string; readonly kind: 'text'; readonly text: string }
  | {
      readonly id: string;
      readonly kind: 'image';
      readonly imageUrl: string;
      readonly alt: string;
    };

export type Challenge =
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
      readonly options: readonly ChallengeOption[];
    }
  | {
      readonly type: 'multiple_option';
      readonly question: string;
      readonly options: readonly ChallengeOption[];
    };

export interface Prize {
  readonly kind: 'digital' | 'physical';
  readonly title: string;
  readonly payload?: string;
  readonly redeemInstructions?: string;
}

interface CardBase {
  readonly id: string;
  readonly order: number;
  readonly title: string;
  readonly clue: string;
}

export type Card =
  | (CardBase & { readonly state: 'revealed' })
  | (CardBase & {
      readonly state: 'unlocked';
      readonly challenge: Challenge;
      readonly recentFailures: readonly number[];
    })
  | (CardBase & {
      readonly state: 'solved';
      readonly challenge: Challenge;
      readonly recentFailures: readonly number[];
      readonly prize: Prize;
    });
