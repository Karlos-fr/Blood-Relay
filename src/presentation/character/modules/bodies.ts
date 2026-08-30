import type { BodyId } from '../CharacterAppearance';
import type {
  CharacterRenderContext,
  CharacterRenderModuleRecord,
} from '../rendering/CharacterRenderModule';

function renderBody(id: BodyId, context: CharacterRenderContext): void {
  const { canvas, pose } = context;

  if (id === 'standard') {
    canvas.drawLine(pose.shoulderRear, pose.hipRear, 'skinDark');
    canvas.drawLine(pose.neck, pose.headCenter, 'skinLight');
    canvas.setPixel(pose.shoulderFront.x, pose.shoulderFront.y, 'skinLight');
    return;
  }

  if (id === 'heavy') {
    canvas.drawThickSegment(pose.shoulderRear, pose.shoulderFront, 1, 'skinDark');
    canvas.drawLine(pose.hipRear, pose.hipFront, 'skinLight');
    canvas.fillRect(pose.elbowFront.x - 1, pose.elbowFront.y - 1, 3, 3, 'skinDark');
    return;
  }

  const torsoCenter = {
    x: Math.round((pose.shoulderRear.x + pose.shoulderFront.x) / 2),
    y: Math.round((pose.shoulderRear.y + pose.hipRear.y) / 2),
  };
  canvas.drawLine(pose.neck, torsoCenter, 'shadow');
  canvas.drawLine(pose.elbowRear, pose.handRear, 'skinDark');
  canvas.drawLine(pose.kneeFront, pose.footFront, 'skinLight');
}

export const BODY_MODULES: CharacterRenderModuleRecord<BodyId> = {
  standard: {
    id: 'standard',
    layer: 'frontBody',
    renderRight: (context) => renderBody('standard', context),
  },
  heavy: {
    id: 'heavy',
    layer: 'frontBody',
    renderRight: (context) => renderBody('heavy', context),
  },
  gaunt: {
    id: 'gaunt',
    layer: 'frontBody',
    renderRight: (context) => renderBody('gaunt', context),
  },
};
