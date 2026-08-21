export interface ChallengeOption {
  readonly id: string;
  readonly text: string;
}

export type Challenge =
  | { readonly type: 'qr_only' }
  | {
      readonly type: 'multiple_choice';
      readonly question: string;
      readonly options: readonly ChallengeOption[];
    }
  | {
      readonly type: 'text';
      readonly question: string;
      readonly placeholder?: string;
      readonly hint?: string;
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
