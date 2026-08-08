import { describe, expect, test } from 'vitest';
import { RoundManager } from '../gameplay/match/RoundManager';

describe('RoundManager', () => {
  const participants = [
    { profileId: 'p1', label: 'Joueur 1', source: 'keyboard' as const },
    { profileId: 'p2', label: 'Joueur 2', source: 'keyboard' as const },
  ];

  test('ne permet pas d’agir avant la fin du décompte', () => {
    const manager = new RoundManager({
      participants,
      countdownMs: 1000,
      roundDurationMs: 10000,
    });
    manager.start(0);
    expect(manager.canAct(200)).toBe(false);
    expect(manager.canAct(1500)).toBe(true);
  });

  test('attribue correctement les éliminations au tueur', () => {
    const manager = new RoundManager({
      participants,
      countdownMs: 0,
      roundDurationMs: 8000,
    });
    manager.start(0);

    manager.recordDamage('p2', 'p1');
    manager.recordElimination('p2');
    manager.recordDamage('p1', 'p2');
    manager.recordElimination('p1');

    const result = manager.getResult(15000);
    expect(result?.isTie).toBe(true);
    expect(result?.winnerScore).toBe(0);
    const killer1 = result?.players.find((entry) => entry.profileId === 'p1');
    const killer2 = result?.players.find((entry) => entry.profileId === 'p2');
    expect(killer1?.eliminations).toBe(1);
    expect(killer2?.eliminations).toBe(1);
  });

  test('applique une pénalité de suicide', () => {
    const manager = new RoundManager({
      participants,
      countdownMs: 0,
      roundDurationMs: 4000,
      suicidePenalty: 2,
    });
    manager.start(0);

    manager.recordElimination('p1');
    const result = manager.getResult(8000);
    expect(result?.players.find((entry) => entry.profileId === 'p1')?.score).toBe(-2);
    expect(result?.players.find((entry) => entry.profileId === 'p1')?.suicides).toBe(1);
  });

  test('termine la manche avec le survivant restant', () => {
    const manager = new RoundManager({
      participants,
      countdownMs: 0,
      roundDurationMs: 10_000,
    });

    manager.start(0);
    manager.recordElimination('p1');
    manager.forceFinish(2000, ['p2']);

    const result = manager.getResult(5000);
    expect(result?.isTie).toBe(false);
    expect(result?.winnerProfileIds).toEqual(['p2']);
    expect(result?.players.find((entry) => entry.profileId === 'p2')?.deaths).toBe(0);
    expect(result?.winnerScore).toBe(0);
  });

  test('en cas d’absence de survivant déclaré, la manche finit à égalité', () => {
    const manager = new RoundManager({
      participants,
      countdownMs: 0,
      roundDurationMs: 10_000,
    });

    manager.start(0);
    manager.recordElimination('p1');
    manager.recordElimination('p2');
    manager.forceFinish(2000, []);

    const result = manager.getResult(5000);
    expect(result?.isTie).toBe(true);
    expect(result?.winnerProfileIds).toEqual([]);
  });

  test('détermine le vainqueur par équipe via les scores cumulés', () => {
    const manager = new RoundManager({
      participants: [
        { profileId: 'p1', label: 'Joueur 1', source: 'keyboard' as const, teamId: '0' },
        { profileId: 'p2', label: 'Joueur 2', source: 'keyboard' as const, teamId: '0' },
        { profileId: 'p3', label: 'Joueur 3', source: 'keyboard' as const, teamId: '1' },
      ],
      countdownMs: 0,
      roundDurationMs: 10_000,
    });

    manager.start(0);
    manager.recordDamage('p1', 'p3');
    manager.recordElimination('p3');
    manager.recordDamage('p1', 'p2');
    manager.recordElimination('p2');

    const result = manager.getResult(5_000);
    expect(result?.isTie).toBe(false);
    expect(result?.winnerTeamIds).toEqual(['0']);
    expect(result?.winnerProfileIds).toEqual(['p1', 'p2']);
    expect(result?.teamScores?.find((team) => team.teamId === '0')?.score).toBe(2);
    expect(result?.winnerScore).toBe(2);
  });
});
