import type { CharacterAppearance } from '../CharacterAppearance';
import { CHARACTER_ANIMATIONS } from '../anatomy/anatomicalAnimations';
import { renderAnatomicalBody } from '../anatomy/anatomicalBodyRenderer';
import {
  ANATOMICAL_LANDMARKS,
  type AnatomicalLandmark,
  type AnatomicalPose,
  type CharacterAnimationName,
  type CharacterPoseFrame,
} from '../anatomy/AnatomicalPose';
import { CHARACTER_FRAME_HEIGHT, CHARACTER_FRAME_WIDTH } from '../characterDimensions';
import { resolveAppearanceRenderModules } from '../characterModuleCatalog';
import {
  mirrorCharacterFrame,
  PixelCanvas,
  type CharacterPixel,
  type CharacterPixelFrame,
} from '../frame/PixelCanvas';
import {
  CHARACTER_RENDER_LAYERS,
  type CharacterRenderLayer,
  type CharacterRenderModule,
} from './CharacterRenderModule';

export type RenderFacing = 'left' | 'right';

interface RenderedModule {
  module: CharacterRenderModule;
  canonicalRight: CharacterPixelFrame;
}

type LayerFrames = Readonly<Record<CharacterRenderLayer, CharacterPixelFrame>>;

function createCanvas(): PixelCanvas {
  return new PixelCanvas(CHARACTER_FRAME_WIDTH, CHARACTER_FRAME_HEIGHT);
}

function renderRightAnatomy(
  appearance: CharacterAppearance,
  poseFrame: CharacterPoseFrame,
): CharacterPixelFrame {
  const canvas = createCanvas();
  renderAnatomicalBody(canvas, poseFrame.pose, appearance.body);
  return canvas.snapshot();
}

function renderModule(
  module: CharacterRenderModule,
  appearance: CharacterAppearance,
  poseFrame: CharacterPoseFrame,
  pose: AnatomicalPose,
  facing: RenderFacing,
): CharacterPixelFrame {
  const canvas = createCanvas();
  const context = {
    canvas,
    pose,
    appearance,
    seed: appearance.seed,
    accessoryPhase: poseFrame.accessoryPhase,
  };

  if (facing === 'left' && module.renderLeft) module.renderLeft(context);
  else module.renderRight(context);

  return canvas.snapshot();
}

function renderRightModules(
  appearance: CharacterAppearance,
  poseFrame: CharacterPoseFrame,
  modules: readonly CharacterRenderModule[],
): RenderedModule[] {
  return modules.map((module) => ({
    module,
    canonicalRight: renderModule(module, appearance, poseFrame, poseFrame.pose, 'right'),
  }));
}

function blendFrames(frames: readonly CharacterPixelFrame[]): CharacterPixelFrame {
  const size = CHARACTER_FRAME_WIDTH * CHARACTER_FRAME_HEIGHT;
  const pixels: CharacterPixel[] = Array(size).fill(null);
  const bodyMask = Array<boolean>(size).fill(false);

  for (const frame of frames) {
    for (let index = 0; index < size; index += 1) {
      if (frame.pixels[index] !== null) pixels[index] = frame.pixels[index];
      bodyMask[index] ||= frame.bodyMask[index];
    }
  }

  return { width: CHARACTER_FRAME_WIDTH, height: CHARACTER_FRAME_HEIGHT, pixels, bodyMask };
}

function resolveLayers(
  anatomy: CharacterPixelFrame,
  renderedModules: readonly RenderedModule[],
  appearance: CharacterAppearance,
  poseFrame: CharacterPoseFrame,
  facing: RenderFacing,
): LayerFrames {
  const mirroredPose = facing === 'left' ? mirrorAnatomicalPose(poseFrame.pose) : undefined;

  return Object.fromEntries(
    CHARACTER_RENDER_LAYERS.map((layer) => {
      const frames: CharacterPixelFrame[] = [];
      if (layer === 'anatomy') {
        frames.push(facing === 'left' ? mirrorCharacterFrame(anatomy) : anatomy);
      }

      for (const rendered of renderedModules) {
        if (rendered.module.layer !== layer) continue;
        if (facing === 'right') {
          frames.push(rendered.canonicalRight);
        } else if (rendered.module.renderLeft) {
          frames.push(renderModule(rendered.module, appearance, poseFrame, mirroredPose!, 'left'));
        } else {
          frames.push(mirrorCharacterFrame(rendered.canonicalRight));
        }
      }

      return [layer, blendFrames(frames)];
    }),
  ) as Record<CharacterRenderLayer, CharacterPixelFrame>;
}

function blendLayers(layers: LayerFrames): CharacterPixelFrame {
  const frame = blendFrames(CHARACTER_RENDER_LAYERS.map((layer) => layers[layer]));

  return Object.freeze({
    width: frame.width,
    height: frame.height,
    pixels: Object.freeze([...frame.pixels]),
    bodyMask: Object.freeze([...frame.bodyMask]),
  });
}

export function mirrorAnatomicalPose(pose: AnatomicalPose): AnatomicalPose {
  const mirrored = {} as Record<AnatomicalLandmark, { x: number; y: number }>;
  for (const landmark of ANATOMICAL_LANDMARKS) {
    const point = pose[landmark];
    mirrored[landmark] = Object.freeze({
      x: CHARACTER_FRAME_WIDTH - 1 - point.x,
      y: point.y,
    });
  }
  return Object.freeze(mirrored);
}

export function composeCharacterFrame(
  appearance: CharacterAppearance,
  animation: CharacterAnimationName,
  frameIndex: number,
  facing: RenderFacing,
): CharacterPixelFrame {
  const poseFrame = CHARACTER_ANIMATIONS[animation].frames[frameIndex];
  if (!poseFrame) throw new Error(`Invalid ${animation} frame index ${frameIndex}.`);

  const modules = resolveAppearanceRenderModules(appearance);
  const anatomy = renderRightAnatomy(appearance, poseFrame);
  const renderedModules = renderRightModules(appearance, poseFrame, modules);
  const resolvedLayers = resolveLayers(anatomy, renderedModules, appearance, poseFrame, facing);

  return blendLayers(resolvedLayers);
}
