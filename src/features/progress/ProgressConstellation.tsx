export interface ConstellationStation {
  readonly id: string;
  readonly order: number;
  readonly solved: boolean;
}

export interface ProgressConstellationProps {
  readonly stations: readonly ConstellationStation[];
  readonly totalCount: number;
  readonly solvedCount: number;
  readonly completionPct: number;
}

export function ProgressConstellation(props: ProgressConstellationProps) {
  return <div>{props.totalCount}</div>;
}
