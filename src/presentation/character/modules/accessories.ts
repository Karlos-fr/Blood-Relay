import type { AccessoryId } from '../CharacterAppearance';
import {
  pixels,
  rect,
  type CharacterPieceSlot,
  type PixelPrimitive,
  type RigAnchorName,
} from '../moduleGeometry';
import type {
  CharacterRenderContext,
  CharacterRenderLayer,
  LegacyCompatibleCharacterRenderModule,
} from '../rendering/CharacterRenderModule';

interface LegacyAccessorySpec {
  slot: CharacterPieceSlot;
  anchor: RigAnchorName;
  geometry: readonly PixelPrimitive[];
}

const legacySpecs: Record<AccessoryId, LegacyAccessorySpec> = {
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

const tubeOffsets = [
  [
    [-1, -5],
    [-3, -4],
    [-4, -2],
    [-4, 0],
    [-3, 2],
    [-2, 4],
  ],
  [
    [-1, -5],
    [-2, -4],
    [-4, -3],
    [-5, -1],
    [-4, 2],
    [-2, 4],
  ],
  [
    [-1, -5],
    [-3, -3],
    [-5, -1],
    [-4, 1],
    [-3, 3],
    [-2, 4],
  ],
  [
    [-1, -5],
    [-4, -4],
    [-5, -2],
    [-5, 1],
    [-3, 3],
    [-2, 4],
  ],
] as const;

function renderAccessory(id: AccessoryId, context: CharacterRenderContext): void {
  const { canvas, pose, accessoryPhase } = context;

  if (id === 'blood-bag') {
    const anchor = pose.hipRear;
    canvas.drawLine(pose.shoulderRear, { x: anchor.x - 2, y: anchor.y }, 'metalLight');
    canvas.fillRect(anchor.x - 5, anchor.y - 1, 4, 6, 'outline');
    canvas.fillRect(anchor.x - 4, anchor.y, 2, 4, 'blood');
    canvas.setPixel(anchor.x, anchor.y, 'metalLight');
    return;
  }

  if (id === 'dorsal-tube') {
    const anchor = pose.shoulderRear;
    const points = tubeOffsets[accessoryPhase].map(([offsetX, offsetY]) => ({
      x: anchor.x + offsetX,
      y: anchor.y + offsetY,
    }));
    for (let index = 0; index + 1 < points.length; index += 1) {
      canvas.drawLine(points[index], points[index + 1], 'metal');
    }
    for (const point of points.filter((_, index) => index % 2 === 1)) {
      canvas.setPixel(point.x, point.y, 'accent');
    }
    canvas.setPixel(anchor.x, anchor.y, 'metalDark');
    return;
  }

  if (id === 'medical-pack') {
    const anchor = pose.shoulderRear;
    canvas.fillRect(anchor.x - 6, anchor.y - 4, 5, 9, 'outline');
    canvas.fillRect(anchor.x - 5, anchor.y - 3, 3, 7, 'clothLight');
    canvas.fillRect(anchor.x - 5, anchor.y - 1, 3, 2, 'accent');
    canvas.setPixel(anchor.x, anchor.y, 'clothDark');
    return;
  }

  if (id === 'shoulder-plate') {
    const anchor = pose.shoulderFront;
    canvas.fillRect(anchor.x - 1, anchor.y - 2, 6, 3, 'outline');
    canvas.fillRect(anchor.x, anchor.y - 2, 4, 2, 'metal');
    canvas.drawLine(
      { x: anchor.x + 1, y: anchor.y - 2 },
      { x: anchor.x + 3, y: anchor.y - 2 },
      'metalLight',
    );
    return;
  }

  if (id === 'external-implant') {
    const anchor = pose.shoulderFront;
    canvas.fillRect(anchor.x + 1, anchor.y - 5, 2, 5, 'metal');
    canvas.drawLine(
      { x: anchor.x + 2, y: anchor.y - 4 },
      { x: anchor.x + 4, y: anchor.y - 2 },
      'accent',
    );
    canvas.setPixel(anchor.x, anchor.y, 'metalDark');
    return;
  }

  const anchor = pose.hipFront;
  canvas.fillRect(anchor.x + 2, anchor.y, 3, 6, 'outline');
  canvas.fillRect(anchor.x + 2, anchor.y + 1, 2, 4, 'clothDark');
  canvas.setPixel(anchor.x, anchor.y, 'metalLight');
}

function createAccessory(
  id: AccessoryId,
  layer: CharacterRenderLayer,
): LegacyCompatibleCharacterRenderModule {
  const legacy = legacySpecs[id];
  return {
    id,
    layer,
    renderRight: (context) => renderAccessory(id, context),
    pieces: [
      {
        id: `${id}:accessory`,
        slot: legacy.slot,
        anchor: legacy.anchor,
        views: { right: legacy.geometry },
      },
    ],
  };
}

export const ACCESSORY_MODULES: Readonly<
  Record<AccessoryId, LegacyCompatibleCharacterRenderModule>
> = {
  'blood-bag': createAccessory('blood-bag', 'rearAccessory'),
  'dorsal-tube': createAccessory('dorsal-tube', 'rearAccessory'),
  'medical-pack': createAccessory('medical-pack', 'rearAccessory'),
  'shoulder-plate': createAccessory('shoulder-plate', 'frontAccessory'),
  'external-implant': createAccessory('external-implant', 'frontAccessory'),
  holster: createAccessory('holster', 'frontAccessory'),
};
