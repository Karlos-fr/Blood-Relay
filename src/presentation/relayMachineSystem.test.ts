import { describe, expect, it } from 'vitest';
import {
  RELAY_CAPACITY,
  RELAY_PRESSURE_THRESHOLD,
  RELAY_PRESSURIZE_MS,
  RELAY_PURGE_MS,
} from './relayMachineCycle';
import { createRelayMachineSimulation, getRelayPurgeDynamics } from './relayMachineSystem';

describe('relay machine simulation', () => {
  it('turns accepted pipe arrivals into stored blood and pressure', () => {
    const simulation = createRelayMachineSimulation();

    for (let index = 0; index < RELAY_CAPACITY / 2; index += 1) {
      expect(simulation.acceptBlood({ x: 40, y: 0 }, { x: -24, y: index * 0.05 })).toBe(true);
    }
    simulation.update(16);

    expect(simulation.cycle.fill).toBeCloseTo(0.5, 2);
    expect(simulation.reservoir.particles.filter((particle) => particle.active)).toHaveLength(
      RELAY_CAPACITY / 2,
    );
    expect(simulation.cycle.pressure).toBeGreaterThan(0.2);
  });

  it('uses a spin-first then suction-heavy purge profile', () => {
    const early = getRelayPurgeDynamics(0.25);
    const late = getRelayPurgeDynamics(0.85);

    expect(early.targetAngularVelocity).toBeGreaterThanOrEqual(7);
    expect(early.suctionStrength).toBeLessThanOrEqual(0.15);
    expect(early.fadeStrength).toBeLessThan(0.1);

    expect(late.targetAngularVelocity).toBeGreaterThan(early.targetAngularVelocity);
    expect(late.suctionStrength).toBeGreaterThan(0.65);
    expect(late.fadeStrength).toBeGreaterThan(0.4);
  });

  it('drives the gauge toward pressure and then drains blood during the longer purge', () => {
    const simulation = createRelayMachineSimulation();
    const thresholdArrivals = Math.ceil(RELAY_CAPACITY * RELAY_PRESSURE_THRESHOLD);

    for (let index = 0; index < thresholdArrivals; index += 1) {
      simulation.acceptBlood({ x: index % 2 === 0 ? 40 : -40, y: (index % 7) - 3 }, {
        x: index % 2 === 0 ? -22 : 22,
        y: (index % 5) - 2,
      });
    }
    simulation.update(16);
    expect(simulation.cycle.phase).toBe('pressurizing');

    const pressurizeFrames = Math.ceil(RELAY_PRESSURIZE_MS / 16) + 2;
    for (let frame = 0; frame < pressurizeFrames; frame += 1) simulation.update(16);
    expect(simulation.cycle.phase).toBe('purging');
    expect(simulation.gauge.position).toBeGreaterThan(0.5);

    const fillAtPurgeStart = simulation.cycle.fill;
    let peakBoost = 0;
    const earlyPurgeFrames = Math.ceil(RELAY_PURGE_MS * 0.35 / 16);
    for (let frame = 0; frame < earlyPurgeFrames; frame += 1) {
      simulation.update(16);
      peakBoost = Math.max(peakBoost, simulation.getPurgeBoost());
    }

    expect(simulation.cycle.phase).toBe('purging');
    expect(simulation.cycle.fill).toBeLessThan(fillAtPurgeStart);
    expect(peakBoost).toBeGreaterThan(0.3);
  });
});
