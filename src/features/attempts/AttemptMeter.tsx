import { formatCountdown } from '../../domain/time/formatCountdown';

export interface AttemptMeterProps {
  readonly attemptsLeft: number;
  readonly maxAttempts: number;
  readonly remainingMs: number | null;
}

export function AttemptMeter({ attemptsLeft, maxAttempts, remainingMs }: AttemptMeterProps) {
  if (attemptsLeft === 0 && remainingMs !== null) {
    return (
      <p className="text-sm text-muted-foreground">
        Sin intentos. Vuelves a tener uno en {formatCountdown(remainingMs)}.
      </p>
    );
  }

  return (
    <p className="text-sm text-muted-foreground">
      {attemptsLeft} / {maxAttempts}
    </p>
  );
}
