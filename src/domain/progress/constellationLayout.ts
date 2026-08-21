export interface Point {
  readonly x: number;
  readonly y: number;
}

export function nodePosition(index: number, total: number, radius: number): Point {
  return { x: index, y: total + radius };
}
