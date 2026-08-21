import { describe, expect, it } from 'vitest';
import { nodePosition } from './constellationLayout';

describe('nodePosition', () => {
  it('places the first node at the top of the circle', () => {
    const { x, y } = nodePosition(0, 4, 100);
    expect(x).toBeCloseTo(0);
    expect(y).toBeCloseTo(-100);
  });

  it('spaces nodes evenly around the circle', () => {
    const a = nodePosition(0, 4, 100);
    const b = nodePosition(1, 4, 100);
    const c = nodePosition(2, 4, 100);
    expect(b.x).toBeCloseTo(100);
    expect(b.y).toBeCloseTo(0);
    expect(c.x).toBeCloseTo(0);
    expect(c.y).toBeCloseTo(100);
    expect(a).not.toEqual(b);
  });

  it('every node is exactly radius away from the center', () => {
    for (let i = 0; i < 7; i++) {
      const { x, y } = nodePosition(i, 7, 50);
      expect(Math.hypot(x, y)).toBeCloseTo(50);
    }
  });

  it('a single-station hunt places its node at the center', () => {
    expect(nodePosition(0, 1, 100)).toEqual({ x: 0, y: 0 });
  });
});
