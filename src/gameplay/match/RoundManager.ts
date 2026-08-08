export interface RoundParticipantSeed {
  profileId: string;
  label: string;
  source: 'keyboard' | 'gamepad' | 'bot';
  teamId?: string;
}

export interface RoundPlayerResult {
  profileId: string;
  label: string;
  source: 'keyboard' | 'gamepad' | 'bot';
  score: number;
  eliminations: number;
  deaths: number;
  suicides: number;
  damageDealt: number;
  bloodRecovered: number;
  successfulTransfusions: number;
}

export type RoundPhase = 'countdown' | 'active' | 'finished';

export interface RoundManagerConfig {
  participants: RoundParticipantSeed[];
  roundNumber?: number;
  roundDurationMs?: number;
  countdownMs?: number;
  suicidePenalty?: number;
}

export interface RoundManagerState {
  phase: RoundPhase;
  countdownRemainingMs: number;
  roundRemainingMs: number;
  isFinished: boolean;
  roundNumber: number;
  roundDurationMs: number;
  countdownMs: number;
}

export interface RoundResult {
  roundNumber: number;
  startedAtMs: number;
  endedAtMs: number;
  roundDurationMs: number;
  countdownMs: number;
  winnerScore: number;
  winnerProfileIds: string[];
  winnerTeamIds?: string[];
  teamScores?: Array<{
    teamId: string;
    score: number;
  }>;
  isTie: boolean;
  players: RoundPlayerResult[];
}

type PlayerState = RoundPlayerResult & { suicidePenalty: number };

export class RoundManager {
  private readonly roundNumber: number;
  private readonly roundDurationMs: number;
  private readonly countdownMs: number;
  private readonly suicidePenalty: number;
  private readonly players = new Map<string, PlayerState>();
  private readonly teamByProfileId = new Map<string, string>();
  private phase: RoundPhase = 'countdown';
  private startedAtMs = 0;
  private countdownEndsAtMs = 0;
  private roundEndsAtMs = 0;
  private finishedAtMs = 0;
  private finished = false;
  private roundResult?: RoundResult;
  private lastDamageSourceByPlayer = new Map<string, string | null>();

  public constructor(options: RoundManagerConfig) {
    this.roundNumber = Math.max(1, Math.floor(options.roundNumber ?? 1));
    this.roundDurationMs = Math.max(1000, Math.floor(options.roundDurationMs ?? 180000));
    this.countdownMs = Math.max(0, Math.floor(options.countdownMs ?? 3000));
    this.suicidePenalty = Math.max(0, Math.floor(options.suicidePenalty ?? 1));

    options.participants.forEach((participant) => {
      if (!participant.profileId) {
        return;
      }

      if (this.players.has(participant.profileId)) {
        return;
      }

      this.players.set(participant.profileId, {
        profileId: participant.profileId,
        label: participant.label,
        source: participant.source,
        score: 0,
        eliminations: 0,
        deaths: 0,
        suicides: 0,
        damageDealt: 0,
        bloodRecovered: 0,
        successfulTransfusions: 0,
        suicidePenalty: this.suicidePenalty,
      });

      if (participant.teamId !== undefined) {
        this.teamByProfileId.set(participant.profileId, `${participant.teamId}`);
      }
    });
  }

  public start(nowMs: number): void {
    if (this.startedAtMs > 0) {
      return;
    }

    this.startedAtMs = Math.floor(nowMs);
    this.countdownEndsAtMs = this.startedAtMs + this.countdownMs;
    this.roundEndsAtMs = this.countdownEndsAtMs + this.roundDurationMs;
    this.phase = this.countdownMs > 0 ? 'countdown' : 'active';
  }

  public update(nowMs: number): RoundManagerState {
    const now = Math.floor(nowMs);

    if (!this.startedAtMs) {
      this.start(now);
    }

    if (this.finished) {
      return this.getState(now);
    }

    if (this.phase === 'countdown' && now >= this.countdownEndsAtMs) {
      this.phase = 'active';
    }

    if (this.phase === 'active' && now >= this.roundEndsAtMs) {
      this.finish(now);
    }

    return this.getState(now);
  }

  public canAct(_nowMs: number): boolean {
    return this.phase === 'active' && !this.finished;
  }

  public getPlayerResult(profileId: string): RoundPlayerResult | undefined {
    const player = this.players.get(profileId);
    if (!player) {
      return undefined;
    }

    return {
      profileId: player.profileId,
      label: player.label,
      source: player.source,
      score: player.score,
      eliminations: player.eliminations,
      deaths: player.deaths,
      suicides: player.suicides,
      damageDealt: player.damageDealt,
      bloodRecovered: player.bloodRecovered,
      successfulTransfusions: player.successfulTransfusions,
    };
  }

  public recordDamage(playerId: string, sourceProfileId?: string): void {
    if (!this.players.has(playerId)) {
      return;
    }

    this.lastDamageSourceByPlayer.set(playerId, sourceProfileId ?? null);
  }

  public recordDamageDealt(attackerProfileId: string, amount: number): void {
    const attacker = this.players.get(attackerProfileId);
    if (!attacker) {
      return;
    }

    attacker.damageDealt += Math.max(0, Math.floor(amount));
  }

  public recordBloodRecovered(playerId: string, amount: number): void {
    const player = this.players.get(playerId);
    if (!player) {
      return;
    }

    player.bloodRecovered += Math.max(0, Math.floor(amount));
  }

  public recordSuccessfulTransfusion(playerId: string, amount: number): void {
    const player = this.players.get(playerId);
    if (!player) {
      return;
    }

    player.successfulTransfusions += Math.max(0, Math.floor(amount));
  }

  public recordScore(playerId: string, delta: number): void {
    const player = this.players.get(playerId);
    if (!player) {
      return;
    }

    player.score += Math.floor(delta);
  }

  public recordElimination(victimProfileId: string): void {
    const victim = this.players.get(victimProfileId);
    if (!victim) {
      return;
    }

    victim.deaths += 1;
    const sourceProfileId = this.lastDamageSourceByPlayer.get(victimProfileId);
    this.lastDamageSourceByPlayer.delete(victimProfileId);
    const isNpcSource = this.isNpcSourceProfileId(sourceProfileId);
    const isSuicide = !sourceProfileId || sourceProfileId === victimProfileId || isNpcSource || !this.players.has(sourceProfileId);
    if (!isSuicide) {
      const killer = this.players.get(sourceProfileId);
      if (!killer) {
        return;
      }

      killer.eliminations += 1;
      killer.score += 1;
      return;
    }

    victim.suicides += 1;
    victim.score -= victim.suicidePenalty;
  }

  private isNpcSourceProfileId(sourceProfileId: string | null | undefined): boolean {
    if (!sourceProfileId) {
      return false;
    }

    return sourceProfileId === 'npc'
      || sourceProfileId.startsWith('npc:')
      || sourceProfileId.startsWith('npc-');
  }

  public getState(nowMs: number): RoundManagerState {
    const now = Math.floor(nowMs);

    if (this.phase === 'countdown') {
      return {
        phase: this.phase,
        countdownRemainingMs: Math.max(0, this.countdownEndsAtMs - now),
        roundRemainingMs: this.roundDurationMs,
        isFinished: false,
        roundNumber: this.roundNumber,
        roundDurationMs: this.roundDurationMs,
        countdownMs: this.countdownMs,
      };
    }

    if (this.phase === 'active') {
      return {
        phase: this.phase,
        countdownRemainingMs: 0,
        roundRemainingMs: Math.max(0, this.roundEndsAtMs - now),
        isFinished: false,
        roundNumber: this.roundNumber,
        roundDurationMs: this.roundDurationMs,
        countdownMs: this.countdownMs,
      };
    }

    return {
      phase: this.phase,
      countdownRemainingMs: 0,
      roundRemainingMs: 0,
      isFinished: true,
      roundNumber: this.roundNumber,
      roundDurationMs: this.roundDurationMs,
      countdownMs: this.countdownMs,
    };
  }

  public getResult(nowMs = Date.now()): RoundResult | undefined {
    const now = Math.floor(nowMs);
    this.update(now);
    return this.roundResult;
  }

  public forceFinish(nowMs: number, forcedWinnerProfileIds: string[] = []): void {
    this.finish(nowMs, forcedWinnerProfileIds);
  }

  private finish(nowMs: number, forcedWinnerProfileIds: string[] = []): void {
    if (this.finished) {
      return;
    }

    this.finished = true;
    this.phase = 'finished';
    this.finishedAtMs = Math.max(this.countdownEndsAtMs, Math.min(this.roundEndsAtMs, nowMs));
    const players = this.getSortedPlayerResults();
    const knownWinnerProfileIds = new Set(players.map((entry) => entry.profileId));
    const sanitizedWinnerProfileIds = forcedWinnerProfileIds.length > 0
      ? forcedWinnerProfileIds.filter((profileId) => knownWinnerProfileIds.has(profileId))
      : [];

    const winnerProfileIds = sanitizedWinnerProfileIds.length > 0
      ? [...new Set(sanitizedWinnerProfileIds)]
      : this.getWinningProfileIdsByTeam(players);
    const winnerTeamScoreMap = this.getTeamScores(players);
    const winnerProfileScoreMap = new Map(players.map((entry) => [entry.profileId, entry.score]));
    const winnerTeamIds = winnerProfileIds.length > 0
      ? this.getUniqueWinnerTeamIds(winnerProfileIds)
      : [];
    const winnerScore = winnerTeamIds.length > 0
      ? Math.max(...winnerTeamIds.map((teamId) => winnerTeamScoreMap.get(teamId) ?? 0))
      : winnerProfileIds.length > 0
        ? Math.max(...winnerProfileIds.map((profileId) => winnerProfileScoreMap.get(profileId) ?? 0))
        : 0;
    const isTie = winnerProfileIds.length === 0
      ? true
      : this.isTeamMode()
      ? winnerTeamIds.length > 1
      : winnerProfileIds.length > 1;

    this.roundResult = {
      roundNumber: this.roundNumber,
      startedAtMs: this.startedAtMs,
      endedAtMs: this.finishedAtMs,
      roundDurationMs: this.roundDurationMs,
      countdownMs: this.countdownMs,
      winnerScore,
      winnerProfileIds,
      winnerTeamIds,
      teamScores: Array.from(winnerTeamScoreMap.entries(), ([teamId, score]) => ({
        teamId,
        score,
      })),
      isTie,
      players,
    };
  }

  private getWinningProfileIdsByTeam(players: RoundPlayerResult[]): string[] {
    if (players.length === 0) {
      return [];
    }

    if (!this.isTeamMode()) {
      return players.filter((entry) => entry.score === players[0].score).map((entry) => entry.profileId);
    }

    const teamScores = this.getTeamScores(players);
    if (teamScores.size <= 1) {
      return players.map((entry) => entry.profileId);
    }

    const topTeamScore = Math.max(...Array.from(teamScores.values()));
    const topTeams = new Set(
      Array.from(teamScores.entries())
        .filter((entry) => entry[1] === topTeamScore)
        .map((entry) => entry[0]),
    );

    return players
      .filter((entry) => topTeams.has(this.getProfileTeam(entry.profileId) ?? ''))
      .map((entry) => entry.profileId);
  }

  private getTeamScores(players: RoundPlayerResult[]): Map<string, number> {
    const teamScores = new Map<string, number>();
    for (let index = 0; index < players.length; index += 1) {
      const player = players[index];
      const teamId = this.getProfileTeam(player.profileId);
      if (teamId === undefined) {
        continue;
      }

      teamScores.set(teamId, (teamScores.get(teamId) ?? 0) + player.score);
    }

    return teamScores;
  }

  private getProfileTeam(profileId: string): string | undefined {
    return this.teamByProfileId.get(profileId);
  }

  private getUniqueWinnerTeamIds(winnerProfileIds: string[]): string[] {
    return Array.from(new Set(
      winnerProfileIds
        .map((profileId) => this.getProfileTeam(profileId))
        .filter((teamId): teamId is string => teamId !== undefined),
    ));
  }

  private isTeamMode(): boolean {
    return this.teamByProfileId.size > 0;
  }

  private getSortedPlayerResults(): RoundPlayerResult[] {
    const players = Array.from(this.players.values()).map((player) => ({
      profileId: player.profileId,
      label: player.label,
      source: player.source,
      score: player.score,
      eliminations: player.eliminations,
      deaths: player.deaths,
      suicides: player.suicides,
      damageDealt: player.damageDealt,
      bloodRecovered: player.bloodRecovered,
      successfulTransfusions: player.successfulTransfusions,
    }));

    players.sort((left, right) => {
      if (left.score !== right.score) {
        return right.score - left.score;
      }

      if (left.eliminations !== right.eliminations) {
        return right.eliminations - left.eliminations;
      }

      if (left.deaths !== right.deaths) {
        return left.deaths - right.deaths;
      }

      return left.label.localeCompare(right.label);
    });

    return players;
  }
}
