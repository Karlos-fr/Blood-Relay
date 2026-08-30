import { describe, expect, it } from 'vitest';
import { ARMS_IDS, HEAD_IDS, LEGS_IDS, TORSO_IDS } from './CharacterAppearance';
import { ARMS_MODULES } from './modules/arms';
import { HEAD_MODULES } from './modules/heads';
import { LEGS_MODULES } from './modules/legs';
import { TORSO_MODULES } from './modules/torsos';

describe('initial modular fighter body library', () => {
  it('implements every locked body id exactly once', () => {
    expect(Object.keys(HEAD_MODULES).sort()).toEqual([...HEAD_IDS].sort());
    expect(Object.keys(TORSO_MODULES).sort()).toEqual([...TORSO_IDS].sort());
    expect(Object.keys(LEGS_MODULES).sort()).toEqual([...LEGS_IDS].sort());
    expect(Object.keys(ARMS_MODULES).sort()).toEqual([...ARMS_IDS].sort());
  });

  it('splits legs and arms into rear/front pieces', () => {
    for (const module of Object.values(LEGS_MODULES)) {
      expect(module.pieces.map((piece) => piece.slot)).toEqual(['rearLeg', 'frontLeg']);
    }
    for (const module of Object.values(ARMS_MODULES)) {
      expect(module.pieces.map((piece) => piece.slot)).toEqual(['rearArm', 'frontArm']);
    }
  });
});
