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

// `clue` es la pista que lleva *a* esa estación (PLAN.md §3.1): revelar las
// vecinas de N es simplemente exponer los IDs de N-1 y N+1, si existen.
function neighboursOf(stationId: string, orderedStationIds: readonly string[]): string[] {
  const idx = orderedStationIds.indexOf(stationId);
  if (idx === -1) return [];
  const neighbours: string[] = [];
  const prev = orderedStationIds[idx - 1];
  const next = orderedStationIds[idx + 1];
  if (prev !== undefined) neighbours.push(prev);
  if (next !== undefined) neighbours.push(next);
  return neighbours;
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
    ...neighboursOf(event.stationId, orderedStationIds),
  ]);
  const completedAt = state.completedAt ?? (solvedStationIds.length === totalCount ? now : null);

  return { ...state, solvedStationIds, revealedStationIds, completedAt };
}

export function completionPct(state: ProgressState, totalCount: number): number {
  if (totalCount === 0) return 0;
  // Nunca se redondea hacia arriba: 11/12 debe mostrar 91 %, jamás 100 %.
  return Math.floor((state.solvedStationIds.length / totalCount) * 100);
}

export function isComplete(state: ProgressState, totalCount: number): boolean {
  return state.solvedStationIds.length === totalCount;
}
