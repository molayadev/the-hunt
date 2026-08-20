export interface ProgressState {
  readonly solvedStationIds: readonly string[];
  readonly unlockedStationIds: readonly string[];
  readonly revealedStationIds: readonly string[];
  readonly completedAt: number | null;
}

export const emptyProgress: ProgressState = Object.freeze({
  solvedStationIds: [],
  unlockedStationIds: [],
  revealedStationIds: [],
  completedAt: null,
});

export interface SolveEvent {
  readonly type: 'solve';
  readonly stationId: string;
}

const uniq = (ids: readonly string[]): string[] => [...new Set(ids)];

function neighbouringStationIds(stationId: string, orderedStationIds: readonly string[]): string[] {
  const index = orderedStationIds.indexOf(stationId);
  if (index === -1) return [];
  const previousStationId = orderedStationIds[index - 1];
  const nextStationId = orderedStationIds[index + 1];
  return [previousStationId, nextStationId].filter((id) => id !== undefined);
}

export function applySolve(
  state: ProgressState,
  event: SolveEvent,
  orderedStationIds: readonly string[],
  totalCount: number,
  now: number,
): ProgressState {
  const solvedStationIds = uniq([...state.solvedStationIds, event.stationId]);
  const revealedStationIds = uniq([
    ...state.revealedStationIds,
    ...neighbouringStationIds(event.stationId, orderedStationIds),
  ]);
  const completedAt = state.completedAt ?? (solvedStationIds.length === totalCount ? now : null);

  return { ...state, solvedStationIds, revealedStationIds, completedAt };
}

export function completionPct(state: ProgressState, totalCount: number): number {
  if (totalCount === 0) return 0;
  return Math.floor((state.solvedStationIds.length / totalCount) * 100);
}

export function isComplete(state: ProgressState, totalCount: number): boolean {
  return state.solvedStationIds.length === totalCount;
}
