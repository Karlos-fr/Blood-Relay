import { describe, expect, it } from 'vitest';
import { isSymmetricPlatformWidth } from '../presentation/platformTiles';
import { GAME_HEIGHT, GAME_WIDTH } from './game';
import { ARENA_CAMERA_ZOOM, ARENA_HEIGHT, ARENA_WIDTH, PLATFORM_LAYOUT } from './arena';

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

  it('uses three platform levels in a 2-1-2 pattern and keeps the relay sightline clear', () => {
    const tiers = PLATFORM_LAYOUT.map((platform) => platform.tier);
    const counts = [1, 2, 3].map(
      (tier) => PLATFORM_LAYOUT.filter((platform) => platform.tier === tier).length,
    );

    expect(counts).toEqual([2, 1, 2]);
    expect(Math.max(...tiers)).toBe(3);
  });

  it('uses widths that produce centered symmetric procedural patterns', () => {
    expect(PLATFORM_LAYOUT.every((platform) => isSymmetricPlatformWidth(platform.width))).toBe(
      true,
    );
  });
});
