import type Phaser from 'phaser';
import { createBloodPipeEffect } from './bloodPipeEffects';
import { createGlowingMoteSystem } from './glowingMotes';
import { createIndustrialEventSystem } from './industrialEvents';
import { createMachineLightingSystem } from './machineLighting';
import { createPanelAmbienceSystem } from './panelAmbience';
import { buildRoundedOrthogonalPath } from './pipeGeometry';
import { createRelayMachineSystem } from './relayMachineSystem';
import { createSteamParticleSystem } from './steamParticles';

interface Point { x: number; y: number; }
interface AnimatedPipe {
  points: Point[];
  thickness: number;
  cornerRadius: number;
  accent: 'none' | 'red';
}
interface AnimatedMachine { x: number; y: number; radius: number; }
interface AnimatedPanel { x: number; y: number; width: number; height: number; }
export interface ArenaBackdropAnimationLayout {
  panels: AnimatedPanel[];
  pipes: AnimatedPipe[];
  machine: AnimatedMachine;
}

const HEARTBEAT_SLOW_PERIOD = 1600;
const HEARTBEAT_FAST_PERIOD = 760;
const FLOW_PERIOD = 3300;
const RING_PERIOD = 18000;

export const HEART_VISUAL_CONFIG = {
  coreRadiusFactor: 0.125,
  coreRestAlpha: 0.34,
  corePulseAlpha: 0.56,
  coreRestScale: 0.96,
  corePulseScale: 0.28,
  corePurgeAlpha: 0.24,
  corePurgeScale: 0.32,
  glowRadiusFactor: 0.52,
  glowRestAlpha: 0.08,
  glowPulseAlpha: 0.22,
  glowRestScale: 0.96,
  glowPulseScale: 0.22,
  glowPurgeAlpha: 0.18,
  glowPurgeScale: 0.16,
} as const;

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

export function getHeartbeatPeriodMs(pressure: number): number {
  const normalizedPressure = clamp(pressure, 0, 1);
  const acceleration = Math.pow(normalizedPressure, 1.35);
  return HEARTBEAT_SLOW_PERIOD -
    (HEARTBEAT_SLOW_PERIOD - HEARTBEAT_FAST_PERIOD) * acceleration;
}

export function getHeartbeatIntensity(timeMs: number, pressure = 0): number {
  const period = getHeartbeatPeriodMs(pressure);
  const timingScale = period / HEARTBEAT_SLOW_PERIOD;
  const phase = ((timeMs % period) + period) % period;
  const first = pulseAtCyclePhase(phase, 0, 105 * timingScale, period);
  const second = pulseAtCyclePhase(phase, 220 * timingScale, 115 * timingScale, period) * 0.72;
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
  const moteSystem = createGlowingMoteSystem(scene, animatedLayer, ambienceWidth, ambienceHeight);
  const panelSystem = createPanelAmbienceSystem(scene, animatedLayer, layout.panels);
  const industrialSystem = createIndustrialEventSystem(
    scene,
    animatedLayer,
    layout,
    buildAmbienceSeed(layout),
  );
  const machineLighting = createMachineLightingSystem(scene, animatedLayer, machine);

  const bloodPipeEffects = layout.pipes.map((pipe) => {
    const path = buildRoundedOrthogonalPath(pipe.points, pipe.cornerRadius);
    return createBloodPipeEffect(scene, animatedLayer, path);
  });

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

  animatedLayer.add([rotatingRing, ventGraphics, ...leds]);
  const relayMachine = createRelayMachineSystem(scene, animatedLayer, machine);
  const steamSystem = createSteamParticleSystem(scene, animatedLayer, steamOrigins);

  const heartGlow = scene.add
    .circle(
      machine.x,
      machine.y,
      machine.radius * HEART_VISUAL_CONFIG.glowRadiusFactor,
      0xe23343,
      1,
    )
    .setAlpha(HEART_VISUAL_CONFIG.glowRestAlpha);
  const heartCore = scene.add
    .circle(
      machine.x,
      machine.y,
      machine.radius * HEART_VISUAL_CONFIG.coreRadiusFactor,
      0xe13b49,
      1,
    )
    .setAlpha(HEART_VISUAL_CONFIG.coreRestAlpha);
  animatedLayer.add([heartGlow, heartCore]);

  let previousTime: number | undefined;
  let ringRotation = 0;
  const controller = new ArenaBackdropAnimationController((time) => {
    const dtMs = previousTime === undefined ? 16 : clamp(time - previousTime, 0, 50);
    previousTime = time;

    moteSystem.update(time);
    panelSystem.update(time);
    industrialSystem.update(time);

    bloodPipeEffects.forEach((effect, index) => {
      const progress = getLoopProgress(time + index * 430, FLOW_PERIOD);
      const shimmer = 0.8 + Math.sin(time * 0.01 + index) * 0.18;
      const update = effect.update(progress, shimmer);
      if (update.arrived && update.entryPoint && update.entryVelocity) {
        relayMachine.acceptBlood(update.entryPoint, update.entryVelocity);
      }
    });

    const relayState = relayMachine.update(time, dtMs);
    const heartbeat = getHeartbeatIntensity(time, relayState.pressure);
    const energizedHeartbeat = Math.min(1, heartbeat * 1.18 + relayState.purgeBoost * 0.78);
    machineLighting.update(energizedHeartbeat);

    heartCore
      .setScale(
        HEART_VISUAL_CONFIG.coreRestScale +
          heartbeat * HEART_VISUAL_CONFIG.corePulseScale +
          relayState.purgeBoost * HEART_VISUAL_CONFIG.corePurgeScale,
      )
      .setAlpha(
        Math.min(
          1,
          HEART_VISUAL_CONFIG.coreRestAlpha +
            heartbeat * HEART_VISUAL_CONFIG.corePulseAlpha +
            relayState.purgeBoost * HEART_VISUAL_CONFIG.corePurgeAlpha,
        ),
      );
    heartGlow
      .setScale(
        HEART_VISUAL_CONFIG.glowRestScale +
          heartbeat * HEART_VISUAL_CONFIG.glowPulseScale +
          relayState.purgeBoost * HEART_VISUAL_CONFIG.glowPurgeScale,
      )
      .setAlpha(
        Math.min(
          1,
          HEART_VISUAL_CONFIG.glowRestAlpha +
            heartbeat * HEART_VISUAL_CONFIG.glowPulseAlpha +
            relayState.purgeBoost * HEART_VISUAL_CONFIG.glowPurgeAlpha,
        ),
      );

    const baseAngularSpeed = (Math.PI * 2) / (RING_PERIOD / 1000);
    const angularSpeed =
      baseAngularSpeed * (1 + relayState.pressure * 0.8) + relayState.purgeBoost * 3.6;
    ringRotation += angularSpeed * (dtMs / 1000);
    rotatingRing.setRotation(ringRotation);

    leds.forEach((led, index) => {
      const intensity = Math.min(1, getLedIntensity(time, index) + relayState.purgeBoost * 0.38);
      led.setAlpha(intensity).setScale(0.9 + intensity * 0.32);
    });

    steamSystem.update(time, relayState.purgeBoost);
  });

  sceneControllers.set(scene, controller);
  return controller;
}

function buildAmbienceSeed(layout: ArenaBackdropAnimationLayout): string {
  return layout.panels
    .slice(0, 4)
    .map((panel) => `${Math.round(panel.x)}:${Math.round(panel.y)}`)
    .join('|');
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
