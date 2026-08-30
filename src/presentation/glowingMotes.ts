import type Phaser from 'phaser';

export type GlowingMoteDepth = 'far' | 'mid' | 'near';

export interface GlowingMoteSeed {
  depth: GlowingMoteDepth;
  startX: number;
  startY: number;
  velocityY: number;
  horizontalDrift: number;
  wanderAmplitude: number;
  wanderPhase: number;
  twinklePhase: number;
  lifetimeMs: number;
  phaseOffsetMs: number;
  baseAlpha: number;
  scale: number;
}

export interface GlowingMoteSample {
  x: number;
  y: number;
  alpha: number;
  scale: number;
}

export interface GlowingMoteSystem {
  update(time: number): void;
}

interface DepthProfile {
  speed: number;
  drift: number;
  scale: number;
  alpha: number;
}

export const GLOWING_MOTE_PALETTE = [0xf2c94c, 0xffe08a, 0xfff3bf] as const;

const MOTE_DEPTHS: GlowingMoteDepth[] = ['far', 'mid', 'near'];
const DEPTH_PROFILES: Record<GlowingMoteDepth, DepthProfile> = {
  far: { speed: 0.62, drift: 0.62, scale: 0.62, alpha: 0.9 },
  mid: { speed: 0.9, drift: 0.9, scale: 0.96, alpha: 1.1 },
  near: { speed: 1.22, drift: 1.22, scale: 1.38, alpha: 1.38 },
};
const MOTE_TEXTURE_KEY = 'relay-glowing-mote-warm-depth-v2';

export function buildGlowingMoteSeeds(
  width: number,
  height: number,
  count = 36,
): GlowingMoteSeed[] {
  return Array.from({ length: Math.min(60, count) }, (_, index) => {
    const depth = MOTE_DEPTHS[index % MOTE_DEPTHS.length];
    const profile = DEPTH_PROFILES[depth];
    const a = fraction(index, 37, 13, 101);
    const b = fraction(index, 61, 29, 103);
    const c = fraction(index, 43, 17, 97);
    const lifetimeMs = 7800 + Math.round(c * 4200);
    const baseTravel = height * (0.88 + c * 0.18);

    return {
      depth,
      startX: a * width,
      startY: height * (0.76 + b * 0.32),
      velocityY: -(baseTravel * profile.speed) / (lifetimeMs / 1000),
      horizontalDrift: (-7 + b * 14) * profile.drift,
      wanderAmplitude: (5 + a * 8) * profile.drift,
      wanderPhase: c * Math.PI * 2,
      twinklePhase: b * Math.PI * 2,
      lifetimeMs,
      phaseOffsetMs: index === 0 ? 0 : Math.round(a * lifetimeMs),
      baseAlpha: Math.min(0.98, (0.46 + c * 0.27) * profile.alpha),
      scale: (0.58 + b * 0.42) * profile.scale,
    };
  });
}

export function sampleGlowingMote(
  seed: GlowingMoteSeed,
  timeMs: number,
  width: number,
  height: number,
): GlowingMoteSample {
  const localTime = positiveModulo(timeMs - seed.phaseOffsetMs, seed.lifetimeMs);
  const progress = localTime / seed.lifetimeMs;
  const seconds = localTime / 1000;

  const x = positiveModulo(
    seed.startX +
      seed.horizontalDrift * progress +
      Math.sin(progress * Math.PI * 2 + seed.wanderPhase) * seed.wanderAmplitude,
    width,
  );
  const y = seed.startY + seed.velocityY * seconds;

  const fadeIn = smoothstep(0, 0.08, progress);
  const fadeOut = 1 - smoothstep(0.8, 1, progress);
  const twinkleA = 0.78 + Math.sin(seconds * 3.35 + seed.twinklePhase) * 0.2;
  const twinkleB = 0.9 + Math.sin(seconds * 8.1 + seed.wanderPhase) * 0.1;
  const alpha = seed.baseAlpha * fadeIn * fadeOut * Math.max(0.32, twinkleA * twinkleB);
  const pulseScale = seed.scale * (0.91 + Math.sin(seconds * 2.7 + seed.twinklePhase) * 0.09);

  return {
    x,
    y: Math.min(height + 18, y),
    alpha,
    scale: pulseScale,
  };
}

export function createGlowingMoteSystem(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  width: number,
  height: number,
): GlowingMoteSystem {
  ensureMoteTexture(scene);
  const seeds = buildGlowingMoteSeeds(width, height);
  const particles = seeds
    .map((seed) => ({
      seed,
      sprite: scene.add
        .image(seed.startX, seed.startY, MOTE_TEXTURE_KEY)
        .setScale(seed.scale)
        .setAlpha(0),
    }))
    .sort((first, second) => depthRank(first.seed.depth) - depthRank(second.seed.depth));

  container.add(particles.map((particle) => particle.sprite));

  return {
    update(time: number): void {
      for (const particle of particles) {
        const sample = sampleGlowingMote(particle.seed, time, width, height);
        particle.sprite
          .setPosition(sample.x, sample.y)
          .setScale(sample.scale)
          .setAlpha(sample.alpha);
      }
    },
  };
}

function ensureMoteTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(MOTE_TEXTURE_KEY)) return;

  const graphics = scene.add.graphics().setVisible(false);
  graphics.fillStyle(GLOWING_MOTE_PALETTE[0], 0.2);
  graphics.fillCircle(8, 8, 8);
  graphics.fillStyle(GLOWING_MOTE_PALETTE[1], 0.5);
  graphics.fillCircle(8, 8, 4.6);
  graphics.fillStyle(GLOWING_MOTE_PALETTE[2], 1);
  graphics.fillCircle(8, 8, 1.6);
  graphics.generateTexture(MOTE_TEXTURE_KEY, 16, 16);
  graphics.destroy();
}

function depthRank(depth: GlowingMoteDepth): number {
  return depth === 'far' ? 0 : depth === 'mid' ? 1 : 2;
}

function fraction(index: number, multiplier: number, offset: number, modulo: number): number {
  return ((index * multiplier + offset) % modulo) / (modulo - 1);
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
