import type Phaser from 'phaser';

export interface SteamOrigin {
  x: number;
  y: number;
  phaseOffsetMs: number;
  outwardDirection: -1 | 1;
}

export interface SteamParticleSeed {
  spawnOffsetMs: number;
  lifetimeMs: number;
  lateralDrift: number;
  riseDistance: number;
  turbulence: number;
  wavePhase: number;
  startScale: number;
  endScale: number;
  peakAlpha: number;
  startRotation: number;
  spin: number;
  textureIndex: number;
}

export interface SteamParticleSample {
  visible: boolean;
  x: number;
  y: number;
  scale: number;
  alpha: number;
  rotation: number;
}

export interface SteamParticleSystem {
  update(time: number): void;
}

const STEAM_LOOP_MS = 1650;
const STEAM_PARTICLES_PER_VENT = 14;
const STEAM_TEXTURE_KEYS = ['relay-steam-a', 'relay-steam-b', 'relay-steam-c'] as const;

export function buildSteamParticleSeeds(count: number): SteamParticleSeed[] {
  return Array.from({ length: count }, (_, index) => {
    const a = fraction(index, 73, 19, 101);
    const b = fraction(index, 47, 31, 97);
    const c = fraction(index, 61, 11, 89);
    const startScale = 0.28 + c * 0.3;

    return {
      spawnOffsetMs: (index / Math.max(1, count)) * STEAM_LOOP_MS,
      lifetimeMs: 620 + Math.round(b * 260),
      lateralDrift: -18 + a * 36,
      riseDistance: 35 + c * 20,
      turbulence: 2.5 + b * 4.5,
      wavePhase: a * Math.PI * 2,
      startScale,
      endScale: startScale + 0.3 + b * 0.24,
      peakAlpha: 0.3 + c * 0.24,
      startRotation: -0.45 + b * 0.9,
      spin: -0.42 + a * 0.84,
      textureIndex: index % STEAM_TEXTURE_KEYS.length,
    };
  });
}

export function sampleSteamParticle(
  seed: SteamParticleSeed,
  ageMs: number,
  outwardDirection: -1 | 0 | 1 = 0,
): SteamParticleSample {
  if (ageMs < 0 || ageMs > seed.lifetimeMs) {
    return { visible: false, x: 0, y: 0, scale: seed.startScale, alpha: 0, rotation: 0 };
  }

  const progress = ageMs / seed.lifetimeMs;
  const smoothProgress = progress * progress * (3 - 2 * progress);
  const envelope = Math.pow(Math.sin(progress * Math.PI), 0.72);
  const turbulence = Math.sin(progress * Math.PI * 2 + seed.wavePhase) * seed.turbulence;
  const outwardBias = outwardDirection * (10 + Math.abs(seed.lateralDrift) * 0.5) * smoothProgress;
  const localDrift = seed.lateralDrift * 0.12 * smoothProgress;

  return {
    visible: true,
    x: outwardBias + localDrift + turbulence * 0.65,
    y: -seed.riseDistance * smoothProgress,
    scale: seed.startScale + (seed.endScale - seed.startScale) * progress,
    alpha: envelope * seed.peakAlpha,
    rotation: seed.startRotation + seed.spin * progress,
  };
}

export function createSteamParticleSystem(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  origins: SteamOrigin[],
): SteamParticleSystem {
  ensureSteamTextures(scene);
  const seeds = buildSteamParticleSeeds(STEAM_PARTICLES_PER_VENT);
  const particles = origins.flatMap((origin) =>
    seeds.map((seed) => ({
      origin,
      seed,
      sprite: scene.add
        .image(origin.x, origin.y, STEAM_TEXTURE_KEYS[seed.textureIndex])
        .setAlpha(0)
        .setScale(seed.startScale)
        .setRotation(seed.startRotation),
    })),
  );

  container.add(particles.map((particle) => particle.sprite));

  return {
    update(time: number): void {
      for (const particle of particles) {
        const cycleTime = positiveModulo(
          time + particle.origin.phaseOffsetMs - particle.seed.spawnOffsetMs,
          STEAM_LOOP_MS,
        );
        const sample = sampleSteamParticle(
          particle.seed,
          cycleTime,
          particle.origin.outwardDirection,
        );

        if (!sample.visible) {
          particle.sprite.setAlpha(0);
          continue;
        }

        particle.sprite
          .setPosition(particle.origin.x + sample.x, particle.origin.y + sample.y)
          .setScale(sample.scale)
          .setRotation(sample.rotation)
          .setAlpha(sample.alpha);
      }
    },
  };
}

function ensureSteamTextures(scene: Phaser.Scene): void {
  STEAM_TEXTURE_KEYS.forEach((key, index) => {
    if (scene.textures.exists(key)) return;

    const graphics = scene.add.graphics().setVisible(false);
    drawSteamBlob(graphics, index);
    graphics.generateTexture(key, 40, 34);
    graphics.destroy();
  });
}

function drawSteamBlob(graphics: Phaser.GameObjects.Graphics, variant: number): void {
  const offsets = [
    [[19, 18, 23, 14], [12, 17, 15, 12], [27, 15, 13, 11], [21, 11, 13, 9]],
    [[20, 18, 24, 13], [13, 14, 13, 11], [28, 19, 12, 10], [21, 10, 15, 8]],
    [[19, 18, 22, 15], [11, 19, 13, 10], [28, 14, 14, 11], [18, 10, 12, 8]],
  ] as const;

  const shapes = offsets[variant % offsets.length];
  graphics.fillStyle(0xe1e5e8, 0.22);
  graphics.fillEllipse(shapes[0][0], shapes[0][1], shapes[0][2], shapes[0][3]);
  graphics.fillStyle(0xf1f3f4, 0.38);
  graphics.fillEllipse(shapes[1][0], shapes[1][1], shapes[1][2], shapes[1][3]);
  graphics.fillStyle(0xd8dde1, 0.3);
  graphics.fillEllipse(shapes[2][0], shapes[2][1], shapes[2][2], shapes[2][3]);
  graphics.fillStyle(0xffffff, 0.25);
  graphics.fillEllipse(shapes[3][0], shapes[3][1], shapes[3][2], shapes[3][3]);
}

function fraction(index: number, multiplier: number, offset: number, modulo: number): number {
  return ((index * multiplier + offset) % modulo) / (modulo - 1);
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}
