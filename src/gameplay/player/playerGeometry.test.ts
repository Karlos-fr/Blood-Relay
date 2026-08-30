import { describe, expect, it } from 'vitest';
import { PLAYER_HEIGHT, PLAYER_WIDTH } from './playerGeometry';

describe('player gameplay geometry', () => {
  it('uses the approved shared 32 × 48 physics body', () => {
    expect(PLAYER_WIDTH).toBe(32);
    expect(PLAYER_HEIGHT).toBe(48);
  });
});
