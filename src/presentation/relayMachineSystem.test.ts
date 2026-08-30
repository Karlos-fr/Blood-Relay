import { describe, expect, it } from 'vitest';
import { createRelayMachineSimulation } from './relayMachineSystem';

describe('relay machine simulation', () => {
  it('turns accepted pipe arrivals into stored blood and pressure', () => {
    const simulation = createRelayMachineSimulation();

    for (let index = 0; index < 18; index += 1) {
      expect(simulation.acceptBlood({ x: 40, y: 0 }, { x: -24, y: index * 0.1 })).toBe(true);
    }
    simulation.update(16);

    expect(simulation.cycle.fill).toBeCloseTo(0.5, 2);
    expect(simulation.reservoir.particles.filter((particle) => particle.active)).toHaveLength(18);
    expect(simulation.cycle.pressure).toBeGreaterThan(0.2);
  });

  it('drives the gauge toward pressure and then drains blood during purge', () => {
    const simulation = createRelayMachineSimulation();

    for (let index = 0; index < 32; index += 1) {
      simulation.acceptBlood({ x: index % 2 === 0 ? 40 : -40, y: (index % 7) - 3 }, {
        x: index % 2 === 0 ? -22 : 22,
        y: (index % 5) - 2,
      });
    }
    simulation.update(16);
    expect(simulation.cycle.phase).toBe('pressurizing');

    for (let frame = 0; frame < 58; frame += 1) simulation.update(16);
    expect(simulation.cycle.phase).toBe('purging');
    expect(simulation.gauge.position).toBeGreaterThan(0.5);

    const fillAtPurgeStart = simulation.cycle.fill;
    let peakBoost = 0;
    for (let frame = 0; frame < 30; frame += 1) {
      simulation.update(16);
      peakBoost = Math.max(peakBoost, simulation.getPurgeBoost());
    }

    expect(simulation.cycle.fill).toBeLessThan(fillAtPurgeStart);
    expect(peakBoost).toBeGreaterThan(0.3);
  });
});
