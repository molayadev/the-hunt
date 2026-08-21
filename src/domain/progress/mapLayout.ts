export interface MapPoint {
  readonly x: number;
  readonly y: number;
}

export function mapNodePosition(order: number, columns: number, spacing: number): MapPoint {
  const index = order - 1;
  const row = Math.floor(index / columns);
  const colInRow = index % columns;
  const col = row % 2 === 0 ? colInRow : columns - 1 - colInRow;
  return { x: col * spacing, y: row * spacing };
}

export function mapRowCount(total: number, columns: number): number {
  return Math.max(1, Math.ceil(total / columns));
}
