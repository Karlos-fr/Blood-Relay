import type { TorsoId } from '../CharacterAppearance';
import {
  pixels,
  rect,
  type CharacterModuleDefinition,
  type PixelPrimitive,
} from '../moduleGeometry';

const torsoPieces: Record<TorsoId, readonly PixelPrimitive[]> = {
  'prison-jumpsuit': [
    rect(-4, -5, 8, 11, 'outline'),
    rect(-3, -4, 6, 9, 'cloth'),
    rect(-3, -4, 2, 9, 'clothDark'),
    pixels(
      [
        [2, -3],
        [2, 1],
      ],
      'clothLight',
    ),
  ],
  'medical-suit': [
    rect(-4, -5, 8, 11, 'outline'),
    rect(-3, -4, 6, 9, 'clothLight'),
    rect(-3, 1, 6, 4, 'cloth'),
    rect(1, -2, 2, 2, 'accent'),
    pixels(
      [
        [-1, -3],
        [-1, 3],
      ],
      'metal',
    ),
  ],
  'torn-suit': [
    rect(-4, -5, 7, 10, 'outline'),
    rect(-3, -4, 6, 4, 'cloth'),
    rect(-3, 0, 5, 4, 'clothDark'),
    pixels(
      [
        [2, 0],
        [3, 1],
        [2, 2],
        [1, 4],
      ],
      'skinDark',
    ),
    pixels(
      [
        [-2, -3],
        [1, -3],
      ],
      'clothLight',
    ),
  ],
  'light-armor': [
    rect(-4, -5, 8, 11, 'outline'),
    rect(-3, -4, 6, 9, 'clothDark'),
    rect(-2, -4, 5, 5, 'metal'),
    rect(-1, -3, 4, 1, 'metalLight'),
    pixels(
      [
        [2, -1],
        [2, 0],
      ],
      'accent',
    ),
  ],
};

export const TORSO_MODULES: Readonly<Record<TorsoId, CharacterModuleDefinition>> = Object.fromEntries(
  Object.entries(torsoPieces).map(([id, geometry]) => [
    id,
    {
      id,
      pieces: [
        {
          id: `${id}:torso`,
          slot: 'torso',
          anchor: 'torso',
          views: { right: geometry },
        },
      ],
    },
  ]),
) as Record<TorsoId, CharacterModuleDefinition>;
