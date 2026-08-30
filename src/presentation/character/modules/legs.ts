import type { LegsId } from '../CharacterAppearance';
import { pixels, rect, type PixelPrimitive } from '../moduleGeometry';
import type {
  CharacterRenderContext,
  LegacyCompatibleCharacterRenderModule,
} from '../rendering/CharacterRenderModule';

interface LegacyLegVariant {
  rear: readonly PixelPrimitive[];
  front: readonly PixelPrimitive[];
}

const legacyVariants: Record<LegsId, LegacyLegVariant> = {
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
    front: [rect(0, 0, 3, 9, 'outline'), rect(0, 0, 2, 8, 'cloth'), rect(0, 4, 2, 2, 'metalLight')],
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

function drawBoot(context: CharacterRenderContext, x: number, footY: number, front: boolean): void {
  const { canvas } = context;
  const top = Math.max(49, footY - 2);
  const bottom = Math.min(51, footY);
  if (top <= bottom) canvas.fillRect(x - 2, top, front ? 5 : 4, bottom - top + 1, 'metalDark');
}

function renderLegs(id: LegsId, context: CharacterRenderContext): void {
  const { canvas, pose } = context;
  const rearLowerRole = id === 'torn-trousers' ? 'skinDark' : 'clothDark';
  const frontLowerRole = id === 'torn-trousers' ? 'skin' : 'cloth';

  canvas.drawThickSegment(pose.hipRear, pose.kneeRear, 2, 'clothDark');
  canvas.drawThickSegment(pose.kneeRear, pose.footRear, 2, rearLowerRole);
  canvas.drawThickSegment(pose.hipFront, pose.kneeFront, 2, 'cloth');
  canvas.drawThickSegment(pose.kneeFront, pose.footFront, 2, frontLowerRole);
  canvas.fillRect(pose.hipRear.x - 2, pose.hipRear.y - 2, 5, 4, 'clothDark');
  canvas.fillRect(pose.hipFront.x - 2, pose.hipFront.y - 2, 5, 4, 'cloth');
  drawBoot(context, pose.footRear.x, pose.footRear.y, false);
  drawBoot(context, pose.footFront.x, pose.footFront.y, true);

  if (id === 'reinforced-trousers') {
    canvas.fillRect(pose.kneeRear.x - 2, pose.kneeRear.y - 1, 4, 3, 'metal');
    canvas.fillRect(pose.kneeFront.x - 2, pose.kneeFront.y - 1, 4, 3, 'metalLight');
  } else if (id === 'prison-trousers') {
    canvas.drawLine(pose.hipFront, pose.kneeFront, 'clothLight');
  } else {
    canvas.setPixel(pose.kneeRear.x - 1, pose.kneeRear.y - 2, 'clothLight');
    canvas.setPixel(pose.kneeFront.x + 1, pose.kneeFront.y - 2, 'clothDark');
  }
}

function createLegs(id: LegsId): LegacyCompatibleCharacterRenderModule {
  const legacy = legacyVariants[id];
  return {
    id,
    layer: 'body',
    renderRight: (context) => renderLegs(id, context),
    pieces: [
      {
        id: `${id}:rear`,
        slot: 'rearLeg',
        anchor: 'hips',
        views: { right: legacy.rear },
      },
      {
        id: `${id}:front`,
        slot: 'frontLeg',
        anchor: 'hips',
        views: { right: legacy.front },
      },
    ],
  };
}

export const LEGS_MODULES: Readonly<Record<LegsId, LegacyCompatibleCharacterRenderModule>> = {
  'prison-trousers': createLegs('prison-trousers'),
  'reinforced-trousers': createLegs('reinforced-trousers'),
  'torn-trousers': createLegs('torn-trousers'),
};
