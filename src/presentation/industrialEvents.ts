import type Phaser from 'phaser';

export type IndustrialEventType = 'spark' | 'led-glitch' | 'steam-leak';

export interface IndustrialEvent {
  type: IndustrialEventType;
  startMs: number;
  durationMs: number;
  anchorIndex: number;
}

interface Point { x: number; y: number; }
interface EventPanel { x: number; y: number; width: number; height: number; }
interface EventPipe { points: Point[]; }

export interface IndustrialEventLayout {
  panels: EventPanel[];
  pipes: EventPipe[];
  machine: { x: number; y: number; radius: number };
}

export interface IndustrialEventSystem {
  update(time: number): void;
}

const EVENT_TYPES: IndustrialEventType[] = ['spark', 'led-glitch', 'steam-leak'];

export function buildIndustrialEventSchedule(seed: string, count: number): IndustrialEvent[] {
  const random = createSeededRandom(seed);
  const typeOffset = hashSeed(seed) % EVENT_TYPES.length;
  const events: IndustrialEvent[] = [];
  let cursor = 0;

  for (let index = 0; index < count; index += 1) {
    const gap = 7000 + Math.floor(random() * 7001);
    const type = EVENT_TYPES[(index + typeOffset) % EVENT_TYPES.length];
    const durationMs = getEventDuration(type, random());
    const startMs = cursor + gap;
    events.push({
      type,
      startMs,
      durationMs,
      anchorIndex: Math.floor(random() * 12),
    });
    cursor = startMs + durationMs;
  }

  return events;
}

export function createIndustrialEventSystem(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  layout: IndustrialEventLayout,
  seed = 'arena-01',
): IndustrialEventSystem {
  const schedule = buildIndustrialEventSchedule(seed, 12);
  const lastEvent = schedule.at(-1);
  const loopDuration = (lastEvent?.startMs ?? 0) + (lastEvent?.durationMs ?? 0) + 9000;

  const sparkGraphics = scene.add.graphics().setAlpha(0);
  const glitchLed = scene.add.circle(0, 0, 2.2, 0xff4a57, 1).setAlpha(0);
  const steamGraphics = scene.add.graphics().setAlpha(0);
  container.add([sparkGraphics, glitchLed, steamGraphics]);

  return {
    update(time: number): void {
      sparkGraphics.clear().setAlpha(0);
      glitchLed.setAlpha(0);
      steamGraphics.clear().setAlpha(0);

      if (schedule.length === 0 || loopDuration <= 0) return;
      const cycle = positiveModulo(time, loopDuration);
      const event = schedule.find(
        (candidate) =>
          cycle >= candidate.startMs && cycle < candidate.startMs + candidate.durationMs,
      );
      if (!event) return;

      const progress = (cycle - event.startMs) / event.durationMs;
      if (event.type === 'spark') {
        drawSparkEvent(sparkGraphics, getPipeAnchor(layout, event.anchorIndex), progress);
      } else if (event.type === 'led-glitch') {
        drawLedGlitch(glitchLed, getPanelAnchor(layout, event.anchorIndex), progress);
      } else {
        drawSteamLeak(steamGraphics, getSteamAnchor(layout, event.anchorIndex), progress);
      }
    },
  };
}

function drawSparkEvent(
  graphics: Phaser.GameObjects.Graphics,
  anchor: Point,
  progress: number,
): void {
  const envelope = Math.sin(progress * Math.PI);
  graphics.setAlpha(envelope);
  graphics.lineStyle(1.4, 0xffd27a, 0.9);
  for (let index = 0; index < 4; index += 1) {
    const angle = -1.1 + index * 0.7 + progress * 0.8;
    const length = 5 + index * 2;
    graphics.lineBetween(
      anchor.x,
      anchor.y,
      anchor.x + Math.cos(angle) * length,
      anchor.y + Math.sin(angle) * length,
    );
  }
  graphics.fillStyle(0xfff1b5, 0.9);
  graphics.fillCircle(anchor.x, anchor.y, 1.5);
}

function drawLedGlitch(
  led: Phaser.GameObjects.Arc,
  anchor: Point,
  progress: number,
): void {
  const flicker = Math.sin(progress * Math.PI * 18) > -0.25 ? 1 : 0.08;
  led.setPosition(anchor.x, anchor.y).setAlpha(flicker * Math.sin(progress * Math.PI));
}

function drawSteamLeak(
  graphics: Phaser.GameObjects.Graphics,
  anchor: Point,
  progress: number,
): void {
  const envelope = Math.sin(progress * Math.PI);
  graphics.setAlpha(envelope * 0.5);
  for (let index = 0; index < 3; index += 1) {
    const local = Math.min(1, Math.max(0, progress * 1.25 - index * 0.12));
    const x = anchor.x + 3 + local * (8 + index * 3);
    const y = anchor.y - local * (10 + index * 5);
    graphics.fillStyle(0xd9dde1, 0.2 + index * 0.06);
    graphics.fillEllipse(x, y, 5 + index * 2, 3 + index * 2);
  }
}

function getPipeAnchor(layout: IndustrialEventLayout, index: number): Point {
  const pipe = layout.pipes[index % Math.max(1, layout.pipes.length)];
  if (!pipe || pipe.points.length === 0) return { x: layout.machine.x, y: layout.machine.y };
  return pipe.points[Math.min(2, pipe.points.length - 1)];
}

function getPanelAnchor(layout: IndustrialEventLayout, index: number): Point {
  const panel = layout.panels[index % Math.max(1, layout.panels.length)];
  if (!panel) return { x: layout.machine.x, y: layout.machine.y };
  return {
    x: panel.x + panel.width * 0.3,
    y: panel.y - panel.height * 0.3,
  };
}

function getSteamAnchor(layout: IndustrialEventLayout, index: number): Point {
  const pipe = layout.pipes[(index + 2) % Math.max(1, layout.pipes.length)];
  if (!pipe || pipe.points.length === 0) {
    return { x: layout.machine.x + layout.machine.radius, y: layout.machine.y };
  }
  return pipe.points[Math.min(1, pipe.points.length - 1)];
}

function getEventDuration(type: IndustrialEventType, random: number): number {
  if (type === 'spark') return 200 + Math.floor(random * 170);
  if (type === 'led-glitch') return 320 + Math.floor(random * 260);
  return 620 + Math.floor(random * 260);
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

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}
