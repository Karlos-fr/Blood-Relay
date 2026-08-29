import { describe, expect, it } from 'vitest';
import { buildRoundedOrthogonalPath, sampleRoundedPath } from './pipeGeometry';

describe('rounded pipe geometry', () => {
  it('replaces a 90 degree corner with a real quarter-circle elbow', () => {
    const path = buildRoundedOrthogonalPath(
      [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 80 },
      ],
      12,
    );

    const arcs = path.filter((segment) => segment.kind === 'arc');
    expect(arcs).toHaveLength(1);
    expect(arcs[0]).toMatchObject({ radius: 12 });
    expect(path[0]).toMatchObject({ kind: 'line', to: { x: 88, y: 0 } });
    expect(path[path.length - 1]).toMatchObject({ kind: 'line', from: { x: 100, y: 12 } });
  });

  it('clamps the elbow radius when adjacent segments are short', () => {
    const path = buildRoundedOrthogonalPath(
      [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
      ],
      12,
    );

    const arc = path.find((segment) => segment.kind === 'arc');
    expect(arc?.kind).toBe('arc');
    if (arc?.kind === 'arc') expect(arc.radius).toBeLessThanOrEqual(5);
  });

  it('samples the same rounded path used by the renderer', () => {
    const path = buildRoundedOrthogonalPath(
      [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
      ],
      10,
    );

    expect(sampleRoundedPath(path, 0)).toEqual({ x: 0, y: 0 });
    expect(sampleRoundedPath(path, 1)).toEqual({ x: 100, y: 100 });
    const midpoint = sampleRoundedPath(path, 0.5);
    expect(midpoint.x).toBeGreaterThan(90);
    expect(midpoint.y).toBeGreaterThanOrEqual(0);
  });
});
