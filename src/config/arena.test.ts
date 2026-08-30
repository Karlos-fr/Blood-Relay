import { describe, expect, it } from 'vitest';
import { isSymmetricPlatformWidth } from '../presentation/platformTiles';
import { GAME_HEIGHT, GAME_WIDTH } from './game';
import { ARENA_CAMERA_ZOOM, ARENA_HEIGHT, ARENA_WIDTH, PLATFORM_LAYOUT } from './arena';

describe('arena layout', () => {
  it('uses a wider native 1:1 arena for desktop', () => {
    expect(ARENA_CAMERA_ZOOM).toBe(1);
    expect(ARENA_WIDTH).toBe(GAME_WIDTH);
    expect(ARENA_HEIGHT).toBe(GAME_HEIGHT);
    expect(ARENA_WIDTH).toBe(1120);
    expect(ARENA_HEIGHT).toBe(540);
  });

  it('fits the complete logical arena in the game viewport', () => {
    expect(ARENA_WIDTH * ARENA_CAMERA_ZOOM).toBe(GAME_WIDTH);
    expect(ARENA_HEIGHT * ARENA_CAMERA_ZOOM).toBe(GAME_HEIGHT);
  });

  it('uses three platform levels in a symmetric 2-2-2 pattern', () => {
    const tiers = PLATFORM_LAYOUT.map((platform) => platform.tier);
    const counts = [1, 2, 3].map(
      (tier) => PLATFORM_LAYOUT.filter((platform) => platform.tier === tier).length,
    );

    expect(counts).toEqual([2, 2, 2]);
    expect(Math.max(...tiers)).toBe(3);
  });

  it('splits tier two around the centered relay machine without changing its height', () => {
    const tierTwo = PLATFORM_LAYOUT.filter((platform) => platform.tier === 2);
    const center = ARENA_WIDTH / 2;
    const machineRadius = 110;

    expect(tierTwo).toHaveLength(2);
    expect(tierTwo[0].y).toBe(tierTwo[1].y);
    expect(center - tierTwo[0].x).toBeCloseTo(tierTwo[1].x - center);
    expect(tierTwo[0].x + tierTwo[0].width / 2).toBeLessThan(center - machineRadius);
    expect(tierTwo[1].x - tierTwo[1].width / 2).toBeGreaterThan(center + machineRadius);
  });

  it('keeps tier-three platforms away from the relay', () => {
    const tierThree = PLATFORM_LAYOUT.filter((platform) => platform.tier === 3);
    const center = ARENA_WIDTH / 2;

    expect(tierThree).toHaveLength(2);
    expect(tierThree[0].y).toBe(tierThree[1].y);
    expect(center - tierThree[0].x).toBeGreaterThanOrEqual(205);
    expect(tierThree[1].x - center).toBeGreaterThanOrEqual(205);
  });

  it('uses widths that produce centered symmetric procedural patterns', () => {
    expect(PLATFORM_LAYOUT.every((platform) => isSymmetricPlatformWidth(platform.width))).toBe(
      true,
    );
  });
});
