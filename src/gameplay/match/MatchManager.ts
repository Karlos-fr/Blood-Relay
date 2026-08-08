import {
  RoundManager,
  RoundManagerConfig,
  RoundParticipantSeed,
  RoundPlayerResult,
  RoundResult,
} from './RoundManager';

export interface MatchPlayerSummary extends RoundPlayerResult {
  roundsWon: number;
}

export interface MatchConfig {
  participants: RoundParticipantSeed[];
  roundsToWin?: number;
  maxRounds?: number;
  roundDurationMs?: number;
  countdownMs?: number;
  suicidePenalty?: number;
}

export interface MatchManagerState {
  isFinished: boolean;
  roundCount: number;
  nextRoundNumber: number;
  roundsToWin: number;
  maxRounds: number;
}

export interface MatchRoundProgress {
  isFinished: boolean;
  winnerProfileIds: string[];
  isTie: boolean;
  playerSummaries: MatchPlayerSummary[];
}

export interface MatchResult {
  roundCount: number;
  roundsToWin: number;
  maxRounds: number;
  isTie: boolean;
  winnerProfileIds: string[];
  players: MatchPlayerSummary[];
  rounds: RoundResult[];
}

interface MatchPlayerState {
  profileId: string;
  label: string;
  source: RoundParticipantSeed['source'];
  teamId?: string;
  roundsWon: number;
  eliminations: number;
  deaths: number;
  suicides: number;
  damageDealt: number;
  bloodRecovered: number;
  successfulTransfusions: number;
}

export class MatchManager {
  private readonly participants: RoundParticipantSeed[];
  private readonly roundsToWin: number;
  private readonly maxRounds: number;
  private readonly roundConfig: Pick<RoundManagerConfig, 'roundDurationMs' | 'countdownMs' | 'suicidePenalty'>;
  private readonly roundHistory: RoundResult[] = [];
  private readonly players = new Map<string, MatchPlayerState>();

  public constructor(options: MatchConfig) {
    this.participants = options.participants
      .filter((participant) => participant.profileId)
      .map((participant) => ({ ...participant }));
    this.roundsToWin = Math.max(1, Math.floor(options.roundsToWin ?? 2));
    this.maxRounds = Math.max(this.roundsToWin, Math.floor(options.maxRounds ?? this.roundsToWin * 2 - 1));
    this.roundConfig = {
      roundDurationMs: options.roundDurationMs,
      countdownMs: options.countdownMs,
      suicidePenalty: options.suicidePenalty,
    };

    this.participants.forEach((participant) => {
      if (!participant.profileId || this.players.has(participant.profileId)) {
        return;
      }

      this.players.set(participant.profileId, {
        profileId: participant.profileId,
        label: participant.label,
        source: participant.source,
        teamId: participant.teamId,
        roundsWon: 0,
        eliminations: 0,
        deaths: 0,
        suicides: 0,
        damageDealt: 0,
        bloodRecovered: 0,
        successfulTransfusions: 0,
      });
    });
  }

  public getCurrentRoundNumber(): number {
    return this.roundHistory.length + 1;
  }

  public createRoundManager(): RoundManager {
    return new RoundManager({
      participants: this.participants,
      roundNumber: this.getCurrentRoundNumber(),
      roundDurationMs: this.roundConfig.roundDurationMs,
      countdownMs: this.roundConfig.countdownMs,
      suicidePenalty: this.roundConfig.suicidePenalty,
    });
  }

  public applyRoundResult(roundResult: RoundResult): MatchRoundProgress {
    this.roundHistory.push(roundResult);

    roundResult.players.forEach((playerRoundResult) => {
      const player = this.ensurePlayerState(playerRoundResult.profileId);
      player.eliminations += playerRoundResult.eliminations;
      player.deaths += playerRoundResult.deaths;
      player.suicides += playerRoundResult.suicides;
      player.damageDealt += playerRoundResult.damageDealt;
      player.bloodRecovered += playerRoundResult.bloodRecovered;
      player.successfulTransfusions += playerRoundResult.successfulTransfusions;
    });

    const winnerTeamIds = this.getUniqueWinnerTeamIds(roundResult);
    if (!roundResult.isTie && winnerTeamIds.length > 0) {
      winnerTeamIds.forEach((teamId) => {
        this.getPlayerIdsForTeam(teamId).forEach((profileId) => {
          const winnerState = this.players.get(profileId);
          if (winnerState) {
            winnerState.roundsWon += 1;
          }
        });
      });
    } else if (!roundResult.isTie) {
      const winner = roundResult.winnerProfileIds[0];
      const winnerState = winner ? this.players.get(winner) : undefined;
      if (winnerState) {
        winnerState.roundsWon += 1;
      }
    }

    const isFinished = this.isFinished();
    const ranking = this.getPlayersSortedByRoundsWon();
    const topRoundsWon = ranking[0]?.roundsWon ?? 0;
    const winnerProfileIds = ranking.filter((entry) => entry.roundsWon === topRoundsWon).map((entry) => entry.profileId);

    return {
      isFinished,
      isTie: winnerProfileIds.length > 1,
      winnerProfileIds,
      playerSummaries: ranking.map((entry) => ({
        profileId: entry.profileId,
        label: entry.label,
        source: entry.source,
        ...(entry.teamId ? { teamId: entry.teamId } : {}),
        roundsWon: entry.roundsWon,
        score: entry.score,
        eliminations: entry.eliminations,
        deaths: entry.deaths,
        suicides: entry.suicides,
        damageDealt: entry.damageDealt,
        bloodRecovered: entry.bloodRecovered,
        successfulTransfusions: entry.successfulTransfusions,
      })),
    };
  }

  public getState(): MatchManagerState {
    const ranking = this.getPlayersSortedByRoundsWon();
    const isFinished = this.isFinished();

    return {
      isFinished,
      roundCount: this.roundHistory.length,
      nextRoundNumber: this.getCurrentRoundNumber(),
      roundsToWin: this.roundsToWin,
      maxRounds: this.maxRounds,
    };
  }

  public getResult(): MatchResult | null {
    const players = this.getPlayersSortedByRoundsWon();
    if (players.length <= 0) {
      return null;
    }

    const topRoundsWon = players[0].roundsWon;
    const winnerProfileIds = players.filter((entry) => entry.roundsWon === topRoundsWon).map((entry) => entry.profileId);

    return {
      roundCount: this.roundHistory.length,
      roundsToWin: this.roundsToWin,
      maxRounds: this.maxRounds,
      isTie: winnerProfileIds.length > 1,
      winnerProfileIds,
      players: players.map((entry) => ({
        profileId: entry.profileId,
        label: entry.label,
        source: entry.source,
        ...(entry.teamId ? { teamId: entry.teamId } : {}),
        roundsWon: entry.roundsWon,
        score: entry.score,
        eliminations: entry.eliminations,
        deaths: entry.deaths,
        suicides: entry.suicides,
        damageDealt: entry.damageDealt,
        bloodRecovered: entry.bloodRecovered,
        successfulTransfusions: entry.successfulTransfusions,
      })),
      rounds: [...this.roundHistory],
    };
  }

  public isFinished(): boolean {
    if (this.hasTopScore(this.roundsToWin)) {
      return true;
    }

    return this.roundHistory.length >= this.maxRounds;
  }

  private hasTopScore(minScore: number): boolean {
    const ranking = this.getPlayersSortedByRoundsWon();
    const topRoundsWon = ranking[0]?.roundsWon ?? 0;
    return topRoundsWon >= minScore;
  }

  private ensurePlayerState(profileId: string): MatchPlayerState {
    const existing = this.players.get(profileId);
    if (existing) {
      return existing;
    }

    const fallback: MatchPlayerState = {
      profileId,
      label: profileId,
      source: 'keyboard',
      roundsWon: 0,
      eliminations: 0,
      deaths: 0,
      suicides: 0,
      damageDealt: 0,
      bloodRecovered: 0,
      successfulTransfusions: 0,
    };
    this.players.set(profileId, fallback);
    return fallback;
  }

  private getPlayersSortedByRoundsWon(): Array<
    MatchPlayerState & {
      score: number;
      label: string;
      source: RoundParticipantSeed['source'];
    }
  > {
    return this.getPlayersArray().sort((left, right) => {
      if (left.roundsWon !== right.roundsWon) {
        return right.roundsWon - left.roundsWon;
      }

      if (left.eliminations !== right.eliminations) {
        return right.eliminations - left.eliminations;
      }

      if (left.deaths !== right.deaths) {
        return left.deaths - right.deaths;
      }

      return left.label.localeCompare(right.label);
    });
  }

  private getPlayersArray(): Array<
    MatchPlayerState & {
      score: number;
      label: string;
      source: RoundParticipantSeed['source'];
      teamId?: string;
    }
  > {
    return Array.from(this.players.values()).map((entry) => ({
      ...entry,
      score: entry.roundsWon,
      label: entry.label,
      source: entry.source,
    }));
  }

  private getUniqueWinnerTeamIds(roundResult: RoundResult): string[] {
    if (!roundResult.winnerTeamIds) {
      return [];
    }

    return Array.from(new Set(roundResult.winnerTeamIds));
  }

  private getPlayerIdsForTeam(teamId: string): string[] {
    return Array.from(this.players.values())
      .filter((entry) => entry.teamId === teamId)
      .map((entry) => entry.profileId);
  }
}
