export type PlatformTileKind = 'left-cap' | 'center' | 'right-cap';

export interface PlatformTile {
  kind: PlatformTileKind;
  width: number;
  x: number;
}

export function buildPlatformTileLayout(
  totalWidth: number,
  capWidth = 18,
  centerTileWidth = 36,
): PlatformTile[] {
  if (totalWidth <= capWidth * 2) {
    throw new Error('Platform width must leave room for both caps.');
  }

  const tiles: PlatformTile[] = [];
  let cursor = -totalWidth / 2;

  tiles.push({ kind: 'left-cap', width: capWidth, x: cursor + capWidth / 2 });
  cursor += capWidth;

  let remaining = totalWidth - capWidth * 2;
  while (remaining > 0) {
    const width = Math.min(centerTileWidth, remaining);
    tiles.push({ kind: 'center', width, x: cursor + width / 2 });
    cursor += width;
    remaining -= width;
  }

  tiles.push({ kind: 'right-cap', width: capWidth, x: cursor + capWidth / 2 });
  return tiles;
}
