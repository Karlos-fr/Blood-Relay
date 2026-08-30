import type Phaser from 'phaser';
import { sampleRoundedPath, type PipePathSegment } from './pipeGeometry';

interface Point { x: number; y: number; }

export interface BloodPipeUpdate {
  arrived: boolean;
  entryPoint?: Point;
  entryVelocity?: Point;
}

export interface BloodPipeEffect {
  update(coreProgress: number, shimmer: number): BloodPipeUpdate;
}

const TRAIL_SPACING = 0.018;
const TRAIL_ALPHAS = [0.2, 0.12, 0.07] as const;
const TRAIL_RADII = [4.2, 3.4, 2.8] as const;

export function getBloodTrailProgresses(coreProgress: number, count = 3): number[] {
  return Array.from({ length: count }, (_, index) =>
    positiveModulo(coreProgress - TRAIL_SPACING * (index + 1), 1),
  );
}

export function didBloodParticleArrive(
  previousProgress: number | undefined,
  currentProgress: number,
): boolean {
  if (previousProgress === undefined) return false;
  return previousProgress > 0.8 && currentProgress < 0.2 && previousProgress - currentProgress > 0.5;
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

  const endPoint = sampleRoundedPath(path, 1);
  const beforeEnd = sampleRoundedPath(path, 0.985);
  const directionX = endPoint.x - beforeEnd.x;
  const directionY = endPoint.y - beforeEnd.y;
  const directionLength = Math.max(0.0001, Math.hypot(directionX, directionY));
  const entryVelocity = {
    x: (directionX / directionLength) * 30,
    y: (directionY / directionLength) * 30,
  };
  const updateResult: BloodPipeUpdate = {
    arrived: false,
    entryPoint: endPoint,
    entryVelocity,
  };
  let previousProgress: number | undefined;

  container.add([...trails, glow, core]);

  return {
    update(coreProgress: number, shimmer: number): BloodPipeUpdate {
      const arrived = didBloodParticleArrive(previousProgress, coreProgress);
      previousProgress = coreProgress;

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

      updateResult.arrived = arrived;
      return updateResult;
    },
  };
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}
