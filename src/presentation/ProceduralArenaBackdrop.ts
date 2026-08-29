import Phaser from 'phaser';
import { attachArenaBackdropAnimation } from './ArenaBackdropAnimation';

export interface ArenaWallPanel { x: number; y: number; width: number; height: number; tone: number; repaired: boolean; }
export interface ArenaPipe { points: Array<{ x: number; y: number }>; thickness: number; accent: 'none' | 'red'; }
export interface ArenaRelayMachine { x: number; y: number; radius: number; }
export interface ArenaBackdropLayout { panels: ArenaWallPanel[]; pipes: ArenaPipe[]; machine: ArenaRelayMachine; }

const WALL = 0x0d0e13;
const PANEL_STROKE = 0x22242d;
const PANEL_TONES = [0x111219, 0x14151c, 0x171820, 0x12131a] as const;
const REPAIR = 0x262832;
const PIPE_DARK = 0x292c34;
const PIPE_EDGE = 0x484c57;
const PIPE_RED = 0x8f2732;
const MACHINE_DARK = 0x171920;
const MACHINE_MID = 0x292c35;
const MACHINE_EDGE = 0x535865;
const MACHINE_RED = 0xa52a36;
const MACHINE_RED_DARK = 0x40151b;

export function buildArenaBackdropLayout(width: number, height: number, seed: string): ArenaBackdropLayout {
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

  const machine = { x: width / 2, y: Math.min(176, height * 0.34), radius: 58 };
  const pipeCount = 6 + Math.floor(random() * 2);
  const pipes: ArenaPipe[] = [];

  for (let index = 0; index < pipeCount; index += 1) {
    const fromLeft = index % 2 === 0;
    const startX = fromLeft ? -24 : width + 24;
    const edgeX = fromLeft ? 72 + random() * 130 : width - 72 - random() * 130;
    const startY = 42 + random() * Math.max(80, height - 125);
    const approachX = machine.x + (fromLeft ? -1 : 1) * (machine.radius + 54 + random() * 55);
    const portAngle = fromLeft ? Math.PI + (random() - 0.5) * 1.55 : (random() - 0.5) * 1.55;
    const port = {
      x: machine.x + Math.cos(portAngle) * (machine.radius - 2),
      y: machine.y + Math.sin(portAngle) * (machine.radius - 2),
    };
    const approachY = Math.max(24, Math.min(height - 35, port.y + (random() - 0.5) * 65));

    pipes.push({
      points: [
        { x: startX, y: startY },
        { x: edgeX, y: startY },
        { x: edgeX, y: approachY },
        { x: approachX, y: approachY },
        { x: approachX, y: port.y },
        port,
      ],
      thickness: 7 + Math.floor(random() * 4),
      accent: 'red',
    });
  }

  return { panels, pipes, machine };
}

export function drawProceduralArenaBackdrop(scene: Phaser.Scene, width: number, height: number, seed = 'arena-01'): Phaser.GameObjects.Container {
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
  for (const panel of panels) {
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
  }
}

function drawPipes(graphics: Phaser.GameObjects.Graphics, pipes: ArenaPipe[]): void {
  for (const pipe of pipes) {
    drawPipePath(graphics, pipe.points, pipe.thickness + 3, 0x090a0d, 0.8);
    drawPipePath(graphics, pipe.points, pipe.thickness, PIPE_DARK, 1);
    drawPipePath(graphics, pipe.points, Math.max(1, pipe.thickness - 4), PIPE_EDGE, 0.35);
    drawPipePath(graphics, pipe.points, 2.4, PIPE_RED, 0.88);
    for (let index = 1; index < pipe.points.length - 1; index += 1) {
      const point = pipe.points[index];
      graphics.fillStyle(0x111217, 1);
      graphics.fillCircle(point.x, point.y, pipe.thickness * 0.85);
      graphics.lineStyle(1, PIPE_EDGE, 0.5);
      graphics.strokeCircle(point.x, point.y, pipe.thickness * 0.65);
    }
  }
}

function drawPipePath(graphics: Phaser.GameObjects.Graphics, points: Array<{ x: number; y: number }>, thickness: number, color: number, alpha: number): void {
  graphics.lineStyle(thickness, color, alpha);
  graphics.beginPath();
  graphics.moveTo(points[0].x, points[0].y);
  for (let index = 1; index < points.length; index += 1) graphics.lineTo(points[index].x, points[index].y);
  graphics.strokePath();
}

function drawRelayMachine(graphics: Phaser.GameObjects.Graphics, machine: ArenaRelayMachine): void {
  const { x, y, radius } = machine;
  graphics.fillStyle(0x08090c, 0.92); graphics.fillCircle(x, y + 5, radius + 16);
  graphics.fillStyle(MACHINE_DARK, 1); graphics.fillCircle(x, y, radius + 10);
  graphics.lineStyle(4, MACHINE_EDGE, 0.45); graphics.strokeCircle(x, y, radius + 8);
  graphics.fillStyle(MACHINE_MID, 1); graphics.fillCircle(x, y, radius - 2);
  graphics.lineStyle(2, 0x6a6f7d, 0.45); graphics.strokeCircle(x, y, radius - 8);
  graphics.fillStyle(MACHINE_RED_DARK, 1); graphics.fillCircle(x, y, radius * 0.52);
  graphics.lineStyle(3, MACHINE_RED, 0.82); graphics.strokeCircle(x, y, radius * 0.52);
  graphics.fillStyle(MACHINE_RED, 0.52); graphics.fillCircle(x - radius * 0.12, y - radius * 0.12, radius * 0.18);
  for (let index = 0; index < 8; index += 1) {
    const angle = (Math.PI * 2 * index) / 8;
    graphics.fillStyle(0x777b86, 0.75);
    graphics.fillCircle(x + Math.cos(angle) * (radius + 2), y + Math.sin(angle) * (radius + 2), 2);
  }
  graphics.fillStyle(0x17181e, 1); graphics.fillRect(x - 74, y + radius + 10, 148, 18);
  graphics.lineStyle(1, 0x474a55, 0.5); graphics.strokeRect(x - 74, y + radius + 10, 148, 18);
  graphics.fillStyle(MACHINE_RED, 0.7); graphics.fillRect(x - 45, y + radius + 17, 28, 3);
  graphics.fillStyle(0x4a4e58, 0.7); graphics.fillRect(x + 10, y + radius + 17, 36, 3);
}

function createSeededRandom(seed: string): () => number {
  let state = hashSeed(seed);
  return () => { state = (state * 1664525 + 1013904223) >>> 0; return state / 0x100000000; };
}

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) { hash ^= seed.charCodeAt(index); hash = Math.imul(hash, 16777619); }
  return hash >>> 0;
}
