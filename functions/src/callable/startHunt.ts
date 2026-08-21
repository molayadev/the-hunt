import type { StartHuntInput, StartHuntResult } from '../domain/callables';

export function startHuntHandler(input: StartHuntInput, uid: string): Promise<StartHuntResult> {
  void input;
  void uid;
  throw new Error('not implemented');
}
