import { describe, expect, it } from 'vitest';
import { ACCESSORY_IDS, PALETTE_IDS, WEAPON_IDS } from './CharacterAppearance';
import { CHARACTER_PALETTES } from './characterPalettes';
import { getAllCharacterModules, resolveAppearanceModules } from './characterModuleCatalog';
import { PLAYER_APPEARANCES } from './deterministicCharacter';
import { ACCESSORY_MODULES } from './modules/accessories';
import { WEAPON_MODULES } from './modules/weapons';

describe('complete character module catalog', () => {
  it('implements all accessories and the one placeholder weapon', () => {
    expect(Object.keys(ACCESSORY_MODULES).sort()).toEqual([...ACCESSORY_IDS].sort());
    expect(Object.keys(WEAPON_MODULES).sort()).toEqual([...WEAPON_IDS].sort());
  });

  it('uses palette roles available in every palette for every authored view', () => {
    const roles = new Set(Object.keys(CHARACTER_PALETTES[PALETTE_IDS[0]]));
    for (const module of getAllCharacterModules()) {
      for (const piece of module.pieces) {
        for (const view of [piece.views.right, piece.views.left, piece.views.back]) {
          if (!view) continue;
          for (const primitive of view) expect(roles.has(primitive.role)).toBe(true);
        }
      }
    }
  });

  it('expands P1/P2 into different module sets and keeps weapon separate', () => {
    const p1 = resolveAppearanceModules(PLAYER_APPEARANCES[1]);
    const p2 = resolveAppearanceModules(PLAYER_APPEARANCES[2]);
    expect(p1.map((module) => module.id)).not.toEqual(p2.map((module) => module.id));
    expect(p1.filter((module) => module.id === 'relay-pistol')).toHaveLength(1);
  });
});
