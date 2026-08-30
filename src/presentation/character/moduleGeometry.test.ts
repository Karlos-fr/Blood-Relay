import { describe, expect, it } from 'vitest';
import { calculateGeometryBounds, mirrorGeometry, resolveModuleGeometry } from './moduleGeometry';

describe('procedural module geometry', () => {
  const right = [
    { kind: 'rect' as const, x: 1, y: -2, width: 3, height: 2, role: 'cloth' as const },
    { kind: 'pixels' as const, points: [[4, 1] as const], role: 'accent' as const },
  ];

  it('mirrors integer pixel geometry around x=0', () => {
    expect(mirrorGeometry(right)).toEqual([
      { kind: 'rect', x: -3, y: -2, width: 3, height: 2, role: 'cloth' },
      { kind: 'pixels', points: [[-4, 1]], role: 'accent' },
    ]);
  });

  it('prefers an explicit left override', () => {
    const piece = {
      id: 'fixture',
      slot: 'head' as const,
      anchor: 'head' as const,
      views: {
        right,
        left: [
          { kind: 'rect' as const, x: -5, y: 0, width: 1, height: 1, role: 'accent' as const },
        ],
      },
    };
    expect(resolveModuleGeometry(piece, 'left')).toEqual(piece.views.left);
  });

  it('reserves back without inventing missing art', () => {
    const piece = {
      id: 'fixture',
      slot: 'head' as const,
      anchor: 'head' as const,
      views: { right },
    };
    expect(resolveModuleGeometry(piece, 'back')).toBeNull();
  });

  it('calculates inclusive bounds', () => {
    expect(calculateGeometryBounds(right)).toEqual({ minX: 1, minY: -2, maxX: 4, maxY: 1 });
  });
});
