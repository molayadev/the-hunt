import type { Envelope } from '../domain/callables';

export function withServerNow<T extends object>(result: T): T & Envelope {
  return { ...result, serverNow: new Date().toISOString() };
}
