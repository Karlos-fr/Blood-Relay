import type Phaser from 'phaser';
import { sampleRoundedPath, type PipePathSegment } from './pipeGeometry';

export interface BloodPipeEffect {
  update(coreProgress: number, shimmer: number): void;
}

const TRAIL_SPACING = 0.018;
const TRAIL_ALPHAS = [0.2, 0.12, 0.07] as const;
const TRAIL_RADII = [4.2, 3.4, 2.8] as const;

export function getBloodTrailProgresses(coreProgress: number, count = 3): number[] {
  return Array.from({ length: count }, (_, index) =>
    positiveModulo(coreProgress - TRAIL_SPACING * (index + 1), 1),
  );
}

export function createBloodPipeEffect(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  path: PipePathSegment[],
): BloodPipeEffect {
  const glow = scene.add.circle(0, 0, 6.5, 0xd42f40, 1).setAlpha(0.18);
  const core = scene.add.circle(0, 0, 2.5, 0xff5360, 1).setAlpha(0.95);
  const trails = TRAIL_ALPHAS.map((alpha, index) =>
    scene.add
      .circle(0, 0, TRAIL_RADII[index], 0xe33a49, 1)
      .setAlpha(alpha),
  );

  container.add([...trails, glow, core]);

  return {
    update(coreProgress: number, shimmer: number): void {
      const corePoint = sampleRoundedPath(path, coreProgress);
      core.setPosition(corePoint.x, corePoint.y).setAlpha(shimmer);
      glow.setPosition(corePoint.x, corePoint.y).setAlpha(0.1 + shimmer * 0.15);

      const trailProgresses = getBloodTrailProgresses(coreProgress, trails.length);
      trails.forEach((trail, index) => {
        const point = sampleRoundedPath(path, trailProgresses[index]);
        trail
          .setPosition(point.x, point.y)
          .setAlpha(TRAIL_ALPHAS[index] * shimmer);
      });
    },
  };
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}
