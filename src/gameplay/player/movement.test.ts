import { describe, expect, it } from 'vitest';
import { getFacingDirection, getHorizontalIntent } from './movement';

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
