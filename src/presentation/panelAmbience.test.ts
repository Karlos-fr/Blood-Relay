import { describe, expect, it } from 'vitest';
import { selectPanelAmbienceTargets } from './panelAmbience';

const panels = Array.from({ length: 20 }, (_, index) => ({
  x: 50 + index * 40,
  y: 60 + (index % 4) * 90,
  width: 180,
  height: 110,
}));

describe('panel ambience', () => {
  it('selects no more than three deterministic wall panels', () => {
    const first = selectPanelAmbienceTargets(panels);
    const second = selectPanelAmbienceTargets(panels);

    expect(first.length).toBeGreaterThan(0);
    expect(first.length).toBeLessThanOrEqual(3);
    expect(second).toEqual(first);
    expect(new Set(first.map((target) => target.index)).size).toBe(first.length);
  });
});
