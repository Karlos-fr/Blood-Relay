import { describe, expect, it } from 'vitest';
import { didBloodParticleArrive, getBloodTrailProgresses } from './bloodPipeEffects';

describe('blood pipe effects', () => {
  it('places three delayed trail samples behind the blood core', () => {
    const trails = getBloodTrailProgresses(0.5, 3);

    expect(trails).toHaveLength(3);
    expect(trails[0]).toBeLessThan(0.5);
    expect(trails[1]).toBeLessThan(trails[0]);
    expect(trails[2]).toBeLessThan(trails[1]);
  });

  it('wraps delayed samples at the beginning of a closed progress cycle', () => {
    const trails = getBloodTrailProgresses(0.01, 3);

    expect(trails.every((progress) => progress >= 0 && progress < 1)).toBe(true);
    expect(trails[0]).toBeGreaterThan(0.9);
  });

  it('reports exactly one arrival when a blood core wraps from the pipe end to its start', () => {
    const progresses = [0.82, 0.94, 0.99, 0.03, 0.12, 0.4];
    let arrivals = 0;
    let previous: number | undefined;

    for (const progress of progresses) {
      if (didBloodParticleArrive(previous, progress)) arrivals += 1;
      previous = progress;
    }

    expect(arrivals).toBe(1);
    expect(didBloodParticleArrive(undefined, 0.02)).toBe(false);
    expect(didBloodParticleArrive(0.4, 0.45)).toBe(false);
  });
});
