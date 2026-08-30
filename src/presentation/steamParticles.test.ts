import { describe, expect, it } from 'vitest';
import { buildSteamParticleSeeds, sampleSteamParticle } from './steamParticles';

describe('steam particle system', () => {
  it('builds varied deterministic particles instead of identical bubbles', () => {
    const first = buildSteamParticleSeeds(14);
    const second = buildSteamParticleSeeds(14);

    expect(second).toEqual(first);
    expect(new Set(first.map((particle) => particle.lateralDrift)).size).toBeGreaterThan(5);
    expect(new Set(first.map((particle) => particle.startScale)).size).toBeGreaterThan(4);
    expect(new Set(first.map((particle) => particle.lifetimeMs)).size).toBeGreaterThan(4);
  });

  it('rises, disperses, grows and fades during its lifetime', () => {
    const seed = buildSteamParticleSeeds(1)[0];
    const middle = sampleSteamParticle(seed, seed.lifetimeMs * 0.5);

    expect(middle.visible).toBe(true);
    expect(middle.y).toBeLessThan(-20);
    expect(Math.abs(middle.x)).toBeGreaterThan(0.5);
    expect(middle.scale).toBeGreaterThan(seed.startScale);
    expect(middle.alpha).toBeGreaterThan(0.2);
  });

  it('fully hides a particle after its lifetime', () => {
    const seed = buildSteamParticleSeeds(1)[0];
    const expired = sampleSteamParticle(seed, seed.lifetimeMs + 1);

    expect(expired.visible).toBe(false);
    expect(expired.alpha).toBe(0);
  });
});
