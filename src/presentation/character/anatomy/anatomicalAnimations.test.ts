import { describe, expect, it } from 'vitest';
import { CHARACTER_BODY_LEFT, CHARACTER_ORIGIN_Y } from '../characterDimensions';
import { CHARACTER_ANIMATIONS, getAnimationFrame } from './anatomicalAnimations';

const expectedCounts = {
  idle: 6,
  run: 8,
  takeoff: 2,
  rise: 2,
  apex: 1,
  fall: 2,
  landing: 3,
  shoot: 4,
  melee: 6,
  hurt: 3,
  transfuse: 6,
  death: 8,
  respawn: 6,
} as const;

describe('anatomical animation catalog', () => {
  it('contains every approved animation with the approved frame count', () => {
    expect(Object.keys(CHARACTER_ANIMATIONS).sort()).toEqual(Object.keys(expectedCounts).sort());
    for (const [name, count] of Object.entries(expectedCounts)) {
      expect(CHARACTER_ANIMATIONS[name as keyof typeof expectedCounts].frames).toHaveLength(count);
    }
  });

  it('keeps every landmark integer and inside the body region', () => {
    for (const animation of Object.values(CHARACTER_ANIMATIONS)) {
      for (const frame of animation.frames) {
        expect(frame.durationMs).toBeGreaterThan(0);
        for (const point of Object.values(frame.pose)) {
          expect(Number.isInteger(point.x)).toBe(true);
          expect(Number.isInteger(point.y)).toBe(true);
          expect(point.x).toBeGreaterThanOrEqual(CHARACTER_BODY_LEFT);
          expect(point.x).toBeLessThan(CHARACTER_BODY_LEFT + 32);
          expect(point.y).toBeGreaterThanOrEqual(4);
          expect(point.y).toBeLessThan(CHARACTER_ORIGIN_Y);
        }
      }
    }
  });

  it('places both idle feet on the contact pixel row', () => {
    for (const frame of CHARACTER_ANIMATIONS.idle.frames) {
      expect(frame.pose.footRear.y).toBe(CHARACTER_ORIGIN_Y - 1);
      expect(frame.pose.footFront.y).toBe(CHARACTER_ORIGIN_Y - 1);
    }
  });

  it('returns the requested discrete pose frame', () => {
    expect(getAnimationFrame('run', 3)).toBe(CHARACTER_ANIMATIONS.run.frames[3]);
  });

  it('rejects an unavailable pose frame index', () => {
    expect(() => getAnimationFrame('idle', 6)).toThrow('Invalid idle frame index 6.');
  });
});
