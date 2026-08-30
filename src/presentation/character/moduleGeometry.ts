import type { CharacterPalette } from './characterPalettes';

export type PaletteRole = keyof CharacterPalette;
export type CharacterFacing = 'left' | 'right' | 'back';
export type CharacterPieceSlot =
  | 'rearAccessory'
  | 'rearArm'
  | 'rearLeg'
  | 'torso'
  | 'frontLeg'
  | 'head'
  | 'frontArm'
  | 'weapon'
  | 'frontAccessory';
export type RigAnchorName =
  | 'hips'
  | 'torso'
  | 'neck'
  | 'head'
  | 'shoulderBack'
  | 'shoulderFront'
  | 'elbowBack'
  | 'elbowFront'
  | 'handBack'
  | 'handFront'
  | 'weaponMount'
  | 'accessoryBack'
  | 'accessoryHip'
  | 'accessoryFront';

export interface PixelRect {
  kind: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  role: PaletteRole;
}

export interface PixelPoints {
  kind: 'pixels';
  points: readonly (readonly [number, number])[];
  role: PaletteRole;
}

export type PixelPrimitive = PixelRect | PixelPoints;

export interface CharacterModulePieceDefinition {
  id: string;
  slot: CharacterPieceSlot;
  anchor: RigAnchorName;
  views: {
    right: readonly PixelPrimitive[];
    left?: readonly PixelPrimitive[];
    back?: readonly PixelPrimitive[];
  };
}

export interface CharacterModuleDefinition {
  id: string;
  pieces: readonly CharacterModulePieceDefinition[];
}

export const rect = (
  x: number,
  y: number,
  width: number,
  height: number,
  role: PaletteRole,
): PixelRect => ({ kind: 'rect', x, y, width, height, role });

export const pixels = (
  points: readonly (readonly [number, number])[],
  role: PaletteRole,
): PixelPoints => ({ kind: 'pixels', points, role });

export function mirrorGeometry(primitives: readonly PixelPrimitive[]): PixelPrimitive[] {
  return primitives.map((primitive) =>
    primitive.kind === 'rect'
      ? { ...primitive, x: -primitive.x - primitive.width + 1 }
      : { ...primitive, points: primitive.points.map(([x, y]) => [-x, y] as const) },
  );
}

export function resolveModuleGeometry(
  piece: CharacterModulePieceDefinition,
  facing: CharacterFacing,
): readonly PixelPrimitive[] | null {
  if (facing === 'back') return piece.views.back ?? null;
  if (facing === 'right') return piece.views.right;
  return piece.views.left ?? mirrorGeometry(piece.views.right);
}

export function calculateGeometryBounds(primitives: readonly PixelPrimitive[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  const xs: number[] = [];
  const ys: number[] = [];

  for (const primitive of primitives) {
    if (primitive.kind === 'rect') {
      xs.push(primitive.x, primitive.x + primitive.width - 1);
      ys.push(primitive.y, primitive.y + primitive.height - 1);
      continue;
    }

    for (const [x, y] of primitive.points) {
      xs.push(x);
      ys.push(y);
    }
  }

  if (xs.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };
}
