import type { HeadId } from '../CharacterAppearance';
import type {
  CharacterRenderContext,
  CharacterRenderModule,
} from '../rendering/CharacterRenderModule';

function paintHeadBase({ canvas, pose }: CharacterRenderContext): void {
  const { headCenter, neck } = pose;
  canvas.drawThickSegment(neck, { x: headCenter.x - 1, y: headCenter.y + 3 }, 1, 'skin');
  canvas.fillRect(headCenter.x - 3, headCenter.y - 4, 7, 9, 'outline');
  canvas.fillRect(headCenter.x - 2, headCenter.y - 3, 6, 7, 'skin');
  canvas.fillRect(headCenter.x + 3, headCenter.y - 2, 2, 5, 'skin');
  canvas.setPixel(headCenter.x + 4, headCenter.y - 2, 'outline');
  canvas.setPixel(headCenter.x + 4, headCenter.y + 2, 'outline');
}

function renderHead(id: HeadId, context: CharacterRenderContext): void {
  paintHeadBase(context);
  const { canvas, pose } = context;
  const { x, y } = pose.headCenter;

  if (id === 'shaved') {
    canvas.drawLine({ x: x - 2, y: y - 3 }, { x: x + 2, y: y - 3 }, 'skinDark');
  } else if (id === 'medical-mask') {
    canvas.fillRect(x + 1, y, 4, 2, 'clothLight');
    canvas.setPixel(x, y, 'outline');
  } else if (id === 'respirator') {
    canvas.fillRect(x + 1, y, 4, 3, 'metal');
    canvas.setPixel(x + 3, y, 'metalLight');
    canvas.drawLine({ x: x + 4, y: y + 2 }, { x: x + 3, y: y + 4 }, 'accent');
  } else if (id === 'visor') {
    canvas.fillRect(x, y - 2, 5, 2, 'metal');
    canvas.drawLine({ x: x + 1, y: y - 2 }, { x: x + 4, y: y - 2 }, 'accent');
  } else {
    canvas.drawLine({ x: x - 3, y: y - 2 }, { x: x - 2, y: y + 1 }, 'metal');
    canvas.setPixel(x - 2, y - 2, 'accent');
  }
}

function createHead(id: HeadId): CharacterRenderModule {
  return {
    id,
    layer: 'frontBody',
    renderRight: (context) => renderHead(id, context),
  };
}

export const HEAD_MODULES: Readonly<Record<HeadId, CharacterRenderModule>> = {
  shaved: createHead('shaved'),
  'medical-mask': createHead('medical-mask'),
  respirator: createHead('respirator'),
  visor: createHead('visor'),
  implants: createHead('implants'),
};
