import { describe, expect, it } from 'vitest';
import { PLAYER_JUMP_SPEED } from '../gameplay/player/movement';
import { isSymmetricPlatformWidth } from '../presentation/platformTiles';
import { GAME_HEIGHT, GAME_WIDTH, GRAVITY_Y } from './game';
import {
  ARENA_CAMERA_ZOOM,
  ARENA_HEIGHT,
  ARENA_WIDTH,
  FLOOR_HEIGHT,
  PLATFORM_HEIGHT,
  PLATFORM_LAYOUT,
} from './arena';

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

  it('uses four platform levels in a symmetric 2-2-2-2 pattern', () => {
    const tiers = PLATFORM_LAYOUT.map((platform) => platform.tier);
    const counts = [1, 2, 3, 4].map(
      (tier) => PLATFORM_LAYOUT.filter((platform) => platform.tier === tier).length,
    );

    expect(counts).toEqual([2, 2, 2, 2]);
    expect(Math.max(...tiers)).toBe(4);
  });

  it('mirrors every platform pair around the vertical arena axis', () => {
    const center = ARENA_WIDTH / 2;

    for (const tier of [1, 2, 3, 4]) {
      const pair = PLATFORM_LAYOUT.filter((platform) => platform.tier === tier);
      expect(pair).toHaveLength(2);
      expect(pair[0].y).toBe(pair[1].y);
      expect(pair[0].width).toBe(pair[1].width);
      expect(center - pair[0].x).toBeCloseTo(pair[1].x - center);
    }
  });

  it('keeps platforms clear of the relay machine footprint', () => {
    const machine = { x: ARENA_WIDTH / 2, y: 228, radius: 110 };
    const machineLeft = machine.x - machine.radius;
    const machineRight = machine.x + machine.radius;
    const machineTop = machine.y - machine.radius;
    const machineBottom = machine.y + machine.radius;

    for (const platform of PLATFORM_LAYOUT) {
      const left = platform.x - platform.width / 2;
      const right = platform.x + platform.width / 2;
      const top = platform.y - PLATFORM_HEIGHT / 2;
      const bottom = platform.y + PLATFORM_HEIGHT / 2;
      const overlapsVertically = bottom > machineTop && top < machineBottom;

      if (overlapsVertically) {
        expect(right < machineLeft || left > machineRight).toBe(true);
      }
    }
  });

  it('spaces each climb within the current full-jump height', () => {
    const maxJumpHeight = (PLAYER_JUMP_SPEED * PLAYER_JUMP_SPEED) / (2 * GRAVITY_Y);
    const tierSurfaceYs = [1, 2, 3, 4].map((tier) => {
      const platform = PLATFORM_LAYOUT.find((candidate) => candidate.tier === tier);
      if (!platform) throw new Error(`Missing platform tier ${tier}`);
      return platform.y - PLATFORM_HEIGHT / 2;
    });
    const surfaces = [ARENA_HEIGHT - FLOOR_HEIGHT, ...tierSurfaceYs];

    for (let index = 1; index < surfaces.length; index += 1) {
      const verticalGap = surfaces[index - 1] - surfaces[index];
      expect(verticalGap).toBeGreaterThan(0);
      expect(verticalGap).toBeLessThanOrEqual(maxJumpHeight * 0.9);
    }
  });

  it('uses widths that produce centered symmetric procedural patterns', () => {
    expect(PLATFORM_LAYOUT.every((platform) => isSymmetricPlatformWidth(platform.width))).toBe(
      true,
    );
  });
});
