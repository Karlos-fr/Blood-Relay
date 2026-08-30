import { describe, expect, it } from 'vitest';
import {
  getHeartbeatIntensity,
  getLedIntensity,
  getLoopProgress,
  samplePolyline,
} from './ArenaBackdropAnimation';

describe('ArenaBackdropAnimation helpers', () => {
  it('produces a double heartbeat with a quiet pause', () => {
    const firstBeat = getHeartbeatIntensity(0);
    const secondBeat = getHeartbeatIntensity(220);
    const pause = getHeartbeatIntensity(900);
    expect(firstBeat).toBeGreaterThan(0.8);
    expect(secondBeat).toBeGreaterThan(0.55);
    expect(pause).toBeLessThan(0.25);
  });

  it('loops normalized progress', () => {
    expect(getLoopProgress(250, 1000)).toBeCloseTo(0.25);
    expect(getLoopProgress(1250, 1000)).toBeCloseTo(0.25);
  });

  it('samples a point along a polyline by distance', () => {
    const point = samplePolyline(
      [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
      ],
      0.75,
    );
    expect(point.x).toBeCloseTo(100);
    expect(point.y).toBeCloseTo(50);
  });

  it('gives leds phase-shifted blinking cycles', () => {
    expect(getLedIntensity(100, 0)).not.toBe(getLedIntensity(100, 1));
  });
});
