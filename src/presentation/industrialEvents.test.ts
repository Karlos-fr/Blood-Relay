import { describe, expect, it } from 'vitest';
import { buildIndustrialEventSchedule } from './industrialEvents';

describe('industrial events', () => {
  it('builds a deterministic rare non-overlapping schedule', () => {
    const first = buildIndustrialEventSchedule('arena-01', 12);
    const second = buildIndustrialEventSchedule('arena-01', 12);

    expect(second).toEqual(first);
    expect(first).toHaveLength(12);

    for (let index = 1; index < first.length; index += 1) {
      const previousEnd = first[index - 1].startMs + first[index - 1].durationMs;
      const gap = first[index].startMs - previousEnd;
      expect(gap).toBeGreaterThanOrEqual(7000);
      expect(gap).toBeLessThanOrEqual(14000);
      expect(first[index].startMs).toBeGreaterThan(previousEnd);
    }
  });

  it('covers sparks, led glitches and secondary steam leaks', () => {
    const schedule = buildIndustrialEventSchedule('arena-01', 12);
    const types = new Set(schedule.map((event) => event.type));

    expect(types).toEqual(new Set(['spark', 'led-glitch', 'steam-leak']));
    expect(schedule.every((event) => event.durationMs >= 180 && event.durationMs <= 900)).toBe(true);
  });
});
