import type { AttemptPolicy } from '../../domain/attempts/window';

export interface AttemptStatus {
  readonly attemptsLeft: number;
  readonly retryAt: number | null;
}

export function useAttemptStatus(
  failures: readonly number[],
  policy: AttemptPolicy,
): AttemptStatus {
  return { attemptsLeft: failures.length + policy.maxAttempts, retryAt: -1 };
}
