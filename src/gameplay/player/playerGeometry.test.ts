import { describe, expect, it } from 'vitest';
import { ARENA_CONTENT_SCALE } from '../../config/arenaScale';
import { PLAYER_HEIGHT, PLAYER_WIDTH } from './playerGeometry';

describe('player gameplay geometry', () => {
  it('preserves the exact existing physics rectangle', () => {
    expect(PLAYER_WIDTH).toBe(22.5 * ARENA_CONTENT_SCALE);
    expect(PLAYER_HEIGHT).toBe(34.5 * ARENA_CONTENT_SCALE);
  });
});
