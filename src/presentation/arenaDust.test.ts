import { describe, expect, it } from 'vitest';
import { buildDustSeeds, sampleDust } from './arenaDust';

describe('arena dust', () => {
  it('builds exactly sixteen deterministic particles for the arena', () => {
    const first = buildDustSeeds(1120, 502);
    const second = buildDustSeeds(1120, 502);

    expect(first).toHaveLength(16);
    expect(first.length).toBeLessThanOrEqual(20);
    expect(second).toEqual(first);
  });

  it('keeps slow particles wrapped inside arena bounds', () => {
    const seed = buildDustSeeds(1120, 502)[0];
    const sample = sampleDust(seed, 180_000, 1120, 502);

    expect(sample.x).toBeGreaterThanOrEqual(0);
    expect(sample.x).toBeLessThan(1120);
    expect(sample.y).toBeGreaterThanOrEqual(0);
    expect(sample.y).toBeLessThan(502);
    expect(sample.alpha).toBeGreaterThan(0);
    expect(sample.alpha).toBeLessThan(0.25);
  });
});
