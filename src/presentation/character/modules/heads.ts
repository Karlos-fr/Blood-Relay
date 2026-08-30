import type { HeadId } from '../CharacterAppearance';
import {
  pixels,
  rect,
  type CharacterModuleDefinition,
  type PixelPrimitive,
} from '../moduleGeometry';

const baseHead: PixelPrimitive[] = [
  rect(-3, -3, 6, 6, 'outline'),
  rect(-2, -2, 4, 5, 'skin'),
  pixels(
    [
      [2, -1],
      [3, 0],
    ],
    'skin',
  ),
  pixels([[2, -2]], 'outline'),
];

const head = (id: HeadId, extra: PixelPrimitive[]): CharacterModuleDefinition => ({
  id,
  pieces: [
    {
      id: `${id}:head`,
      slot: 'head',
      anchor: 'head',
      views: { right: [...baseHead, ...extra] },
    },
  ],
});

export const HEAD_MODULES: Readonly<Record<HeadId, CharacterModuleDefinition>> = {
  shaved: head('shaved', [
    pixels(
      [
        [-2, -3],
        [-1, -3],
        [0, -3],
      ],
      'skinDark',
    ),
  ]),
  'medical-mask': head('medical-mask', [
    rect(1, 0, 3, 2, 'clothLight'),
    pixels(
      [
        [0, 0],
        [0, 1],
      ],
      'outline',
    ),
  ]),
  respirator: head('respirator', [
    rect(1, 0, 3, 3, 'metal'),
    pixels(
      [
        [2, 0],
        [3, 1],
      ],
      'metalLight',
    ),
    pixels(
      [
        [4, 2],
        [4, 3],
        [3, 4],
      ],
      'accent',
    ),
  ]),
  visor: head('visor', [rect(0, -2, 4, 2, 'metal'), rect(1, -2, 3, 1, 'accent')]),
  implants: head('implants', [
    pixels(
      [
        [-3, -1],
        [-3, 0],
        [-2, 1],
      ],
      'metal',
    ),
    pixels(
      [
        [-3, -2],
        [-2, -1],
      ],
      'accent',
    ),
  ]),
};
