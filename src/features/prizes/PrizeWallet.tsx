import { isUrl } from '../../domain/station/isUrl';
import type { WonPrize } from './solvedPrizes';

export interface PrizeWalletProps {
  readonly prizes: readonly WonPrize[];
}

function PrizeLinkOrText({ value, linkLabel }: { value: string; linkLabel: string }) {
  if (isUrl(value)) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noreferrer"
        className="mt-1 inline-block text-sm font-medium text-primary underline"
      >
        {linkLabel}
      </a>
    );
  }
  return <p className="mt-1 text-sm text-muted-foreground">{value}</p>;
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
            <PrizeLinkOrText value={won.prize.redeemInstructions} linkLabel="Ver ubicación" />
          )}
          {won.prize.kind === 'digital' && won.prize.payload && (
            <PrizeLinkOrText value={won.prize.payload} linkLabel="Abrir" />
          )}
        </li>
      ))}
    </ul>
  );
}
