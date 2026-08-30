import { describe, expect, it } from 'vitest';
import {
  RELAY_CAPACITY,
  createRelayMachineCycle,
  stepRelayMachineCycle,
} from './relayMachineCycle';

describe('relay machine cycle', () => {
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

    stepRelayMachineCycle(state, 16, 32);
    expect(state.phase).toBe('pressurizing');

    stepRelayMachineCycle(state, 820, 0);
    expect(state.phase).toBe('purging');
    const fillAtPurgeStart = state.fill;

    stepRelayMachineCycle(state, 600, 0);
    expect(state.fill).toBeLessThan(fillAtPurgeStart);
    expect(state.phase).toBe('purging');

    stepRelayMachineCycle(state, 700, 0);
    expect(state.phase).toBe('cooldown');
    expect(state.fill).toBeLessThanOrEqual(0.02);

    stepRelayMachineCycle(state, 1700, 0);
    expect(state.phase).toBe('filling');
  });

  it('does not immediately retrigger a purge during cooldown', () => {
    const state = createRelayMachineCycle();
    stepRelayMachineCycle(state, 16, 32);
    stepRelayMachineCycle(state, 820, 0);
    stepRelayMachineCycle(state, 1300, 0);

    expect(state.phase).toBe('cooldown');
    stepRelayMachineCycle(state, 200, RELAY_CAPACITY);
    expect(state.phase).toBe('cooldown');
  });
});
