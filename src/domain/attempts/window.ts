export interface AttemptPolicy {
  readonly maxAttempts: number;
  readonly windowMs: number;
}

const isWithinWindow = (failedAt: number, now: number, policy: AttemptPolicy): boolean =>
  now - failedAt < policy.windowMs;

const activeFailures = (
  failures: readonly number[],
  now: number,
  policy: AttemptPolicy,
): number[] => failures.filter((at) => isWithinWindow(at, now, policy));

export function attemptsLeft(
  failures: readonly number[],
  now: number,
  policy: AttemptPolicy,
): number {
  return Math.max(0, policy.maxAttempts - activeFailures(failures, now, policy).length);
}

/** Moment the next attempt becomes available; null if attempts are already available. */
export function retryAt(
  failures: readonly number[],
  now: number,
  policy: AttemptPolicy,
): number | null {
  if (attemptsLeft(failures, now, policy) > 0) return null;
  const [oldest] = activeFailures(failures, now, policy).sort((a, b) => a - b);
  if (oldest === undefined) return null;
  return oldest + policy.windowMs;
}

/** Only the N most recent failures can influence the calculation. */
export function trimFailures(failures: readonly number[], policy: AttemptPolicy): number[] {
  return [...failures].sort((a, b) => b - a).slice(0, policy.maxAttempts);
}
