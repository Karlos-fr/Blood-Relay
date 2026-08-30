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

  it('keeps normal steam below the top-edge travel budget', () => {
    const seeds = buildSteamParticleSeeds(14);

    expect(seeds.every((seed) => seed.riseDistance >= 35 && seed.riseDistance <= 55)).toBe(true);
    expect(seeds.every((seed) => seed.lifetimeMs >= 600 && seed.lifetimeMs <= 900)).toBe(true);
  });

  it('biases the two vents away from the relay machine', () => {
    const seed = buildSteamParticleSeeds(1)[0];
    const age = seed.lifetimeMs * 0.55;
    const left = sampleSteamParticle(seed, age, -1);
    const right = sampleSteamParticle(seed, age, 1);

    expect(left.visible).toBe(true);
    expect(right.visible).toBe(true);
    expect(left.x).toBeLessThan(0);
    expect(right.x).toBeGreaterThan(0);
  });

  it('makes purge steam dramatically larger, brighter and farther travelling', () => {
    const seed = buildSteamParticleSeeds(1)[0];
    const age = seed.lifetimeMs * 0.5;
    const normal = sampleSteamParticle(seed, age, 1, 0);
    const boosted = sampleSteamParticle(seed, age, 1, 1);
    const omittedBoost = sampleSteamParticle(seed, age, 1);

    expect(omittedBoost).toEqual(normal);
    expect(boosted.alpha).toBeGreaterThan(normal.alpha * 1.8);
    expect(boosted.scale).toBeGreaterThan(normal.scale * 1.65);
    expect(boosted.x - normal.x).toBeGreaterThanOrEqual(28);
    expect(Math.abs(boosted.y)).toBeGreaterThan(Math.abs(normal.y) * 1.55);
  });

  it('keeps boosted purge steam alive longer than normal steam', () => {
    const seed = buildSteamParticleSeeds(1)[0];
    const age = seed.lifetimeMs * 1.22;

    expect(sampleSteamParticle(seed, age, 1, 0).visible).toBe(false);
    expect(sampleSteamParticle(seed, age, 1, 1).visible).toBe(true);
  });

  it('rises, disperses, grows and fades during its normal lifetime', () => {
    const seed = buildSteamParticleSeeds(1)[0];
    const middle = sampleSteamParticle(seed, seed.lifetimeMs * 0.5, 1);

    expect(middle.visible).toBe(true);
    expect(middle.y).toBeLessThan(-15);
    expect(Math.abs(middle.x)).toBeGreaterThan(0.5);
    expect(middle.scale).toBeGreaterThan(seed.startScale);
    expect(middle.alpha).toBeGreaterThan(0.2);
  });

  it('fully hides a normal particle after its lifetime', () => {
    const seed = buildSteamParticleSeeds(1)[0];
    const expired = sampleSteamParticle(seed, seed.lifetimeMs + 1, 1);

    expect(expired.visible).toBe(false);
    expect(expired.alpha).toBe(0);
  });
});
