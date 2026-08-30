import type { LegsId } from '../CharacterAppearance';
import {
  pixels,
  rect,
  type CharacterModuleDefinition,
  type PixelPrimitive,
} from '../moduleGeometry';

interface LegVariant {
  rear: readonly PixelPrimitive[];
  front: readonly PixelPrimitive[];
}

const variants: Record<LegsId, LegVariant> = {
  'prison-trousers': {
    rear: [rect(-3, 0, 3, 8, 'outline'), rect(-2, 0, 2, 7, 'clothDark')],
    front: [rect(0, 0, 3, 9, 'outline'), rect(0, 0, 2, 8, 'cloth')],
  },
  'reinforced-trousers': {
    rear: [
      rect(-3, 0, 3, 8, 'outline'),
      rect(-2, 0, 2, 7, 'clothDark'),
      rect(-2, 4, 2, 2, 'metal'),
    ],
    front: [
      rect(0, 0, 3, 9, 'outline'),
      rect(0, 0, 2, 8, 'cloth'),
      rect(0, 4, 2, 2, 'metalLight'),
    ],
  },
  'torn-trousers': {
    rear: [
      rect(-3, 0, 3, 7, 'outline'),
      rect(-2, 0, 2, 5, 'clothDark'),
      pixels(
        [
          [-2, 6],
          [-1, 7],
        ],
        'skinDark',
      ),
    ],
    front: [
      rect(0, 0, 3, 8, 'outline'),
      rect(0, 0, 2, 6, 'cloth'),
      pixels(
        [
          [1, 7],
          [2, 8],
        ],
        'skin',
      ),
    ],
  },
};

export const LEGS_MODULES: Readonly<Record<LegsId, CharacterModuleDefinition>> = Object.fromEntries(
  Object.entries(variants).map(([id, variant]) => [
    id,
    {
      id,
      pieces: [
        { id: `${id}:rear`, slot: 'rearLeg', anchor: 'hips', views: { right: variant.rear } },
        { id: `${id}:front`, slot: 'frontLeg', anchor: 'hips', views: { right: variant.front } },
      ],
    },
  ]),
) as Record<LegsId, CharacterModuleDefinition>;
