import type { PixelPoint } from '../frame/PixelCanvas';

export const ANATOMICAL_LANDMARKS = [
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
] as const;

export type AnatomicalLandmark = (typeof ANATOMICAL_LANDMARKS)[number];
export type AnatomicalPose = Readonly<Record<AnatomicalLandmark, PixelPoint>>;

export type CharacterAnimationName =
  | 'idle'
  | 'run'
  | 'takeoff'
  | 'rise'
  | 'apex'
  | 'fall'
  | 'landing'
  | 'shoot'
  | 'melee'
  | 'hurt'
  | 'transfuse'
  | 'death'
  | 'respawn';

export interface CharacterPoseFrame {
  durationMs: number;
  pose: AnatomicalPose;
  accessoryPhase: 0 | 1 | 2 | 3;
}

export interface CharacterAnimationDefinition {
  loop: boolean;
  frames: readonly CharacterPoseFrame[];
}
