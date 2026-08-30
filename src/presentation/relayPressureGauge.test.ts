import { describe, expect, it } from 'vitest';
import { createGaugeNeedleState, stepGaugeNeedle } from './relayPressureGauge';

describe('relay pressure gauge', () => {
  it('lags behind a sudden pressure increase instead of snapping to target', () => {
    const state = createGaugeNeedleState();

    stepGaugeNeedle(state, 0.8, 0.016);

    expect(state.position).toBeGreaterThan(0);
    expect(state.position).toBeLessThan(0.8);
    expect(state.velocity).toBeGreaterThan(0);
  });

  it('stays bounded and settles near the requested pressure', () => {
    const state = createGaugeNeedleState();

    for (let index = 0; index < 240; index += 1) {
      stepGaugeNeedle(state, 0.72, 0.016);
    }

    expect(state.position).toBeGreaterThanOrEqual(0);
    expect(state.position).toBeLessThanOrEqual(1);
    expect(state.position).toBeCloseTo(0.72, 2);
    expect(Math.abs(state.velocity)).toBeLessThan(0.03);
  });

  it('falls with inertia when pressure is released', () => {
    const state = createGaugeNeedleState();
    for (let index = 0; index < 180; index += 1) {
      stepGaugeNeedle(state, 0.9, 0.016);
    }

    const beforeRelease = state.position;
    stepGaugeNeedle(state, 0.05, 0.016);

    expect(state.position).toBeLessThanOrEqual(beforeRelease);
    expect(state.position).toBeGreaterThan(0.05);
  });
});
