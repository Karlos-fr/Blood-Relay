import { PLAYER_MOVE_SPEED } from '../../gameplay/player/movement';
import { CHARACTER_ANIMATIONS } from './anatomy/anatomicalAnimations';
import type { CharacterAnimationName, CharacterPoseFrame } from './anatomy/AnatomicalPose';

export interface CharacterMotionSnapshot {
  grounded: boolean;
  velocityX: number;
  velocityY: number;
}

export interface CharacterFrameSelection {
  animationName: CharacterAnimationName;
  frameIndex: number;
}

const AIR_VERTICAL_DEADZONE = 60;
const RUN_MIN_SPEED = 10;
const RUN_MIN_RATE = 0.65;
const RUN_MAX_RATE = 1.35;

export class PixelPoseAnimator {
  public animationName: CharacterAnimationName = 'idle';
  private animationElapsedMs = 0;
  private lastUpdateAt = 0;
  private initialized = false;
  private wasGrounded = true;

  public update(timeMs: number, motion: CharacterMotionSnapshot): CharacterFrameSelection {
    if (!this.initialized) {
      this.initialized = true;
      this.wasGrounded = motion.grounded;
      this.lastUpdateAt = timeMs;
      this.start(baseAnimation(motion));
    } else {
      const deltaTimeMs = timeMs - this.lastUpdateAt;
      this.lastUpdateAt = timeMs;
      this.animationElapsedMs += deltaTimeMs * animationRate(this.animationName, motion);

      const tookOff = this.wasGrounded && !motion.grounded && motion.velocityY < 0;
      const landed = !this.wasGrounded && motion.grounded;

      if (tookOff) {
        this.start('takeoff');
      } else if (landed) {
        this.start('landing');
      } else if (!this.isTransientStillActive()) {
        const next = baseAnimation(motion);
        if (next !== this.animationName) this.start(next);
      }

      this.wasGrounded = motion.grounded;
    }

    return {
      animationName: this.animationName,
      frameIndex: sampleFrameIndex(
        CHARACTER_ANIMATIONS[this.animationName].frames,
        this.animationElapsedMs,
      ),
    };
  }

  private start(name: CharacterAnimationName): void {
    this.animationName = name;
    this.animationElapsedMs = 0;
  }

  private isTransientStillActive(): boolean {
    return (
      (this.animationName === 'takeoff' || this.animationName === 'landing') &&
      this.animationElapsedMs < animationDurationMs(this.animationName)
    );
  }
}

function animationRate(
  animationName: CharacterAnimationName,
  motion: CharacterMotionSnapshot,
): number {
  if (animationName !== 'run') return 1;
  return Math.min(
    RUN_MAX_RATE,
    Math.max(RUN_MIN_RATE, Math.abs(motion.velocityX) / PLAYER_MOVE_SPEED),
  );
}

function animationDurationMs(animationName: CharacterAnimationName): number {
  return CHARACTER_ANIMATIONS[animationName].frames.reduce(
    (sum, frame) => sum + frame.durationMs,
    0,
  );
}

function baseAnimation(motion: CharacterMotionSnapshot): CharacterAnimationName {
  if (motion.grounded) {
    return Math.abs(motion.velocityX) >= RUN_MIN_SPEED ? 'run' : 'idle';
  }
  if (motion.velocityY < -AIR_VERTICAL_DEADZONE) return 'rise';
  if (motion.velocityY > AIR_VERTICAL_DEADZONE) return 'fall';
  return 'apex';
}

function sampleFrameIndex(frames: readonly CharacterPoseFrame[], elapsedMs: number): number {
  const total = frames.reduce((sum, frame) => sum + frame.durationMs, 0);
  let cursor = ((elapsedMs % total) + total) % total;

  for (let index = 0; index < frames.length; index += 1) {
    if (cursor < frames[index].durationMs) return index;
    cursor -= frames[index].durationMs;
  }

  return frames.length - 1;
}
