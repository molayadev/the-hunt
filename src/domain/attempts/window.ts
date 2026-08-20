export interface AttemptPolicy {
  readonly maxAttempts: number;
  readonly windowMs: number;
}

// Un fallo con timestamp futuro (reloj del servidor adelantado por error) se
// trata como si acabara de ocurrir: cuenta como activo. Ignorarlo dejaría
// "desaparecer" un fallo real y devolvería intentos de más — ver test 9,
// PLAN.md §7.3 y la invariante 6 (nunca más de maxAttempts).
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

/** Instante en que se recupera el próximo intento. null si ya hay intentos disponibles. */
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

/** Solo importan los N más recientes: el resto ya no puede influir en el cálculo. */
export function trimFailures(failures: readonly number[], policy: AttemptPolicy): number[] {
  return [...failures].sort((a, b) => b - a).slice(0, policy.maxAttempts);
}
