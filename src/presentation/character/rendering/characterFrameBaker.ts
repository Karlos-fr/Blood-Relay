import type Phaser from 'phaser';
import type { CharacterAppearance } from '../CharacterAppearance';
import { getAnimationFrame } from '../anatomy/anatomicalAnimations';
import type { CharacterAnimationName } from '../anatomy/AnatomicalPose';
import {
  CHARACTER_FRAME_HEIGHT,
  CHARACTER_FRAME_WIDTH,
  CHARACTER_ORIGIN_Y,
} from '../characterDimensions';
import { getCharacterPalette } from '../characterPalettes';
import { composeCharacterFrame, type RenderFacing } from './characterFrameComposer';

export interface BakedCharacterFrame {
  textureKey: string;
  originX: number;
  originY: number;
}

export function buildCharacterFrameTextureKey(
  appearance: CharacterAppearance,
  animation: CharacterAnimationName,
  frameIndex: number,
  facing: RenderFacing,
): string {
  const appearanceKey = [
    appearance.body,
    appearance.head,
    appearance.torso,
    appearance.legs,
    appearance.arms,
    appearance.armor,
    appearance.mutation,
    appearance.weapon,
    appearance.accessories.join(','),
    appearance.palette,
    (appearance.seed >>> 0).toString(16),
  ].join(':');
  return `char-frame:${appearanceKey}:${animation}:${frameIndex}:${facing}`;
}

export function bakeCharacterFrame(
  scene: Phaser.Scene,
  appearance: CharacterAppearance,
  animation: CharacterAnimationName,
  frameIndex: number,
  facing: RenderFacing,
): BakedCharacterFrame {
  getAnimationFrame(animation, frameIndex);
  const textureKey = buildCharacterFrameTextureKey(appearance, animation, frameIndex, facing);

  if (!scene.textures.exists(textureKey)) {
    const frame = composeCharacterFrame(appearance, animation, frameIndex, facing);
    const texture = scene.textures.createCanvas(
      textureKey,
      CHARACTER_FRAME_WIDTH,
      CHARACTER_FRAME_HEIGHT,
    );
    if (!texture) throw new Error(`Could not create texture ${textureKey}.`);

    const palette = getCharacterPalette(appearance.palette);
    texture.context.imageSmoothingEnabled = false;
    frame.pixels.forEach((role, index) => {
      if (!role) return;
      texture.context.fillStyle = `#${palette[role].toString(16).padStart(6, '0')}`;
      texture.context.fillRect(
        index % CHARACTER_FRAME_WIDTH,
        Math.floor(index / CHARACTER_FRAME_WIDTH),
        1,
        1,
      );
    });
    texture.refresh();
  }

  return {
    textureKey,
    originX: 0.5,
    originY: CHARACTER_ORIGIN_Y / CHARACTER_FRAME_HEIGHT,
  };
}
