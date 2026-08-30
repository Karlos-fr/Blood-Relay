import type { AccessoryId } from '../CharacterAppearance';
import {
  pixels,
  rect,
  type CharacterModuleDefinition,
  type CharacterPieceSlot,
  type PixelPrimitive,
  type RigAnchorName,
} from '../moduleGeometry';

interface AccessorySpec {
  slot: CharacterPieceSlot;
  anchor: RigAnchorName;
  geometry: readonly PixelPrimitive[];
}

const specs: Record<AccessoryId, AccessorySpec> = {
  'blood-bag': {
    slot: 'rearAccessory',
    anchor: 'accessoryHip',
    geometry: [
      rect(-5, -1, 4, 6, 'outline'),
      rect(-4, 0, 2, 4, 'blood'),
      pixels(
        [
          [-3, -2],
          [-2, -2],
          [-1, -1],
        ],
        'metalLight',
      ),
    ],
  },
  'dorsal-tube': {
    slot: 'rearAccessory',
    anchor: 'accessoryBack',
    geometry: [
      pixels(
        [
          [-1, -5],
          [-3, -4],
          [-4, -2],
          [-4, 0],
          [-3, 2],
          [-2, 4],
        ],
        'metal',
      ),
      pixels(
        [
          [-3, -4],
          [-4, -2],
          [-3, 2],
        ],
        'accent',
      ),
    ],
  },
  'medical-pack': {
    slot: 'rearAccessory',
    anchor: 'accessoryBack',
    geometry: [
      rect(-6, -4, 4, 8, 'outline'),
      rect(-5, -3, 3, 6, 'clothLight'),
      pixels(
        [
          [-4, -1],
          [-4, 0],
          [-5, 0],
          [-3, 0],
        ],
        'accent',
      ),
    ],
  },
  'shoulder-plate': {
    slot: 'frontAccessory',
    anchor: 'accessoryFront',
    geometry: [
      rect(-1, -2, 5, 3, 'outline'),
      rect(0, -2, 4, 2, 'metal'),
      pixels(
        [
          [1, -2],
          [2, -2],
        ],
        'metalLight',
      ),
    ],
  },
  'external-implant': {
    slot: 'frontAccessory',
    anchor: 'accessoryFront',
    geometry: [
      rect(1, -5, 2, 4, 'metal'),
      pixels(
        [
          [2, -4],
          [3, -3],
        ],
        'accent',
      ),
    ],
  },
  holster: {
    slot: 'frontAccessory',
    anchor: 'accessoryHip',
    geometry: [
      rect(2, 1, 3, 5, 'outline'),
      rect(2, 2, 2, 3, 'clothDark'),
      pixels([[4, 1]], 'metalLight'),
    ],
  },
};

function createAccessory(
  id: AccessoryId,
  spec: AccessorySpec,
): CharacterModuleDefinition {
  return {
    id,
    pieces: [
      {
        id: `${id}:accessory`,
        slot: spec.slot,
        anchor: spec.anchor,
        views: { right: spec.geometry },
      },
    ],
  };
}

export const ACCESSORY_MODULES: Readonly<
  Record<AccessoryId, CharacterModuleDefinition>
> = {
  'blood-bag': createAccessory('blood-bag', specs['blood-bag']),
  'dorsal-tube': createAccessory('dorsal-tube', specs['dorsal-tube']),
  'medical-pack': createAccessory('medical-pack', specs['medical-pack']),
  'shoulder-plate': createAccessory('shoulder-plate', specs['shoulder-plate']),
  'external-implant': createAccessory('external-implant', specs['external-implant']),
  holster: createAccessory('holster', specs.holster),
};
