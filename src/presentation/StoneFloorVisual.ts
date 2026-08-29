import Phaser from 'phaser';

export interface StoneFloorBlock {
  row: number;
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  tone: number;
  chipped: boolean;
  cracked: boolean;
}

const STONE_BASE_WIDTHS = [22, 28, 20, 26, 30, 18, 24] as const;
const STONE_TONES = [0x34343b, 0x3a3940, 0x302f36, 0x3d3c43, 0x36353c] as const;
const MORTAR = 0x17171d;
const TOP_HIGHLIGHT = 0x5a5960;
const LOWER_SHADOW = 0x24242a;
const CRACK = 0x202027;

export function buildStoneFloorPattern(width: number, height: number): StoneFloorBlock[] {
  const rowCount = Math.max(2, Math.ceil(height / 19));
  const rowHeight = height / rowCount;
  const halfWidth = width / 2;
  const blocks: StoneFloorBlock[] = [];

  for (let row = 0; row < rowCount; row += 1) {
    let index = 0;
    let cursor = -halfWidth - (row % 2 === 1 ? 12 : 0);

    while (cursor < halfWidth) {
      const nominalWidth = STONE_BASE_WIDTHS[(index + row * 2) % STONE_BASE_WIDTHS.length];
      const blockWidth = Math.min(nominalWidth, halfWidth - cursor + nominalWidth);
      const tone = STONE_TONES[(index * 3 + row) % STONE_TONES.length];

      blocks.push({
        row,
        index,
        x: cursor + blockWidth / 2,
        y: row * rowHeight + rowHeight / 2,
        width: blockWidth,
        height: rowHeight,
        tone,
        chipped: (index + row * 3) % 5 === 2,
        cracked: (index * 2 + row) % 7 === 3,
      });

      cursor += blockWidth;
      index += 1;
    }
  }

  return blocks;
}

export function drawStoneFloor(
  scene: Phaser.Scene,
  x: number,
  collisionY: number,
  width: number,
  collisionHeight: number,
): Phaser.GameObjects.Graphics {
  const top = collisionY - collisionHeight / 2;
  const graphics = scene.add.graphics().setPosition(x, top).setDepth(5);
  const pattern = buildStoneFloorPattern(width, collisionHeight);

  graphics.fillStyle(MORTAR, 1);
  graphics.fillRect(-width / 2, 0, width, collisionHeight);

  for (const stone of pattern) {
    drawStone(graphics, stone);
  }

  return graphics;
}

function drawStone(graphics: Phaser.GameObjects.Graphics, stone: StoneFloorBlock): void {
  const gap = 1.5;
  const left = stone.x - stone.width / 2 + gap;
  const top = stone.y - stone.height / 2 + gap;
  const drawWidth = Math.max(2, stone.width - gap * 2);
  const drawHeight = Math.max(2, stone.height - gap * 2);

  graphics.fillStyle(stone.tone, 1);

  if (stone.chipped && drawWidth > 14) {
    graphics.fillTriangle(left, top + 4, left + 4, top, left + 4, top + 4);
    graphics.fillRect(left + 3, top, drawWidth - 3, drawHeight);
  } else {
    graphics.fillRect(left, top, drawWidth, drawHeight);
  }

  graphics.fillStyle(TOP_HIGHLIGHT, 0.38);
  graphics.fillRect(left + 2, top + 1, Math.max(2, drawWidth - 4), 1);

  graphics.fillStyle(LOWER_SHADOW, 0.65);
  graphics.fillRect(left + 2, top + drawHeight - 2, Math.max(2, drawWidth - 4), 1.5);

  if (stone.cracked && drawWidth > 18) {
    const crackX = left + drawWidth * 0.58;
    graphics.lineStyle(1, CRACK, 0.9);
    graphics.beginPath();
    graphics.moveTo(crackX, top + 3);
    graphics.lineTo(crackX - 2, top + drawHeight * 0.45);
    graphics.lineTo(crackX + 1, top + drawHeight - 4);
    graphics.strokePath();
  }
}
