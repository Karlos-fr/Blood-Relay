import type { AccessoryId } from '../CharacterAppearance';
import type {
  CharacterRenderContext,
  CharacterRenderLayer,
  CharacterRenderModule,
} from '../rendering/CharacterRenderModule';

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
): CharacterRenderModule {
  return {
    id,
    layer,
    renderRight: (context) => renderAccessory(id, context),
  };
}

export const ACCESSORY_MODULES: Readonly<Record<AccessoryId, CharacterRenderModule>> = {
  'blood-bag': createAccessory('blood-bag', 'rearAccessory'),
  'dorsal-tube': createAccessory('dorsal-tube', 'rearAccessory'),
  'medical-pack': createAccessory('medical-pack', 'rearAccessory'),
  'shoulder-plate': createAccessory('shoulder-plate', 'frontAccessory'),
  'external-implant': createAccessory('external-implant', 'frontAccessory'),
  holster: createAccessory('holster', 'frontAccessory'),
};
