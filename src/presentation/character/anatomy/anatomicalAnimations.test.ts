import { describe, expect, it } from 'vitest';
import { CHARACTER_BODY_LEFT, CHARACTER_ORIGIN_Y } from '../characterDimensions';
import type { AnatomicalLandmark } from './AnatomicalPose';
import { CHARACTER_ANIMATIONS, getAnimationFrame } from './anatomicalAnimations';

const expectedAnimations = {
  idle: { loop: true, durations: [180, 180, 180, 180, 180, 180] },
  run: { loop: true, durations: [80, 80, 80, 80, 80, 80, 80, 80] },
  takeoff: { loop: false, durations: [70, 70] },
  rise: { loop: true, durations: [140, 140] },
  apex: { loop: true, durations: [100] },
  fall: { loop: true, durations: [140, 140] },
  landing: { loop: false, durations: [60, 70, 70] },
  shoot: { loop: false, durations: [70, 60, 90, 110] },
  melee: { loop: false, durations: [80, 70, 60, 70, 90, 120] },
  hurt: { loop: false, durations: [70, 90, 130] },
  transfuse: { loop: true, durations: [160, 160, 160, 160, 160, 160] },
  death: { loop: false, durations: [90, 90, 90, 100, 110, 120, 140, 180] },
  respawn: { loop: false, durations: [100, 100, 90, 90, 80, 120] },
} as const;

const expectedLandmarks = [
  'headCenter',
  'neck',
  'shoulderRear',
  'shoulderFront',
  'elbowRear',
  'elbowFront',
  'handRear',
  'handFront',
  'hipRear',
  'hipFront',
  'kneeRear',
  'kneeFront',
  'footRear',
  'footFront',
  'weaponMount',
] as const satisfies readonly AnatomicalLandmark[];

const verticalProgressionLandmarks = [
  'headCenter',
  'shoulderRear',
  'shoulderFront',
  'hipRear',
  'hipFront',
  'kneeRear',
  'kneeFront',
] as const satisfies readonly AnatomicalLandmark[];

describe('anatomical animation catalog', () => {
  it('contains every approved animation with the approved frame count', () => {
    expect(Object.keys(CHARACTER_ANIMATIONS).sort()).toEqual(
      Object.keys(expectedAnimations).sort(),
    );
    for (const [name, expected] of Object.entries(expectedAnimations)) {
      expect(CHARACTER_ANIMATIONS[name as keyof typeof expectedAnimations].frames).toHaveLength(
        expected.durations.length,
      );
    }
  });

  it('uses the approved duration sequence and loop flag for every animation', () => {
    for (const [name, expected] of Object.entries(expectedAnimations)) {
      const animation = CHARACTER_ANIMATIONS[name as keyof typeof expectedAnimations];
      expect(animation.frames.map((frame) => frame.durationMs)).toEqual(expected.durations);
      expect(animation.loop).toBe(expected.loop);
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

  it('contains exactly the approved 15 landmarks in every pose', () => {
    for (const animation of Object.values(CHARACTER_ANIMATIONS)) {
      for (const frame of animation.frames) {
        expect(Object.keys(frame.pose).sort()).toEqual([...expectedLandmarks].sort());
      }
    }
  });

  it('keeps every grounded animation on the contact pixel row', () => {
    const groundedAnimations = [
      'idle',
      'run',
      'landing',
      'shoot',
      'melee',
      'hurt',
      'transfuse',
    ] as const;

    for (const name of groundedAnimations) {
      for (const frame of CHARACTER_ANIMATIONS[name].frames) {
        expect(frame.pose.footRear.y).toBe(CHARACTER_ORIGIN_Y - 1);
        expect(frame.pose.footFront.y).toBe(CHARACTER_ORIGIN_Y - 1);
      }
    }
  });

  it('keeps rise and fall feet above the contact pixel row', () => {
    for (const name of ['rise', 'fall'] as const) {
      for (const frame of CHARACTER_ANIMATIONS[name].frames) {
        expect(frame.pose.footRear.y).toBeLessThan(CHARACTER_ORIGIN_Y - 1);
        expect(frame.pose.footFront.y).toBeLessThan(CHARACTER_ORIGIN_Y - 1);
      }
    }
  });

  it('keeps front torso landmarks right of rear torso landmarks', () => {
    for (const animation of Object.values(CHARACTER_ANIMATIONS)) {
      for (const frame of animation.frames) {
        expect(frame.pose.shoulderFront.x).toBeGreaterThan(frame.pose.shoulderRear.x);
        expect(frame.pose.hipFront.x).toBeGreaterThan(frame.pose.hipRear.x);
      }
    }
  });

  it('compresses before extending through the authored takeoff phases', () => {
    const standing = CHARACTER_ANIMATIONS.idle.frames[0].pose;
    const compressed = CHARACTER_ANIMATIONS.takeoff.frames[0].pose;
    const extended = CHARACTER_ANIMATIONS.takeoff.frames[1].pose;

    expect(compressed.hipRear.y).toBeGreaterThan(standing.hipRear.y);
    expect(compressed.hipFront.y).toBeGreaterThan(standing.hipFront.y);
    expect(compressed.kneeRear.y).toBeGreaterThan(compressed.hipRear.y);
    expect(compressed.kneeFront.y).toBeGreaterThan(compressed.hipFront.y);
    expect(extended.headCenter.y).toBeLessThan(compressed.headCenter.y);
    expect(extended.hipRear.y).toBeLessThan(compressed.hipRear.y);
    expect(extended.hipFront.y).toBeLessThan(compressed.hipFront.y);
    expect(extended.footRear.y).toBeLessThan(compressed.footRear.y);
    expect(extended.footFront.y).toBeLessThan(compressed.footFront.y);
  });

  it('alternates opposing contact and passing relationships across the run cycle', () => {
    const firstContact = CHARACTER_ANIMATIONS.run.frames[0].pose;
    const firstPassing = CHARACTER_ANIMATIONS.run.frames[2].pose;
    const oppositeContact = CHARACTER_ANIMATIONS.run.frames[4].pose;
    const oppositePassing = CHARACTER_ANIMATIONS.run.frames[6].pose;

    expect(firstContact.footRear.x).toBeLessThan(firstContact.hipRear.x);
    expect(firstContact.footFront.x).toBeGreaterThan(firstContact.hipFront.x);
    expect(oppositeContact.footRear.x).toBeGreaterThan(oppositeContact.hipRear.x);
    expect(oppositeContact.footFront.x).toBeLessThan(oppositeContact.hipFront.x);
    expect(firstPassing.footRear.x).toBeLessThan(firstPassing.footFront.x);
    expect(oppositePassing.footRear.x).toBeGreaterThan(oppositePassing.footFront.x);
  });

  it('lowers the fighter progressively into a horizontal death pose', () => {
    for (const landmark of verticalProgressionLandmarks) {
      const positions = CHARACTER_ANIMATIONS.death.frames.map((frame) => frame.pose[landmark].y);
      for (let index = 1; index < positions.length; index += 1) {
        expect(positions[index]).toBeGreaterThanOrEqual(positions[index - 1]);
      }
    }

    const finalPose = CHARACTER_ANIMATIONS.death.frames.at(-1)!.pose;
    const finalRows = verticalProgressionLandmarks.map((landmark) => finalPose[landmark].y);
    expect(Math.max(...finalRows) - Math.min(...finalRows)).toBeLessThanOrEqual(3);
  });

  it('returns independently authored respawn frames to the standing pose', () => {
    const death = CHARACTER_ANIMATIONS.death;
    const respawn = CHARACTER_ANIMATIONS.respawn;
    const standingPose = CHARACTER_ANIMATIONS.idle.frames[0].pose;
    const finalRespawnPose = respawn.frames.at(-1)!.pose;

    expect(respawn.frames).not.toBe(death.frames);
    expect(finalRespawnPose).not.toBe(standingPose);
    expect(finalRespawnPose).toEqual(standingPose);
    for (const landmark of verticalProgressionLandmarks) {
      const positions = respawn.frames.map((frame) => frame.pose[landmark].y);
      for (let index = 1; index < positions.length; index += 1) {
        expect(positions[index]).toBeLessThanOrEqual(positions[index - 1]);
      }
    }
    for (const deathFrame of death.frames) {
      expect(respawn.frames).not.toContain(deathFrame);
      expect(respawn.frames.map((frame) => frame.pose)).not.toContain(deathFrame.pose);
    }
  });

  it('keeps every animation array, frame, pose, and point distinct and frozen', () => {
    const definitions = Object.values(CHARACTER_ANIMATIONS);
    const frameArrays = definitions.map((definition) => definition.frames);
    const frames = frameArrays.flat();
    const poses = frames.map((frame) => frame.pose);
    const points = poses.flatMap((pose) => Object.values(pose));

    expect(Object.isFrozen(CHARACTER_ANIMATIONS)).toBe(true);
    expect(new Set(definitions)).toHaveProperty('size', definitions.length);
    expect(new Set(frameArrays)).toHaveProperty('size', definitions.length);
    expect(new Set(frames)).toHaveProperty('size', frames.length);
    expect(new Set(poses)).toHaveProperty('size', poses.length);
    expect(new Set(points)).toHaveProperty('size', points.length);

    for (const definition of definitions) {
      expect(Object.isFrozen(definition)).toBe(true);
      expect(Object.isFrozen(definition.frames)).toBe(true);
    }
    for (const frame of frames) {
      expect(Object.isFrozen(frame)).toBe(true);
      expect(Object.isFrozen(frame.pose)).toBe(true);
      for (const point of Object.values(frame.pose)) {
        expect(Object.isFrozen(point)).toBe(true);
      }
    }
  });

  it('returns the requested discrete pose frame', () => {
    expect(getAnimationFrame('run', 3)).toBe(CHARACTER_ANIMATIONS.run.frames[3]);
  });

  it('rejects an unavailable pose frame index', () => {
    expect(() => getAnimationFrame('idle', 6)).toThrow('Invalid idle frame index 6.');
  });
});
