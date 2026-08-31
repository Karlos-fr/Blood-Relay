import { describe, expect, it } from 'vitest';
import { CHARACTER_ANIMATIONS } from '../anatomy/anatomicalAnimations';
import { ANATOMICAL_LANDMARKS, type CharacterAnimationName } from '../anatomy/AnatomicalPose';
import { CHARACTER_FRAME_HEIGHT, CHARACTER_FRAME_WIDTH } from '../characterDimensions';
import { PREVIEW_APPEARANCES } from '../deterministicCharacter';
import { isMaskConnected } from '../frame/PixelCanvas';
import { ACCESSORY_MODULES } from '../modules/accessories';
import { composeCharacterFrame, mirrorAnatomicalPose } from './characterFrameComposer';

describe('complete character frame composer', () => {
  it('is deterministic for identical complete-frame inputs', () => {
    const first = composeCharacterFrame(PREVIEW_APPEARANCES.mixed, 'run', 3, 'right');
    const second = composeCharacterFrame(PREVIEW_APPEARANCES.mixed, 'run', 3, 'right');
    expect(second).toEqual(first);
  });

  it('keeps both facings in bounds with a connected anatomical body', () => {
    for (const appearance of Object.values(PREVIEW_APPEARANCES)) {
      for (const animation of Object.keys(CHARACTER_ANIMATIONS) as CharacterAnimationName[]) {
        for (let index = 0; index < CHARACTER_ANIMATIONS[animation].frames.length; index += 1) {
          for (const facing of ['left', 'right'] as const) {
            const frame = composeCharacterFrame(appearance, animation, index, facing);
            expect(frame.width).toBe(CHARACTER_FRAME_WIDTH);
            expect(frame.height).toBe(CHARACTER_FRAME_HEIGHT);
            expect(frame.pixels).toHaveLength(CHARACTER_FRAME_WIDTH * CHARACTER_FRAME_HEIGHT);
            expect(frame.bodyMask).toHaveLength(CHARACTER_FRAME_WIDTH * CHARACTER_FRAME_HEIGHT);
            expect(frame.bodyMask.some(Boolean)).toBe(true);
            expect(
              isMaskConnected(frame.bodyMask, CHARACTER_FRAME_WIDTH, CHARACTER_FRAME_HEIGHT),
            ).toBe(true);
          }
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
        expect(left.bodyMask[y * 48 + x]).toBe(right.bodyMask[y * 48 + (47 - x)]);
      }
    }
  });

  it('mirrors every anatomical landmark into a frozen independent pose', () => {
    const source = CHARACTER_ANIMATIONS.idle.frames[0].pose;
    const mirrored = mirrorAnatomicalPose(source);

    expect(mirrored).toEqual({
      headCenter: { x: 20, y: 11 },
      neck: { x: 23, y: 17 },
      shoulderRear: { x: 27, y: 20 },
      shoulderFront: { x: 20, y: 19 },
      elbowRear: { x: 29, y: 28 },
      elbowFront: { x: 16, y: 27 },
      handRear: { x: 26, y: 35 },
      handFront: { x: 14, y: 34 },
      hipRear: { x: 26, y: 34 },
      hipFront: { x: 20, y: 34 },
      kneeRear: { x: 27, y: 42 },
      kneeFront: { x: 18, y: 42 },
      footRear: { x: 29, y: 51 },
      footFront: { x: 16, y: 51 },
      weaponMount: { x: 13, y: 33 },
    });
    expect(Object.isFrozen(mirrored)).toBe(true);
    for (const landmark of ANATOMICAL_LANDMARKS) {
      expect(mirrored[landmark]).not.toBe(source[landmark]);
      expect(Object.isFrozen(mirrored[landmark])).toBe(true);
    }
  });

  it('returns fresh frozen frame snapshots and arrays', () => {
    const first = composeCharacterFrame(PREVIEW_APPEARANCES.clone, 'idle', 0, 'right');
    const second = composeCharacterFrame(PREVIEW_APPEARANCES.clone, 'idle', 0, 'right');

    expect(second).not.toBe(first);
    expect(second.pixels).not.toBe(first.pixels);
    expect(second.bodyMask).not.toBe(first.bodyMask);
    for (const value of [first, first.pixels, first.bodyMask]) {
      expect(Object.isFrozen(value)).toBe(true);
    }
  });

  it('resolves left renderers independently without erasing same-layer siblings', () => {
    const bloodBag = ACCESSORY_MODULES['blood-bag'];
    const dorsalTube = ACCESSORY_MODULES['dorsal-tube'];
    const medicalPack = ACCESSORY_MODULES['medical-pack'];
    const originalBloodRight = bloodBag.renderRight;
    const originalBloodLeft = bloodBag.renderLeft;
    const originalTubeRight = dorsalTube.renderRight;
    const originalTubeLeft = dorsalTube.renderLeft;
    const originalPackRight = medicalPack.renderRight;

    try {
      bloodBag.renderRight = ({ canvas }) => canvas.setPixel(5, 1, 'blood');
      bloodBag.renderLeft = ({ canvas }) => {
        canvas.setPixel(1, 1, 'blood');
        canvas.setPixel(4, 1, 'metal');
      };
      dorsalTube.renderRight = ({ canvas }) => canvas.setPixel(6, 1, 'accent');
      dorsalTube.renderLeft = ({ canvas }) => {
        canvas.setPixel(2, 1, 'accent');
        canvas.setPixel(4, 1, 'metalLight');
      };
      medicalPack.renderRight = ({ canvas }) => canvas.setPixel(3, 1, 'clothLight');

      const left = composeCharacterFrame(
        {
          ...PREVIEW_APPEARANCES.clone,
          accessories: ['blood-bag', 'dorsal-tube', 'medical-pack'],
        },
        'idle',
        0,
        'left',
      );

      expect(left.pixels[1 * CHARACTER_FRAME_WIDTH + 1]).toBe('blood');
      expect(left.pixels[1 * CHARACTER_FRAME_WIDTH + 2]).toBe('accent');
      expect(left.pixels[1 * CHARACTER_FRAME_WIDTH + 4]).toBe('metalLight');
      expect(left.pixels[1 * CHARACTER_FRAME_WIDTH + 44]).toBe('clothLight');
      expect(left.pixels[1 * CHARACTER_FRAME_WIDTH + 42]).toBeNull();
      expect(left.pixels[1 * CHARACTER_FRAME_WIDTH + 41]).toBeNull();
    } finally {
      bloodBag.renderRight = originalBloodRight;
      dorsalTube.renderRight = originalTubeRight;
      medicalPack.renderRight = originalPackRight;
      if (originalBloodLeft) bloodBag.renderLeft = originalBloodLeft;
      else delete bloodBag.renderLeft;
      if (originalTubeLeft) dorsalTube.renderLeft = originalTubeLeft;
      else delete dorsalTube.renderLeft;
    }
  });

  it('rejects unavailable animation frame indexes', () => {
    expect(() => composeCharacterFrame(PREVIEW_APPEARANCES.clone, 'idle', 6, 'right')).toThrow(
      'Invalid idle frame index 6.',
    );
  });
});
