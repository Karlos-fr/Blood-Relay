import type { MutationId } from '../CharacterAppearance';
import type {
  CharacterRenderModule,
  CharacterRenderModuleRecord,
} from '../rendering/CharacterRenderModule';

const none: CharacterRenderModule = {
  id: 'none',
  layer: 'mutationAccent',
  renderRight: () => {},
};

export const MUTATION_MODULES: CharacterRenderModuleRecord<MutationId> = {
  none,
  'blood-veins': {
    id: 'blood-veins',
    layer: 'mutationAccent',
    renderRight({ canvas, pose }) {
      canvas.drawLine(pose.neck, pose.shoulderFront, 'blood');
      canvas.drawLine(pose.shoulderFront, pose.elbowFront, 'mutationDark');
      canvas.drawLine(pose.elbowFront, pose.handFront, 'blood');
      canvas.setPixel(pose.hipFront.x, pose.hipFront.y - 2, 'mutation');
    },
  },
  'bone-growth': {
    id: 'bone-growth',
    layer: 'mutationAccent',
    renderRight({ canvas, pose }) {
      for (const [x, y] of [
        [pose.shoulderRear.x - 2, pose.shoulderRear.y - 2],
        [pose.shoulderRear.x - 3, pose.shoulderRear.y - 3],
        [pose.elbowRear.x - 2, pose.elbowRear.y - 1],
        [pose.hipRear.x - 2, pose.hipRear.y - 2],
      ] as const) {
        canvas.setPixel(x, y, 'mutation');
      }
      canvas.setPixel(pose.shoulderRear.x - 2, pose.shoulderRear.y - 1, 'mutationDark');
    },
  },
  'grafted-arm': {
    id: 'grafted-arm',
    layer: 'mutationAccent',
    renderRight({ canvas, pose }) {
      canvas.drawThickSegment(pose.shoulderRear, pose.elbowRear, 2, 'mutationDark');
      canvas.drawThickSegment(pose.elbowRear, pose.handRear, 2, 'mutation');
      canvas.fillRect(pose.handRear.x - 1, pose.handRear.y - 1, 3, 3, 'skinDark');
    },
  },
};
