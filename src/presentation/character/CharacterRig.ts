import type { CharacterFacing, CharacterPieceSlot, RigAnchorName } from './moduleGeometry';

export interface RigPoint {
  x: number;
  y: number;
}

export const CHARACTER_RIG: Readonly<Record<RigAnchorName, RigPoint>> = {
  hips: { x: 0, y: 7 },
  torso: { x: 0, y: 0 },
  neck: { x: 0, y: -7 },
  head: { x: 1, y: -11 },
  shoulderBack: { x: -1, y: -4 },
  shoulderFront: { x: 1, y: -4 },
  elbowBack: { x: -2, y: 0 },
  elbowFront: { x: 4, y: -1 },
  handBack: { x: -3, y: 4 },
  handFront: { x: 6, y: 1 },
  weaponMount: { x: 6, y: 1 },
  accessoryBack: { x: -3, y: -1 },
  accessoryHip: { x: -2, y: 6 },
  accessoryFront: { x: 2, y: -4 },
};

export const CHARACTER_RENDER_ORDER: readonly CharacterPieceSlot[] = [
  'rearAccessory',
  'rearArm',
  'rearLeg',
  'torso',
  'frontLeg',
  'head',
  'frontArm',
  'weapon',
  'frontAccessory',
];

export function getRigAnchor(anchor: RigAnchorName, facing: CharacterFacing): RigPoint {
  const point = CHARACTER_RIG[anchor];
  return {
    x: facing === 'left' ? -point.x : point.x,
    y: point.y,
  };
}
