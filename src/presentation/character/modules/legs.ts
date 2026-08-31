import type { LegsId } from '../CharacterAppearance';
import type {
  CharacterRenderContext,
  CharacterRenderModule,
} from '../rendering/CharacterRenderModule';

function drawBoot(context: CharacterRenderContext, x: number, footY: number, front: boolean): void {
  const { canvas } = context;
  const bottom = Math.min(51, footY);
  const top = bottom - 2;
  canvas.fillRect(x - 2, top, front ? 5 : 4, bottom - top + 1, 'metalDark');
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

function createLegs(id: LegsId): CharacterRenderModule {
  return {
    id,
    layer: 'body',
    renderRight: (context) => renderLegs(id, context),
  };
}

export const LEGS_MODULES: Readonly<Record<LegsId, CharacterRenderModule>> = {
  'prison-trousers': createLegs('prison-trousers'),
  'reinforced-trousers': createLegs('reinforced-trousers'),
  'torn-trousers': createLegs('torn-trousers'),
};
