import { describe, expect, it } from 'vitest';
import {
  GLOWING_MOTE_PALETTE,
  buildGlowingMoteSeeds,
  sampleGlowingMote,
} from './glowingMotes';

describe('glowing motes', () => {
  it('builds exactly sixteen deterministic upward-moving motes', () => {
    const first = buildGlowingMoteSeeds(1120, 502);
    const second = buildGlowingMoteSeeds(1120, 502);

    expect(first).toHaveLength(16);
    expect(second).toEqual(first);
    expect(first.every((mote) => mote.velocityY < 0)).toBe(true);
  });

  it('uses warm yellow and cream tones that contrast with the red relay', () => {
    expect(GLOWING_MOTE_PALETTE).toEqual([0xf2c94c, 0xffe08a, 0xfff3bf]);
  });

  it('rises and visibly twinkles during a lifetime', () => {
    const seed = buildGlowingMoteSeeds(1120, 502, 1)[0];
    const early = sampleGlowingMote(seed, seed.phaseOffsetMs + seed.lifetimeMs * 0.25, 1120, 502);
    const middle = sampleGlowingMote(seed, seed.phaseOffsetMs + seed.lifetimeMs * 0.5, 1120, 502);

    expect(middle.y).toBeLessThan(early.y);
    expect(Math.max(early.alpha, middle.alpha)).toBeGreaterThan(0.2);
    expect(early.alpha).not.toBeCloseTo(middle.alpha, 3);
  });

  it('fades near the top and respawns from below on the next cycle', () => {
    const seed = buildGlowingMoteSeeds(1120, 502, 1)[0];
    const nearEnd = sampleGlowingMote(
      seed,
      seed.phaseOffsetMs + seed.lifetimeMs * 0.94,
      1120,
      502,
    );
    const respawned = sampleGlowingMote(
      seed,
      seed.phaseOffsetMs + seed.lifetimeMs * 1.02,
      1120,
      502,
    );

    expect(nearEnd.alpha).toBeLessThan(0.12);
    expect(respawned.y).toBeGreaterThan(502 * 0.72);
  });
});
