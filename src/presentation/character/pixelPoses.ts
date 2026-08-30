import type { CharacterPieceSlot } from './moduleGeometry';

export type CharacterAnimationName =
  | 'idle'
  | 'run'
  | 'takeoff'
  | 'rise'
  | 'apex'
  | 'fall'
  | 'landing';

export interface PixelOffset {
  x: number;
  y: number;
}

export interface PixelPoseFrame {
  durationMs: number;
  offsets: Partial<Record<CharacterPieceSlot, PixelOffset>>;
}

export const LOWER_BODY_SLOTS = ['rearLeg', 'frontLeg'] as const;
export const UPPER_BODY_SLOTS = ['rearArm', 'torso', 'head', 'frontArm', 'weapon'] as const;

const frame = (
  durationMs: number,
  offsets: PixelPoseFrame['offsets'] = {},
): PixelPoseFrame => ({ durationMs, offsets });

export const CHARACTER_ANIMATIONS: Readonly<
  Record<CharacterAnimationName, readonly PixelPoseFrame[]>
> = {
  idle: [
    frame(220),
    frame(220, {
      torso: { x: 0, y: 1 },
      head: { x: 0, y: 1 },
      rearArm: { x: 0, y: 1 },
      frontArm: { x: 0, y: 1 },
      weapon: { x: 0, y: 1 },
    }),
    frame(220),
    frame(220, { frontArm: { x: 1, y: 0 }, weapon: { x: 1, y: 0 } }),
  ],
  run: [
    frame(90, {
      rearLeg: { x: -1, y: 0 },
      frontLeg: { x: 1, y: -1 },
      rearArm: { x: 1, y: 0 },
      frontArm: { x: -1, y: 0 },
      weapon: { x: -1, y: 0 },
    }),
    frame(90, {
      rearLeg: { x: -1, y: -1 },
      frontLeg: { x: 1, y: 0 },
      torso: { x: 1, y: 0 },
    }),
    frame(90, { torso: { x: 1, y: -1 } }),
    frame(90, {
      rearLeg: { x: 1, y: -1 },
      frontLeg: { x: -1, y: 0 },
      rearArm: { x: -1, y: 0 },
      frontArm: { x: 1, y: 0 },
      weapon: { x: 1, y: 0 },
    }),
    frame(90, {
      rearLeg: { x: 1, y: 0 },
      frontLeg: { x: -1, y: -1 },
      torso: { x: 1, y: 0 },
    }),
    frame(90, { torso: { x: 1, y: -1 } }),
  ],
  takeoff: [
    frame(70, {
      torso: { x: 0, y: 1 },
      head: { x: 0, y: 1 },
      rearLeg: { x: 0, y: 1 },
      frontLeg: { x: 0, y: 1 },
    }),
    frame(70, {
      torso: { x: 1, y: -1 },
      frontArm: { x: 1, y: -1 },
      weapon: { x: 1, y: -1 },
    }),
  ],
  rise: [
    frame(140, {
      rearLeg: { x: -1, y: -1 },
      frontLeg: { x: 1, y: -1 },
      torso: { x: 1, y: -1 },
      frontArm: { x: 1, y: 0 },
      weapon: { x: 1, y: 0 },
    }),
    frame(140, {
      rearLeg: { x: 0, y: -2 },
      frontLeg: { x: 1, y: -1 },
      torso: { x: 1, y: -1 },
    }),
  ],
  apex: [
    frame(100, {
      rearLeg: { x: -1, y: -1 },
      frontLeg: { x: 1, y: -1 },
      torso: { x: 0, y: -1 },
    }),
  ],
  fall: [
    frame(140, {
      rearLeg: { x: -1, y: 0 },
      frontLeg: { x: 1, y: 1 },
      frontArm: { x: 1, y: 1 },
      weapon: { x: 1, y: 1 },
    }),
    frame(140, {
      rearLeg: { x: 1, y: 1 },
      frontLeg: { x: -1, y: 0 },
      rearArm: { x: -1, y: 1 },
    }),
  ],
  landing: [
    frame(70, {
      torso: { x: 0, y: 1 },
      head: { x: 0, y: 1 },
      rearLeg: { x: -1, y: 1 },
      frontLeg: { x: 1, y: 1 },
    }),
    frame(70, {
      torso: { x: 0, y: 1 },
      rearLeg: { x: 0, y: 1 },
      frontLeg: { x: 0, y: 1 },
    }),
  ],
};
