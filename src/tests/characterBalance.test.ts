import { describe, expect, test } from 'vitest';
import { CHARACTER_PROFILES, type CharacterProfile } from '../app/config/characters';

describe('Équilibrage des personnages', () => {
  const spreadLimitMs = {
    moveSpeed: 35,
    acceleration: 160,
    jumpStrength: 45,
    dodgeSpeed: 90,
    dodgeDurationMs: 30,
    dodgeCooldownMs: 150,
    drag: 450,
    maxFallSpeed: 160,
    maxHealth: 20,
    maxBloodReserve: 70,
    transfusionCooldownMs: 260,
    transfusionDurationMs: 120,
    transfusionUnitsPerSecond: 14,
    transfusionHealingMultiplier: 0.35,
    meleeCooldownMs: 120,
    meleeDurationMs: 40,
    meleeWindupMs: 20,
    hemorrhageCriticalHealthThreshold: 10,
    hemorrhageLossUnitsPerSecond: 0.7,
    interactionCooldownMs: 90,
  } as const;

  test('chaque personnage dispose de quatre palettes', () => {
    const invalidProfile = CHARACTER_PROFILES.find((profile) => profile.paletteVariants.length !== 4);

    expect(CHARACTER_PROFILES.length).toBeGreaterThanOrEqual(5);
    expect(invalidProfile, `Le profil ${invalidProfile?.id ?? 'inconnu'} n'a pas 4 palettes`).toBeUndefined();
  });

  test('les écarts statistiques restent raisonnables', () => {
    const keys = Object.keys(spreadLimitMs) as Array<keyof typeof spreadLimitMs>;

    keys.forEach((statKey) => {
      const values = CHARACTER_PROFILES.map((profile) => profile[statKey] as number);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const spread = max - min;

      expect(spread, `Écart trop important pour ${statKey}`).toBeLessThanOrEqual(spreadLimitMs[statKey]);
    });
  });

  test('aucun personnage n\'est strictement dominant sur les statistiques clés', () => {
    const keyMetrics: Array<{ key: keyof CharacterProfile; higherIsBetter: boolean }> = [
      { key: 'moveSpeed', higherIsBetter: true },
      { key: 'acceleration', higherIsBetter: true },
      { key: 'jumpStrength', higherIsBetter: true },
      { key: 'maxHealth', higherIsBetter: true },
      { key: 'maxBloodReserve', higherIsBetter: true },
      { key: 'transfusionUnitsPerSecond', higherIsBetter: true },
      { key: 'transfusionHealingMultiplier', higherIsBetter: true },
      { key: 'hemorrhageLossUnitsPerSecond', higherIsBetter: false },
      { key: 'hemorrhageCriticalHealthThreshold', higherIsBetter: true },
    ];

    const strictlyDominant = CHARACTER_PROFILES.filter((profile) => {
      return keyMetrics.every((metric) => {
        const currentValue = profile[metric.key] as number;
        return CHARACTER_PROFILES.every((otherProfile) => {
          if (otherProfile.id === profile.id) {
            return true;
          }

          const otherValue = otherProfile[metric.key] as number;
          if (metric.higherIsBetter) {
            return currentValue >= otherValue;
          }
          return currentValue <= otherValue;
        });
      });
    });

    expect(
      strictlyDominant,
      `Ce personnage semble obligatoire car dominant sur toutes les métriques clés: ${strictlyDominant.map((value) => value.name).join(', ')}`,
    ).toHaveLength(0);
  });
});
