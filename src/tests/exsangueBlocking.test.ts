import { describe, expect, test } from 'vitest';
import { Player } from '../gameplay/actors/Player';
import { revolverWeapon } from '../gameplay/combat/weapons';
import { Health } from '../gameplay/health/Health';

type ActionInputStateLike = {
  isDown: boolean;
  consumeJustDown: () => boolean;
  refresh: () => void;
};

const makeAction = (consumeJustDown: () => boolean): ActionInputStateLike => ({
  isDown: false,
  consumeJustDown,
  refresh: () => {},
});

const createExsanguePlayerHarness = (): Player => {
  const player = Object.create(Player.prototype) as unknown as Player as any;

  player.health = new Health('player-exsangue-harness', { maxHealth: 100 });
  player.health.respawn(0);
  player.profile = {
    id: 'player-exsangue-harness',
    label: 'Exsangue harness',
    source: 'keyboard',
    update: () => {},
    actions: {
      left: makeAction(() => false),
      right: makeAction(() => false),
      jump: makeAction(() => false),
      down: makeAction(() => false),
      shoot: makeAction(() => true),
      melee: makeAction(() => true),
      dodge: makeAction(() => false),
      transfusion: makeAction(() => false),
      interact: makeAction(() => false),
      join: makeAction(() => false),
      leave: makeAction(() => false),
    },
  };

  player._equippedWeapon = revolverWeapon;
  player._isExsangue = true;
  player._exsangueRemainingWeaponUses = 1;
  player._dead = false;
  player._isTransfusing = false;
  player._isInteracting = false;
  player._nextShootAt = 0;
  player._nextMeleeAt = 0;
  player._lastMeleeInputAt = 0;
  player._meleeComboStep = 0;
  player._shotSpreadBonusDegrees = 0;
  player._lastAutoShotAt = 0;
  player._lastAutoShotWeaponId = '';
  player.applyVisualState = () => {};
  player.updateAutomaticShootSpread = Player.prototype.updateAutomaticShootSpread;
  player.refreshAutomaticShootSpread = Player.prototype.refreshAutomaticShootSpread;

  return player as Player;
};

describe('Phase 15 — situations de blocage en exsangue', () => {
  test('bloque le tir après la dernière utilisation autorisée', () => {
    const player = createExsanguePlayerHarness();
    const firstShot = player.consumeShootAction(1_000);
    const secondShot = player.consumeShootAction(1_000 + revolverWeapon.config.cooldownMs + 1);

    expect(firstShot).toBe(true);
    expect(secondShot).toBe(false);
    expect((player as any)._exsangueRemainingWeaponUses).toBe(0);
  });

  test('bloque la mêlée après la dernière utilisation autorisée', () => {
    const player = createExsanguePlayerHarness();
    const firstMelee = player.consumeMeleeAction(1_000);
    const secondMelee = player.consumeMeleeAction(2_000);

    expect(firstMelee).toBe(true);
    expect(secondMelee).toBe(false);
    expect((player as any)._exsangueRemainingWeaponUses).toBe(0);
  });
});
