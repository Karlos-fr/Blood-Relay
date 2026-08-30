import { describe, expect, it } from 'vitest';
import { GAME_HEIGHT, GAME_VERSION, GAME_WIDTH } from './game';

describe('game configuration', () => {
  it('uses the widened 1120x540 logical resolution', () => {
    expect(GAME_WIDTH).toBe(1120);
    expect(GAME_HEIGHT).toBe(540);
  });

  it('uses the wider desktop arena aspect ratio', () => {
    expect(GAME_WIDTH / GAME_HEIGHT).toBeCloseTo(1120 / 540);
  });

  it('exposes a development version string', () => {
    expect(GAME_VERSION).toMatch(/^0\.1\.0-dev$/);
  });
});
