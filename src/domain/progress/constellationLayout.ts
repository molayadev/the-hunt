export interface Point {
  readonly x: number;
  readonly y: number;
}

export function nodePosition(index: number, total: number, radius: number): Point {
  if (total <= 1) return { x: 0, y: 0 };
  const angle = (2 * Math.PI * index) / total - Math.PI / 2;
  return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) };
}
