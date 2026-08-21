import type { WonPrize } from './solvedPrizes';

export interface PrizeWalletProps {
  readonly prizes: readonly WonPrize[];
}

export function PrizeWallet(props: PrizeWalletProps) {
  return <p>{props.prizes.length}</p>;
}
