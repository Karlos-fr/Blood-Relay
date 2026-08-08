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

describe('Équilibrage des armes', () => {
  test('le revolver reste une arme principale', () => {
    expect(revolverWeapon.config.id).toBe('revolver');
    expect(revolverWeapon.config.damage).toBeGreaterThan(shotgunWeapon.config.damage);
    expect(revolverWeapon.config.cooldownMs).toBeLessThan(shotgunWeapon.config.cooldownMs);
    expect(revolverWeapon.config.recoilForce).toBeLessThan(shotgunWeapon.config.recoilForce);
    expect(revolverWeapon.config.projectile.maxRangePx).toBeGreaterThan(shotgunWeapon.config.projectile.maxRangePx);
    expect(revolverWeapon.config.projectile.maxPlayerHits).toBe(1);
  });

  test('le fusil à pompe reste une arme de salve', () => {
    expect(shotgunWeapon.config.id).toBe('shotgun');
    expect(shotgunWeapon.config.projectile.pelletCount).toBeGreaterThan(1);
    expect(shotgunWeapon.config.projectile.spreadDegrees).toBeGreaterThan(revolverWeapon.config.projectile.spreadDegrees ?? 0);
    expect(shotgunWeapon.config.bloodProjection?.particleCount).toBeGreaterThan(
      revolverWeapon.config.bloodProjection?.particleCount ?? 0,
    );
  });

  test('le pistolet-mitrailleur favorise un feu soutenu', () => {
    expect(smgWeapon.config.id).toBe('smg');
    expect(smgWeapon.config.damage).toBeLessThan(revolverWeapon.config.damage);
    expect(smgWeapon.config.damage).toBeLessThan(shotgunWeapon.config.damage);
    expect(smgWeapon.config.fireMode).toBe('automatic');
    expect(smgWeapon.config.projectile.spreadIncreaseDegrees ?? 0).toBeGreaterThan(0);
    expect(smgWeapon.config.projectile.trailIntervalMs ?? 0).toBeGreaterThan(0);
    expect(smgWeapon.config.projectile.spreadResetMs ?? 0).toBeGreaterThanOrEqual(80);
    expect(smgWeapon.config.cooldownMs).toBeLessThan(shotgunWeapon.config.cooldownMs);
  });

  test('l\'arbalète est un tir à trajectoire lente et persistante', () => {
    expect(crossbowWeapon.config.id).toBe('crossbow');
    expect(crossbowWeapon.config.projectileBehavior).toBe('arc');
    expect(crossbowWeapon.config.wallInteraction).toBe('passThrough');
    expect(crossbowWeapon.config.wallStickingMs ?? 0).toBeGreaterThan(200);
    expect(crossbowWeapon.config.projectile.speed).toBeLessThan(shotgunWeapon.config.projectile.speed);
    expect(crossbowWeapon.config.projectile.gravityScale ?? 0).toBeGreaterThan(0);
    expect(crossbowWeapon.projectileTexture).toBe('projectile-crossbow');
  });

  test('chaque arme a des profils complets', () => {
    weaponRegistry.forEach((weapon) => {
      expect(weapon.config.projectile.maxRangePx, `Portée absente pour ${weapon.config.id}`).toBeTruthy();
      expect(weapon.config.projectile.maxPlayerHits, `Limite de cibles absente pour ${weapon.config.id}`).toBeGreaterThan(0);
      expect(weapon.config.wallInteraction, `Comportement décor absent pour ${weapon.config.id}`).toBeTruthy();
      expect(weapon.config.projectileBehavior, `Comportement trajectoire absent pour ${weapon.config.id}`).toBeTruthy();
      expect(weapon.config.bloodProjection?.spreadDegrees, `Projection absente pour ${weapon.config.id}`).toBeGreaterThan(0);
      expect(weapon.config.audio?.shoot?.length, `Son de tir absent pour ${weapon.config.id}`).toBeGreaterThan(0);
      expect(weapon.config.audio?.impact?.length, `Son d’impact absent pour ${weapon.config.id}`).toBeGreaterThan(0);
      expect(weapon.config.audio?.projection?.length, `Son de projection absent pour ${weapon.config.id}`).toBeGreaterThan(0);
    });
  });

  test('la machette privilégie la pression de mêlée', () => {
    expect(machetteWeapon.config.id).toBe('machette');
    expect(machetteWeapon.config.combatMode).toBe('melee');
    expect(machetteWeapon.config.melee).toBeTruthy();
    expect(machetteWeapon.config.melee?.cooldownMs).toBeLessThan(shotgunWeapon.config.cooldownMs);
    expect(machetteWeapon.config.melee?.damage).toBeGreaterThan(smgWeapon.config.damage);
    expect(machetteWeapon.config.melee?.comboMax).toBeGreaterThan(1);
    expect(machetteWeapon.config.melee?.comboDamageMultiplier?.length).toBeGreaterThan(1);
    expect(machetteWeapon.config.melee?.comboDamageMultiplier?.[1]).toBeGreaterThan(
      machetteWeapon.config.melee?.comboDamageMultiplier?.[0] ?? 0,
    );
    expect(machetteWeapon.config.melee?.parryWindowMs).toBeGreaterThan(100);
    expect(machetteWeapon.config.melee?.parryCooldownMs).toBeLessThan(1000);
    expect(machetteWeapon.config.bloodProjection?.particleCount).toBeGreaterThan(shotgunWeapon.config.bloodProjection?.particleCount ?? 0);
  });

  test('la grenade combine trajet courbe et projection', () => {
    expect(grenadeWeapon.config.id).toBe('grenade');
    expect(grenadeWeapon.config.combatMode).toBe('ranged');
    expect(grenadeWeapon.config.projectileBehavior).toBe('arc');
    expect(grenadeWeapon.config.projectile.explosionRadiusPx).toBeGreaterThan(80);
    expect(grenadeWeapon.config.projectile.explosionRadiusPx).toBeLessThan(260);
    expect(grenadeWeapon.config.projectile.explosionDelayMs).toBeGreaterThan(320);
    expect(grenadeWeapon.config.projectile.explosionDamage).toBeGreaterThan(20);
    expect(grenadeWeapon.config.projectile.explosionKnockback).toBeGreaterThan(180);
    expect(grenadeWeapon.config.projectile.explosionPoolCount).toBeGreaterThan(1);
  });

  test('le fusil perforant mise en valeur de la pénétration', () => {
    expect(perforantWeapon.config.id).toBe('perforant');
    expect(perforantWeapon.config.projectileBehavior).toBe('straight');
    expect(perforantWeapon.config.wallInteraction).toBe('passThrough');
    expect(perforantWeapon.config.projectile.maxPlayerHits).toBeGreaterThan(1);
    expect(perforantWeapon.config.damage).toBeGreaterThan(30);
    expect(perforantWeapon.config.cooldownMs).toBeGreaterThanOrEqual(350);
    expect(perforantWeapon.config.muzzleFlashMs).toBeGreaterThan(120);
    expect(perforantWeapon.config.projectile.maxRangePx).toBeGreaterThan(600);
  });

  test('le canon scié privilégie la pression courte et large', () => {
    expect(sawWeapon.config.id).toBe('canon-scie');
    expect(sawWeapon.config.projectile.pelletCount).toBeGreaterThan(1);
    expect(sawWeapon.config.projectile.spreadDegrees).toBeGreaterThan(40);
    expect(sawWeapon.config.projectile.maxRangePx).toBeLessThan(320);
    expect(sawWeapon.config.recoilForce).toBeGreaterThan(300);
    expect(sawWeapon.config.cooldownMs).toBeLessThan(shotgunWeapon.config.cooldownMs);
    expect(sawWeapon.config.bloodProjection?.particleCount).toBeGreaterThan(shotgunWeapon.config.bloodProjection?.particleCount ?? 0);
  });
});
