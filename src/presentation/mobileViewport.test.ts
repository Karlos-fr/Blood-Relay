import { describe, expect, it } from 'vitest';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/game';
import { calculateContainedViewport, selectViewportSize } from './mobileViewport';

describe('calculateContainedViewport', () => {
  it('centers a 16:9 arena inside a wider landscape viewport', () => {
    const viewport = calculateContainedViewport(932, 430, GAME_WIDTH, GAME_HEIGHT);

    expect(viewport.height).toBeCloseTo(430);
    expect(viewport.width).toBeCloseTo(764.4444, 3);
    expect(viewport.x).toBeCloseTo(83.7778, 3);
    expect(viewport.y).toBeCloseTo(0);
    expect(viewport.zoom).toBeCloseTo(430 / 540);
  });

  it('centers the arena vertically in portrait without cropping it', () => {
    const viewport = calculateContainedViewport(390, 844, GAME_WIDTH, GAME_HEIGHT);

    expect(viewport.width).toBeCloseTo(390);
    expect(viewport.height).toBeCloseTo(219.375);
    expect(viewport.x).toBeCloseTo(0);
    expect(viewport.y).toBeCloseTo(312.3125);
    expect(viewport.zoom).toBeCloseTo(390 / 960);
  });
});

describe('selectViewportSize', () => {
  it('prefers VisualViewport when standalone iOS still exposes stale inner dimensions', () => {
    expect(selectViewportSize(844, 390, 390, 844)).toEqual({
      width: 844,
      height: 390,
    });
  });

  it('falls back to inner dimensions when VisualViewport is unavailable', () => {
    expect(selectViewportSize(undefined, undefined, 844, 390)).toEqual({
      width: 844,
      height: 390,
    });
  });
});
