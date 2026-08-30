import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import type { CharacterAppearance } from '../CharacterAppearance';
import { getCharacterPalette } from '../characterPalettes';
import { PREVIEW_APPEARANCES } from '../deterministicCharacter';
import { composeCharacterFrame } from './characterFrameComposer';
import { bakeCharacterFrame, buildCharacterFrameTextureKey } from './characterFrameBaker';

interface PaintedPixel {
  color: string;
  x: number;
  y: number;
}

function createSceneDouble(textureExists: boolean) {
  const paintedPixels: PaintedPixel[] = [];
  const context = {
    imageSmoothingEnabled: true,
    fillStyle: '',
    fillRect: vi.fn((x: number, y: number) => {
      paintedPixels.push({ color: context.fillStyle, x, y });
    }),
  };
  const refresh = vi.fn();
  const texture = { context, refresh };
  const createCanvas = vi.fn(() => texture);
  const exists = vi.fn(() => textureExists);
  const scene = { textures: { exists, createCanvas } } as unknown as Phaser.Scene;

  return { scene, exists, createCanvas, context, refresh, paintedPixels };
}

describe('character frame baker', () => {
  it('keys complete frames by every appearance field, animation, frame, and facing', () => {
    const appearance = PREVIEW_APPEARANCES.mixed;
    const right = buildCharacterFrameTextureKey(appearance, 'run', 3, 'right');
    const left = buildCharacterFrameTextureKey(appearance, 'run', 3, 'left');

    expect(right).toBe(
      `char-frame:${appearance.body}:${appearance.head}:${appearance.torso}:${appearance.legs}:` +
        `${appearance.arms}:${appearance.armor}:${appearance.mutation}:${appearance.weapon}:` +
        `${appearance.accessories.join(',')}:${appearance.palette}:b100d004:run:3:right`,
    );
    expect(left).not.toBe(right);

    const variants: CharacterAppearance[] = [
      { ...appearance, body: 'heavy' },
      { ...appearance, head: 'shaved' },
      { ...appearance, torso: 'medical-suit' },
      { ...appearance, legs: 'prison-trousers' },
      { ...appearance, arms: 'wrapped-arms' },
      { ...appearance, armor: 'industrial-vest' },
      { ...appearance, mutation: 'bone-growth' },
      { ...appearance, weapon: 'relay-pistol', seed: appearance.seed + 1 },
      { ...appearance, accessories: [...appearance.accessories].reverse() },
      { ...appearance, palette: 'ash-violet' },
    ];
    for (const variant of variants) {
      expect(buildCharacterFrameTextureKey(variant, 'run', 3, 'right')).not.toBe(right);
    }
    expect(
      buildCharacterFrameTextureKey({ ...appearance, seed: -1 }, 'idle', 0, 'right'),
    ).toContain(':ffffffff:idle:0:right');
  });

  it('creates and paints a missing 48 by 56 canvas texture', () => {
    const sceneDouble = createSceneDouble(false);
    const appearance = PREVIEW_APPEARANCES.clone;
    const composed = composeCharacterFrame(appearance, 'idle', 0, 'right');
    const palette = getCharacterPalette(appearance.palette);

    const baked = bakeCharacterFrame(sceneDouble.scene, appearance, 'idle', 0, 'right');

    expect(sceneDouble.exists).toHaveBeenCalledWith(baked.textureKey);
    expect(sceneDouble.createCanvas).toHaveBeenCalledWith(baked.textureKey, 48, 56);
    expect(sceneDouble.context.imageSmoothingEnabled).toBe(false);
    expect(sceneDouble.paintedPixels).toHaveLength(
      composed.pixels.filter((role) => role !== null).length,
    );
    const firstPaintedIndex = composed.pixels.findIndex((role) => role !== null);
    const firstRole = composed.pixels[firstPaintedIndex]!;
    expect(sceneDouble.paintedPixels[0]).toEqual({
      color: `#${palette[firstRole].toString(16).padStart(6, '0')}`,
      x: firstPaintedIndex % 48,
      y: Math.floor(firstPaintedIndex / 48),
    });
    expect(sceneDouble.refresh).toHaveBeenCalledOnce();
    expect(baked).toEqual({ textureKey: baked.textureKey, originX: 0.5, originY: 52 / 56 });
  });

  it('reuses an existing texture without composing or creating it again', () => {
    const sceneDouble = createSceneDouble(true);

    expect(() =>
      bakeCharacterFrame(sceneDouble.scene, PREVIEW_APPEARANCES.clone, 'idle', 99, 'left'),
    ).not.toThrow();
    expect(sceneDouble.createCanvas).not.toHaveBeenCalled();
    expect(sceneDouble.refresh).not.toHaveBeenCalled();
  });

  it('throws when Phaser cannot create a missing canvas texture', () => {
    const sceneDouble = createSceneDouble(false);
    sceneDouble.createCanvas.mockReturnValueOnce(null as never);
    const key = buildCharacterFrameTextureKey(PREVIEW_APPEARANCES.clone, 'idle', 0, 'right');

    expect(() =>
      bakeCharacterFrame(sceneDouble.scene, PREVIEW_APPEARANCES.clone, 'idle', 0, 'right'),
    ).toThrow(`Could not create texture ${key}.`);
  });
});
