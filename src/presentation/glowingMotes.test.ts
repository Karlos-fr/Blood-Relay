import { describe, expect, it } from 'vitest';
import {
  GLOWING_MOTE_PALETTE,
  buildGlowingMoteSeeds,
  sampleGlowingMote,
} from './glowingMotes';

describe('glowing motes', () => {
  it('builds thirty-six deterministic upward-moving motes', () => {
    const first = buildGlowingMoteSeeds(1120, 502);
    const second = buildGlowingMoteSeeds(1120, 502);

    expect(first).toHaveLength(36);
    expect(second).toEqual(first);
    expect(first.every((mote) => mote.velocityY < 0)).toBe(true);
  });

  it('distributes motes evenly across three retro depth planes', () => {
    const motes = buildGlowingMoteSeeds(1120, 502);
    const counts = ['far', 'mid', 'near'].map(
      (depth) => motes.filter((mote) => mote.depth === depth).length,
    );

    expect(counts).toEqual([12, 12, 12]);

    const averages = ['far', 'mid', 'near'].map((depth) => {
      const layer = motes.filter((mote) => mote.depth === depth);
      return {
        scale: layer.reduce((sum, mote) => sum + mote.scale, 0) / layer.length,
        alpha: layer.reduce((sum, mote) => sum + mote.baseAlpha, 0) / layer.length,
        speed: layer.reduce((sum, mote) => sum + Math.abs(mote.velocityY), 0) / layer.length,
      };
    });

    expect(averages[0].scale).toBeLessThan(averages[1].scale);
    expect(averages[1].scale).toBeLessThan(averages[2].scale);
    expect(averages[0].alpha).toBeLessThan(averages[1].alpha);
    expect(averages[1].alpha).toBeLessThan(averages[2].alpha);
    expect(averages[0].speed).toBeLessThan(averages[1].speed);
    expect(averages[1].speed).toBeLessThan(averages[2].speed);
  });

  it('uses warm yellow and cream tones that contrast with the red relay', () => {
    expect(GLOWING_MOTE_PALETTE).toEqual([0xf2c94c, 0xffe08a, 0xfff3bf]);
  });

  it('rises and visibly twinkles during a lifetime', () => {
    const seed = buildGlowingMoteSeeds(1120, 502, 1)[0];
    const early = sampleGlowingMote(seed, seed.phaseOffsetMs + seed.lifetimeMs * 0.25, 1120, 502);
    const middle = sampleGlowingMote(seed, seed.phaseOffsetMs + seed.lifetimeMs * 0.5, 1120, 502);

    expect(middle.y).toBeLessThan(early.y);
    expect(Math.max(early.alpha, middle.alpha)).toBeGreaterThan(0.3);
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

    expect(nearEnd.alpha).toBeLessThan(0.16);
    expect(respawned.y).toBeGreaterThan(502 * 0.72);
  });
});
