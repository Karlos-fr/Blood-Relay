import { describe, expect, it } from 'vitest';
import {
  getFacingDirection,
  getHorizontalIntent,
  getReleasedJumpVelocity,
  PLAYER_JUMP_RELEASE_SPEED,
  PLAYER_JUMP_SPEED,
} from './movement';

describe('player movement intent', () => {
  it('returns left when only left is pressed', () => {
    expect(getHorizontalIntent(true, false)).toBe(-1);
  });

  it('returns right when only right is pressed', () => {
    expect(getHorizontalIntent(false, true)).toBe(1);
  });

  it('returns neutral when both or neither direction is pressed', () => {
    expect(getHorizontalIntent(false, false)).toBe(0);
    expect(getHorizontalIntent(true, true)).toBe(0);
  });

  it('keeps facing when idle and follows movement otherwise', () => {
    expect(getFacingDirection(0, -1)).toBe(-1);
    expect(getFacingDirection(1, -1)).toBe(1);
    expect(getFacingDirection(-1, 1)).toBe(-1);
  });
});

describe('variable jump release', () => {
  it('cuts a strong upward jump when the jump button is released early', () => {
    const released = getReleasedJumpVelocity(-PLAYER_JUMP_SPEED);

    expect(released).toBe(-PLAYER_JUMP_RELEASE_SPEED);
    expect(Math.abs(released)).toBeLessThan(Math.abs(PLAYER_JUMP_SPEED));
  });

  it('does not boost a jump that is already rising more slowly', () => {
    expect(getReleasedJumpVelocity(-PLAYER_JUMP_RELEASE_SPEED * 0.5)).toBe(
      -PLAYER_JUMP_RELEASE_SPEED * 0.5,
    );
  });

  it('does not alter downward velocity', () => {
    expect(getReleasedJumpVelocity(120)).toBe(120);
  });
});
