export type PlatformTileKind = 'left-cap' | 'center' | 'right-cap';
export type PlatformTileDecoration = 'plain' | 'cyan' | 'red-center';

export const PLATFORM_CAP_WIDTH = 18;
export const PLATFORM_CENTER_TILE_WIDTH = 36;

export interface PlatformTile {
  kind: PlatformTileKind;
  width: number;
  x: number;
  decoration?: PlatformTileDecoration;
}

export function buildPlatformTileLayout(
  totalWidth: number,
  capWidth = PLATFORM_CAP_WIDTH,
  centerTileWidth = PLATFORM_CENTER_TILE_WIDTH,
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

export function isSymmetricPlatformWidth(
  totalWidth: number,
  capWidth = PLATFORM_CAP_WIDTH,
  centerTileWidth = PLATFORM_CENTER_TILE_WIDTH,
): boolean {
  const centerSpan = totalWidth - capWidth * 2;
  if (centerSpan <= 0) {
    return false;
  }

  const centerCount = centerSpan / centerTileWidth;
  return Number.isInteger(centerCount) && centerCount % 2 === 1;
}

export function buildSymmetricPlatformTileLayout(
  totalWidth: number,
  capWidth = PLATFORM_CAP_WIDTH,
  centerTileWidth = PLATFORM_CENTER_TILE_WIDTH,
): PlatformTile[] {
  if (!isSymmetricPlatformWidth(totalWidth, capWidth, centerTileWidth)) {
    throw new Error('Symmetric platform width must contain an odd number of full center tiles.');
  }

  const centerCount = (totalWidth - capWidth * 2) / centerTileWidth;
  const centerIndex = Math.floor(centerCount / 2);
  const tiles: PlatformTile[] = [
    { kind: 'left-cap', width: capWidth, x: -totalWidth / 2 + capWidth / 2 },
  ];

  for (let index = 0; index < centerCount; index += 1) {
    const distanceFromCenter = Math.abs(index - centerIndex);
    const decoration: PlatformTileDecoration =
      distanceFromCenter === 0 ? 'red-center' : distanceFromCenter % 2 === 1 ? 'cyan' : 'plain';

    tiles.push({
      kind: 'center',
      width: centerTileWidth,
      x: (index - centerIndex) * centerTileWidth,
      decoration,
    });
  }

  tiles.push({
    kind: 'right-cap',
    width: capWidth,
    x: totalWidth / 2 - capWidth / 2,
  });

  return tiles;
}
