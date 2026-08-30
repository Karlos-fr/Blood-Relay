import type Phaser from 'phaser';

export interface GlowingMoteSeed {
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

const MOTE_TEXTURE_KEY = 'relay-glowing-mote';

export function buildGlowingMoteSeeds(
  width: number,
  height: number,
  count = 16,
): GlowingMoteSeed[] {
  return Array.from({ length: Math.min(20, count) }, (_, index) => {
    const a = fraction(index, 37, 13, 101);
    const b = fraction(index, 61, 29, 103);
    const c = fraction(index, 43, 17, 97);
    const lifetimeMs = 7800 + Math.round(c * 4200);

    return {
      startX: a * width,
      startY: height * (0.76 + b * 0.32),
      velocityY: -(height * (0.88 + c * 0.18)) / (lifetimeMs / 1000),
      horizontalDrift: -7 + b * 14,
      wanderAmplitude: 5 + a * 8,
      wanderPhase: c * Math.PI * 2,
      twinklePhase: b * Math.PI * 2,
      lifetimeMs,
      phaseOffsetMs: index === 0 ? 0 : Math.round(a * lifetimeMs),
      baseAlpha: 0.34 + c * 0.28,
      scale: 0.6 + b * 0.55,
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
    seed.startX + seed.horizontalDrift * progress + Math.sin(progress * Math.PI * 2 + seed.wanderPhase) * seed.wanderAmplitude,
    width,
  );
  const y = seed.startY + seed.velocityY * seconds;

  const fadeIn = smoothstep(0, 0.1, progress);
  const fadeOut = 1 - smoothstep(0.78, 1, progress);
  const twinkleA = 0.72 + Math.sin(seconds * 3.1 + seed.twinklePhase) * 0.18;
  const twinkleB = 0.88 + Math.sin(seconds * 7.3 + seed.wanderPhase) * 0.12;
  const alpha = seed.baseAlpha * fadeIn * fadeOut * Math.max(0.25, twinkleA * twinkleB);
  const pulseScale = seed.scale * (0.92 + Math.sin(seconds * 2.4 + seed.twinklePhase) * 0.08);

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
  const seeds = buildGlowingMoteSeeds(width, height, 16);
  const motes = seeds.map((seed) =>
    scene.add
      .image(seed.startX, seed.startY, MOTE_TEXTURE_KEY)
      .setScale(seed.scale)
      .setAlpha(0),
  );
  container.add(motes);

  return {
    update(time: number): void {
      motes.forEach((mote, index) => {
        const sample = sampleGlowingMote(seeds[index], time, width, height);
        mote.setPosition(sample.x, sample.y).setScale(sample.scale).setAlpha(sample.alpha);
      });
    },
  };
}

function ensureMoteTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(MOTE_TEXTURE_KEY)) return;

  const graphics = scene.add.graphics().setVisible(false);
  graphics.fillStyle(0xeaf6ff, 0.08);
  graphics.fillCircle(6, 6, 6);
  graphics.fillStyle(0xf5fbff, 0.2);
  graphics.fillCircle(6, 6, 3.5);
  graphics.fillStyle(0xffffff, 0.95);
  graphics.fillCircle(6, 6, 1.2);
  graphics.generateTexture(MOTE_TEXTURE_KEY, 12, 12);
  graphics.destroy();
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
