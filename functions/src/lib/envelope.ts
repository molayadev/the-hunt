import type { Envelope } from '../domain/callables';

/** Toda callable devuelve serverNow (PLAN.md §5.4, §8.3, test 45). */
export function withServerNow<T extends object>(result: T): T & Envelope {
  return { ...result, serverNow: new Date().toISOString() };
}
