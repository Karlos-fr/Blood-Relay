import type { TorsoId } from '../CharacterAppearance';
import { pixels, rect, type PixelPrimitive } from '../moduleGeometry';
import type {
  CharacterRenderContext,
  LegacyCompatibleCharacterRenderModule,
} from '../rendering/CharacterRenderModule';

const legacyGeometry: Record<TorsoId, readonly PixelPrimitive[]> = {
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

function torsoPolygon(context: CharacterRenderContext) {
  const { pose } = context;
  return [
    { x: pose.shoulderRear.x - 2, y: pose.shoulderRear.y - 1 },
    { x: pose.shoulderFront.x + 2, y: pose.shoulderFront.y - 1 },
    { x: pose.hipFront.x + 2, y: pose.hipFront.y + 2 },
    { x: pose.hipRear.x - 2, y: pose.hipRear.y + 2 },
  ] as const;
}

function renderTorso(id: TorsoId, context: CharacterRenderContext): void {
  const { canvas, pose } = context;
  const baseRole =
    id === 'medical-suit' ? 'clothLight' : id === 'light-armor' ? 'clothDark' : 'cloth';
  canvas.fillPolygon(torsoPolygon(context), baseRole);
  canvas.drawThickSegment(pose.hipRear, pose.hipFront, 1, baseRole);
  canvas.drawLine(pose.neck, pose.shoulderFront, 'skin');
  canvas.setPixel(pose.shoulderRear.x, pose.shoulderRear.y, baseRole);
  canvas.setPixel(pose.shoulderFront.x, pose.shoulderFront.y, baseRole);

  if (id === 'prison-jumpsuit') {
    canvas.drawLine(pose.shoulderRear, pose.hipRear, 'clothDark');
    canvas.drawLine(pose.shoulderFront, pose.hipFront, 'clothLight');
  } else if (id === 'medical-suit') {
    canvas.drawLine(pose.neck, pose.hipRear, 'metal');
    canvas.fillRect(pose.shoulderFront.x - 2, pose.shoulderFront.y + 4, 2, 2, 'accent');
  } else if (id === 'torn-suit') {
    const tearY = Math.round((pose.shoulderFront.y + pose.hipFront.y) / 2);
    canvas.drawLine(
      { x: pose.shoulderFront.x, y: tearY },
      { x: pose.hipFront.x + 1, y: pose.hipFront.y },
      'skinDark',
    );
    canvas.setPixel(pose.hipFront.x, pose.hipFront.y + 1, 'clothDark');
  } else {
    canvas.fillPolygon(
      [
        { x: pose.shoulderRear.x + 1, y: pose.shoulderRear.y },
        { x: pose.shoulderFront.x + 1, y: pose.shoulderFront.y },
        { x: pose.hipFront.x, y: pose.hipFront.y - 4 },
        { x: pose.hipRear.x + 1, y: pose.hipRear.y - 4 },
      ],
      'metal',
    );
    canvas.drawLine(pose.shoulderRear, pose.shoulderFront, 'metalLight');
    canvas.setPixel(pose.shoulderFront.x, pose.shoulderFront.y + 2, 'accent');
  }
}

function createTorso(id: TorsoId): LegacyCompatibleCharacterRenderModule {
  return {
    id,
    layer: 'body',
    renderRight: (context) => renderTorso(id, context),
    pieces: [
      {
        id: `${id}:torso`,
        slot: 'torso',
        anchor: 'torso',
        views: { right: legacyGeometry[id] },
      },
    ],
  };
}

export const TORSO_MODULES: Readonly<Record<TorsoId, LegacyCompatibleCharacterRenderModule>> = {
  'prison-jumpsuit': createTorso('prison-jumpsuit'),
  'medical-suit': createTorso('medical-suit'),
  'torn-suit': createTorso('torn-suit'),
  'light-armor': createTorso('light-armor'),
};
