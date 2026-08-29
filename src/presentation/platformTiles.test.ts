import { describe, expect, it } from 'vitest';
import {
  buildPlatformTileLayout,
  buildSymmetricPlatformTileLayout,
  isSymmetricPlatformWidth,
} from './platformTiles';

describe('buildPlatformTileLayout', () => {
  it('covers an arbitrary requested width for continuous surfaces', () => {
    const layout = buildPlatformTileLayout(202.5, 18, 36);

    expect(layout[0]).toMatchObject({ kind: 'left-cap', width: 18 });
    expect(layout.at(-1)).toMatchObject({ kind: 'right-cap', width: 18 });

    const totalWidth = layout.reduce((sum, tile) => sum + tile.width, 0);
    expect(totalWidth).toBeCloseTo(202.5);
  });
});

describe('buildSymmetricPlatformTileLayout', () => {
  it('builds an odd number of full center tiles mirrored around x=0', () => {
    const layout = buildSymmetricPlatformTileLayout(216, 18, 36);
    const centers = layout.filter((tile) => tile.kind === 'center');

    expect(centers).toHaveLength(5);
    expect(centers.map((tile) => tile.width)).toEqual([36, 36, 36, 36, 36]);
    expect(centers.map((tile) => tile.x)).toEqual([-72, -36, 0, 36, 72]);
  });

  it('mirrors cyan accents around one red center detail', () => {
    const layout = buildSymmetricPlatformTileLayout(216, 18, 36);
    const decorations = layout
      .filter((tile) => tile.kind === 'center')
      .map((tile) => tile.decoration);

    expect(decorations).toEqual(['plain', 'cyan', 'red-center', 'cyan', 'plain']);
  });

  it('recognizes only widths compatible with odd repeatable center counts', () => {
    expect(isSymmetricPlatformWidth(216, 18, 36)).toBe(true);
    expect(isSymmetricPlatformWidth(144, 18, 36)).toBe(true);
    expect(isSymmetricPlatformWidth(202.5, 18, 36)).toBe(false);
    expect(isSymmetricPlatformWidth(175.5, 18, 36)).toBe(false);
  });
});
