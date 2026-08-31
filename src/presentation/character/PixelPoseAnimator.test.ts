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

  it.each([
    { label: 'lower', velocityX: 10, beforeBoundaryMs: 123, boundaryMs: 124 },
    {
      label: 'base',
      velocityX: PLAYER_MOVE_SPEED,
      beforeBoundaryMs: 79,
      boundaryMs: 80,
    },
    {
      label: 'upper',
      velocityX: PLAYER_MOVE_SPEED * 2,
      beforeBoundaryMs: 59,
      boundaryMs: 60,
    },
  ])(
    'clamps run timing at the $label playback rate',
    ({ velocityX, beforeBoundaryMs, boundaryMs }) => {
      const animator = new PixelPoseAnimator();
      expect(animator.update(0, { grounded: true, velocityX, velocityY: 0 }).frameIndex).toBe(0);
      expect(
        animator.update(beforeBoundaryMs, { grounded: true, velocityX, velocityY: 0 }).frameIndex,
      ).toBe(0);
      expect(
        animator.update(boundaryMs, { grounded: true, velocityX, velocityY: 0 }).frameIndex,
      ).toBe(1);
    },
  );

  it('preserves accumulated run phase when velocity slows', () => {
    const animator = new PixelPoseAnimator();
    const fastVelocity = PLAYER_MOVE_SPEED * 2;

    animator.update(0, { grounded: true, velocityX: fastVelocity, velocityY: 0 });
    expect(
      animator.update(100, { grounded: true, velocityX: fastVelocity, velocityY: 0 }).frameIndex,
    ).toBe(1);
    expect(animator.update(110, { grounded: true, velocityX: 10, velocityY: 0 })).toEqual({
      animationName: 'run',
      frameIndex: 1,
    });
  });

  it('preserves accumulated run phase when velocity accelerates', () => {
    const animator = new PixelPoseAnimator();

    animator.update(0, { grounded: true, velocityX: 10, velocityY: 0 });
    expect(animator.update(100, { grounded: true, velocityX: 10, velocityY: 0 }).frameIndex).toBe(
      0,
    );
    expect(
      animator.update(110, {
        grounded: true,
        velocityX: PLAYER_MOVE_SPEED * 2,
        velocityY: 0,
      }),
    ).toEqual({ animationName: 'run', frameIndex: 0 });
  });

  it('plays every authored landing interval before returning to grounded movement', () => {
    const idleAnimator = new PixelPoseAnimator();
    idleAnimator.update(0, { grounded: false, velocityX: 0, velocityY: 180 });
    expect(idleAnimator.update(10, { grounded: true, velocityX: 0, velocityY: 0 })).toEqual({
      animationName: 'landing',
      frameIndex: 0,
    });
    expect(idleAnimator.update(70, { grounded: true, velocityX: 0, velocityY: 0 })).toEqual({
      animationName: 'landing',
      frameIndex: 1,
    });
    expect(idleAnimator.update(140, { grounded: true, velocityX: 0, velocityY: 0 })).toEqual({
      animationName: 'landing',
      frameIndex: 2,
    });
    expect(idleAnimator.update(209, { grounded: true, velocityX: 0, velocityY: 0 })).toEqual({
      animationName: 'landing',
      frameIndex: 2,
    });
    expect(idleAnimator.update(210, { grounded: true, velocityX: 0, velocityY: 0 })).toEqual({
      animationName: 'idle',
      frameIndex: 0,
    });

    const runAnimator = new PixelPoseAnimator();
    runAnimator.update(0, { grounded: false, velocityX: 20, velocityY: 180 });
    runAnimator.update(10, { grounded: true, velocityX: 20, velocityY: 0 });
    expect(runAnimator.update(210, { grounded: true, velocityX: 20, velocityY: 0 })).toEqual({
      animationName: 'run',
      frameIndex: 0,
    });
  });
});
