import { describe, expect, test, vi } from 'vitest';
import { Health } from '../gameplay/health/Health';

describe('Health', () => {
  test('initialise à la vie maximale', () => {
    const health = new Health('player-1', { maxHealth: 125 });

    expect(health.state.current).toBe(125);
    expect(health.state.max).toBe(125);
    expect(health.isDead()).toBe(false);
  });

  test('réduit la vie et émet playerDamaged', () => {
    const health = new Health('player-1', { maxHealth: 100 });
    const onDamaged = vi.fn();

    health.on('playerDamaged', (payload) => {
      onDamaged(payload);
    });

    const result = health.takeDamage(25, 'attacker', 0);

    expect(result).toBe(true);
    expect(health.state.current).toBe(75);
    expect(onDamaged).toHaveBeenCalledTimes(1);
    expect(onDamaged).toHaveBeenCalledWith({
      playerId: 'player-1',
      amount: 25,
      sourceProfileId: 'attacker',
      current: 75,
      max: 100,
    });
  });

  test('rejette les dégâts pendant l’invulnérabilité', () => {
    const health = new Health('player-1', { maxHealth: 100, damageInvulnerabilityMs: 350 });
    const onDamaged = vi.fn();

    health.on('playerDamaged', onDamaged);

    const firstHit = health.takeDamage(30, 'attacker', 0);
    const secondHit = health.takeDamage(30, 'attacker', 120);
    const thirdHit = health.takeDamage(30, 'attacker', 400);

    expect(firstHit).toBe(true);
    expect(secondHit).toBe(false);
    expect(thirdHit).toBe(true);
    expect(health.state.current).toBe(40);
    expect(onDamaged).toHaveBeenCalledTimes(2);
  });

  test('émits playerKilled lors d’une létalité', () => {
    const health = new Health('player-1', { maxHealth: 60 });
    const onKilled = vi.fn();

    health.on('playerKilled', onKilled);

    const result = health.takeDamage(60, 'attacker', 0);

    expect(result).toBe(true);
    expect(health.isDead()).toBe(true);
    expect(health.state.current).toBe(0);
    expect(onKilled).toHaveBeenCalledTimes(1);
    expect(onKilled).toHaveBeenCalledWith({ playerId: 'player-1' });
  });

  test('réapparaît et réactive l’invulnérabilité', () => {
    const health = new Health('player-1', { maxHealth: 40, respawnInvulnerabilityMs: 700 });
    const onRespawned = vi.fn();

    health.takeDamage(40, 'attacker', 0);
    health.on('playerRespawned', onRespawned);
    health.respawn(1000);

    expect(health.isDead()).toBe(false);
    expect(health.state.current).toBe(40);
    expect(onRespawned).toHaveBeenCalledTimes(1);
    expect(onRespawned).toHaveBeenCalledWith({ playerId: 'player-1' });
    expect(health.isInvulnerable(1200)).toBe(true);
    expect(health.takeDamage(40, 'attacker', 1200)).toBe(false);
    expect(health.takeDamage(40, 'attacker', 1900)).toBe(true);
    expect(health.isDead()).toBe(true);
  });
});
