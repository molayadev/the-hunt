import type { AttemptPolicy } from '../../domain/attempts/window';
import type { AnswerInput } from '../../domain/callables';
import type { Card } from '../../shared/types/card';
import type { HuntSummary } from '../../shared/types/hunt';
import { useAttemptStatus } from './useAttemptStatus';
import type { AttemptStatus } from './useAttemptStatus';
import { useSubmitAnswer } from './useSubmitAnswer';

const NO_ATTEMPTS_POLICY: AttemptPolicy = { maxAttempts: 0, windowMs: 0 };

export function errorMessageFor(isOk: boolean | undefined, submitError: unknown): string | null {
  if (submitError) {
    const code = (submitError as { code?: string }).code;
    if (code === 'resource-exhausted') {
      return 'Sin intentos disponibles. Vuelve a intentarlo más tarde.';
    }
    return 'No se ha podido comprobar la respuesta. Inténtalo de nuevo.';
  }
  if (isOk === false) return 'Respuesta incorrecta. Inténtalo de nuevo.';
  return null;
}

export interface StationSolver {
  readonly policy: AttemptPolicy;
  readonly attemptStatus: AttemptStatus;
  readonly result: { readonly ok: boolean } | undefined;
  readonly errorMessage: string | null;
  readonly isPending: boolean;
  readonly submit: (answer: AnswerInput) => void;
}

export function useStationSolver(
  huntId: string,
  stationId: string,
  card: Card | undefined,
  hunt: HuntSummary | null,
): StationSolver {
  const policy: AttemptPolicy = hunt
    ? {
        maxAttempts: hunt.attemptPolicy.maxAttempts,
        windowMs: hunt.attemptPolicy.windowHours * 3_600_000,
      }
    : NO_ATTEMPTS_POLICY;
  const failures = card && card.state !== 'revealed' ? card.recentFailures : [];
  const attemptStatus = useAttemptStatus(failures, policy);
  const { mutate, data: result, error, isPending } = useSubmitAnswer();

  return {
    policy,
    attemptStatus,
    result,
    errorMessage: errorMessageFor(result?.ok, error),
    isPending,
    submit: (answer: AnswerInput) => {
      mutate({
        huntId,
        stationId,
        answer,
        clientRequestId: crypto.randomUUID(),
      });
    },
  };
}
