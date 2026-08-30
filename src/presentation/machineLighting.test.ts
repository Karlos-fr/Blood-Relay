import { describe, expect, it } from 'vitest';
import { buildMachineLightPlacements, getMachineLightAlpha } from './machineLighting';

describe('machine lighting', () => {
  it('uses a few localized light patches instead of one broad halo', () => {
    const placements = buildMachineLightPlacements({ x: 560, y: 142, radius: 110 });

    expect(placements.length).toBeGreaterThanOrEqual(3);
    expect(placements.length).toBeLessThanOrEqual(5);
    expect(placements.every((light) => light.scaleX !== light.scaleY)).toBe(true);
  });

  it('brightens reflected light with heartbeat intensity', () => {
    const quiet = getMachineLightAlpha(0.08, 0.08);
    const beat = getMachineLightAlpha(0.08, 1);

    expect(quiet).toBeGreaterThan(0);
    expect(beat).toBeGreaterThan(quiet * 2);
    expect(beat).toBeLessThan(0.2);
  });
});
