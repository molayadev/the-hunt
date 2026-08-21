export interface AttemptMeterProps {
  readonly attemptsLeft: number;
  readonly maxAttempts: number;
  readonly remainingMs: number | null;
}

export function AttemptMeter(props: AttemptMeterProps) {
  return <div>{props.maxAttempts}</div>;
}
