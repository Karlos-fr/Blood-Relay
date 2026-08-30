import Phaser from 'phaser';
import { attachArenaBackdropAnimation } from './ArenaBackdropAnimation';
import { buildRoundedOrthogonalPath, type PipePathSegment, type PipePoint } from './pipeGeometry';

export interface ArenaWallPanel {
  x: number;
  y: number;
  width: number;
  height: number;
  tone: number;
  repaired: boolean;
}

export interface ArenaPipe {
  points: PipePoint[];
  thickness: number;
  accent: 'none' | 'red';
}

export interface ArenaRelayMachine {
  x: number;
  y: number;
  radius: number;
}

export interface ArenaBackdropLayout {
  panels: ArenaWallPanel[];
  pipes: ArenaPipe[];
  machine: ArenaRelayMachine;
}

const WALL = 0x0d0e13;
const PANEL_STROKE = 0x22242d;
const PANEL_TONES = [0x111219, 0x14151c, 0x171820, 0x12131a] as const;
const REPAIR = 0x262832;
const PIPE_DARK = 0x262a32;
const PIPE_EDGE = 0x565b66;
const PIPE_RED = 0x9d2734;
const PIPE_RED_HIGHLIGHT = 0xeb4553;
const MACHINE_DARK = 0x171920;
const MACHINE_MID = 0x292c35;
const MACHINE_EDGE = 0x626775;
const MACHINE_RED = 0xb32d3a;
const MACHINE_RED_DARK = 0x40151b;

export function buildArenaBackdropLayout(
  width: number,
  height: number,
  seed: string,
): ArenaBackdropLayout {
  const random = createSeededRandom(seed);
  const panels: ArenaWallPanel[] = [];
  const columns = 5;
  const rows = 4;
  const cellWidth = width / columns;
  const cellHeight = height / rows;

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const insetX = 5 + Math.floor(random() * 9);
      const insetY = 5 + Math.floor(random() * 7);
      panels.push({
        x: column * cellWidth + cellWidth / 2 + Math.floor((random() - 0.5) * 8),
        y: row * cellHeight + cellHeight / 2 + Math.floor((random() - 0.5) * 6),
        width: cellWidth - insetX * 2,
        height: cellHeight - insetY * 2,
        tone: PANEL_TONES[Math.floor(random() * PANEL_TONES.length)],
        repaired: random() > 0.78,
      });
    }
  }

  const machine = {
    x: width / 2,
    y: Math.min(142, height * 0.29),
    radius: 110,
  };

  const laneFractions = [0.19, 0.48, 0.79] as const;
  const laneYs = laneFractions.map((fraction) => height * fraction + (random() - 0.5) * 18);
  const portOffsets = [-0.58, 0, 0.58] as const;
  const pipes: ArenaPipe[] = [];

  for (let pairIndex = 0; pairIndex < 3; pairIndex += 1) {
    for (const fromLeft of [true, false]) {
      const side = fromLeft ? -1 : 1;
      const startX = fromLeft ? -24 : width + 24;
      const startY = laneYs[pairIndex] + (random() - 0.5) * 10;
      const edgeX = fromLeft
        ? 78 + random() * 96
        : width - 78 - random() * 96;
      const portAngle = fromLeft
        ? Math.PI - portOffsets[pairIndex]
        : portOffsets[pairIndex];
      const port = {
        x: machine.x + Math.cos(portAngle) * (machine.radius - 3),
        y: machine.y + Math.sin(portAngle) * (machine.radius - 3),
      };
      const approachX = machine.x + side * (machine.radius + 52 + random() * 34);
      const approachY = Math.max(26, Math.min(height - 36, port.y + (random() - 0.5) * 28));

      pipes.push({
        points: [
          { x: startX, y: startY },
          { x: edgeX, y: startY },
          { x: edgeX, y: approachY },
          { x: approachX, y: approachY },
          { x: approachX, y: port.y },
          port,
        ],
        thickness: 8 + Math.floor(random() * 3),
        accent: 'red',
      });
    }
  }

  return { panels, pipes, machine };
}

export function drawProceduralArenaBackdrop(
  scene: Phaser.Scene,
  width: number,
  height: number,
  seed = 'arena-01',
): Phaser.GameObjects.Container {
  const container = scene.add.container(0, 0).setDepth(0);
  const layout = buildArenaBackdropLayout(width, height, seed);
  container.add(scene.add.rectangle(width / 2, height / 2, width, height, WALL));

  const graphics = scene.add.graphics();
  drawWallPanels(graphics, layout.panels);
  drawPipes(graphics, layout.pipes);
  drawRelayMachine(graphics, layout.machine);
  container.add(graphics);
  attachArenaBackdropAnimation(scene, container, layout);
  return container;
}

function drawWallPanels(graphics: Phaser.GameObjects.Graphics, panels: ArenaWallPanel[]): void {
  panels.forEach((panel, index) => {
    const left = panel.x - panel.width / 2;
    const top = panel.y - panel.height / 2;
    graphics.fillStyle(panel.tone, 1);
    graphics.fillRoundedRect(left, top, panel.width, panel.height, 2);
    graphics.lineStyle(1, PANEL_STROKE, 0.72);
    graphics.strokeRoundedRect(left, top, panel.width, panel.height, 2);

    graphics.fillStyle(0x3a3c45, 0.28);
    graphics.fillRect(left + 8, top + 7, 12, 1);
    graphics.fillRect(left + panel.width - 20, top + panel.height - 8, 12, 1);

    if (panel.repaired) {
      graphics.fillStyle(REPAIR, 0.8);
      graphics.fillRect(panel.x - 18, panel.y - 7, 36, 14);
      graphics.fillStyle(0x555966, 0.35);
      graphics.fillRect(panel.x - 15, panel.y - 4, 2, 2);
      graphics.fillRect(panel.x + 13, panel.y + 2, 2, 2);
    }

    drawPanelMicroDetails(graphics, panel, index);
  });
}

function drawPanelMicroDetails(
  graphics: Phaser.GameObjects.Graphics,
  panel: ArenaWallPanel,
  index: number,
): void {
  const left = panel.x - panel.width / 2;
  const top = panel.y - panel.height / 2;

  if (index % 4 === 1) {
    const ventWidth = Math.min(34, panel.width * 0.24);
    graphics.fillStyle(0x0a0b0f, 0.92);
    graphics.fillRect(panel.x - ventWidth / 2, panel.y - 9, ventWidth, 18);
    graphics.lineStyle(1, 0x3d414c, 0.6);
    graphics.strokeRect(panel.x - ventWidth / 2, panel.y - 9, ventWidth, 18);
    for (let line = 0; line < 4; line += 1) {
      graphics.lineBetween(
        panel.x - ventWidth / 2 + 5,
        panel.y - 5 + line * 3,
        panel.x + ventWidth / 2 - 5,
        panel.y - 5 + line * 3,
      );
    }
  }

  if (index % 5 === 2) {
    graphics.fillStyle(0x2d3039, 0.7);
    graphics.fillRect(left + 18, top + 22, 42, 16);
    graphics.fillStyle(0x707581, 0.25);
    graphics.fillRect(left + 23, top + 27, 20, 2);
    graphics.fillRect(left + 23, top + 32, 28, 1);
  }

  if (index % 3 === 0) {
    graphics.lineStyle(1, 0x08090c, 0.42);
    const streakX = left + panel.width * 0.72;
    graphics.lineBetween(streakX, top + 10, streakX - 2, top + panel.height * 0.45);
    graphics.lineBetween(streakX + 4, top + 16, streakX + 1, top + panel.height * 0.33);
  }

  if (index % 7 === 4) {
    graphics.lineStyle(1, 0x4b2a2d, 0.42);
    graphics.beginPath();
    graphics.moveTo(left + panel.width * 0.2, top + panel.height * 0.72);
    graphics.lineTo(left + panel.width * 0.27, top + panel.height * 0.66);
    graphics.lineTo(left + panel.width * 0.32, top + panel.height * 0.75);
    graphics.strokePath();
  }
}

function drawPipes(graphics: Phaser.GameObjects.Graphics, pipes: ArenaPipe[]): void {
  for (const pipe of pipes) {
    const radius = Math.max(11, pipe.thickness * 1.45);
    const path = buildRoundedOrthogonalPath(pipe.points, radius);

    drawPipePath(graphics, path, pipe.thickness + 5, 0x08090d, 0.9);
    drawPipePath(graphics, path, pipe.thickness + 1, PIPE_DARK, 1);
    drawPipePath(graphics, path, Math.max(2, pipe.thickness - 3), PIPE_EDGE, 0.34);

    // Blood sits inside the dark tube rather than reading as the pipe itself.
    drawPipePath(graphics, path, Math.max(2.8, pipe.thickness * 0.34), PIPE_RED, 0.66);
    drawPipePath(graphics, path, 1, PIPE_RED_HIGHLIGHT, 0.36);
  }
}

function drawPipePath(
  graphics: Phaser.GameObjects.Graphics,
  path: PipePathSegment[],
  thickness: number,
  color: number,
  alpha: number,
): void {
  if (path.length === 0) return;
  graphics.lineStyle(thickness, color, alpha);
  graphics.beginPath();
  graphics.moveTo(path[0].from.x, path[0].from.y);
  for (const segment of path) {
    if (segment.kind === 'line') {
      graphics.lineTo(segment.to.x, segment.to.y);
    } else {
      graphics.arc(
        segment.center.x,
        segment.center.y,
        segment.radius,
        segment.startAngle,
        segment.endAngle,
        segment.anticlockwise,
      );
    }
  }
  graphics.strokePath();
}

function drawRelayMachine(
  graphics: Phaser.GameObjects.Graphics,
  machine: ArenaRelayMachine,
): void {
  const { x, y, radius } = machine;

  graphics.fillStyle(0x08090c, 0.94);
  graphics.fillCircle(x, y + 6, radius + 18);
  graphics.fillStyle(MACHINE_DARK, 1);
  graphics.fillCircle(x, y, radius + 11);
  graphics.lineStyle(5, MACHINE_EDGE, 0.48);
  graphics.strokeCircle(x, y, radius + 8);

  // Outer mechanical collar and radial clamps.
  for (let index = 0; index < 12; index += 1) {
    const angle = (Math.PI * 2 * index) / 12;
    const cx = x + Math.cos(angle) * (radius + 1);
    const cy = y + Math.sin(angle) * (radius + 1);
    graphics.fillStyle(index % 3 === 0 ? 0x373b46 : 0x252832, 1);
    graphics.fillCircle(cx, cy, index % 3 === 0 ? 5 : 3);
    graphics.fillStyle(0x858a96, 0.72);
    graphics.fillCircle(cx, cy, 1.4);
  }

  graphics.fillStyle(MACHINE_MID, 1);
  graphics.fillCircle(x, y, radius - 3);
  graphics.lineStyle(3, 0x747986, 0.44);
  graphics.strokeCircle(x, y, radius - 15);
  graphics.lineStyle(2, 0x3c404a, 0.9);
  graphics.strokeCircle(x, y, radius * 0.72);

  // Inner spokes and conduits make it read as a pump, not a single eye.
  for (let index = 0; index < 6; index += 1) {
    const angle = (Math.PI * 2 * index) / 6 + 0.28;
    graphics.lineStyle(5, 0x1d2027, 0.9);
    graphics.lineBetween(
      x + Math.cos(angle) * radius * 0.54,
      y + Math.sin(angle) * radius * 0.54,
      x + Math.cos(angle) * radius * 0.69,
      y + Math.sin(angle) * radius * 0.69,
    );
    graphics.lineStyle(1, 0x676c78, 0.55);
    graphics.lineBetween(
      x + Math.cos(angle) * radius * 0.55,
      y + Math.sin(angle) * radius * 0.55,
      x + Math.cos(angle) * radius * 0.68,
      y + Math.sin(angle) * radius * 0.68,
    );
  }

  // Blood chamber.
  graphics.fillStyle(MACHINE_RED_DARK, 1);
  graphics.fillCircle(x, y, radius * 0.5);
  graphics.lineStyle(4, MACHINE_RED, 0.88);
  graphics.strokeCircle(x, y, radius * 0.5);
  graphics.fillStyle(0x8f202d, 0.72);
  graphics.fillEllipse(x - radius * 0.07, y + radius * 0.02, radius * 0.54, radius * 0.7);
  graphics.fillStyle(0xd43a48, 0.44);
  graphics.fillEllipse(x - radius * 0.2, y - radius * 0.2, radius * 0.26, radius * 0.19);

  // Gauge.
  const gaugeX = x + radius * 0.38;
  const gaugeY = y - radius * 0.46;
  graphics.fillStyle(0x15171c, 1);
  graphics.fillCircle(gaugeX, gaugeY, 15);
  graphics.lineStyle(2, 0x858a96, 0.72);
  graphics.strokeCircle(gaugeX, gaugeY, 14);
  graphics.lineStyle(2, 0xc9404b, 0.9);
  graphics.lineBetween(gaugeX, gaugeY, gaugeX + 7, gaugeY - 4);
  graphics.fillStyle(0xb8bdc7, 0.8);
  graphics.fillCircle(gaugeX, gaugeY, 2);

  drawMaintenanceModule(graphics, x, y + radius + 9);
}

function drawMaintenanceModule(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
): void {
  const width = 126;
  const height = 24;
  const left = x - width / 2;

  graphics.fillStyle(0x0b0d11, 0.9);
  graphics.fillRect(left - 9, y + 5, 9, 13);
  graphics.fillRect(left + width, y + 5, 9, 13);

  graphics.fillStyle(0x242832, 1);
  graphics.fillRoundedRect(left, y, width, height, 3);
  graphics.lineStyle(1, 0x666b76, 0.65);
  graphics.strokeRoundedRect(left, y, width, height, 3);

  graphics.fillStyle(0x59606b, 0.38);
  graphics.fillRect(left + 5, y + 3, width - 10, 1);

  graphics.fillStyle(0x101218, 1);
  graphics.fillRect(x - 24, y + 6, 48, 12);
  graphics.lineStyle(1, 0x4d525d, 0.5);
  graphics.strokeRect(x - 24, y + 6, 48, 12);
  for (let slot = 0; slot < 5; slot += 1) {
    graphics.lineBetween(x - 18 + slot * 9, y + 9, x - 18 + slot * 9, y + 15);
  }

  const indicators = [0x9e313b, 0x42c7d8, 0x7b8444] as const;
  indicators.forEach((color, index) => {
    graphics.fillStyle(0x0a0b0f, 1);
    graphics.fillCircle(x + 36 + index * 10, y + 12, 3);
    graphics.fillStyle(color, 0.72);
    graphics.fillCircle(x + 36 + index * 10, y + 12, 1.4);
  });

  graphics.fillStyle(0x8c929c, 0.62);
  graphics.fillCircle(left + 8, y + 7, 1.3);
  graphics.fillCircle(left + width - 8, y + 7, 1.3);
  graphics.fillCircle(left + 8, y + height - 6, 1.3);
  graphics.fillCircle(left + width - 8, y + height - 6, 1.3);
}

function createSeededRandom(seed: string): () => number {
  let state = hashSeed(seed);
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
