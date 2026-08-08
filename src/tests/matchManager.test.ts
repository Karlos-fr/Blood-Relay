import { describe, expect, test } from 'vitest';
import { MatchManager } from '../gameplay/match/MatchManager';
import { RoundResult } from '../gameplay/match/RoundManager';

const participants = [
  { profileId: 'p1', label: 'Joueur 1', source: 'keyboard' as const },
  { profileId: 'p2', label: 'Joueur 2', source: 'keyboard' as const },
];
const relayParticipants = [
  { profileId: 'p1', label: 'Joueur 1', source: 'keyboard' as const, teamId: '0' },
  { profileId: 'p2', label: 'Joueur 2', source: 'keyboard' as const, teamId: '0' },
  { profileId: 'p3', label: 'Joueur 3', source: 'keyboard' as const, teamId: '1' },
  { profileId: 'p4', label: 'Joueur 4', source: 'keyboard' as const, teamId: '1' },
];
const participantsThreePlayers = [
  { profileId: 'p1', label: 'Joueur 1', source: 'keyboard' as const },
  { profileId: 'p2', label: 'Joueur 2', source: 'keyboard' as const },
  { profileId: 'p3', label: 'Joueur 3', source: 'keyboard' as const },
];

const playerRoundResult = (profileId: string, overrides: Partial<RoundResult['players'][number]> = {}) => ({
  profileId,
  label: profileId === 'p1' ? 'Joueur 1' : 'Joueur 2',
  source: 'keyboard' as const,
  score: 0,
  eliminations: 0,
  deaths: 0,
  suicides: 0,
  damageDealt: 0,
  bloodRecovered: 0,
  successfulTransfusions: 0,
  ...overrides,
});

const roundResult = (
  roundNumber: number,
  players: Array<RoundResult['players'][number]>,
  winnerProfileId?: string,
): RoundResult => {
  const winnerProfileIds = winnerProfileId ? [winnerProfileId] : [players[0].profileId, players[1].profileId];
  const winnerScore = winnerProfileId ? 1 : 0;
  return {
    roundNumber,
    startedAtMs: 0,
    endedAtMs: 0,
    roundDurationMs: 60000,
    countdownMs: 3000,
    winnerScore,
    winnerProfileIds: winnerProfileIds,
    isTie: !winnerProfileId,
    players,
  };
};

describe('MatchManager', () => {
  test('détermine un vainqueur de match au format meilleure des trois', () => {
    const manager = new MatchManager({
      participants,
      roundsToWin: 2,
      maxRounds: 3,
    });

    const firstRound = roundResult(
      1,
      [
        playerRoundResult('p1', { eliminations: 2, score: 2 }),
        playerRoundResult('p2', { eliminations: 0, score: 0 }),
      ],
      'p1',
    );
    manager.applyRoundResult(firstRound);
    expect(manager.getResult()).toBeNull();

    const secondRound = roundResult(
      2,
      [
        playerRoundResult('p1', { eliminations: 1, score: 1 }),
        playerRoundResult('p2', { eliminations: 3, score: 1 }),
      ],
      'p2',
    );
    const progress = manager.applyRoundResult(secondRound);
    const matchResult = manager.getResult();

    expect(progress.isFinished).toBe(true);
    expect(matchResult?.isTie).toBe(true);
    expect(matchResult?.roundCount).toBe(2);
  });

  test('agrège les statistiques globales', () => {
    const manager = new MatchManager({
      participants,
      roundsToWin: 3,
      maxRounds: 5,
    });

    const round = roundResult(
      1,
      [
        playerRoundResult('p1', {
          score: 1,
          eliminations: 1,
          bloodRecovered: 12,
          successfulTransfusions: 2,
          damageDealt: 44,
        }),
        playerRoundResult('p2', {
          score: 0,
          deaths: 1,
          bloodRecovered: 3,
          damageDealt: 20,
          successfulTransfusions: 1,
        }),
      ],
      'p1',
    );

    manager.applyRoundResult(round);
    const result = manager.getResult();

    const playerOne = result?.players.find((entry) => entry.profileId === 'p1');
    const playerTwo = result?.players.find((entry) => entry.profileId === 'p2');

    expect(playerOne?.bloodRecovered).toBe(12);
    expect(playerOne?.successfulTransfusions).toBe(2);
    expect(playerOne?.damageDealt).toBe(44);
    expect(playerTwo?.deaths).toBe(1);
  });

  test('déclare un résultat nul après un maximum de manches atteint', () => {
    const manager = new MatchManager({
      participants,
      roundsToWin: 3,
      maxRounds: 2,
    });

    manager.applyRoundResult(roundResult(1, [playerRoundResult('p1', { score: 1 }), playerRoundResult('p2', { score: 0 })], 'p1'));
    manager.applyRoundResult(roundResult(2, [playerRoundResult('p1', { score: 0 }), playerRoundResult('p2', { score: 1 })], 'p2'));

    const result = manager.getResult();
    expect(result?.isTie).toBe(true);
    expect(result?.roundCount).toBe(2);
  });

  test('conserve le mode chacun pour soi avec un score par joueur', () => {
    const manager = new MatchManager({
      participants: participantsThreePlayers,
      roundsToWin: 2,
      maxRounds: 3,
    });

    manager.applyRoundResult(
      roundResult(
        1,
        [
          playerRoundResult('p1', { eliminations: 1, score: 1 }),
          playerRoundResult('p2', { eliminations: 0, score: 0 }),
          playerRoundResult('p3', { eliminations: 0, score: 0 }),
        ],
        'p1',
      ),
    );

    manager.applyRoundResult(
      roundResult(
        2,
        [
          playerRoundResult('p1', { eliminations: 0, score: 0 }),
          playerRoundResult('p2', { eliminations: 1, score: 1 }),
          playerRoundResult('p3', { eliminations: 0, score: 0 }),
        ],
        'p2',
      ),
    );

    const thirdRound = manager.applyRoundResult(
      roundResult(
        3,
        [
          playerRoundResult('p1', { eliminations: 2, score: 1 }),
          playerRoundResult('p2', { eliminations: 0, score: 0 }),
          playerRoundResult('p3', { eliminations: 0, score: 0 }),
        ],
        'p1',
      ),
    );

    expect(thirdRound.isFinished).toBe(true);
    const matchResult = manager.getResult();

    expect(matchResult?.winnerProfileIds).toEqual(['p1']);
    expect(matchResult?.isTie).toBe(false);
    expect(matchResult?.players).toHaveLength(3);
    expect(matchResult?.players.find((entry) => entry.profileId === 'p3')?.roundsWon).toBe(0);
    expect(matchResult?.players.find((entry) => entry.profileId === 'p2')?.roundsWon).toBe(1);
    expect(matchResult?.players.find((entry) => entry.profileId === 'p1')?.roundsWon).toBe(2);
  });

  test('attribue les manches aux membres de l’équipe gagnante', () => {
    const manager = new MatchManager({
      participants: relayParticipants,
      roundsToWin: 3,
      maxRounds: 5,
    });

    const round = {
      ...roundResult(
        1,
        [
          playerRoundResult('p1', { score: 4 }),
          playerRoundResult('p2', { score: 4 }),
          playerRoundResult('p3', { score: 1 }),
          playerRoundResult('p4', { score: 0 }),
        ],
        'p1',
      ),
      winnerProfileIds: ['p1', 'p2'],
      winnerTeamIds: ['0'],
      teamScores: [
        { teamId: '0', score: 8 },
        { teamId: '1', score: 1 },
      ],
      isTie: false,
    };

    const progress = manager.applyRoundResult(round);
    const teamZero = progress.playerSummaries.find((entry) => entry.profileId === 'p1');
    const teamZeroPartner = progress.playerSummaries.find((entry) => entry.profileId === 'p2');
    const teamOne = progress.playerSummaries.find((entry) => entry.profileId === 'p3');
    const teamOnePartner = progress.playerSummaries.find((entry) => entry.profileId === 'p4');

    expect(teamZero?.roundsWon).toBe(1);
    expect(teamZeroPartner?.roundsWon).toBe(1);
    expect(teamOne?.roundsWon).toBe(0);
    expect(teamOnePartner?.roundsWon).toBe(0);
  });
});
