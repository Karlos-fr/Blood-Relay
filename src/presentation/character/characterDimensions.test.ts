import { describe, expect, it } from 'vitest';
import {
  CHARACTER_BODY_HEIGHT,
  CHARACTER_BODY_LEFT,
  CHARACTER_BODY_TOP,
  CHARACTER_BODY_WIDTH,
  CHARACTER_FRAME_HEIGHT,
  CHARACTER_FRAME_WIDTH,
  CHARACTER_ORIGIN_X,
  CHARACTER_ORIGIN_Y,
} from './characterDimensions';

describe('detailed character dimensions', () => {
  it('centers the 32 × 48 body inside the 48 × 56 frame', () => {
    expect([CHARACTER_BODY_WIDTH, CHARACTER_BODY_HEIGHT]).toEqual([32, 48]);
    expect([CHARACTER_FRAME_WIDTH, CHARACTER_FRAME_HEIGHT]).toEqual([48, 56]);
    expect([CHARACTER_BODY_LEFT, CHARACTER_BODY_TOP]).toEqual([8, 4]);
    expect([CHARACTER_ORIGIN_X, CHARACTER_ORIGIN_Y]).toEqual([24, 52]);
    expect(CHARACTER_BODY_LEFT * 2 + CHARACTER_BODY_WIDTH).toBe(CHARACTER_FRAME_WIDTH);
    expect(CHARACTER_BODY_TOP + CHARACTER_BODY_HEIGHT).toBe(CHARACTER_ORIGIN_Y);
  });
});
