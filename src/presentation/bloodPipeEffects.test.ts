import { describe, expect, it } from 'vitest';
import { getBloodTrailProgresses } from './bloodPipeEffects';

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
});
