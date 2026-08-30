import { describe, expect, it } from 'vitest';
import { buildArenaBackdropLayout } from './ProceduralArenaBackdrop';

describe('buildArenaBackdropLayout', () => {
  it('is deterministic for the same seed', () => {
    const first = buildArenaBackdropLayout(1120, 502, 'arena-01');
    const second = buildArenaBackdropLayout(1120, 502, 'arena-01');
    expect(second).toEqual(first);
  });

  it('changes decorative layout when the seed changes', () => {
    const first = buildArenaBackdropLayout(1120, 502, 'arena-01');
    const second = buildArenaBackdropLayout(1120, 502, 'arena-02');
    expect(second.panels).not.toEqual(first.panels);
    expect(second.pipes).not.toEqual(first.pipes);
  });

  it('keeps the relay machine centered, imposing, and fully visible', () => {
    const layout = buildArenaBackdropLayout(1120, 502, 'arena-01');
    expect(layout.machine.x).toBe(560);
    expect(layout.machine.radius).toBeGreaterThanOrEqual(105);
    expect(layout.machine.y - layout.machine.radius).toBeGreaterThanOrEqual(20);
    expect(layout.machine.y + layout.machine.radius).toBeLessThan(320);
  });

  it('creates a restrained amount of wall detail', () => {
    const layout = buildArenaBackdropLayout(1120, 502, 'arena-01');
    expect(layout.panels.length).toBeGreaterThanOrEqual(12);
    expect(layout.panels.length).toBeLessThanOrEqual(28);
    expect(layout.pipes.length).toBeGreaterThanOrEqual(5);
    expect(layout.pipes.length).toBeLessThanOrEqual(8);
  });

  it('routes every blood-filled pipe into the relay machine', () => {
    const layout = buildArenaBackdropLayout(1120, 502, 'arena-01');
    for (const pipe of layout.pipes) {
      expect(pipe.accent).toBe('red');
      const end = pipe.points[pipe.points.length - 1];
      const distance = Math.hypot(end.x - layout.machine.x, end.y - layout.machine.y);
      expect(distance).toBeLessThanOrEqual(layout.machine.radius + 4);
    }
  });

  it('balances left and right pipe lanes instead of clustering one side', () => {
    const layout = buildArenaBackdropLayout(1120, 502, 'arena-01');
    const left = layout.pipes.filter((pipe) => pipe.points[0].x < 0);
    const right = layout.pipes.filter((pipe) => pipe.points[0].x > 1120);
    expect(Math.abs(left.length - right.length)).toBeLessThanOrEqual(1);
    const pairedCount = Math.min(left.length, right.length);
    for (let index = 0; index < pairedCount; index += 1) {
      expect(Math.abs(left[index].points[0].y - right[index].points[0].y)).toBeLessThanOrEqual(32);
    }
  });
});
