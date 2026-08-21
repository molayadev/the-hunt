export interface AttemptHeartsProps {
  readonly attemptsLeft: number;
  readonly maxAttempts: number;
}

export function AttemptHearts({ attemptsLeft, maxAttempts }: AttemptHeartsProps) {
  const hearts = Array.from({ length: maxAttempts }, (_, index) => index < attemptsLeft);

  return (
    <div
      role="status"
      aria-label={`${String(attemptsLeft)} de ${String(maxAttempts)} intentos restantes`}
      className="flex gap-1 text-lg"
    >
      {hearts.map((filled, index) => (
        <span
          key={index}
          data-testid={`heart-${String(index)}`}
          data-filled={filled}
          aria-hidden="true"
          className={filled ? 'text-primary' : 'text-muted opacity-40'}
        >
          ♥
        </span>
      ))}
    </div>
  );
}
