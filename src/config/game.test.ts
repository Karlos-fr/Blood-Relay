import { describe, expect, it } from 'vitest';
import { GAME_HEIGHT, GAME_VERSION, GAME_WIDTH } from './game';

describe('game configuration', () => {
  it('uses the 960x540 logical resolution defined by the plan', () => {
    expect(GAME_WIDTH).toBe(960);
    expect(GAME_HEIGHT).toBe(540);
  });

  it('keeps a 16:9 logical aspect ratio', () => {
    expect(GAME_WIDTH / GAME_HEIGHT).toBe(16 / 9);
  });

  it('exposes a development version string', () => {
    expect(GAME_VERSION).toMatch(/^0\.1\.0-dev$/);
  });
});
