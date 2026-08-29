import { describe, expect, it } from 'vitest';
import { buildArenaBackdropLayout } from './ProceduralArenaBackdrop';

describe('buildArenaBackdropLayout', () => {
  it('is deterministic for the same seed', () => {
    const first = buildArenaBackdropLayout(960, 502, 'arena-01');
    const second = buildArenaBackdropLayout(960, 502, 'arena-01');

    expect(second).toEqual(first);
  });

  it('changes decorative layout when the seed changes', () => {
    const first = buildArenaBackdropLayout(960, 502, 'arena-01');
    const second = buildArenaBackdropLayout(960, 502, 'arena-02');

    expect(second.panels).not.toEqual(first.panels);
    expect(second.pipes).not.toEqual(first.pipes);
  });

  it('keeps the relay machine centered and inside the upper half of the arena', () => {
    const layout = buildArenaBackdropLayout(960, 502, 'arena-01');

    expect(layout.machine.x).toBe(480);
    expect(layout.machine.y).toBeGreaterThan(70);
    expect(layout.machine.y).toBeLessThan(240);
    expect(layout.machine.radius).toBeGreaterThan(45);
  });

  it('creates a restrained amount of wall detail', () => {
    const layout = buildArenaBackdropLayout(960, 502, 'arena-01');

    expect(layout.panels.length).toBeGreaterThanOrEqual(12);
    expect(layout.panels.length).toBeLessThanOrEqual(28);
    expect(layout.pipes.length).toBeGreaterThanOrEqual(3);
    expect(layout.pipes.length).toBeLessThanOrEqual(7);
  });
});
