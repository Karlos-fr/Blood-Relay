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

type LayerCanvases = Record<CharacterRenderLayer, PixelCanvas>;

function createLayerCanvases(): LayerCanvases {
  return Object.fromEntries(
    CHARACTER_RENDER_LAYERS.map((layer) => [
      layer,
      new PixelCanvas(CHARACTER_FRAME_WIDTH, CHARACTER_FRAME_HEIGHT),
    ]),
  ) as LayerCanvases;
}

function renderRightLayers(
  appearance: CharacterAppearance,
  poseFrame: CharacterPoseFrame,
  modules: readonly CharacterRenderModule[],
): LayerCanvases {
  const layers = createLayerCanvases();
  renderAnatomicalBody(layers.anatomy, poseFrame.pose, appearance.body);

  for (const module of modules) {
    module.renderRight({
      canvas: layers[module.layer],
      pose: poseFrame.pose,
      appearance,
      seed: appearance.seed,
      accessoryPhase: poseFrame.accessoryPhase,
    });
  }

  return layers;
}

function resolveLeftLayers(
  rightLayers: LayerCanvases,
  appearance: CharacterAppearance,
  poseFrame: CharacterPoseFrame,
  modules: readonly CharacterRenderModule[],
): Readonly<Record<CharacterRenderLayer, CharacterPixelFrame>> {
  const mirroredPose = mirrorAnatomicalPose(poseFrame.pose);
  const leftLayers = Object.fromEntries(
    CHARACTER_RENDER_LAYERS.map((layer) => [
      layer,
      mirrorCharacterFrame(rightLayers[layer].snapshot()),
    ]),
  ) as Record<CharacterRenderLayer, CharacterPixelFrame>;

  for (const module of modules) {
    if (!module.renderLeft) continue;

    const canvas = new PixelCanvas(CHARACTER_FRAME_WIDTH, CHARACTER_FRAME_HEIGHT);
    module.renderLeft({
      canvas,
      pose: mirroredPose,
      appearance,
      seed: appearance.seed,
      accessoryPhase: poseFrame.accessoryPhase,
    });
    leftLayers[module.layer] = canvas.snapshot();
  }

  return leftLayers;
}

function blendLayers(
  layers: Readonly<Record<CharacterRenderLayer, CharacterPixelFrame>>,
): CharacterPixelFrame {
  const size = CHARACTER_FRAME_WIDTH * CHARACTER_FRAME_HEIGHT;
  const pixels: CharacterPixel[] = Array(size).fill(null);
  const bodyMask = Array<boolean>(size).fill(false);

  for (const layer of CHARACTER_RENDER_LAYERS) {
    const frame = layers[layer];
    for (let index = 0; index < size; index += 1) {
      if (frame.pixels[index] !== null) pixels[index] = frame.pixels[index];
      bodyMask[index] ||= frame.bodyMask[index];
    }
  }

  return Object.freeze({
    width: CHARACTER_FRAME_WIDTH,
    height: CHARACTER_FRAME_HEIGHT,
    pixels: Object.freeze(pixels),
    bodyMask: Object.freeze(bodyMask),
  });
}

function snapshotLayers(
  layers: LayerCanvases,
): Readonly<Record<CharacterRenderLayer, CharacterPixelFrame>> {
  return Object.fromEntries(
    CHARACTER_RENDER_LAYERS.map((layer) => [layer, layers[layer].snapshot()]),
  ) as Record<CharacterRenderLayer, CharacterPixelFrame>;
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
  const rightLayers = renderRightLayers(appearance, poseFrame, modules);
  const resolvedLayers =
    facing === 'right'
      ? snapshotLayers(rightLayers)
      : resolveLeftLayers(rightLayers, appearance, poseFrame, modules);

  return blendLayers(resolvedLayers);
}
