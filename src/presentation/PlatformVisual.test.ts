import { describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({ default: {} }));

import * as platformVisual from './PlatformVisual';

describe('platform visual depth', () => {
  it('uses a shallow subtle shadow without affecting collision geometry', () => {
    const config = platformVisual.PLATFORM_SHADOW_CONFIG;

    expect(config.offsetY).toBeGreaterThanOrEqual(6);
    expect(config.offsetY).toBeLessThanOrEqual(8);
    expect(config.nearAlpha).toBeGreaterThan(0);
    expect(config.nearAlpha).toBeLessThan(0.25);
    expect(config.farAlpha).toBeGreaterThan(0);
    expect(config.farAlpha).toBeLessThan(config.nearAlpha);
  });
});
