import { describe, expect, it } from 'vitest';
import { CHARACTER_ANIMATIONS } from '../anatomy/anatomicalAnimations';
import type { CharacterAnimationName } from '../anatomy/AnatomicalPose';
import { PREVIEW_APPEARANCES } from '../deterministicCharacter';
import { isMaskConnected } from '../frame/PixelCanvas';
import { composeCharacterFrame } from './characterFrameComposer';

describe('complete character frame composer', () => {
  it('is deterministic for identical complete-frame inputs', () => {
    const first = composeCharacterFrame(PREVIEW_APPEARANCES.mixed, 'run', 3, 'right');
    const second = composeCharacterFrame(PREVIEW_APPEARANCES.mixed, 'run', 3, 'right');
    expect(second).toEqual(first);
  });

  it('keeps the anatomical body connected for every preview family and animation', () => {
    for (const appearance of Object.values(PREVIEW_APPEARANCES)) {
      for (const animation of Object.keys(CHARACTER_ANIMATIONS) as CharacterAnimationName[]) {
        for (let index = 0; index < CHARACTER_ANIMATIONS[animation].frames.length; index += 1) {
          const frame = composeCharacterFrame(appearance, animation, index, 'right');
          expect(frame.pixels).toHaveLength(48 * 56);
          expect(isMaskConnected(frame.bodyMask, 48, 56)).toBe(true);
        }
      }
    }
  });

  it('mirrors default output and preserves semantic roles', () => {
    const right = composeCharacterFrame(PREVIEW_APPEARANCES.clone, 'idle', 0, 'right');
    const left = composeCharacterFrame(PREVIEW_APPEARANCES.clone, 'idle', 0, 'left');
    for (let y = 0; y < 56; y += 1) {
      for (let x = 0; x < 48; x += 1) {
        expect(left.pixels[y * 48 + x]).toBe(right.pixels[y * 48 + (47 - x)]);
      }
    }
  });

  it('rejects unavailable animation frame indexes', () => {
    expect(() => composeCharacterFrame(PREVIEW_APPEARANCES.clone, 'idle', 6, 'right')).toThrow(
      'Invalid idle frame index 6.',
    );
  });
});
