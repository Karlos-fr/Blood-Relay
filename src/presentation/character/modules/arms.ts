import type { ArmsId } from '../CharacterAppearance';
import type {
  CharacterRenderContext,
  CharacterRenderModule,
} from '../rendering/CharacterRenderModule';

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

function createArms(id: ArmsId): CharacterRenderModule {
  return {
    id,
    layer: 'frontBody',
    renderRight: (context) => renderArms(id, context),
  };
}

export const ARMS_MODULES: Readonly<Record<ArmsId, CharacterRenderModule>> = {
  'wrapped-arms': createArms('wrapped-arms'),
  'medical-arms': createArms('medical-arms'),
};
