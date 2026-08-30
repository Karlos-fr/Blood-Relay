import { describe, expect, it } from 'vitest';
import { CHARACTER_RENDER_ORDER, getRigAnchor } from './CharacterRig';
import { PixelPoseAnimator } from './PixelPoseAnimator';
import { CHARACTER_ANIMATIONS, LOWER_BODY_SLOTS, UPPER_BODY_SLOTS } from './pixelPoses';

describe('shared procedural character rig and poses', () => {
  it('mirrors rig x positions while preserving y', () => {
    const right = getRigAnchor('weaponMount', 'right');
    const left = getRigAnchor('weaponMount', 'left');
    expect(left).toEqual({ x: -right.x, y: right.y });
  });

  it('uses the locked render order', () => {
    expect(CHARACTER_RENDER_ORDER).toEqual([
      'rearAccessory',
      'rearArm',
      'rearLeg',
      'torso',
      'frontLeg',
      'head',
      'frontArm',
      'weapon',
      'frontAccessory',
    ]);
  });

  it('keeps explicit lower/upper groups for future weapon poses without blending', () => {
    expect(LOWER_BODY_SLOTS).toEqual(['rearLeg', 'frontLeg']);
    expect(UPPER_BODY_SLOTS).toEqual(['rearArm', 'torso', 'head', 'frontArm', 'weapon']);
  });

  it('contains all initial animations with integer offsets', () => {
    expect(Object.keys(CHARACTER_ANIMATIONS).sort()).toEqual(
      ['apex', 'fall', 'idle', 'landing', 'rise', 'run', 'takeoff'].sort(),
    );
    for (const frames of Object.values(CHARACTER_ANIMATIONS)) {
      for (const frame of frames) {
        for (const offset of Object.values(frame.offsets)) {
          expect(Number.isInteger(offset?.x)).toBe(true);
          expect(Number.isInteger(offset?.y)).toBe(true);
        }
      }
    }
  });

  it('selects motion transitions deterministically', () => {
    const animator = new PixelPoseAnimator();
    animator.update(0, { grounded: true, velocityX: 100, velocityY: 0 });
    expect(animator.animationName).toBe('run');
    animator.update(16, { grounded: false, velocityX: 80, velocityY: -300 });
    expect(animator.animationName).toBe('takeoff');
    animator.update(180, { grounded: false, velocityX: 80, velocityY: -180 });
    expect(animator.animationName).toBe('rise');
    animator.update(360, { grounded: false, velocityX: 60, velocityY: 10 });
    expect(animator.animationName).toBe('apex');
    animator.update(520, { grounded: false, velocityX: 40, velocityY: 180 });
    expect(animator.animationName).toBe('fall');
    animator.update(700, { grounded: true, velocityX: 20, velocityY: 0 });
    expect(animator.animationName).toBe('landing');
  });
});
