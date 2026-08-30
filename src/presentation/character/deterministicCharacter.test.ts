import { describe, expect, it } from 'vitest';
import {
  ACCESSORY_IDS,
  ARMOR_IDS,
  ARMS_IDS,
  BODY_IDS,
  HEAD_IDS,
  LEGS_IDS,
  MUTATION_IDS,
  PALETTE_IDS,
  TORSO_IDS,
  WEAPON_IDS,
} from './CharacterAppearance';
import {
  buildCharacterAppearance,
  PLAYER_APPEARANCES,
  PREVIEW_APPEARANCES,
} from './deterministicCharacter';

describe('deterministic procedural character appearance', () => {
  it('rebuilds the same appearance from the same seed', () => {
    expect(buildCharacterAppearance(0x1234abcd)).toEqual(buildCharacterAppearance(0x1234abcd));
  });

  it('only selects valid ids', () => {
    const appearance = buildCharacterAppearance(0x0badcafe);
    expect(HEAD_IDS).toContain(appearance.head);
    expect(TORSO_IDS).toContain(appearance.torso);
    expect(LEGS_IDS).toContain(appearance.legs);
    expect(ARMS_IDS).toContain(appearance.arms);
    expect(WEAPON_IDS).toContain(appearance.weapon);
    expect(PALETTE_IDS).toContain(appearance.palette);
    expect(appearance.accessories.every((id) => ACCESSORY_IDS.includes(id))).toBe(true);
  });

  it('selects valid body, armor, and mutation ids', () => {
    const appearance = buildCharacterAppearance(0x0badcafe);
    expect(BODY_IDS).toContain(appearance.body);
    expect(ARMOR_IDS).toContain(appearance.armor);
    expect(MUTATION_IDS).toContain(appearance.mutation);
  });

  it('provides clone, mercenary, mutant, and mixed preview appearances', () => {
    expect(Object.keys(PREVIEW_APPEARANCES)).toEqual(['clone', 'mercenary', 'mutant', 'mixed']);
    expect(new Set(Object.values(PREVIEW_APPEARANCES).map((value) => value.seed)).size).toBe(4);
  });

  it('keeps the fixed prototype fighters materially different', () => {
    const p1 = PLAYER_APPEARANCES[1];
    const p2 = PLAYER_APPEARANCES[2];
    expect(p1.head).not.toBe(p2.head);
    expect(p1.torso).not.toBe(p2.torso);
    expect(p1.palette).not.toBe(p2.palette);
    expect(p1.accessories).not.toEqual(p2.accessories);
  });
});
