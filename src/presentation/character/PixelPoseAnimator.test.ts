import { describe, expect, it } from 'vitest';
import { PLAYER_MOVE_SPEED } from '../../gameplay/player/movement';
import { PixelPoseAnimator } from './PixelPoseAnimator';

describe('pixel pose animator', () => {
  it('returns deterministic animation and frame indexes', () => {
    const animator = new PixelPoseAnimator();
    expect(animator.update(0, { grounded: true, velocityX: 0, velocityY: 0 })).toEqual({
      animationName: 'idle',
      frameIndex: 0,
    });
    expect(animator.update(181, { grounded: true, velocityX: 0, velocityY: 0 })).toEqual({
      animationName: 'idle',
      frameIndex: 1,
    });
  });

  it('selects motion transitions deterministically', () => {
    const animator = new PixelPoseAnimator();
    expect(animator.update(0, { grounded: true, velocityX: 100, velocityY: 0 })).toEqual({
      animationName: 'run',
      frameIndex: 0,
    });
    expect(animator.update(16, { grounded: false, velocityX: 80, velocityY: -300 })).toEqual({
      animationName: 'takeoff',
      frameIndex: 0,
    });
    expect(animator.update(180, { grounded: false, velocityX: 80, velocityY: -180 })).toEqual({
      animationName: 'rise',
      frameIndex: 0,
    });
    expect(animator.update(360, { grounded: false, velocityX: 60, velocityY: 10 })).toEqual({
      animationName: 'apex',
      frameIndex: 0,
    });
    expect(animator.update(520, { grounded: false, velocityX: 40, velocityY: 180 })).toEqual({
      animationName: 'fall',
      frameIndex: 0,
    });
    expect(animator.update(700, { grounded: true, velocityX: 20, velocityY: 0 })).toEqual({
      animationName: 'landing',
      frameIndex: 0,
    });
  });

  it('retains velocity-scaled run timing', () => {
    const animator = new PixelPoseAnimator();
    expect(
      animator.update(0, { grounded: true, velocityX: PLAYER_MOVE_SPEED, velocityY: 0 }),
    ).toEqual({
      animationName: 'run',
      frameIndex: 0,
    });
    expect(
      animator.update(80, { grounded: true, velocityX: PLAYER_MOVE_SPEED, velocityY: 0 }),
    ).toEqual({
      animationName: 'run',
      frameIndex: 1,
    });
  });
});
