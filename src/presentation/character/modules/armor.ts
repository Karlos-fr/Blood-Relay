import type { ArmorId } from '../CharacterAppearance';
import type {
  CharacterRenderContext,
  CharacterRenderModule,
  CharacterRenderModuleRecord,
} from '../rendering/CharacterRenderModule';

function torsoPlatePoints(context: CharacterRenderContext) {
  const { pose } = context;
  return [
    { x: pose.shoulderRear.x + 1, y: pose.shoulderRear.y },
    { x: pose.shoulderFront.x - 1, y: pose.shoulderFront.y },
    { x: pose.hipFront.x - 1, y: pose.hipFront.y + 1 },
    { x: pose.hipRear.x + 1, y: pose.hipRear.y + 1 },
  ] as const;
}

const none: CharacterRenderModule = {
  id: 'none',
  layer: 'armor',
  renderRight: () => {},
};

export const ARMOR_MODULES: CharacterRenderModuleRecord<ArmorId> = {
  none,
  'scrap-plate': {
    id: 'scrap-plate',
    layer: 'armor',
    renderRight(context) {
      const { canvas, pose } = context;
      canvas.fillPolygon(torsoPlatePoints(context), 'metalDark');
      canvas.drawLine(pose.shoulderRear, pose.hipFront, 'metal');
      canvas.drawLine(pose.shoulderFront, pose.hipRear, 'metalLight');
      canvas.setPixel(pose.neck.x, pose.neck.y, 'skin');
      canvas.setPixel(pose.hipRear.x, pose.hipRear.y, 'clothDark');
      canvas.setPixel(pose.hipFront.x, pose.hipFront.y, 'cloth');
    },
  },
  'industrial-vest': {
    id: 'industrial-vest',
    layer: 'armor',
    renderRight(context) {
      const { canvas, pose } = context;
      canvas.fillPolygon(torsoPlatePoints(context), 'clothDark');
      canvas.drawThickSegment(pose.shoulderRear, pose.hipRear, 1, 'metalDark');
      canvas.drawThickSegment(pose.shoulderFront, pose.hipFront, 1, 'metal');
      const chestY = Math.round((pose.shoulderFront.y + pose.hipFront.y) / 2);
      canvas.drawLine(
        { x: pose.shoulderRear.x, y: chestY },
        { x: pose.shoulderFront.x, y: chestY },
        'metalLight',
      );
      canvas.setPixel(pose.neck.x, pose.neck.y, 'skin');
    },
  },
};
