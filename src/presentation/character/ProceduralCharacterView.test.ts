import type Phaser from 'phaser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PlayerPresentationState } from '../../gameplay/player/playerPresentationState';
import { PREVIEW_APPEARANCES } from './deterministicCharacter';

const { bakeCharacterFrameMock } = vi.hoisted(() => ({
  bakeCharacterFrameMock: vi.fn(() => ({
    textureKey: 'char-frame:test',
    originX: 0.5,
    originY: 52 / 56,
  })),
}));

vi.mock('./rendering/characterFrameBaker', () => ({
  bakeCharacterFrame: bakeCharacterFrameMock,
}));

import { ProceduralCharacterView } from './ProceduralCharacterView';

function createSceneDouble() {
  const image = {
    setOrigin: vi.fn(),
    setDepth: vi.fn(),
    setPosition: vi.fn(),
    setTexture: vi.fn(),
    destroy: vi.fn(),
  };
  image.setOrigin.mockReturnValue(image);
  image.setDepth.mockReturnValue(image);
  image.setPosition.mockReturnValue(image);
  image.setTexture.mockReturnValue(image);
  const addImage = vi.fn(() => image);
  const scene = { add: { image: addImage } } as unknown as Phaser.Scene;

  return { scene, addImage, image };
}

const IDLE_STATE: PlayerPresentationState = {
  x: 10.4,
  y: 20.2,
  facing: 1,
  grounded: true,
  velocityX: 0,
  velocityY: 0,
};

describe('ProceduralCharacterView', () => {
  beforeEach(() => {
    bakeCharacterFrameMock.mockClear();
  });

  it('owns one image while selecting and applying a complete frame on every update', () => {
    const { scene, addImage, image } = createSceneDouble();
    const appearance = PREVIEW_APPEARANCES.mixed;
    const view = new ProceduralCharacterView(scene, appearance);

    view.update(0, IDLE_STATE);
    view.update(181, { ...IDLE_STATE, x: 12.6, y: 21.2, facing: -1 });

    expect(addImage).toHaveBeenCalledOnce();
    expect(bakeCharacterFrameMock).toHaveBeenNthCalledWith(
      1,
      scene,
      appearance,
      'idle',
      0,
      'right',
    );
    expect(bakeCharacterFrameMock).toHaveBeenNthCalledWith(2, scene, appearance, 'idle', 1, 'left');
    expect(image.setPosition).toHaveBeenNthCalledWith(1, 10, 36);
    expect(image.setPosition).toHaveBeenNthCalledWith(2, 13, 37);
    expect(image.setTexture).toHaveBeenCalledTimes(2);
    expect(image.setTexture).toHaveBeenLastCalledWith('char-frame:test');
    expect(image.setOrigin).toHaveBeenCalledTimes(2);
    expect(image.setOrigin).toHaveBeenLastCalledWith(0.5, 52 / 56);
  });

  it('destroys its single image', () => {
    const { scene, image } = createSceneDouble();
    const view = new ProceduralCharacterView(scene, PREVIEW_APPEARANCES.clone);

    view.destroy();

    expect(image.destroy).toHaveBeenCalledOnce();
  });
});
