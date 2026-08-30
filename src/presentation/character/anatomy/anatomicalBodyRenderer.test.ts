import { describe, expect, it } from 'vitest';
import { BODY_IDS } from '../CharacterAppearance';
import {
  CHARACTER_BODY_LEFT,
  CHARACTER_BODY_TOP,
  CHARACTER_ORIGIN_Y,
} from '../characterDimensions';
import { PixelCanvas, isMaskConnected } from '../frame/PixelCanvas';
import { CHARACTER_ANIMATIONS } from './anatomicalAnimations';
import { renderAnatomicalBody } from './anatomicalBodyRenderer';

const FRAME_WIDTH = 48;
const FRAME_HEIGHT = 56;
const CONTACT_ROW = CHARACTER_ORIGIN_Y - 1;

describe('connected anatomical underbody', () => {
  it('keeps every body build non-empty, connected, bounded, and semantically separated', () => {
    for (const body of BODY_IDS) {
      for (const animation of Object.values(CHARACTER_ANIMATIONS)) {
        for (const frame of animation.frames) {
          const canvas = new PixelCanvas(FRAME_WIDTH, FRAME_HEIGHT);
          renderAnatomicalBody(canvas, frame.pose, body);
          const snapshot = canvas.snapshot();

          const bodyIndexes: number[] = [];
          const outlineIndexes: number[] = [];
          for (let index = 0; index < snapshot.bodyMask.length; index += 1) {
            if (snapshot.bodyMask[index]) bodyIndexes.push(index);
            if (snapshot.pixels[index] === 'outline') outlineIndexes.push(index);
          }

          expect(bodyIndexes.length).toBeGreaterThan(0);
          expect(isMaskConnected(snapshot.bodyMask, FRAME_WIDTH, FRAME_HEIGHT)).toBe(true);
          expect(
            bodyIndexes.every((index) => {
              const x = index % FRAME_WIDTH;
              const y = Math.floor(index / FRAME_WIDTH);
              return (
                x >= CHARACTER_BODY_LEFT &&
                x < 40 &&
                y >= CHARACTER_BODY_TOP &&
                y < CHARACTER_ORIGIN_Y
              );
            }),
          ).toBe(true);

          const row52Start = CHARACTER_ORIGIN_Y * FRAME_WIDTH;
          const row52End = row52Start + FRAME_WIDTH;
          expect(snapshot.bodyMask.slice(row52Start, row52End).some(Boolean)).toBe(false);
          expect(snapshot.pixels.slice(row52Start, row52End).every((pixel) => pixel === null)).toBe(
            true,
          );
          expect(outlineIndexes.length).toBeGreaterThan(0);
          expect(outlineIndexes.every((index) => !snapshot.bodyMask[index])).toBe(true);

          for (const foot of [frame.pose.footRear, frame.pose.footFront]) {
            if (foot.y !== CONTACT_ROW) continue;
            expect(
              [CONTACT_ROW - 2, CONTACT_ROW - 1, CONTACT_ROW].every(
                (y) => snapshot.bodyMask[y * FRAME_WIDTH + foot.x],
              ),
            ).toBe(true);
          }
        }
      }
    }
  });
});
