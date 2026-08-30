import type { ArmsId } from '../CharacterAppearance';
import { rect, type CharacterModuleDefinition, type PixelPrimitive } from '../moduleGeometry';

interface ArmVariant {
  rear: readonly PixelPrimitive[];
  front: readonly PixelPrimitive[];
}

const variants: Record<ArmsId, ArmVariant> = {
  'wrapped-arms': {
    rear: [
      rect(-2, 0, 3, 7, 'outline'),
      rect(-1, 0, 2, 5, 'skinDark'),
      rect(-1, 3, 2, 2, 'clothLight'),
    ],
    front: [
      rect(0, 0, 3, 7, 'outline'),
      rect(0, 0, 2, 5, 'skin'),
      rect(0, 3, 2, 2, 'clothLight'),
    ],
  },
  'medical-arms': {
    rear: [
      rect(-2, 0, 3, 7, 'outline'),
      rect(-1, 0, 2, 5, 'clothDark'),
      rect(-1, 5, 2, 2, 'skinDark'),
    ],
    front: [
      rect(0, 0, 3, 7, 'outline'),
      rect(0, 0, 2, 5, 'clothLight'),
      rect(0, 5, 2, 2, 'skin'),
    ],
  },
};

function createArms(id: ArmsId, variant: ArmVariant): CharacterModuleDefinition {
  return {
    id,
    pieces: [
      {
        id: `${id}:rear`,
        slot: 'rearArm',
        anchor: 'shoulderBack',
        views: { right: variant.rear },
      },
      {
        id: `${id}:front`,
        slot: 'frontArm',
        anchor: 'shoulderFront',
        views: { right: variant.front },
      },
    ],
  };
}

export const ARMS_MODULES: Readonly<Record<ArmsId, CharacterModuleDefinition>> = {
  'wrapped-arms': createArms('wrapped-arms', variants['wrapped-arms']),
  'medical-arms': createArms('medical-arms', variants['medical-arms']),
};
