import { describe, expect, it } from 'vitest';
import { buildStoneFloorPattern } from './StoneFloorVisual';

describe('buildStoneFloorPattern', () => {
  it('covers the requested width without gaps across staggered rows', () => {
    const pattern = buildStoneFloorPattern(960, 38);

    expect(pattern.length).toBeGreaterThan(0);

    const rows = new Map<number, typeof pattern>();
    for (const stone of pattern) {
      const row = rows.get(stone.row) ?? [];
      row.push(stone);
      rows.set(stone.row, row);
    }

    for (const stones of rows.values()) {
      const left = Math.min(...stones.map((stone) => stone.x - stone.width / 2));
      const right = Math.max(...stones.map((stone) => stone.x + stone.width / 2));
      expect(left).toBeLessThanOrEqual(-480);
      expect(right).toBeGreaterThanOrEqual(480);
    }
  });

  it('staggeres alternate rows so vertical joints do not align', () => {
    const pattern = buildStoneFloorPattern(360, 38);
    const firstRow = pattern.filter((stone) => stone.row === 0);
    const secondRow = pattern.filter((stone) => stone.row === 1);

    expect(firstRow.length).toBeGreaterThan(0);
    expect(secondRow.length).toBeGreaterThan(0);
    expect(secondRow[0].x).not.toBe(firstRow[0].x);
  });
});
