import { describe, expect, it } from 'vitest';
import { mapNodePosition, mapRowCount } from './mapLayout';

describe('mapNodePosition', () => {
  it('places the first row left to right', () => {
    expect(mapNodePosition(1, 2, 10)).toEqual({ x: 0, y: 0 });
    expect(mapNodePosition(2, 2, 10)).toEqual({ x: 10, y: 0 });
  });

  it('reverses the second row, snaking down from the last column', () => {
    expect(mapNodePosition(3, 2, 10)).toEqual({ x: 10, y: 10 });
    expect(mapNodePosition(4, 2, 10)).toEqual({ x: 0, y: 10 });
  });

  it('reverses back for the third row, snaking down from the first column', () => {
    expect(mapNodePosition(5, 2, 10)).toEqual({ x: 0, y: 20 });
    expect(mapNodePosition(6, 2, 10)).toEqual({ x: 10, y: 20 });
  });

  it('supports wider rows', () => {
    expect(mapNodePosition(1, 3, 10)).toEqual({ x: 0, y: 0 });
    expect(mapNodePosition(3, 3, 10)).toEqual({ x: 20, y: 0 });
    expect(mapNodePosition(4, 3, 10)).toEqual({ x: 20, y: 10 });
    expect(mapNodePosition(6, 3, 10)).toEqual({ x: 0, y: 10 });
  });
});

describe('mapRowCount', () => {
  it('counts full and partial rows', () => {
    expect(mapRowCount(6, 2)).toBe(3);
    expect(mapRowCount(5, 2)).toBe(3);
    expect(mapRowCount(1, 2)).toBe(1);
  });

  it('never returns fewer than one row', () => {
    expect(mapRowCount(0, 2)).toBe(1);
  });
});
