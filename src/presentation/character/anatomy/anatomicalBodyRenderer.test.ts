import { describe, expect, it } from 'vitest';
import { BODY_IDS } from '../CharacterAppearance';
import { CHARACTER_BODY_LEFT, CHARACTER_ORIGIN_Y } from '../characterDimensions';
import { PixelCanvas, isMaskConnected } from '../frame/PixelCanvas';
import { CHARACTER_ANIMATIONS } from './anatomicalAnimations';
import { renderAnatomicalBody } from './anatomicalBodyRenderer';

describe('connected anatomical underbody', () => {
  it('keeps every body build connected in every approved pose', () => {
    for (const body of BODY_IDS) {
      for (const animation of Object.values(CHARACTER_ANIMATIONS)) {
        for (const frame of animation.frames) {
          const canvas = new PixelCanvas(48, 56);
          renderAnatomicalBody(canvas, frame.pose, body);
          const snapshot = canvas.snapshot();
          expect(isMaskConnected(snapshot.bodyMask, 48, 56)).toBe(true);
        }
      }
    }
  });

  it('keeps the body inside its region and grounded feet on the contact row', () => {
    const canvas = new PixelCanvas(48, 56);
    renderAnatomicalBody(canvas, CHARACTER_ANIMATIONS.idle.frames[0].pose, 'standard');
    const mask = canvas.snapshot().bodyMask;
    for (let index = 0; index < mask.length; index += 1) {
      if (!mask[index]) continue;
      const x = index % 48;
      const y = Math.floor(index / 48);
      expect(x).toBeGreaterThanOrEqual(CHARACTER_BODY_LEFT);
      expect(x).toBeLessThan(40);
      expect(y).toBeLessThan(CHARACTER_ORIGIN_Y);
    }
    expect(mask[(CHARACTER_ORIGIN_Y - 1) * 48 + 18]).toBe(true);
    expect(mask[(CHARACTER_ORIGIN_Y - 1) * 48 + 31]).toBe(true);
  });
});
