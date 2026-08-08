import { describe, expect, test } from 'vitest';
import {
  crossbowWeapon,
  grenadeWeapon,
  perforantWeapon,
  machetteWeapon,
  revolverWeapon,
  shotgunWeapon,
  sawWeapon,
  smgWeapon,
  weaponRegistry,
} from '../gameplay/combat/weapons';
import { Weapon } from '../gameplay/combat/Weapon';

describe('Configuration des armes', () => {
  const assertWeaponStats = (weapon: Weapon): void => {
    expect(weapon.config.id, `ID manquant pour ${weapon.config.label}`).toBeTruthy();
    expect(weapon.config.label, `Libellé manquant pour ${weapon.config.id}`).toBeTruthy();

    expect(weapon.config.damage, `Dégâts invalides pour ${weapon.config.id}`).toBeGreaterThan(0);
    expect(weapon.config.cooldownMs, `Temps de recharge invalide pour ${weapon.config.id}`).toBeGreaterThan(0);
    expect(weapon.config.recoilForce, `Recul invalide pour ${weapon.config.id}`).toBeGreaterThan(0);

    expect(weapon.config.projectile.speed, `Vitesse de projectile invalide pour ${weapon.config.id}`).toBeGreaterThan(0);
    expect(weapon.config.projectile.damage, `Dégâts de projectile invalides pour ${weapon.config.id}`).toBeGreaterThan(0);

    expect(weapon.muzzleFlashMs, `Muzzle flash absent pour ${weapon.config.id}`).toBeGreaterThan(0);
    expect(weapon.muzzleFlashLengthPx, `Longueur muzzle flash invalide pour ${weapon.config.id}`).toBeGreaterThan(0);
    expect(weapon.muzzleFlashHeightPx, `Hauteur muzzle flash invalide pour ${weapon.config.id}`).toBeGreaterThan(0);
    expect(weapon.projectileTexture, `Texture de projectile manquante pour ${weapon.config.id}`).toBeTruthy();
    expect(weapon.muzzleFlashTexture, `Texture muzzle flash manquante pour ${weapon.config.id}`).toBeTruthy();
    expect(weapon.iconTexture, `Icône d’arme manquante pour ${weapon.config.id}`).toBeTruthy();
    expect(weapon.muzzleFlashAnimation, `Animation de flash d’arme manquante pour ${weapon.config.id}`).toBeTruthy();
  };

  test('arme principale et arme secondaire sont présentes', () => {
    expect(revolverWeapon.config.id).toBe('revolver');
    expect(shotgunWeapon.config.id).toBe('shotgun');
    expect(smgWeapon.config.id).toBe('smg');
    expect(crossbowWeapon.config.id).toBe('crossbow');
    expect(grenadeWeapon.config.id).toBe('grenade');
    expect(perforantWeapon.config.id).toBe('perforant');
    expect(sawWeapon.config.id).toBe('canon-scie');
    expect(machetteWeapon.config.id).toBe('machette');
    expect(weaponRegistry).toEqual(
      expect.arrayContaining([
        revolverWeapon,
        shotgunWeapon,
        smgWeapon,
        crossbowWeapon,
        grenadeWeapon,
        perforantWeapon,
        sawWeapon,
        machetteWeapon,
      ]),
    );
  });

  test('la machette est une arme de mêlée', () => {
    expect(machetteWeapon.config.combatMode).toBe('melee');
    expect(machetteWeapon.config.melee).toBeTruthy();
    expect(machetteWeapon.config.melee?.damage).toBeGreaterThan(0);
    expect(machetteWeapon.config.melee?.rangeWidth).toBeGreaterThan(0);
    expect(machetteWeapon.config.melee?.rangeHeight).toBeGreaterThan(0);
    expect(machetteWeapon.config.melee?.rangeOffset).toBeGreaterThan(0);
    expect(machetteWeapon.config.melee?.knockback).toBeGreaterThan(0);
    expect(machetteWeapon.config.melee?.cooldownMs).toBeGreaterThan(0);
    expect(machetteWeapon.config.melee?.comboMax).toBeGreaterThan(1);
    expect(machetteWeapon.config.melee?.comboDamageMultiplier?.length).toBe(3);
    expect(machetteWeapon.config.melee?.comboDamageMultiplier?.[0]).toBeGreaterThanOrEqual(1);
    expect(machetteWeapon.config.melee?.parryWindowMs).toBeGreaterThan(0);
    expect(machetteWeapon.config.melee?.parryCooldownMs).toBeGreaterThan(0);
    expect(machetteWeapon.config.melee?.dashSpeed).toBeGreaterThan(0);
    expect(machetteWeapon.config.melee?.dashDurationMs).toBeGreaterThan(0);
  });

  test('la grenade est une arme explosive', () => {
    expect(grenadeWeapon.config.projectile.explosionRadiusPx).toBeGreaterThan(0);
    expect(grenadeWeapon.config.projectile.explosionDamage).toBeGreaterThan(0);
    expect(grenadeWeapon.config.projectile.explosionKnockback).toBeGreaterThan(0);
    expect(grenadeWeapon.config.projectile.explosionDelayMs).toBeGreaterThan(0);
    expect(grenadeWeapon.config.projectile.explosionPoolCount).toBeGreaterThan(0);
    expect(grenadeWeapon.config.projectileBehavior).toBe('arc');
    expect(grenadeWeapon.config.damage).toBeLessThan(60);
  });

  test('le fusil perforant est perforant', () => {
    expect(perforantWeapon.config.projectileBehavior).toBe('straight');
    expect(perforantWeapon.config.projectile.maxPlayerHits).toBeGreaterThan(1);
    expect(perforantWeapon.config.wallInteraction).toBe('passThrough');
    expect(perforantWeapon.config.projectile.damage).toBeGreaterThan(30);
    expect(perforantWeapon.config.muzzleFlashMs).toBeGreaterThan(120);
    expect(perforantWeapon.projectileTexture).toBe('projectile-perforant');
    expect(perforantWeapon.iconTexture).toBe('weapon-icon-perforant');
  });

  test('le canon scié a un tir en salve courte', () => {
    expect(sawWeapon.config.projectile.pelletCount).toBeGreaterThan(1);
    expect(sawWeapon.config.projectile.spreadDegrees).toBeGreaterThan(40);
    expect(sawWeapon.config.projectile.maxRangePx).toBeLessThan(400);
    expect(sawWeapon.config.recoilForce).toBeGreaterThan(300);
    expect(sawWeapon.config.projectile.damage).toBeGreaterThan(10);
    expect(sawWeapon.projectileTexture).toBe('projectile-scie');
  });

  test('chaque arme suit un format commun', () => {
    weaponRegistry.forEach((weapon) => {
      assertWeaponStats(weapon);
    });
  });

  test('les identifiants des armes sont uniques', () => {
    const ids = weaponRegistry.map((weapon) => weapon.config.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
