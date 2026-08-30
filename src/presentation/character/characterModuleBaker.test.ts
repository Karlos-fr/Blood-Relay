import { describe, expect, it } from 'vitest';
import { buildModuleTextureKey } from './characterModuleBaker';

describe('module baker cache key', () => {
  it('distinguishes piece, palette and facing', () => {
    expect(buildModuleTextureKey('respirator:head', 'inmate-red', 'right')).toBe(
      'char:respirator:head:inmate-red:right',
    );
    expect(buildModuleTextureKey('respirator:head', 'inmate-red', 'left')).not.toBe(
      buildModuleTextureKey('respirator:head', 'inmate-red', 'right'),
    );
  });
});
