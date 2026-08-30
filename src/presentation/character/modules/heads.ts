import type { HeadId } from '../CharacterAppearance';
import { pixels, rect, type PixelPrimitive } from '../moduleGeometry';
import type {
  CharacterRenderContext,
  LegacyCompatibleCharacterRenderModule,
} from '../rendering/CharacterRenderModule';

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

const legacyExtras: Record<HeadId, readonly PixelPrimitive[]> = {
  shaved: [
    pixels(
      [
        [-2, -3],
        [-1, -3],
        [0, -3],
      ],
      'skinDark',
    ),
  ],
  'medical-mask': [
    rect(1, 0, 3, 2, 'clothLight'),
    pixels(
      [
        [0, 0],
        [0, 1],
      ],
      'outline',
    ),
  ],
  respirator: [
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
  ],
  visor: [rect(0, -2, 4, 2, 'metal'), rect(1, -2, 3, 1, 'accent')],
  implants: [
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
  ],
};

function paintHeadBase({ canvas, pose }: CharacterRenderContext): void {
  const { headCenter, neck } = pose;
  canvas.drawThickSegment(neck, { x: headCenter.x - 1, y: headCenter.y + 3 }, 1, 'skin');
  canvas.fillRect(headCenter.x - 3, headCenter.y - 4, 7, 9, 'outline');
  canvas.fillRect(headCenter.x - 2, headCenter.y - 3, 6, 7, 'skin');
  canvas.fillRect(headCenter.x + 3, headCenter.y - 2, 2, 5, 'skin');
  canvas.setPixel(headCenter.x + 4, headCenter.y - 2, 'outline');
  canvas.setPixel(headCenter.x + 4, headCenter.y + 2, 'outline');
}

function renderHead(id: HeadId, context: CharacterRenderContext): void {
  paintHeadBase(context);
  const { canvas, pose } = context;
  const { x, y } = pose.headCenter;

  if (id === 'shaved') {
    canvas.drawLine({ x: x - 2, y: y - 3 }, { x: x + 2, y: y - 3 }, 'skinDark');
  } else if (id === 'medical-mask') {
    canvas.fillRect(x + 1, y, 4, 2, 'clothLight');
    canvas.setPixel(x, y, 'outline');
  } else if (id === 'respirator') {
    canvas.fillRect(x + 1, y, 4, 3, 'metal');
    canvas.setPixel(x + 3, y, 'metalLight');
    canvas.drawLine({ x: x + 4, y: y + 2 }, { x: x + 3, y: y + 4 }, 'accent');
  } else if (id === 'visor') {
    canvas.fillRect(x, y - 2, 5, 2, 'metal');
    canvas.drawLine({ x: x + 1, y: y - 2 }, { x: x + 4, y: y - 2 }, 'accent');
  } else {
    canvas.drawLine({ x: x - 3, y: y - 2 }, { x: x - 2, y: y + 1 }, 'metal');
    canvas.setPixel(x - 2, y - 2, 'accent');
  }
}

function createHead(id: HeadId): LegacyCompatibleCharacterRenderModule {
  return {
    id,
    layer: 'frontBody',
    renderRight: (context) => renderHead(id, context),
    pieces: [
      {
        id: `${id}:head`,
        slot: 'head',
        anchor: 'head',
        views: { right: [...baseHead, ...legacyExtras[id]] },
      },
    ],
  };
}

export const HEAD_MODULES: Readonly<Record<HeadId, LegacyCompatibleCharacterRenderModule>> = {
  shaved: createHead('shaved'),
  'medical-mask': createHead('medical-mask'),
  respirator: createHead('respirator'),
  visor: createHead('visor'),
  implants: createHead('implants'),
};
