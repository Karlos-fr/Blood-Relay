import type Phaser from 'phaser';

interface Point {
  x: number;
  y: number;
}

interface AnimatedPipe {
  points: Point[];
  accent: 'none' | 'red';
}

interface AnimatedMachine {
  x: number;
  y: number;
  radius: number;
}

export interface ArenaBackdropAnimationLayout {
  pipes: AnimatedPipe[];
  machine: AnimatedMachine;
}

const HEARTBEAT_PERIOD = 1600;
const FLOW_PERIOD = 3600;
const RING_PERIOD = 18000;
const STEAM_PERIOD = 5200;
const UPDATE_EVENT = 'update';
const SHUTDOWN_EVENT = 'shutdown';

export function getLoopProgress(timeMs: number, periodMs: number): number {
  if (periodMs <= 0) {
    return 0;
  }

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
  return 0.14 + Math.pow(wave, 3) * 0.72;
}

export function samplePolyline(points: Point[], progress: number): Point {
  if (points.length === 0) {
    return { x: 0, y: 0 };
  }

  if (points.length === 1) {
    return { ...points[0] };
  }

  const lengths: number[] = [];
  let totalLength = 0;
  for (let index = 1; index < points.length; index += 1) {
    const dx = points[index].x - points[index - 1].x;
    const dy = points[index].y - points[index - 1].y;
    const length = Math.hypot(dx, dy);
    lengths.push(length);
    totalLength += length;
  }

  if (totalLength <= 0) {
    return { ...points[0] };
  }

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

export function attachArenaBackdropAnimation(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  layout: ArenaBackdropAnimationLayout,
): void {
  const { machine } = layout;
  const animatedLayer = scene.add.container(0, 0);
  container.add(animatedLayer);

  const heartGlow = scene.add.circle(machine.x, machine.y, machine.radius * 0.39, 0xd52f3d, 0.08);
  const heartCore = scene.add.circle(machine.x, machine.y, machine.radius * 0.24, 0xc32c38, 0.38);

  const rotatingRing = scene.add.graphics().setPosition(machine.x, machine.y);
  rotatingRing.lineStyle(2, 0x8d929f, 0.36);
  rotatingRing.beginPath();
  rotatingRing.arc(0, 0, machine.radius * 0.72, -0.75, 0.85, false);
  rotatingRing.arc(0, 0, machine.radius * 0.72, 2.35, 3.65, false);
  rotatingRing.strokePath();

  const ledOffsets = [
    { x: -machine.radius - 34, y: -24, color: 0x42d9e8 },
    { x: machine.radius + 34, y: -10, color: 0xc62f3c },
    { x: -machine.radius - 26, y: 30, color: 0xc62f3c },
    { x: machine.radius + 27, y: 34, color: 0x42d9e8 },
  ];
  const leds = ledOffsets.map((led) =>
    scene.add.circle(machine.x + led.x, machine.y + led.y, 2.2, led.color, 0.2),
  );

  const redPipes = layout.pipes.filter((pipe) => pipe.accent === 'red');
  const flowParticles = redPipes.map((pipe) => ({
    pipe,
    glow: scene.add.circle(0, 0, 4.5, 0xb52c39, 0.1),
    core: scene.add.circle(0, 0, 1.7, 0xe24551, 0.72),
  }));

  const steamOrigins = [
    { x: machine.x - machine.radius - 58, y: machine.y + 42, offset: 0 },
    { x: machine.x + machine.radius + 62, y: machine.y + 58, offset: 0.47 },
  ];
  const steamPuffs = steamOrigins.flatMap((origin, originIndex) =>
    [0, 1, 2].map((puffIndex) => ({
      origin,
      phaseOffset: origin.offset + puffIndex * 0.085 + originIndex * 0.03,
      circle: scene.add.circle(origin.x, origin.y, 5 + puffIndex * 1.5, 0x9ba0aa, 0),
    })),
  );

  animatedLayer.add([
    heartGlow,
    heartCore,
    rotatingRing,
    ...leds,
    ...flowParticles.flatMap((particle) => [particle.glow, particle.core]),
    ...steamPuffs.map((puff) => puff.circle),
  ]);

  const update = (time: number): void => {
    const heartbeat = getHeartbeatIntensity(time);
    const pulseScale = 0.96 + heartbeat * 0.09;
    heartCore.setScale(pulseScale).setAlpha(0.2 + heartbeat * 0.45);
    heartGlow.setScale(0.92 + heartbeat * 0.24).setAlpha(0.025 + heartbeat * 0.13);

    rotatingRing.setRotation(getLoopProgress(time, RING_PERIOD) * Math.PI * 2);

    leds.forEach((led, index) => {
      const intensity = getLedIntensity(time, index);
      led.setAlpha(intensity).setScale(0.85 + intensity * 0.25);
    });

    flowParticles.forEach((particle, index) => {
      const progress = getLoopProgress(time + index * 780, FLOW_PERIOD);
      const point = samplePolyline(particle.pipe.points, progress);
      particle.core.setPosition(point.x, point.y);
      particle.glow.setPosition(point.x, point.y);
      const shimmer = 0.72 + Math.sin(time * 0.009 + index) * 0.16;
      particle.core.setAlpha(shimmer);
      particle.glow.setAlpha(0.08 + shimmer * 0.08);
    });

    steamPuffs.forEach((puff) => {
      const progress = getLoopProgress(time + puff.phaseOffset * STEAM_PERIOD, STEAM_PERIOD);
      const visibleProgress = progress < 0.42 ? progress / 0.42 : -1;
      if (visibleProgress < 0) {
        puff.circle.setAlpha(0);
        return;
      }

      const rise = visibleProgress * 34;
      const drift = Math.sin(visibleProgress * Math.PI) * 5;
      const alpha = Math.sin(visibleProgress * Math.PI) * 0.1;
      puff.circle
        .setPosition(puff.origin.x + drift, puff.origin.y - rise)
        .setScale(0.7 + visibleProgress * 0.85)
        .setAlpha(alpha);
    });
  };

  scene.events.on(UPDATE_EVENT, update);
  scene.events.once(SHUTDOWN_EVENT, () => {
    scene.events.off(UPDATE_EVENT, update);
  });
}

function pulseAtCyclePhase(
  phase: number,
  center: number,
  halfWidth: number,
  period: number,
): number {
  const directDistance = Math.abs(phase - center);
  const wrappedDistance = Math.min(directDistance, period - directDistance);
  return Math.max(0, 1 - wrappedDistance / halfWidth);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
