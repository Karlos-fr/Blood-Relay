import type { ArmsId } from '../CharacterAppearance';
import { rect, type PixelPrimitive } from '../moduleGeometry';
import type {
  CharacterRenderContext,
  LegacyCompatibleCharacterRenderModule,
} from '../rendering/CharacterRenderModule';

interface LegacyArmVariant {
  rear: readonly PixelPrimitive[];
  front: readonly PixelPrimitive[];
}

const legacyVariants: Record<ArmsId, LegacyArmVariant> = {
  'wrapped-arms': {
    rear: [
      rect(-2, 0, 3, 7, 'outline'),
      rect(-1, 0, 2, 5, 'skinDark'),
      rect(-1, 3, 2, 2, 'clothLight'),
    ],
    front: [rect(0, 0, 3, 7, 'outline'), rect(0, 0, 2, 5, 'skin'), rect(0, 3, 2, 2, 'clothLight')],
  },
  'medical-arms': {
    rear: [
      rect(-2, 0, 3, 7, 'outline'),
      rect(-1, 0, 2, 5, 'clothDark'),
      rect(-1, 5, 2, 2, 'skinDark'),
    ],
    front: [rect(0, 0, 3, 7, 'outline'), rect(0, 0, 2, 5, 'clothLight'), rect(0, 5, 2, 2, 'skin')],
  },
};

function renderArm(context: CharacterRenderContext, side: 'Rear' | 'Front', id: ArmsId): void {
  const { canvas, pose } = context;
  const shoulder = pose[`shoulder${side}`];
  const elbow = pose[`elbow${side}`];
  const hand = pose[`hand${side}`];
  const rear = side === 'Rear';
  const upperRole =
    id === 'medical-arms' ? (rear ? 'clothDark' : 'clothLight') : rear ? 'skinDark' : 'skin';

  canvas.drawThickSegment(shoulder, elbow, 2, upperRole);
  canvas.drawThickSegment(elbow, hand, 2, upperRole);
  canvas.fillRect(shoulder.x - 2, shoulder.y - 2, 5, 5, upperRole);

  if (id === 'wrapped-arms') {
    const wrapStart = {
      x: Math.round((shoulder.x + elbow.x) / 2),
      y: Math.round((shoulder.y + elbow.y) / 2),
    };
    canvas.drawThickSegment(wrapStart, elbow, 1, 'clothLight');
  }

  canvas.fillRect(hand.x - 1, hand.y - 1, 3, 3, rear ? 'skinDark' : 'skin');
}

function renderArms(id: ArmsId, context: CharacterRenderContext): void {
  renderArm(context, 'Rear', id);
  renderArm(context, 'Front', id);
}

function createArms(id: ArmsId): LegacyCompatibleCharacterRenderModule {
  const legacy = legacyVariants[id];
  return {
    id,
    layer: 'frontBody',
    renderRight: (context) => renderArms(id, context),
    pieces: [
      {
        id: `${id}:rear`,
        slot: 'rearArm',
        anchor: 'shoulderBack',
        views: { right: legacy.rear },
      },
      {
        id: `${id}:front`,
        slot: 'frontArm',
        anchor: 'shoulderFront',
        views: { right: legacy.front },
      },
    ],
  };
}

export const ARMS_MODULES: Readonly<Record<ArmsId, LegacyCompatibleCharacterRenderModule>> = {
  'wrapped-arms': createArms('wrapped-arms'),
  'medical-arms': createArms('medical-arms'),
};
