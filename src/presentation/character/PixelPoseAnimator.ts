import { PLAYER_MOVE_SPEED } from '../../gameplay/player/movement';
import {
  CHARACTER_ANIMATIONS,
  type CharacterAnimationName,
  type PixelPoseFrame,
} from './pixelPoses';

export interface CharacterMotionSnapshot {
  grounded: boolean;
  velocityX: number;
  velocityY: number;
}

const TAKEOFF_MS = 140;
const LANDING_MS = 140;
const AIR_VERTICAL_DEADZONE = 60;
const RUN_MIN_SPEED = 10;

export class PixelPoseAnimator {
  public animationName: CharacterAnimationName = 'idle';
  private startedAt = 0;
  private initialized = false;
  private wasGrounded = true;

  public update(timeMs: number, motion: CharacterMotionSnapshot): PixelPoseFrame {
    if (!this.initialized) {
      this.initialized = true;
      this.wasGrounded = motion.grounded;
      this.start(baseAnimation(motion), timeMs);
    } else {
      const tookOff = this.wasGrounded && !motion.grounded && motion.velocityY < 0;
      const landed = !this.wasGrounded && motion.grounded;

      if (tookOff) {
        this.start('takeoff', timeMs);
      } else if (landed) {
        this.start('landing', timeMs);
      } else if (!this.isTransientStillActive(timeMs)) {
        const next = baseAnimation(motion);
        if (next !== this.animationName) this.start(next, timeMs);
      }

      this.wasGrounded = motion.grounded;
    }

    const rate =
      this.animationName === 'run'
        ? Math.min(1.35, Math.max(0.65, Math.abs(motion.velocityX) / PLAYER_MOVE_SPEED))
        : 1;
    return sampleFrames(
      CHARACTER_ANIMATIONS[this.animationName],
      (timeMs - this.startedAt) * rate,
    );
  }

  private start(name: CharacterAnimationName, timeMs: number): void {
    this.animationName = name;
    this.startedAt = timeMs;
  }

  private isTransientStillActive(timeMs: number): boolean {
    const elapsed = timeMs - this.startedAt;
    return (
      (this.animationName === 'takeoff' && elapsed < TAKEOFF_MS) ||
      (this.animationName === 'landing' && elapsed < LANDING_MS)
    );
  }
}

function baseAnimation(motion: CharacterMotionSnapshot): CharacterAnimationName {
  if (motion.grounded) {
    return Math.abs(motion.velocityX) >= RUN_MIN_SPEED ? 'run' : 'idle';
  }
  if (motion.velocityY < -AIR_VERTICAL_DEADZONE) return 'rise';
  if (motion.velocityY > AIR_VERTICAL_DEADZONE) return 'fall';
  return 'apex';
}

function sampleFrames(frames: readonly PixelPoseFrame[], elapsedMs: number): PixelPoseFrame {
  const total = frames.reduce((sum, frame) => sum + frame.durationMs, 0);
  let cursor = ((elapsedMs % total) + total) % total;

  for (const frame of frames) {
    if (cursor < frame.durationMs) return frame;
    cursor -= frame.durationMs;
  }

  return frames[frames.length - 1];
}
