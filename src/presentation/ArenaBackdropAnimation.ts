import type Phaser from 'phaser';
import { createArenaDustSystem } from './arenaDust';
import { createBloodPipeEffect } from './bloodPipeEffects';
import { createMachineLightingSystem } from './machineLighting';
import { createPanelAmbienceSystem } from './panelAmbience';
import { buildRoundedOrthogonalPath } from './pipeGeometry';
import { createSteamParticleSystem } from './steamParticles';

interface Point { x: number; y: number; }
interface AnimatedPipe { points: Point[]; thickness: number; accent: 'none' | 'red'; }
interface AnimatedMachine { x: number; y: number; radius: number; }
interface AnimatedPanel { x: number; y: number; width: number; height: number; }
export interface ArenaBackdropAnimationLayout {
  panels: AnimatedPanel[];
  pipes: AnimatedPipe[];
  machine: AnimatedMachine;
}

const HEARTBEAT_PERIOD = 1600;
const FLOW_PERIOD = 3300;
const RING_PERIOD = 18000;

export class ArenaBackdropAnimationController {
  public constructor(private readonly renderFrame: (time: number) => void) {}

  public update(time: number): void {
    this.renderFrame(time);
  }
}

const sceneControllers = new WeakMap<object, ArenaBackdropAnimationController>();

export function getLoopProgress(timeMs: number, periodMs: number): number {
  if (periodMs <= 0) return 0;
  return ((timeMs % periodMs) + periodMs) % periodMs / periodMs;
}

export function getHeartbeatIntensity(timeMs: number): number {
  const phase = ((timeMs % HEARTBEAT_PERIOD) + HEARTBEAT_PERIOD) % HEARTBEAT_PERIOD;
  const first = pulseAtCyclePhase(phase, 0, 105, HEARTBEAT_PERIOD);
  const second = pulseAtCyclePhase(phase, 220, 115, HEARTBEAT_PERIOD) * 0.72;
  return Math.min(1, 0.08 + Math.max(first, second) * 0.92);
}

export function getLedIntensity(timeMs: number, phaseIndex: number): number {
  const period = 1250 + phaseIndex * 170;
  const progress = getLoopProgress(timeMs + phaseIndex * 310, period);
  const wave = (Math.sin(progress * Math.PI * 2) + 1) / 2;
  return 0.22 + Math.pow(wave, 3) * 0.78;
}

export function samplePolyline(points: Point[], progress: number): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return { ...points[0] };
  const lengths: number[] = [];
  let totalLength = 0;
  for (let index = 1; index < points.length; index += 1) {
    const length = Math.hypot(
      points[index].x - points[index - 1].x,
      points[index].y - points[index - 1].y,
    );
    lengths.push(length);
    totalLength += length;
  }
  if (totalLength <= 0) return { ...points[0] };
  let remaining = clamp(progress, 0, 1) * totalLength;
  for (let index = 0; index < lengths.length; index += 1) {
    const segmentLength = lengths[index];
    if (remaining <= segmentLength || index === lengths.length - 1) {
      const start = points[index];
      const end = points[index + 1];
      const t = segmentLength > 0 ? remaining / segmentLength : 0;
      return {
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t,
      };
    }
    remaining -= segmentLength;
  }
  return { ...points[points.length - 1] };
}

export function updateArenaBackdropAnimation(scene: Phaser.Scene, time: number): void {
  sceneControllers.get(scene)?.update(time);
}

export function attachArenaBackdropAnimation(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  layout: ArenaBackdropAnimationLayout,
): ArenaBackdropAnimationController {
  const { machine } = layout;
  const animatedLayer = scene.add.container(0, 0);
  container.add(animatedLayer);

  const ambienceWidth = machine.x * 2;
  const ambienceHeight = Math.max(
    ...layout.panels.map((panel) => panel.y + panel.height / 2),
    machine.y + machine.radius,
  );
  const dustSystem = createArenaDustSystem(scene, animatedLayer, ambienceWidth, ambienceHeight);
  const panelSystem = createPanelAmbienceSystem(scene, animatedLayer, layout.panels);
  const machineLighting = createMachineLightingSystem(scene, animatedLayer, machine);

  const heartGlow = scene.add.circle(
    machine.x,
    machine.y,
    machine.radius * 0.72,
    0xe23343,
    0.16,
  );
  const heartCore = scene.add.circle(
    machine.x,
    machine.y,
    machine.radius * 0.25,
    0xe13b49,
    0.58,
  );
  const rotatingRing = scene.add.graphics().setPosition(machine.x, machine.y);
  rotatingRing.lineStyle(2, 0xa3a8b5, 0.48);
  rotatingRing.beginPath();
  rotatingRing.arc(0, 0, machine.radius * 0.72, -0.75, 0.85, false);
  rotatingRing.arc(0, 0, machine.radius * 0.72, 2.35, 3.65, false);
  rotatingRing.strokePath();

  const ledRadius = machine.radius;
  const ledOffsets = [
    [-0.9,-0.42,0x42d9e8],[-0.78,-0.14,0xd83a48],[-0.88,0.2,0x42d9e8],[-0.68,0.49,0xd83a48],
    [0.9,-0.42,0xd83a48],[0.78,-0.14,0x42d9e8],[0.88,0.2,0xd83a48],[0.68,0.49,0x42d9e8],
    [-0.3,-0.8,0x42d9e8],[0,-0.86,0xd83a48],[0.3,-0.8,0x42d9e8],[0,0.84,0xd83a48],
  ] as const;
  const leds = ledOffsets.map(([x, y, color]) =>
    scene.add.circle(machine.x + x * ledRadius, machine.y + y * ledRadius, 3.2, color, 0.5),
  );

  const bloodPipeEffects = layout.pipes.map((pipe) => {
    const path = buildRoundedOrthogonalPath(pipe.points, Math.max(11, pipe.thickness * 1.45));
    return createBloodPipeEffect(scene, animatedLayer, path);
  });

  const ventGraphics = scene.add.graphics();
  const ventY = machine.y - machine.radius * 0.72;
  const steamOrigins = [
    {
      x: machine.x - machine.radius * 0.72,
      y: ventY,
      phaseOffsetMs: 0,
      outwardDirection: -1 as const,
    },
    {
      x: machine.x + machine.radius * 0.72,
      y: ventY,
      phaseOffsetMs: 620,
      outwardDirection: 1 as const,
    },
  ];
  for (const origin of steamOrigins) {
    ventGraphics.fillStyle(0x3c404a, 1);
    ventGraphics.fillRoundedRect(origin.x - 12, origin.y - 5, 24, 10, 3);
    ventGraphics.lineStyle(2, 0x858b98, 0.78);
    ventGraphics.strokeRoundedRect(origin.x - 12, origin.y - 5, 24, 10, 3);
    ventGraphics.lineStyle(2, 0x16181d, 0.9);
    for (let slot = -6; slot <= 6; slot += 6) {
      ventGraphics.lineBetween(origin.x + slot, origin.y - 2, origin.x + slot, origin.y + 2);
    }
  }

  animatedLayer.add([heartGlow, heartCore, rotatingRing, ventGraphics, ...leds]);
  const steamSystem = createSteamParticleSystem(scene, animatedLayer, steamOrigins);

  const controller = new ArenaBackdropAnimationController((time) => {
    const heartbeat = getHeartbeatIntensity(time);
    dustSystem.update(time);
    panelSystem.update(time);
    machineLighting.update(heartbeat);
    heartCore.setScale(0.96 + heartbeat * 0.12).setAlpha(0.38 + heartbeat * 0.55);
    heartGlow.setScale(0.9 + heartbeat * 0.28).setAlpha(0.07 + heartbeat * 0.22);
    rotatingRing.setRotation(getLoopProgress(time, RING_PERIOD) * Math.PI * 2);

    leds.forEach((led, index) => {
      const intensity = getLedIntensity(time, index);
      led.setAlpha(intensity).setScale(0.9 + intensity * 0.32);
    });

    bloodPipeEffects.forEach((effect, index) => {
      const progress = getLoopProgress(time + index * 430, FLOW_PERIOD);
      const shimmer = 0.8 + Math.sin(time * 0.01 + index) * 0.18;
      effect.update(progress, shimmer);
    });

    steamSystem.update(time);
  });

  sceneControllers.set(scene, controller);
  return controller;
}

function pulseAtCyclePhase(
  phase: number,
  center: number,
  halfWidth: number,
  period: number,
): number {
  const directDistance = Math.abs(phase - center);
  return Math.max(0, 1 - Math.min(directDistance, period - directDistance) / halfWidth);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
