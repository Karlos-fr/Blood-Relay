import { describe, expect, test } from 'vitest';
import { canBeAbsorbingCandidate, isPlayerWithinBloodPoolContact } from '../gameplay/blood/absorption';

describe('Absorption', () => {
  test('autorise l’absorption si le joueur est en l’air', () => {
    const airbornePlayer = {
      health: { isDead: () => false },
      bloodReserve: 10,
      maxBloodReserve: 120,
      isTransfusing: () => false,
      state: 'airborne',
    } as const;

    expect(canBeAbsorbingCandidate(airbornePlayer)).toBe(true);
  });

  test('autorise l’absorption pendant une esquive', () => {
    const dodgingPlayer = {
      health: { isDead: () => false },
      bloodReserve: 0,
      maxBloodReserve: 120,
      isTransfusing: () => false,
      state: 'dodge',
    } as const;

    expect(canBeAbsorbingCandidate(dodgingPlayer)).toBe(true);
  });

  test('bloque l’absorption si la réserve est pleine', () => {
    const fullReservePlayer = {
      health: { isDead: () => false },
      bloodReserve: 120,
      maxBloodReserve: 120,
      isTransfusing: () => false,
    } as const;

    expect(canBeAbsorbingCandidate(fullReservePlayer)).toBe(false);
  });

  test('bloque l’absorption si le joueur transpulse', () => {
    const transfusingPlayer = {
      health: { isDead: () => false },
      bloodReserve: 20,
      maxBloodReserve: 120,
      isTransfusing: () => true,
    } as const;

    expect(canBeAbsorbingCandidate(transfusingPlayer)).toBe(false);
  });

  test('confirme le rayon de capture de la flaque', () => {
    expect(
      isPlayerWithinBloodPoolContact(10, 20, {
        playerX: 10,
        playerY: 20,
        poolX: 24,
        poolY: 20,
        poolRadius: 12,
        absorbContactRadiusPx: 24,
      }),
    ).toBe(true);

    expect(
      isPlayerWithinBloodPoolContact(10, 20, {
        playerX: 10,
        playerY: 20,
        poolX: 100,
        poolY: 20,
        poolRadius: 12,
        absorbContactRadiusPx: 24,
      }),
    ).toBe(false);
  });
});
