import { describe, expect, it } from 'vitest';
import { PLAYER_JUMP_SPEED } from '../gameplay/player/movement';
import { GAME_HEIGHT, GAME_WIDTH, GRAVITY_Y } from './game';
import {
  ARENA_CAMERA_ZOOM,
  ARENA_HEIGHT,
  ARENA_WIDTH,
  PLATFORM_HEIGHT,
  PLATFORM_LAYOUT,
} from './arena';

const SCALED_PLAYER_HEIGHT = 31.05;
const MIN_TOP_JUMP_MARGIN = 24;

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

  it('uses four platform levels in a 2-1-2-1 pattern', () => {
    const counts = [1, 2, 3, 4].map(
      (tier) => PLATFORM_LAYOUT.filter((platform) => platform.tier === tier).length,
    );

    expect(counts).toEqual([2, 1, 2, 1]);
  });

  it('keeps a full jump from the fourth level inside the screen', () => {
    const highestPlatform = PLATFORM_LAYOUT.reduce((highest, platform) =>
      platform.y < highest.y ? platform : highest,
    );
    expect(highestPlatform.tier).toBe(4);

    const platformTop = highestPlatform.y - PLATFORM_HEIGHT / 2;
    const standingPlayerTop = platformTop - SCALED_PLAYER_HEIGHT;
    const jumpHeight = PLAYER_JUMP_SPEED ** 2 / (2 * GRAVITY_Y);
    const apexTop = standingPlayerTop - jumpHeight;

    expect(apexTop).toBeGreaterThanOrEqual(MIN_TOP_JUMP_MARGIN);
  });
});
