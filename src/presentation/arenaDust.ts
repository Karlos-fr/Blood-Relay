import type Phaser from 'phaser';

export interface DustSeed {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  baseAlpha: number;
  phase: number;
  size: 1 | 2;
}

export interface DustSample {
  x: number;
  y: number;
  alpha: number;
}

export interface ArenaDustSystem {
  update(time: number): void;
}

export function buildDustSeeds(width: number, height: number, count = 16): DustSeed[] {
  return Array.from({ length: Math.min(20, count) }, (_, index) => {
    const a = fraction(index, 37, 13, 101);
    const b = fraction(index, 61, 29, 103);
    const c = fraction(index, 43, 17, 97);
    return {
      x: a * width,
      y: b * height,
      velocityX: -0.7 + c * 1.4,
      velocityY: -0.18 + a * 0.42,
      baseAlpha: 0.035 + b * 0.075,
      phase: c * Math.PI * 2,
      size: index % 5 === 0 ? 2 : 1,
    };
  });
}

export function sampleDust(
  seed: DustSeed,
  timeMs: number,
  width: number,
  height: number,
): DustSample {
  const seconds = timeMs / 1000;
  const x = positiveModulo(seed.x + seed.velocityX * seconds, width);
  const y = positiveModulo(seed.y + seed.velocityY * seconds, height);
  const twinkle = 0.7 + Math.sin(seconds * 0.45 + seed.phase) * 0.3;
  return { x, y, alpha: seed.baseAlpha * twinkle };
}

export function createArenaDustSystem(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  width: number,
  height: number,
): ArenaDustSystem {
  const seeds = buildDustSeeds(width, height, 16);
  const particles = seeds.map((seed) =>
    scene.add.rectangle(seed.x, seed.y, seed.size, seed.size, 0xc9cdd2, 1).setAlpha(seed.baseAlpha),
  );
  container.add(particles);

  return {
    update(time: number): void {
      particles.forEach((particle, index) => {
        const sample = sampleDust(seeds[index], time, width, height);
        particle.setPosition(sample.x, sample.y).setAlpha(sample.alpha);
      });
    },
  };
}

function fraction(index: number, multiplier: number, offset: number, modulo: number): number {
  return ((index * multiplier + offset) % modulo) / (modulo - 1);
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}
