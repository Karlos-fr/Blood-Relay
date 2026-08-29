import { describe, expect, it } from 'vitest';
import { GAME_HEIGHT, GAME_WIDTH } from './game';
import {
  ARENA_CAMERA_ZOOM,
  ARENA_HEIGHT,
  ARENA_WIDTH,
  PLATFORM_LAYOUT,
} from './arena';

describe('arena layout', () => {
  it('uses a native 1:1 camera scale', () => {
    expect(ARENA_CAMERA_ZOOM).toBe(1);
    expect(ARENA_WIDTH).toBe(GAME_WIDTH);
    expect(ARENA_HEIGHT).toBe(GAME_HEIGHT);
  });

  it('fits the complete arena in the 960x540 viewport', () => {
    expect(ARENA_WIDTH * ARENA_CAMERA_ZOOM).toBe(GAME_WIDTH);
    expect(ARENA_HEIGHT * ARENA_CAMERA_ZOOM).toBe(GAME_HEIGHT);
  });

  it('uses exactly three platform levels', () => {
    const tiers = new Set(PLATFORM_LAYOUT.map((platform) => platform.tier));
    expect(tiers.size).toBe(3);
  });
});
