import { useEffect, useState } from 'react';
import type { AttemptPolicy } from '../../domain/attempts/window';
import {
  attemptsLeft as computeAttemptsLeft,
  retryAt as computeRetryAt,
} from '../../domain/attempts/window';

export interface AttemptStatus {
  readonly attemptsLeft: number;
  readonly retryAt: number | null;
}

export function useAttemptStatus(
  failures: readonly number[],
  policy: AttemptPolicy,
): AttemptStatus {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return {
    attemptsLeft: computeAttemptsLeft(failures, now, policy),
    retryAt: computeRetryAt(failures, now, policy),
  };
}
