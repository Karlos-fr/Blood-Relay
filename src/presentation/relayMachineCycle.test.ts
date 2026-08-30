import { describe, expect, it } from 'vitest';
import {
  RELAY_CAPACITY,
  RELAY_COOLDOWN_MS,
  RELAY_PRESSURE_THRESHOLD,
  RELAY_PRESSURIZE_MS,
  RELAY_PURGE_MS,
  createRelayMachineCycle,
  stepRelayMachineCycle,
} from './relayMachineCycle';

describe('relay machine cycle', () => {
  it('uses a quadruple-original reservoir and a longer dramatic pressure cycle', () => {
    expect(RELAY_CAPACITY).toBe(144);
    expect(RELAY_PRESSURIZE_MS).toBe(1000);
    expect(RELAY_PURGE_MS).toBe(2400);
    expect(RELAY_COOLDOWN_MS).toBe(1600);
  });

  it('fills from arriving blood and does not purge below the pressure threshold', () => {
    const state = createRelayMachineCycle();

    stepRelayMachineCycle(state, 16, Math.floor(RELAY_CAPACITY * 0.5));
    expect(state.phase).toBe('filling');
    expect(state.fill).toBeCloseTo(0.5, 2);
    expect(state.pressure).toBeGreaterThan(0.2);
    expect(state.pressure).toBeLessThan(0.9);
  });

  it('transitions filling -> pressurizing -> purging -> cooldown -> filling', () => {
    const state = createRelayMachineCycle();
    const thresholdArrivals = Math.ceil(RELAY_CAPACITY * RELAY_PRESSURE_THRESHOLD);

    stepRelayMachineCycle(state, 16, thresholdArrivals);
    expect(state.phase).toBe('pressurizing');

    stepRelayMachineCycle(state, RELAY_PRESSURIZE_MS + 20, 0);
    expect(state.phase).toBe('purging');
    const fillAtPurgeStart = state.fill;

    stepRelayMachineCycle(state, RELAY_PURGE_MS * 0.45, 0);
    expect(state.fill).toBeLessThan(fillAtPurgeStart);
    expect(state.phase).toBe('purging');

    stepRelayMachineCycle(state, RELAY_PURGE_MS * 0.65, 0);
    expect(state.phase).toBe('cooldown');
    expect(state.fill).toBeLessThanOrEqual(0.02);

    stepRelayMachineCycle(state, RELAY_COOLDOWN_MS + 100, 0);
    expect(state.phase).toBe('filling');
  });

  it('does not immediately retrigger a purge during cooldown', () => {
    const state = createRelayMachineCycle();
    const thresholdArrivals = Math.ceil(RELAY_CAPACITY * RELAY_PRESSURE_THRESHOLD);
    stepRelayMachineCycle(state, 16, thresholdArrivals);
    stepRelayMachineCycle(state, RELAY_PRESSURIZE_MS + 20, 0);
    stepRelayMachineCycle(state, RELAY_PURGE_MS + 100, 0);

    expect(state.phase).toBe('cooldown');
    stepRelayMachineCycle(state, 200, RELAY_CAPACITY);
    expect(state.phase).toBe('cooldown');
  });
});
