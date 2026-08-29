import { describe, expect, it } from 'vitest';
import { buildPlatformTileLayout } from './platformTiles';

describe('buildPlatformTileLayout', () => {
  it('covers the requested width with two caps and repeatable center tiles', () => {
    const layout = buildPlatformTileLayout(202.5, 18, 36);

    expect(layout[0]).toMatchObject({ kind: 'left-cap', width: 18 });
    expect(layout.at(-1)).toMatchObject({ kind: 'right-cap', width: 18 });
    expect(layout.filter((tile) => tile.kind === 'center').length).toBeGreaterThan(0);

    const totalWidth = layout.reduce((sum, tile) => sum + tile.width, 0);
    expect(totalWidth).toBeCloseTo(202.5);
  });

  it('keeps the final center segment within the repeatable tile width', () => {
    const layout = buildPlatformTileLayout(175.5, 18, 36);
    const centers = layout.filter((tile) => tile.kind === 'center');

    expect(centers.every((tile) => tile.width > 0 && tile.width <= 36)).toBe(true);
  });
});
