import { describe, expect, it } from 'vitest';
import { combinePlayerControls, type PlayerControls } from './playerControls';

function stubControls(state: {
  left?: boolean;
  right?: boolean;
  down?: boolean;
  jumpDown?: boolean;
  jumpPressed?: boolean;
}): PlayerControls {
  return {
    isLeftDown: () => state.left ?? false,
    isRightDown: () => state.right ?? false,
    isDownDown: () => state.down ?? false,
    isJumpDown: () => state.jumpDown ?? false,
    consumeJumpPressed: () => state.jumpPressed ?? false,
  };
}

describe('combinePlayerControls', () => {
  it('combines keyboard and touch directions for the same player', () => {
    const keyboard = stubControls({ left: true });
    const touch = stubControls({ right: true, down: true });
    const combined = combinePlayerControls(keyboard, touch);

    expect(combined.isLeftDown()).toBe(true);
    expect(combined.isRightDown()).toBe(true);
    expect(combined.isDownDown()).toBe(true);
  });

  it('reports a held jump while any control source is still held', () => {
    const keyboard = stubControls({ jumpDown: false });
    const touch = stubControls({ jumpDown: true });
    const combined = combinePlayerControls(keyboard, touch);

    expect(combined.isJumpDown()).toBe(true);
  });

  it('reports a jump when any control source triggers one', () => {
    const keyboard = stubControls({ jumpPressed: false });
    const touch = stubControls({ jumpPressed: true });
    const combined = combinePlayerControls(keyboard, touch);

    expect(combined.consumeJumpPressed()).toBe(true);
  });
});
