import type { WonPrize } from './solvedPrizes';

export interface PrizeWalletProps {
  readonly prizes: readonly WonPrize[];
}

export function PrizeWallet({ prizes }: PrizeWalletProps) {
  if (prizes.length === 0) {
    return (
      <p className="p-6 text-center text-muted-foreground">
        Todavía no has ganado ningún premio. ¡Sigue resolviendo estaciones!
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {prizes.map((won) => (
        <li key={won.stationId} className="rounded-md border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">{won.stationTitle}</p>
          <p className="font-display text-lg font-semibold text-primary">{won.prize.title}</p>
          {won.prize.kind === 'physical' && won.prize.redeemInstructions && (
            <p className="mt-1 text-sm text-muted-foreground">{won.prize.redeemInstructions}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
