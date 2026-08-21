export interface MapPoint {
  readonly x: number;
  readonly y: number;
}

export function mapNodePosition(order: number, columns: number, spacing: number): MapPoint {
  void order;
  void columns;
  void spacing;
  return { x: 0, y: 0 };
}

export function mapRowCount(total: number, columns: number): number {
  void total;
  void columns;
  return 1;
}
