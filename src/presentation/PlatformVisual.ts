import Phaser from 'phaser';
import { buildPlatformTileLayout, type PlatformTile } from './platformTiles';

const CAP_WIDTH = 18;
const CENTER_TILE_WIDTH = 36;
const FLOATING_PLATFORM_DEPTH = 25;

const METAL_TOP = 0x56616c;
const METAL_HIGHLIGHT = 0x89949e;
const METAL_FACE = 0x303842;
const METAL_INSET = 0x202730;
const UNDERSIDE = 0x151a20;
const SEAM = 0x0c1015;
const CYAN = 0x42d9e8;
const RED_SCRATCH = 0x8d3033;

export interface PlatformVisualOptions {
  visualDepth?: number;
  showAccent?: boolean;
}

export function drawIndustrialPlatform(
  scene: Phaser.Scene,
  x: number,
  collisionY: number,
  width: number,
  collisionHeight: number,
  options: PlatformVisualOptions = {},
): Phaser.GameObjects.Graphics {
  const visualDepth = options.visualDepth ?? FLOATING_PLATFORM_DEPTH;
  const top = collisionY - collisionHeight / 2;
  const graphics = scene.add.graphics().setPosition(x, top).setDepth(5);
  const tiles = buildPlatformTileLayout(width, CAP_WIDTH, CENTER_TILE_WIDTH);

  drawUnderside(graphics, width, visualDepth);
  tiles.forEach((tile, index) => drawTile(graphics, tile, index, visualDepth, options));
  return graphics;
}

function drawUnderside(
  graphics: Phaser.GameObjects.Graphics,
  width: number,
  visualDepth: number,
): void {
  graphics.fillStyle(UNDERSIDE, 1);
  graphics.fillRect(-width / 2 + 4, 13, width - 8, Math.max(4, visualDepth - 13));

  graphics.fillStyle(SEAM, 0.9);
  graphics.fillRect(-width / 2 + 8, visualDepth - 3, width - 16, 2);
}

function drawTile(
  graphics: Phaser.GameObjects.Graphics,
  tile: PlatformTile,
  index: number,
  visualDepth: number,
  options: PlatformVisualOptions,
): void {
  const left = tile.x - tile.width / 2;
  const right = left + tile.width;

  graphics.fillStyle(METAL_FACE, 1);
  graphics.fillRect(left, 4, tile.width, 11);

  graphics.fillStyle(METAL_TOP, 1);
  graphics.fillRect(left, 0, tile.width, 5);

  graphics.fillStyle(METAL_HIGHLIGHT, 0.78);
  graphics.fillRect(left + 1, 0, Math.max(1, tile.width - 2), 1);

  graphics.fillStyle(METAL_INSET, 1);
  graphics.fillRect(left + 4, 7, Math.max(2, tile.width - 8), 5);

  graphics.fillStyle(SEAM, 0.85);
  graphics.fillRect(right - 1, 2, 1, Math.min(15, visualDepth));

  graphics.fillStyle(0xa8b1b9, 0.55);
  graphics.fillRect(left + 4, 3, 1, 1);
  graphics.fillRect(right - 5, 3, 1, 1);

  if (tile.kind === 'left-cap') {
    graphics.fillStyle(METAL_FACE, 1);
    graphics.fillTriangle(left, 7, left + 6, 15, left + 6, visualDepth - 2);
  } else if (tile.kind === 'right-cap') {
    graphics.fillStyle(METAL_FACE, 1);
    graphics.fillTriangle(right, 7, right - 6, 15, right - 6, visualDepth - 2);
  } else if (options.showAccent !== false && index % 2 === 0) {
    const accentWidth = Math.min(18, Math.max(8, tile.width - 12));
    graphics.fillStyle(CYAN, 0.9);
    graphics.fillRect(tile.x - accentWidth / 2, 14, accentWidth, 2);
    graphics.fillStyle(CYAN, 0.18);
    graphics.fillRect(tile.x - accentWidth / 2 - 2, 13, accentWidth + 4, 4);
  }

  if (tile.kind === 'center' && index === 3 && tile.width >= 20) {
    graphics.fillStyle(RED_SCRATCH, 0.7);
    graphics.fillRect(tile.x + 2, 2, 7, 1);
    graphics.fillRect(tile.x + 6, 3, 5, 1);
  }
}
