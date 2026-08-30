import { describe, expect, it } from 'vitest';
import {
  createReservoirState,
  getReservoirFill,
  injectReservoirParticle,
  stepReservoir,
} from './relayBloodReservoir';

describe('relay blood reservoir', () => {
  it('preallocates and enforces a bounded capacity of at most 36 particles', () => {
    const state = createReservoirState(36);

    expect(state.particles).toHaveLength(36);
    for (let index = 0; index < 36; index += 1) {
      expect(
        injectReservoirParticle(state, { x: 38, y: -8 }, { x: -18, y: index * 0.1 }),
      ).toBe(true);
    }
    expect(injectReservoirParticle(state, { x: 38, y: 0 }, { x: -18, y: 0 })).toBe(false);
    expect(getReservoirFill(state)).toBe(1);
  });

  it('injects deterministically with the requested entry position and velocity', () => {
    const state = createReservoirState();
    injectReservoirParticle(state, { x: -40, y: 6 }, { x: 22, y: -3 });

    const particle = state.particles[0];
    expect(particle.active).toBe(true);
    expect(particle.x).toBeCloseTo(-40);
    expect(particle.y).toBeCloseTo(6);
    expect(particle.vx).toBeCloseTo(22);
    expect(particle.vy).toBeCloseTo(-3);
  });

  it('applies gravity and keeps particles inside the circular chamber', () => {
    const state = createReservoirState();
    injectReservoirParticle(state, { x: 0, y: -10 }, { x: 180, y: 0 });

    stepReservoir(state, 0.2, { swirlStrength: 0, damping: 1 });

    const particle = state.particles[0];
    expect(particle.vy).toBeGreaterThan(0);
    expect(Math.hypot(particle.x, particle.y)).toBeLessThanOrEqual(
      state.chamberRadius - state.particleRadius + 0.001,
    );
  });

  it('pulls stored blood toward the center during a purge', () => {
    const state = createReservoirState();
    injectReservoirParticle(state, { x: 32, y: 0 }, { x: 0, y: 0 });
    const before = Math.hypot(state.particles[0].x, state.particles[0].y);

    for (let index = 0; index < 18; index += 1) {
      stepReservoir(state, 0.016, {
        gravityY: 0,
        damping: 1,
        swirlStrength: 0,
        purgeStrength: 1,
      });
    }

    const particle = state.particles[0];
    const after = particle.active ? Math.hypot(particle.x, particle.y) : 0;
    expect(after).toBeLessThan(before);
  });
});
