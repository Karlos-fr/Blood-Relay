import { describe, expect, it } from 'vitest';
import { detectMobileInput } from './device';

describe('detectMobileInput', () => {
  it('detects a coarse touch device without hover as mobile input', () => {
    expect(
      detectMobileInput({
        maxTouchPoints: 5,
        coarsePointer: true,
        hoverNone: true,
      }),
    ).toBe(true);
  });

  it('keeps desktop pointer environments out of mobile mode', () => {
    expect(
      detectMobileInput({
        maxTouchPoints: 0,
        coarsePointer: false,
        hoverNone: false,
      }),
    ).toBe(false);
  });

  it('does not enable mobile controls on a touch-capable device with desktop pointer semantics', () => {
    expect(
      detectMobileInput({
        maxTouchPoints: 10,
        coarsePointer: false,
        hoverNone: false,
      }),
    ).toBe(false);
  });
});
