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
  });

  it('positions the relay above screen center while keeping it fully visible', () => {
    const layout = buildArenaBackdropLayout(1120, 502, 'arena-01');
    expect(layout.machine.x).toBe(560);
    expect(layout.machine.y).toBe(228);
    expect(layout.machine.radius).toBeGreaterThanOrEqual(105);
    expect(layout.machine.y - layout.machine.radius).toBeGreaterThanOrEqual(20);
    expect(layout.machine.y + layout.machine.radius).toBeLessThan(502);
  });

  it('uses four lateral feeds and two balanced feeds from the ceiling', () => {
    const layout = buildArenaBackdropLayout(1120, 502, 'arena-01');
    const lateral = layout.pipes.filter((pipe) => {
      const start = pipe.points[0];
      return start.x < 0 || start.x > 1120;
    });
    const ceiling = layout.pipes.filter((pipe) => pipe.points[0].y < 0);

    expect(layout.pipes).toHaveLength(6);
    expect(lateral).toHaveLength(4);
    expect(ceiling).toHaveLength(2);

    const ceilingStarts = ceiling.map((pipe) => pipe.points[0]).sort((a, b) => a.x - b.x);
    expect(ceilingStarts[0].x + ceilingStarts[1].x).toBeCloseTo(1120, 6);
    expect(ceilingStarts[0].y).toBe(ceilingStarts[1].y);
  });

  it('gives every pipe at least one large sharp ninety-degree elbow', () => {
    const layout = buildArenaBackdropLayout(1120, 502, 'arena-01');

    for (const pipe of layout.pipes) {
      expect(pipe.points.length).toBeGreaterThanOrEqual(3);
      expect('cornerRadius' in pipe).toBe(true);
      if ('cornerRadius' in pipe) expect(pipe.cornerRadius).toBe(0);

      let elbowCount = 0;
      for (let index = 1; index < pipe.points.length - 1; index += 1) {
        const previous = pipe.points[index - 1];
        const current = pipe.points[index];
        const next = pipe.points[index + 1];
        const incomingHorizontal = previous.y === current.y && previous.x !== current.x;
        const incomingVertical = previous.x === current.x && previous.y !== current.y;
        const outgoingHorizontal = current.y === next.y && current.x !== next.x;
        const outgoingVertical = current.x === next.x && current.y !== next.y;
        const isRightAngle =
          (incomingHorizontal && outgoingVertical) || (incomingVertical && outgoingHorizontal);

        expect(isRightAngle).toBe(true);
        const incomingLength = Math.hypot(current.x - previous.x, current.y - previous.y);
        const outgoingLength = Math.hypot(next.x - current.x, next.y - current.y);
        expect(Math.min(incomingLength, outgoingLength)).toBeGreaterThanOrEqual(48);
        elbowCount += 1;
      }
      expect(elbowCount).toBeGreaterThanOrEqual(1);
    }
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
});
