import Phaser from 'phaser';
import { ARENA_HEIGHT, ARENA_WIDTH, GAME_VERSION } from '../app/config/game';
import { getConnectedGamepadProfiles } from '../input/profiles/gamepad';
import { createSimpleBotProfile } from '../input/profiles/bot';
import {
  KeyboardBindingSet,
  createKeyboardProfile,
  defaultKeyboardProfiles,
} from '../input/profiles/keyboard';
import { InputProfile } from '../input/profiles/input';
import {
  LobbyProfileReference,
  isValidKeyboardBinding,
  resolvePlayerProfilesForLobby,
} from '../gameplay/input/resolvePlayerProfiles';
import { Player } from '../gameplay/actors/Player';
import { Enemy } from '../gameplay/actors/Enemy';
import { Weapon, revolverWeapon, weaponRegistry } from '../gameplay/combat/weapons';
import { BloodLedger } from '../gameplay/blood/BloodLedger';
import { canBeAbsorbingCandidate, isPlayerWithinBloodPoolContact } from '../gameplay/blood/absorption';
import { BloodPool } from '../gameplay/blood/BloodPool';
import { RoundManager, RoundManagerState, RoundResult } from '../gameplay/match/RoundManager';
import { MatchManager } from '../gameplay/match/MatchManager';
import { getRelayTeamId, isRelayAlly, RelayTeamId } from '../gameplay/match/relay';
import { ARENA_PRESETS, ArenaInteractionStation, ArenaPlatform, ArenaPreset, getArenaPresetByIndex } from '../app/config/arenas';
import {
  DEFAULT_GAME_OPTIONS,
  GameOptions,
  getDaltonianColor,
  normalizeGameOptions,
  loadGameOptions,
} from '../app/config/options';
import { UI_THEME } from '../app/config/uiTheme';
import { CHARACTER_PROFILES } from '../app/config/characters';
import type { CharacterProfile } from '../app/config/characters';

interface ArenaSceneData {
  selectedProfiles?: LobbyProfileReference[];
  selectedCharacterIds?: string[];
  selectedWeaponId?: string;
  selectedArenaIndex?: number;
  selectedGameMode?: ArenaGameMode;
}

type ArenaGameMode = 'carnage' | 'lastSurvivor' | 'relay' | 'bloodBank' | 'survival' | 'training';

interface MatchTestMetrics {
  roundsPlayed: number;
  totalBloodSpilled: number;
  totalBloodRecovered: number;
  totalTransfusions: number;
  totalTransfusionAttempts: number;
  totalTransfusionsStarted: number;
  totalTransfusionsBlockedByCooldown: number;
  totalPoolAbsorptions: number;
  poolAbsorptionsByPlayer: Map<string, number>;
  transfusionAttemptsByPlayer: Map<string, number>;
  transfusionSuccessByPlayer: Map<string, number>;
  roundDurationsMs: number[];
  lowHealthTimeMsByPlayer: Map<string, number>;
  eliminationsByWeapon: Record<string, number>;
}

export class ArenaScene extends Phaser.Scene {
  public static readonly KEY = 'ArenaScene';
  private players: Player[] = [];
  private arenaPresetForMatch!: ArenaPreset;
  private readonly arenaPresets: ArenaPreset[] = ARENA_PRESETS;
  private debugMode = true;
  private debugText!: Phaser.GameObjects.Text;
  private debugGraphics!: Phaser.GameObjects.Graphics;
  private toggleDebugKey!: Phaser.Input.Keyboard.Key;
  private performanceMode = false;
  private performanceKey!: Phaser.Input.Keyboard.Key;
  private performanceText!: Phaser.GameObjects.Text;
  private pauseKey!: Phaser.Input.Keyboard.Key;
  private quickReloadKey!: Phaser.Input.Keyboard.Key;
  private pauseOverlay!: Phaser.GameObjects.Container;
  private isPaused = false;
  private isPausedByFocusLoss = false;
  private readonly performanceSampleWindowMs = 1000;
  private readonly performanceTextRefreshMs = 250;
  private readonly performanceLogIntervalMs = 2000;
  private performanceSampleElapsedMs = 0;
  private performanceSampleFrames = 0;
  private performanceAverageFps = 0;
  private performanceSpawnedProjectilesThisFrame = 0;
  private performanceSpawnedMeleeZonesThisFrame = 0;
  private performanceSpawnedParticlesThisFrame = 0;
  private accumulatedProjectilesThisWindow = 0;
  private accumulatedMeleeZonesThisWindow = 0;
  private accumulatedParticlesThisWindow = 0;
  private projectilesPerSecond = 0;
  private meleeZonesPerSecond = 0;
  private particlesPerSecond = 0;
  private nextPerformanceLogAtMs = 0;
  private nextPerformanceTextAtMs = 0;
  private readonly playtestMinDurationMs = 300;
  private readonly ambientMusicLoopMs = 2200;
  private ambientMusicLoop?: Phaser.Time.TimerEvent;
  private platformGroup!: Phaser.Physics.Arcade.StaticGroup;
  private arenaFloor!: Phaser.Physics.Arcade.Image;
  private platformCollider!: Phaser.Physics.Arcade.Collider;
  private readonly debugGridColor = 0x2c3e5a;
  private readonly debugGridStep = 64;
  private readonly cameraShakeIntensityBase = 0.012;
  private readonly cameraShakeDuration = 110;
  private readonly cameraPushDuration = 130;
  private readonly cameraRecoilDistance = 8;
  private readonly cameraRecoilThreshold = 24;
  private readonly cameraRecoilScale = 70;
  private readonly cameraRecoilCooldownMs = 80;
  private lastCameraRecoilAt = 0;
  private readonly heavyImpactHitStopThreshold = 48;
  private readonly heavyImpactHitStopDurationMs = 55;
  private readonly heavyImpactHitStopScale = 0.14;
  private readonly heavyImpactHitStopCooldownMs = 90;
  private lastHeavyImpactHitStopAt = 0;
  private readonly eliminationSlowMotionThreshold = 30;
  private readonly eliminationSlowMotionDurationMs = 120;
  private readonly eliminationSlowMotionScale = 0.22;
  private readonly localImpactVibrationThreshold = 26;
  private readonly localImpactVibrationDurationMs = 120;
  private readonly localImpactVibrationAmplitudePx = 5;
  private readonly localImpactVibrationScale = 95;
  private readonly localImpactVibrationCooldownMs = 80;
  private readonly botNavigationProbeDistancePx = 52;
  private readonly botNavigationMaxDropPx = 210;
  private readonly botNavigationMaxStepUpPx = 74;
  private readonly botNavigationStepTolerancePx = 28;
  private lastLocalImpactVibrationAt = 0;
  private readonly bloodFootprintCooldownMs = 130;
  private readonly heavyImpactDistortionThreshold = 32;
  private readonly heavyImpactDistortionScale = 90;
  private readonly heavyImpactDistortionDurationMs = 110;
  private readonly heavyImpactCooldownMs = 120;
  private lastHeavyImpactDistortionAt = 0;
  private readonly cooldownBars: Phaser.GameObjects.Graphics[] = [];
  private enemies!: Phaser.Physics.Arcade.Group;
  private bullets!: Phaser.Physics.Arcade.Group;
  private meleeZones!: Phaser.Physics.Arcade.Group;
  private interactionStations!: Phaser.Physics.Arcade.StaticGroup;
  private readonly maxPlayers = 4;
  private detectedGamepads: InputProfile[] = [];
  private audioContext: AudioContext | null = null;
  private bloodProjectionEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private dustEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private sparkEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly meleeDamage = 24;
  private readonly respawnDelayMs = 1500;
  private readonly spawnEffectDurationMs = 300;
  private readonly spawnEffectRadiusPx = 30;
  private readonly spawnEffectYOffset = 10;
  private readonly deathEffectDurationMs = 420;
  private readonly deathEffectSpreadRadiusPx = 40;
  private readonly lowHealthWarningThreshold = 0.3;
  private readonly meleeWidth = 58;
  private readonly meleeHeight = 32;
  private readonly meleeRangeOffset = 18;
  private readonly meleeKnockback = 190;
  private readonly meleeEffectDurationMs = 150;
  private readonly bloodPoolMergeDistancePx = 58;
  private readonly bloodPoolMaxCount = 12;
  private readonly bloodPoolAbsorbUnitsPerSecond = 40;
  private readonly bloodPoolAbsorbContactRadiusPx = 24;
  private readonly bloodPoolSoundCooldownMs = 110;
  private readonly transfusionSoundCooldownMs = 120;
  private readonly transfusionVisualCooldownMs = 95;
  private readonly exsangueSoundCooldownMs = 260;
  private readonly hemorrhageSoundCooldownMs = 190;
  private readonly hemorrhageTraceCooldownMs = 150;
  private readonly meleeImpactSoundCooldownMs = 90;
  private readonly impactSoundCooldownMs = 65;
  private readonly projectionSoundCooldownMs = 95;
  private readonly deathSoundCooldownMs = 260;
  private readonly respawnSoundCooldownMs = 450;
  private readonly maxConcurrentAudioSources = 8;
  private lastBloodAbsorbSoundAt = 0;
  private lastTransfusionSoundAt = 0;
  private lastTransfusionVisualAt = 0;
  private lastExsangueSoundAt = 0;
  private lastImpactSoundAt = 0;
  private lastMeleeImpactSoundAt = 0;
  private lastProjectionSoundAt = 0;
  private lastHemorrhageSoundAt = 0;
  private lastDeathSoundAt = 0;
  private lastRespawnSoundAt = 0;
  private activeAudioSources = 0;
  private selectedWeaponId: string | null = null;
  private selectedArenaIndex = 0;
  private selectedCharacterIds: string[] = [];
  private gameOptions: GameOptions = { ...DEFAULT_GAME_OPTIONS };
  private matchTestMetrics: MatchTestMetrics = {
    roundsPlayed: 0,
    totalBloodSpilled: 0,
    totalBloodRecovered: 0,
    totalTransfusions: 0,
    totalTransfusionAttempts: 0,
    totalTransfusionsStarted: 0,
    totalTransfusionsBlockedByCooldown: 0,
    totalPoolAbsorptions: 0,
    poolAbsorptionsByPlayer: new Map(),
    transfusionAttemptsByPlayer: new Map(),
    transfusionSuccessByPlayer: new Map(),
    roundDurationsMs: [],
    lowHealthTimeMsByPlayer: new Map(),
    eliminationsByWeapon: {},
  };
  private spawnPoints: Array<{ x: number; y: number }> = [];
  private readonly interactionStationCooldownMs = 900;
  private interactionFeedbackText!: Phaser.GameObjects.Text;
  private interactionFeedbackUntil = 0;
  private selectedProfiles: LobbyProfileReference[] = [];
  private matchManager!: MatchManager;
  private roundManager!: RoundManager;
  private roundStatusText!: Phaser.GameObjects.Text;
  private matchHudHeaderText!: Phaser.GameObjects.Text;
  private matchHudRows: Array<{
    profileId: string;
    colorMarker: Phaser.GameObjects.Rectangle;
    text: Phaser.GameObjects.Text;
  }> = [];
  private roundFinishedProcessed = false;
  private isTransitioningRound = false;
  private nextRoundAtMs: number | null = null;
  private readonly roundTransitionMs = 1200;
  private readonly playtestMaxDurationMs = 300_000;
  private readonly lastSurvivorRoundDurationMs = 18_000;
  private roundsToWin = 2;
  private maxRounds = 3;
  private matchRoundDurationMs = 90000;
  private matchCountdownMs = 3000;
  private matchSuicidePenalty = 1;
  private matchMode: ArenaGameMode = 'carnage';
  private readonly bloodBankDeathPenaltyRate = 0.35;
  private readonly relayTeamColors = [0x4f95ff, 0xe44f4f, 0x8fff78, 0xf4b942];
  private readonly relayTransfusionRangePx = 95;
  private readonly relayReviveRangePx = 95;
  private readonly relayReviveCostUnits = 48;
  private readonly survivalReviveRangePx = 95;
  private readonly relayTeamCount = 2;
  private readonly playerTeamIdByProfileId = new Map<string, RelayTeamId>();
  private readonly relayTeamBloodPool = new Map<RelayTeamId, number>();
  private readonly relayTeamBloodPoolMax = new Map<RelayTeamId, number>();
  private readonly relayTeamMatchScore = new Map<RelayTeamId, number>();
  private readonly relayTeamMatchVictories = new Map<RelayTeamId, number>();
  private readonly relayTeamHudRows: Array<{
    teamId: RelayTeamId;
    colorMarker: Phaser.GameObjects.Rectangle;
    text: Phaser.GameObjects.Text;
  }> = [];
  private readonly relayTransfusionRemainderByProfileId = new Map<string, number>();
  private readonly survivalTeamBloodReviveUnit = 40;
  private survivalTeamBloodPool = 0;
  private survivalTeamBloodPoolMax = 0;
  private readonly playerSpawnPoints = new Map<string, { x: number; y: number }>();
  private readonly groundTraces: Array<{ marker: Phaser.GameObjects.GameObject; expiresAt: number }> = [];
  private readonly bloodPools: BloodPool[] = [];
  private readonly fallbackWeapon: Weapon = revolverWeapon;
  private readonly bloodLedger = new BloodLedger({
    unitsPerDamagePoint: 1.05,
    maxUnitsPerImpact: 78,
    spillLifetimeMs: 6200,
  });
  private readonly playtestMessagePrefix = '[playtest]';
  private isPlaytestMode = false;
  private readonly playerWasGrounded = new Map<string, boolean>();
  private readonly playerLastVerticalVelocity = new Map<string, number>();
  private readonly playerLastBloodFootstep = new Map<string, number>();
  private enemySpawnCounter = 0;
  private enemyWaveIndex = 0;
  private nextEnemyWaveAtMs = 0;
  private readonly enemyWaveConfig = {
    intervalMs: 5200,
    baseSize: 2,
    maxAlive: 8,
    health: 42,
    speed: 45,
    contactDamage: 12,
    contactKnockback: 110,
    contactCooldownMs: 700,
    scoreValue: 10,
    contactRangePx: 30,
  };
  private readonly trainingMannequinConfig = {
    count: 2,
    maxHealth: 60,
    speed: 0,
    contactDamage: 0,
    contactKnockback: 0,
    attackCooldownMs: 900,
    attackRangePx: 24,
    scoreValue: 0,
    respawnDelayMs: 1800,
  };
  private nextTrainingMannequinSpawnAtMs = 0;
  private readonly hudMargin = 12;

  public init(data?: ArenaSceneData): void {
    const inputProfiles = data?.selectedProfiles ?? [];
    this.selectedProfiles = inputProfiles.filter(
      (profile) =>
        typeof profile.id === 'string' &&
        profile.id.length > 0 &&
        (profile.source === 'keyboard' || profile.source === 'gamepad'),
    );
    this.selectedProfiles = this.selectedProfiles.map((profile) => {
      if (profile.source === 'keyboard' && profile.binding && !isValidKeyboardBinding(profile.binding)) {
        return {
          ...profile,
          binding: undefined,
        };
      }

      return { ...profile };
    });
    const selectedMode = this.normalizeGameMode(data?.selectedGameMode);
    if (selectedMode) {
      this.matchMode = selectedMode;
    }
    this.isPlaytestMode = this.configurePlaytestOverridesFromQuery();
    const inputCharacterIds = data?.selectedCharacterIds ?? [];
    this.selectedCharacterIds = inputCharacterIds
      .filter((characterId): characterId is string => typeof characterId === 'string' && characterId.length > 0)
      .map((characterId) => characterId.trim());
    this.selectedWeaponId = typeof data?.selectedWeaponId === 'string' ? data.selectedWeaponId : null;
    this.selectedArenaIndex = this.getValidatedArenaIndex(data?.selectedArenaIndex ?? this.selectedArenaIndex);
    const registryOptions = this.registry.get('gameOptions');
    const loadedFromStorage = loadGameOptions();
    if (registryOptions && typeof registryOptions === 'object') {
      this.gameOptions = normalizeGameOptions({ ...loadedFromStorage, ...(registryOptions as Partial<GameOptions>) });
    } else {
      this.gameOptions = loadedFromStorage;
    }
    this.updateBloodProjectionVisuals();
  }

  constructor() {
    super({ key: ArenaScene.KEY });
  }

  public create(): void {
    this.resetMatchTestMetrics();
    this.physics.world.setBounds(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
    this.physics.world.setBoundsCollision(true, true, true, true);
    this.cameras.main.setBounds(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
    this.cameras.main.setScroll(0, 0);
    this.cameras.main.setBackgroundColor(UI_THEME.scene.background);
    this.playerWasGrounded.clear();
    this.playerLastVerticalVelocity.clear();
    this.createArenaLighting();
    this.createDustParticles();
    this.createSparkParticles();
    const arenaPreset = this.getArenaPreset();
    this.arenaPresetForMatch = arenaPreset;

    this.arenaFloor = this.physics.add.staticImage(ARENA_WIDTH / 2, ARENA_HEIGHT - 24, 'platform');
    this.arenaFloor.setDisplaySize(ARENA_WIDTH, 48);
    this.arenaFloor.setOrigin(0.5, 0.5);
    this.arenaFloor.refreshBody();
    this.spawnPoints = arenaPreset.spawnPoints.map((point) => ({ ...point }));

    this.platformGroup = this.physics.add.staticGroup();
    this.spawnArenaPlatforms(arenaPreset.platforms);
    this.refreshConnectedGamepads();
    this.startAmbientMusicLoop();

    const playerProfiles = this.resolvePlayerProfilesForArena({
      selectedProfiles: this.selectedProfiles,
      detectedGamepads: this.detectedGamepads,
      maxPlayers: this.maxPlayers,
      createKeyboardProfile: (id, label, binding) => createKeyboardProfile(this, id, label, binding),
      defaultKeyboardProfiles,
    });
    const playerColors = this.getPlayerColors();
    this.playerSpawnPoints.clear();
    const maxSpawnCount = Math.min(playerProfiles.length, this.spawnPoints.length);
    const players: Player[] = [];
    this.playerTeamIdByProfileId.clear();
    this.relayTeamBloodPool.clear();
    this.relayTeamBloodPoolMax.clear();
    this.relayTeamMatchScore.clear();
    this.relayTeamMatchVictories.clear();
    this.relayTransfusionRemainderByProfileId.clear();

    for (let index = 0; index < maxSpawnCount; index += 1) {
      const profile = playerProfiles[index];
      const spawn = this.spawnPoints[index];
      const color = playerColors[index % playerColors.length];
      if (!profile || !spawn) {
        continue;
      }

      const weapon = this.getSelectedWeapon();
      const characterProfile = this.getPlayerCharacterProfile(index);
      const characterPrefix = this.getPlayerCharacterPrefix(index);
      const player = new Player(this, spawn.x, spawn.y, characterPrefix, profile, color, weapon, characterProfile);
      player.setExsangueEnabled(this.isExsangueModeCompatible());
      player.on('exsangueStarted', () => {
        this.createExsangueSound();
      });
      const isTeamMode = this.matchMode === 'relay' || this.matchMode === 'bloodBank';
      if (isTeamMode) {
        const teamId = this.getRelayTeamIdForPlayerIndex(index);
        this.playerTeamIdByProfileId.set(profile.id, teamId);
        this.relayTeamBloodPool.set(teamId, 0);
        this.relayTeamBloodPoolMax.set(teamId, (this.relayTeamBloodPoolMax.get(teamId) ?? 0) + player.maxBloodReserve);
        this.relayTeamMatchScore.set(teamId, 0);
        this.relayTeamMatchVictories.set(teamId, 0);
      }
      this.playerSpawnPoints.set(profile.id, spawn);
      this.playerWasGrounded.set(profile.id, false);
      this.playerLastVerticalVelocity.set(profile.id, 0);
      this.playerLastBloodFootstep.set(profile.id, 0);
      this.bindPlayerLifecycle(player);
      this.triggerSpawnVisualEffect(player);
      players.push(player);
    }

    this.players = players;
      if (this.matchMode === 'relay') {
        this.syncRelayTeamBloodReserves();
      }
      if (this.matchMode === 'survival') {
        this.resetSurvivalTeamBloodReserves();
      }

    const roundParticipants = players.map((player) => ({
      profileId: player.profile.id,
      label: player.profile.label,
      source: player.profile.source,
      teamId: (this.matchMode === 'relay' || this.matchMode === 'bloodBank')
        ? `${this.getRelayTeamIdForProfile(player.profile.id) ?? 0}`
        : undefined,
    }));
    this.matchManager = new MatchManager({
      participants: roundParticipants,
      roundsToWin: this.roundsToWin,
      maxRounds: this.maxRounds,
      roundDurationMs: this.matchRoundDurationMs,
      countdownMs: this.matchCountdownMs,
      suicidePenalty: this.matchSuicidePenalty,
    });
    if (this.isPlaytestMode) {
      console.info(
        `${this.playtestMessagePrefix} arena-start players=${roundParticipants.length} mode=${this.matchMode} playerProfileIds=${roundParticipants.map((player) => player.profileId).join(',')}`,
      );
    }
    this.roundManager = this.matchManager.createRoundManager();
    this.roundManager.start(this.time.now);

    this.physics.add.collider(this.players, this.players);
    this.physics.add.collider(this.players, this.arenaFloor);
    this.platformCollider = this.physics.add.collider(
      this.players,
      this.platformGroup,
      undefined,
      this.canCollideWithPlatform,
      this,
    );

    const hudScale = this.getHudScale();
    const versionText = this.getHudFontSize(20, hudScale);
    const roundStatusTextSize = this.getHudFontSize(26, hudScale);
    const headerTextSize = this.getHudFontSize(16, hudScale);

    this.add
      .text(this.hudMargin, this.hudMargin, `Blood Relay prototype - Version ${GAME_VERSION}`, {
        fontSize: versionText,
        color: UI_THEME.text.body,
        fontFamily: UI_THEME.font.body,
      })
      .setDepth(10)
      .setScrollFactor(0);

    this.add
      .image(this.hudMargin, this.hudMargin, 'ui-panel-strip')
      .setOrigin(0, 0)
      .setDisplaySize(Math.min(560, this.scale.width - this.hudMargin * 2), 58)
      .setScrollFactor(0);

    this.debugGraphics = this.add.graphics().setDepth(1000);
    this.debugText = this.add
      .text(this.hudMargin, this.hudMargin + 22, '', {
        color: UI_THEME.text.bodyDim,
        fontFamily: UI_THEME.font.mono,
        fontSize: this.getHudFontSize(14, hudScale),
        lineSpacing: 4,
      })
      .setDepth(1000)
      .setScrollFactor(0);
    this.performanceText = this.add
      .text(this.hudMargin, this.hudMargin + 210, '', {
        color: UI_THEME.text.bodyDim,
        fontFamily: UI_THEME.font.mono,
        fontSize: this.getHudFontSize(12, hudScale),
        lineSpacing: 2,
      })
      .setDepth(1000)
      .setScrollFactor(0)
      .setVisible(false);
    this.roundStatusText = this.add
      .text(this.hudMargin + 2, 52, 'Préparation de la manche...', {
        color: UI_THEME.text.body,
        fontSize: roundStatusTextSize,
        fontFamily: UI_THEME.font.mono,
        lineSpacing: 3,
      })
      .setOrigin(0, 0)
      .setDepth(1002)
      .setScrollFactor(0);
    this.matchHudHeaderText = this.add
      .text(this.hudMargin, 74, '', {
        color: UI_THEME.text.accent,
        fontSize: headerTextSize,
        fontFamily: UI_THEME.font.mono,
        lineSpacing: 2,
      })
      .setDepth(1002)
      .setScrollFactor(0);

    this.createBloodProjectionParticles();
    this.updateBloodProjectionVisuals();
    this.createMatchHud();

    this.toggleDebugKey = this.input.keyboard?.addKey('F1') as Phaser.Input.Keyboard.Key;
    this.toggleDebugKey.on('down', () => {
      this.debugMode = !this.debugMode;
      this.debugText.setVisible(this.debugMode);
      this.debugGraphics.setVisible(this.debugMode);
    });
    this.performanceKey = this.input.keyboard?.addKey('F9') as Phaser.Input.Keyboard.Key;
    this.performanceKey.on('down', () => {
      this.performanceMode = !this.performanceMode;
      this.performanceText.setVisible(this.performanceMode);
    });
    this.pauseKey = this.input.keyboard?.addKey('TAB') as Phaser.Input.Keyboard.Key;
    this.pauseKey.on('down', () => {
      this.togglePause();
    });
    this.quickReloadKey = this.input.keyboard?.addKey('R') as Phaser.Input.Keyboard.Key;
    this.quickReloadKey.on('down', () => {
      if (this.matchMode !== 'training') {
        return;
      }

      this.scene.start('ArenaScene', {
        selectedProfiles: this.selectedProfiles,
        selectedCharacterIds: this.selectedCharacterIds,
        selectedWeaponId: this.selectedWeaponId,
        selectedArenaIndex: this.selectedArenaIndex,
        selectedGameMode: this.matchMode,
      });
    });
    this.scale.on('blur', this.handleGameBlur, this);
    this.scale.on('focus', this.handleGameFocus, this);
    this.pauseOverlay = this.createPauseOverlay();
    this.input.gamepad?.on(
      Phaser.Input.Gamepad.Events.BUTTON_DOWN,
      this.handleGamepadPauseInput,
      this,
    );

    this.ensureEnemyBodyTexture();

    this.bullets = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 20,
      runChildUpdate: false,
    });

    this.enemies = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      runChildUpdate: false,
    });
    this.resetEnemyWaveState(this.time.now);

    this.meleeZones = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 4,
      runChildUpdate: false,
    });

    this.interactionStations = this.physics.add.staticGroup();
    this.spawnInteractionStations(arenaPreset.interactionStations);
    this.physics.add.collider(this.enemies, this.arenaFloor);
    this.physics.add.collider(this.enemies, this.platformGroup);

    this.interactionFeedbackText = this.add
      .text(16, ARENA_HEIGHT - 24, '', {
        color: UI_THEME.text.status,
        fontFamily: UI_THEME.font.mono,
        fontSize: '14px',
      })
      .setDepth(1000)
      .setScrollFactor(0);

    this.createCooldownBars();

    this.physics.add.collider(this.bullets, this.arenaFloor, this.destroyBullet, undefined, this);
    this.physics.add.collider(this.bullets, this.platformGroup, this.destroyBullet, undefined, this);
    this.physics.add.overlap(this.bullets, this.enemies, this.onProjectileHitEnemy, this.shouldHitWithProjectileEnemy, this);
    this.physics.add.overlap(this.bullets, this.players, this.onProjectileHit, this.shouldHitWithProjectile, this);
    this.physics.add.overlap(this.meleeZones, this.players, this.onMeleeHit, this.shouldHitWithMelee, this);
    this.physics.add.overlap(this.meleeZones, this.enemies, this.onMeleeHitEnemy, this.shouldHitWithMeleeEnemy, this);
      this.physics.add.overlap(
      this.interactionStations,
      this.players,
      this.onInteractionZoneOverlap,
      this.shouldInteractWithZone,
      this,
    );

    this.input.gamepad?.on('connected', this.handleGamepadConnected, this);
    this.input.gamepad?.on('disconnected', this.handleGamepadDisconnected, this);
    this.refreshConnectedGamepads();
  }

  private resolvePlayerProfilesForArena(args: {
    selectedProfiles: LobbyProfileReference[];
    detectedGamepads: InputProfile[];
    maxPlayers: number;
    createKeyboardProfile: (id: string, label: string, binding: KeyboardBindingSet) => InputProfile;
    defaultKeyboardProfiles: KeyboardBindingSet[];
  }): InputProfile[] {
    const resolvedProfiles = resolvePlayerProfilesForLobby({
      selectedProfiles: args.selectedProfiles,
      detectedGamepads: args.detectedGamepads,
      maxPlayers: args.maxPlayers,
      createKeyboardProfile: args.createKeyboardProfile,
      defaultKeyboardProfiles: args.defaultKeyboardProfiles,
    });

    if (this.matchMode !== 'training' || resolvedProfiles.length >= 2) {
      return resolvedProfiles;
    }

    const botProfileId = `bot-training-${resolvedProfiles.length + 1}`;
    const isTeamMode = this.matchMode === 'relay' || this.matchMode === 'bloodBank';
    const botExpectedTeamId = this.getRelayTeamIdForPlayerIndex(resolvedProfiles.length);

    const isAllyOfBot = (candidateProfileId: string): boolean => {
      if (!isTeamMode) {
        return false;
      }

      if (candidateProfileId === botProfileId) {
        return true;
      }

      const botTeamId = this.playerTeamIdByProfileId.get(botProfileId) ?? botExpectedTeamId;
      const candidateTeamId = this.playerTeamIdByProfileId.get(candidateProfileId);
      if (botTeamId === undefined || candidateTeamId === undefined) {
        return false;
      }

      return isRelayAlly(this.playerTeamIdByProfileId, botProfileId, candidateProfileId);
    };

    const botProfile = createSimpleBotProfile({
      id: botProfileId,
      label: 'Bot entrainement',
      getSelf: () => this.getPlayerByProfileId(botProfileId),
      difficulty: 'normal',
      getOpponents: () => this.players.filter((player) => {
        if (player.profile.id === botProfileId || player.health.isDead()) {
          return false;
        }
        if (!isTeamMode) {
          return true;
        }
        return !isAllyOfBot(player.profile.id);
      }),
      getTeamMembers: () => this.players.filter((player) => {
        if (player.profile.id === botProfileId || player.health.isDead()) {
          return false;
        }
        if (!isTeamMode) {
          return false;
        }
        return isAllyOfBot(player.profile.id);
      }),
      canTraverseDirection: (bot, direction) => this.canBotTraverseArena(bot.x, bot.y, direction),
      getNearestBloodPool: (bot) => this.getNearestBloodPoolForBot(bot.x, bot.y),
    });

    return [...resolvedProfiles, botProfile];
  }

  private getPlayerByProfileId(profileId: string): Player | undefined {
    return this.players.find((player) => player.profile.id === profileId);
  }

  private getNearestBloodPoolForBot(
    sourceX: number,
    sourceY: number,
  ): { x: number; y: number; units: number } | undefined {
    let nearestPool: { x: number; y: number; units: number } | undefined;
    let bestDistanceSq = Number.POSITIVE_INFINITY;

    for (let index = 0; index < this.bloodPools.length; index += 1) {
      const pool = this.bloodPools[index];
      if (!pool || pool.units <= 0) {
        continue;
      }

      const poolState = pool.state;
      const distanceSq = Phaser.Math.Distance.Squared(sourceX, sourceY, poolState.x, poolState.y);
      if (distanceSq < bestDistanceSq) {
        bestDistanceSq = distanceSq;
        nearestPool = {
          x: poolState.x,
          y: poolState.y,
          units: poolState.units,
        };
      }
    }

    return nearestPool;
  }

  private canBotTraverseArena(x: number, y: number, direction: -1 | 1): boolean {
    const probeX = x + direction * this.botNavigationProbeDistancePx;
    if (probeX <= 20 || probeX >= ARENA_WIDTH - 20) {
      return false;
    }

    const probeSurface = this.getClosestArenaSurfaceYAt(probeX, y);
    if (probeSurface === null) {
      return false;
    }

    const deltaToSurface = probeSurface - y;
    if (deltaToSurface < -this.botNavigationMaxStepUpPx - this.botNavigationStepTolerancePx) {
      return false;
    }

    if (deltaToSurface > this.botNavigationMaxDropPx) {
      return false;
    }

    return true;
  }

  private getClosestArenaSurfaceYAt(x: number, referenceY: number): number | null {
    const floorSurfaceY = ARENA_HEIGHT - 48;
    let bestSurfaceY: number | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    const considerSurface = (surfaceY: number): void => {
      const distance = Math.abs(surfaceY - referenceY);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestSurfaceY = surfaceY;
      }
    };

    const tryCandidate = (left: number, right: number, surfaceY: number): void => {
      const isUnderProbe = x >= left && x <= right;
      if (!isUnderProbe) {
        return;
      }

      const deltaY = surfaceY - referenceY;
      if (deltaY < -this.botNavigationMaxStepUpPx - this.botNavigationStepTolerancePx) {
        return;
      }

      if (deltaY > this.botNavigationMaxDropPx) {
        return;
      }

      considerSurface(surfaceY);
    };

    if (floorSurfaceY >= referenceY - this.botNavigationStepTolerancePx && floorSurfaceY <= referenceY + this.botNavigationMaxDropPx) {
      tryCandidate(0, ARENA_WIDTH, floorSurfaceY);
    }

    this.arenaPresetForMatch.platforms.forEach((platform) => {
      const halfWidth = Math.abs(platform.width) / 2;
      const halfHeight = Math.abs(platform.height) / 2;
      const left = platform.x - halfWidth;
      const right = platform.x + halfWidth;
      const surfaceY = platform.y - halfHeight;
      tryCandidate(left, right, surfaceY);
    });

    return bestSurfaceY;
  }

  public update(time: number, delta: number): void {
    if (this.isPaused) {
      return;
    }

    this.collectPerformanceSamples(delta);
    this.updatePerformanceText(time);

    const roundState = this.roundManager.update(time);
    this.updateRoundStatus(roundState);
    this.updateMatchHud(roundState);

    if (this.isTransitioningRound && this.nextRoundAtMs !== null) {
      if (time >= this.nextRoundAtMs) {
        this.nextRoundAtMs = null;
        this.isTransitioningRound = false;
        this.startNextRound(time);
      }

      return;
    }

    if (roundState.isFinished && !this.roundFinishedProcessed) {
      this.roundFinishedProcessed = true;
      const roundResult = this.roundManager.getResult(time);
      if (roundResult) {
        this.recordRoundTestMetrics(roundResult);
        this.applyRelayMatchStateFromRoundResult(roundResult);
      }
      const matchProgress = roundResult ? this.matchManager.applyRoundResult(roundResult) : null;

      if (!matchProgress || matchProgress.playerSummaries.length <= 0) {
        this.scene.start('ResultsScene', {
          selectedProfiles: this.selectedProfiles,
          selectedWeaponId: this.selectedWeaponId,
          selectedArenaIndex: this.selectedArenaIndex,
          matchResult: null,
          selectedGameMode: this.matchMode,
        });
        return;
      }

      if (matchProgress.isFinished) {
        const matchResult = this.matchManager.getResult();
        if (!matchResult) {
          this.scene.start('ResultsScene', {
            selectedProfiles: this.selectedProfiles,
            selectedWeaponId: this.selectedWeaponId,
            selectedArenaIndex: this.selectedArenaIndex,
            matchResult: null,
            selectedGameMode: this.matchMode,
          });
          return;
        }

        if (!matchResult.isTie) {
          this.triggerSlowMotion(180);
        }
        this.logMatchTestMetrics();

        this.time.delayedCall(220, () => {
          this.scene.start('ResultsScene', {
            selectedProfiles: this.selectedProfiles,
            selectedWeaponId: this.selectedWeaponId,
            selectedArenaIndex: this.selectedArenaIndex,
            matchResult,
            selectedGameMode: this.matchMode,
          });
        });
        return;
      }

      this.isTransitioningRound = true;
      this.nextRoundAtMs = time + this.roundTransitionMs;
      return;
    }

    const canAct = this.roundManager.canAct(time);

    for (let playerIndex = 0; playerIndex < this.players.length; playerIndex += 1) {
      const player = this.players[playerIndex];
      const profileId = player.profile.id;
      const wasGrounded = this.playerWasGrounded.get(profileId) ?? player.debugState.grounded;
      const previousVelocityY = this.playerLastVerticalVelocity.get(profileId) ?? 0;

      player.update();
      this.recordPlayerLowHealthTime(player, delta);
      const isGrounded = player.debugState.grounded;
      const body = player.body as Phaser.Physics.Arcade.Body;
      const currentVelocityY = body?.velocity.y ?? 0;
      if (!wasGrounded && isGrounded && previousVelocityY > 180) {
        this.spawnLandingDust(player.x, player.y + 18, previousVelocityY);
      }
      if (
        !player.health.isDead()
        && player.debugState.health > 0
        && player.debugState.bleeding
        && isGrounded
        && body
        && Math.abs(body.velocity.x) > 40
      ) {
        this.spawnBloodFootprint(player, time);
      }

      this.playerWasGrounded.set(profileId, isGrounded);
      this.playerLastVerticalVelocity.set(profileId, currentVelocityY);

      if (!canAct) {
        continue;
      }

      if (player.debugState.interacting) {
        if (player.consumeInteractionAction()) {
          // Interaction est résolue côté zone de chevauchement.
        }
        continue;
      }

      if (player.profile.actions.down.isDown) {
        player.requestDropThroughPlatforms();
      }

      if (player.consumeShootAction()) {
        this.triggerProfileVibration(player.profile, 0.45, 95);
        this.spawnProjectile(player);
      }

      if (player.consumeMeleeAction()) {
        this.triggerProfileVibration(player.profile, 0.6, 90);
      }

      if (player.consumeMeleeAttack()) {
        this.spawnMeleeZone(player);
      }

      const transfusionOutcome = player.consumeTransfusionActionWithOutcome();
      if (transfusionOutcome !== 'none') {
        this.recordTransfusionAttempt(player.profile.id, transfusionOutcome);
      }

      if (player.consumeInteractionAction()) {
        // Interaction result is resolved when overlap is detected.
      }
    }

    if (canAct) {
      this.updateEnemyWaves(time);
      this.updateEnemies(time);
    }

    this.cleanupTransientAttacks();
    this.bloodLedger.drySpills(this.time.now);
    this.bloodLedger.purgeExpired(this.time.now);
    this.processTransfusions(this.time.now, delta);
    this.processHemorrhages(this.time.now, delta);
    this.updateBloodPools(this.time.now, delta);
    this.cleanupGroundTraces();
    this.updateInteractionFeedback();

    if (this.debugMode) {
      this.debugText.setVisible(true);
      this.debugGraphics.setVisible(true);
      this.debugGraphics.clear();
      this.debugGraphics.lineStyle(1, 0x79ff4d, 0.8);
      this.renderDebugGrid();

      const lines = [
        `FPS : ${Math.round(this.game.loop.actualFps)}`,
        `Manettes détectées : ${this.detectedGamepads.length}`,
      ];

      for (let playerIndex = 0; playerIndex < this.players.length; playerIndex += 1) {
        const player = this.players[playerIndex];
        const index = playerIndex;
        const state = player.debugState;
        const body = player.body as Phaser.Physics.Arcade.Body;
        const bar = this.cooldownBars[index];
        if (bar) {
          this.drawCooldownBar(bar, state.dodgeCooldownRemaining, state.dodgeCooldownTotal);
        }

        lines.push(
          `P${index + 1} [${state.dead ? 'mort' : 'vivant'}]`,
          ` - x/y: ${Math.round(player.x)} / ${Math.round(player.y)}`,
          ` - vx/vy: ${state.velocity.x} / ${state.velocity.y}`,
          ` - au sol: ${state.grounded ? 'oui' : 'non'}`,
          ` - en air: ${state.airborne ? 'oui' : 'non'}`,
          ` - face: ${state.facing}`,
          ` - esquive: ${state.dodging ? 'oui' : 'non'}`,
          ` - tir: ${state.shooting ? 'oui' : 'non'}`,
          ` - cooldown tir: ${state.shootCooldownRemaining} ms`,
          ` - invulnérabilité: ${state.invulnerable ? 'oui' : 'non'}`,
          ` - cooldown esquive: ${state.dodgeCooldownRemaining} ms`,
          ` - mêlée: ${state.meleeing ? 'oui' : 'non'}`,
          ` - cooldown mêlée: ${state.meleeCooldownRemaining} ms`,
          ` - transfusion: ${state.transfusing ? 'oui' : 'non'}`,
          ` - cooldown transfusion: ${state.transfusionCooldownRemaining} ms`,
          ` - hémorragie: ${state.bleeding ? 'oui' : 'non'}`,
          ` - progression transfusion: ${player.getTransfusionProgress()} ms`,
          ` - sang réserve: ${player.bloodReserve} / ${player.maxBloodReserve}`,
          ` - interaction: ${state.interacting ? 'oui' : 'non'}`,
          ` - cooldown interaction: ${state.interactionCooldownRemaining} ms`,
          ` - périphérique: ${player.profile.source}`,
        );

        if (body) {
          this.debugGraphics.strokeRect(
            body.x,
            body.y,
            body.width,
            body.height,
          );
        }
      }

      const transfusionAttemptRate = this.matchTestMetrics.totalTransfusionAttempts > 0
        ? Math.round((this.matchTestMetrics.totalTransfusionsStarted / this.matchTestMetrics.totalTransfusionAttempts) * 100)
        : 0;
      lines.push(
        `Test match: sang total ${this.matchTestMetrics.totalBloodSpilled}/${this.matchTestMetrics.totalBloodRecovered}`,
        ` - transfusions: ${this.matchTestMetrics.totalTransfusions} unités, ${this.matchTestMetrics.totalTransfusionAttempts} tentatives`,
        ` - transfusions réussite: ${this.matchTestMetrics.totalTransfusionsStarted} (${transfusionAttemptRate}%)`,
        ` - flaques: ${this.matchTestMetrics.totalPoolAbsorptions} absorptions`,
      );

      this.debugText.setText(lines.join('\n'));
    } else {
      this.debugText.setVisible(false);
      this.debugGraphics.setVisible(false);
      this.debugGraphics.clear();
    }
  }

  private canCollideWithPlatform(
    playerObj: Phaser.GameObjects.GameObject,
    _platformObj: Phaser.GameObjects.GameObject,
  ): boolean {
    const player = playerObj as Player;
    const platform = _platformObj as Phaser.Physics.Arcade.Image;
    const isPassThrough = Boolean(platform?.getData('passThrough') === true);
    const body = player.body as Phaser.Physics.Arcade.Body;

    if (!body) {
      return true;
    }

    if (isPassThrough) {
      return !player.canPassThroughPlatforms(this.time.now);
    }

    return true;
  }

  private togglePause(): void {
    this.isPausedByFocusLoss = false;
    this.setPausedState(!this.isPaused);
  }

  private handleGameBlur(): void {
    if (!this.isPaused) {
      this.isPausedByFocusLoss = true;
    }

    this.setPausedState(true);
  }

  private handleGameFocus(): void {
    if (!this.isPaused || !this.isPausedByFocusLoss) {
      return;
    }

    this.setPausedState(false);
    this.isPausedByFocusLoss = false;
  }

  private setPausedState(paused: boolean): void {
    if (paused === this.isPaused) {
      return;
    }

    this.isPaused = paused;
    if (paused) {
      this.time.timeScale = 0;
      this.physics.world.timeScale = 0;
      this.tweens.timeScale = 0;
      this.physics.world.pause();
      this.pauseOverlay.setVisible(true);
      return;
    }

    this.physics.world.resume();
    this.time.timeScale = 1;
    this.physics.world.timeScale = 1;
    this.tweens.timeScale = 1;
    this.pauseOverlay.setVisible(false);
  }

  private handleGamepadPauseInput(
    _gamepad: Phaser.Input.Gamepad.Gamepad,
    _button: Phaser.Input.Gamepad.Button,
    buttonIndex: number,
  ): void {
    if (buttonIndex === 9) {
      this.togglePause();
    }
  }

  private createPauseOverlay(): Phaser.GameObjects.Container {
    const overlayBackground = this.add
      .image(ARENA_WIDTH / 2, ARENA_HEIGHT / 2, 'ui-panel-large')
      .setOrigin(0.5, 0.5)
      .setDisplaySize(ARENA_WIDTH, ARENA_HEIGHT)
      .setAlpha(0.84)
      .setScrollFactor(0)
      .setDepth(2000);

    const title = this.add
      .text(ARENA_WIDTH / 2, ARENA_HEIGHT / 2 - 26, 'PAUSE', {
        color: UI_THEME.text.warning,
        fontFamily: UI_THEME.font.mono,
        fontSize: this.getHudFontSize(58, 1),
        align: 'center',
      })
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setDepth(2000);

    const hint = this.add
      .text(ARENA_WIDTH / 2, ARENA_HEIGHT / 2 + 22, 'TAB: reprendre • START (manette): reprendre', {
        color: UI_THEME.text.status,
        fontFamily: UI_THEME.font.mono,
        fontSize: this.getHudFontSize(22, 1),
        align: 'center',
      })
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setDepth(2000);

    const overlay = this.add.container(0, 0, [overlayBackground, title, hint]).setDepth(2000);
    overlay.setVisible(false);
    return overlay;
  }

  private createCooldownBars(): void {
    const startX = 16;
    const startY = 620;
    const barWidth = 88;
    const barHeight = 7;

    for (let index = 0; index < this.players.length; index += 1) {
      const bar = this.add.graphics().setDepth(1002).setScrollFactor(0);
      bar.x = startX;
      bar.y = startY + index * 14;
      bar.lineStyle(1, 0x2c3e5a, 1);
      bar.strokeRect(0, 0, barWidth, barHeight);
      this.cooldownBars.push(bar);
    }
  }

  private drawCooldownBar(graphic: Phaser.GameObjects.Graphics, remainingMs: number, cooldownMs: number): void {
    const fullWidth = 88;
    const barHeight = 7;
    const progress = cooldownMs <= 0 ? 1 : Math.max(0, 1 - remainingMs / cooldownMs);

    graphic.clear();
    graphic.lineStyle(1, 0x2c3e5a, 1);
    graphic.strokeRect(0, 0, fullWidth, barHeight);
    graphic.fillStyle(0x39d98c, 0.9);
    graphic.fillRect(1, 1, Math.max(0, Math.round(fullWidth * progress) - 2), barHeight - 2);
  }

  private getArenaPreset(): ArenaPreset {
    const selectedIndex = this.getValidatedArenaIndex(this.selectedArenaIndex);
    const basePreset = getArenaPresetByIndex(selectedIndex, this.arenaPresets[0]?.id ?? 'classic');
    const mirrored = this.applyArenaMirroring(basePreset);
    return this.validateArenaPreset(mirrored);
  }

  private getArenaLabel(): string {
    return this.arenaPresetForMatch.label;
  }

  private getValidatedArenaIndex(value: number): number {
    const count = this.arenaPresets.length;
    if (!count) {
      return 0;
    }

    return ((value % count) + count) % count;
  }

  private spawnArenaPlatforms(platforms: ArenaPlatform[]): void {
    for (const platform of platforms) {
      if (!Number.isFinite(platform.x) || !Number.isFinite(platform.y) || platform.width <= 0 || platform.height <= 0) {
        continue;
      }

      const arenaPlatform = this.platformGroup.create(platform.x, platform.y, 'platform') as Phaser.Physics.Arcade.Image;
      arenaPlatform.setDisplaySize(platform.width, platform.height);
      arenaPlatform.setOrigin(0.5, 0.5);
      arenaPlatform.setData('passThrough', !!platform.passThrough);
      arenaPlatform.setData('label', platform.label ?? 'plateforme');

      if (platform.passThrough) {
        arenaPlatform.setAlpha(0.86);
        arenaPlatform.setTint(0x8ab7ef);
      }

      arenaPlatform.refreshBody();
    }
  }

  private spawnInteractionStations(stations: ArenaInteractionStation[]): void {
    for (const station of stations) {
      if (!Number.isFinite(station.x) || !Number.isFinite(station.y) || !station.label) {
        continue;
      }

      const interactionStation = this.interactionStations.create(station.x, station.y, 'interaction-zone') as Phaser.Physics.Arcade.Image;
      interactionStation.setDisplaySize(34, 34);
      interactionStation.setOrigin(0.5, 0.5);
      interactionStation.setData('label', station.label);
      interactionStation.setData('isBloodBank', station.isBloodBank === true);
      interactionStation.setData('cooldownMs', station.cooldownMs ?? this.interactionStationCooldownMs);
      interactionStation.setData('cooldownUntil', 0);
    }
  }

  private applyArenaMirroring(preset: ArenaPreset): ArenaPreset {
    if (!preset.allowRandomMirror || Math.random() >= 0.5) {
      return this.cloneArenaPreset(preset);
    }

    return {
      ...this.cloneArenaPreset(preset),
      spawnPoints: preset.spawnPoints.map((point) => ({
        ...point,
        x: ARENA_WIDTH - point.x,
      })),
      platforms: preset.platforms.map((platform) => ({
        ...platform,
        x: ARENA_WIDTH - platform.x,
      })),
      interactionStations: preset.interactionStations.map((station) => ({
        ...station,
        x: ARENA_WIDTH - station.x,
      })),
    };
  }

  private validateArenaPreset(preset: ArenaPreset): ArenaPreset {
    const clampX = (value: number): number => Phaser.Math.Clamp(value, 24, ARENA_WIDTH - 24);
    const clampY = (value: number): number => Phaser.Math.Clamp(value, 80, ARENA_HEIGHT - 100);

    const sanitizedSpawnPoints = preset.spawnPoints
      .map((point) => ({
        x: clampX(Number.isFinite(point.x) ? point.x : ARENA_WIDTH / 2),
        y: clampY(Number.isFinite(point.y) ? point.y : ARENA_HEIGHT - 100),
      }))
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));

    const sanitizedPlatforms = preset.platforms
      .map((platform) => ({
        ...platform,
        x: clampX(Number.isFinite(platform.x) ? platform.x : ARENA_WIDTH / 2),
        y: clampY(Number.isFinite(platform.y) ? platform.y : ARENA_HEIGHT / 2),
        width: Math.max(24, Math.abs(Number.isFinite(platform.width) ? platform.width : 220)),
        height: Math.max(12, Math.abs(Number.isFinite(platform.height) ? platform.height : 16)),
      }))
      .filter((platform) => platform.width > 0 && platform.height > 0);

    const sanitizedInteractionStations = preset.interactionStations
      .map((station) => ({
        ...station,
        x: clampX(Number.isFinite(station.x) ? station.x : ARENA_WIDTH / 2),
        y: clampY(Number.isFinite(station.y) ? station.y : ARENA_HEIGHT - 100),
      }))
      .filter((station) => Number.isFinite(station.x) && Number.isFinite(station.y) && Boolean(station.label));

    return {
      id: preset.id || 'custom-arena',
      label: preset.label || 'Arène sans nom',
      spawnPoints: sanitizedSpawnPoints.length > 0 ? sanitizedSpawnPoints : [{ x: ARENA_WIDTH / 2, y: ARENA_HEIGHT - 100 }],
      platforms: sanitizedPlatforms.length > 0 ? sanitizedPlatforms : [],
      interactionStations:
        sanitizedInteractionStations.length > 0
          ? sanitizedInteractionStations
          : [{ x: ARENA_WIDTH / 2, y: ARENA_HEIGHT - 90, label: 'Cuve de sang', isBloodBank: true }],
      preview: preset.preview.length > 0 ? preset.preview : ['Arène custom', 'Contenu variable'],
      allowRandomMirror: preset.allowRandomMirror,
    };
  }

  private cloneArenaPreset(preset: ArenaPreset): ArenaPreset {
    return {
      ...preset,
      spawnPoints: preset.spawnPoints.map((point) => ({ ...point })),
      platforms: preset.platforms.map((platform) => ({ ...platform })),
      interactionStations: preset.interactionStations.map((station) => ({ ...station })),
      preview: preset.preview.map((line) => line),
    };
  }

  private getSelectedWeapon(): Weapon {
    const selectedFromMenu = weaponRegistry.find((weapon) => weapon.config.id === this.selectedWeaponId);
    return selectedFromMenu ?? this.fallbackWeapon;
  }

  private getSelectedWeaponLabel(): string {
    return this.getSelectedWeapon().config.label;
  }

  private getBloodProjectionVisualMultiplier(): number {
    return this.gameOptions.reducedBloodVisual ? 0.55 : 1;
  }

  private getBloodTraceVisualMultiplier(): number {
    return this.gameOptions.reducedBloodVisual ? 0.5 : 1;
  }

  private getEffectGain(): number {
    return Math.max(0, Math.min(1, this.gameOptions.masterVolume * this.gameOptions.effectsVolume));
  }

  private getAudioSaturationScale(): number {
    const baselineLoad = Math.max(0, this.activeAudioSources - 2);
    if (baselineLoad <= 0) {
      return 1;
    }

    return Phaser.Math.Clamp(1 - (baselineLoad / this.maxConcurrentAudioSources) * 0.55, 0.45, 1);
  }

  private canPlayAudioSource(): boolean {
    return this.activeAudioSources < this.maxConcurrentAudioSources;
  }

  private getFlashIntensity(): number {
    return Math.max(0, Math.min(1, this.gameOptions.masterVolume * this.gameOptions.flashIntensity));
  }

  private getCameraShakeIntensity(): number {
    return this.cameraShakeIntensityBase * this.gameOptions.cameraShakeIntensity * this.gameOptions.masterVolume;
  }

  private getHudScale(): number {
    const widthRatio = this.scale.width / ARENA_WIDTH;
    const heightRatio = this.scale.height / ARENA_HEIGHT;
    const fittedRatio = Math.min(widthRatio, heightRatio);
    return Math.max(0.8, Math.min(1.06, fittedRatio * 1.15));
  }

  private createArenaLighting(): void {
    const ambient = this.add.graphics();
    ambient.fillGradientStyle(0x2b3a55, 0x2b3a55, 0x101924, 0x101924, 0.35, 0.35, 0.7, 0.7);
    ambient.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
    ambient.setDepth(1);
    ambient.setScrollFactor(0);

    const warmSpot = this.add.graphics();
    warmSpot.fillStyle(0xfff2cc, 0.16);
    warmSpot.fillCircle(ARENA_WIDTH / 2, ARENA_HEIGHT * 0.32, 280);
    warmSpot.setBlendMode(Phaser.BlendModes.ADD);
    warmSpot.setDepth(2);
    warmSpot.setScrollFactor(0);

    const coolSpot = this.add.graphics();
    coolSpot.fillStyle(0x8dc7ff, 0.07);
    coolSpot.fillCircle(ARENA_WIDTH * 0.18, ARENA_HEIGHT * 0.82, 320);
    coolSpot.setBlendMode(Phaser.BlendModes.ADD);
    coolSpot.setDepth(1);
    coolSpot.setScrollFactor(0);
  }

  private spawnImpactFlash(x: number, y: number, color: number, radiusPx = 12): void {
    const flashIntensity = this.getFlashIntensity();
    if (flashIntensity <= 0) {
      return;
    }

    if (!this.textures.exists('blood-flash')) {
      const fallbackFlash = this.make.graphics({ x: 0, y: 0, add: false });
      fallbackFlash.fillStyle(0xffffff, 1);
      fallbackFlash.fillCircle(12, 12, 10);
      fallbackFlash.fillCircle(12, 6, 3.2);
      fallbackFlash.fillCircle(6, 12, 2.5);
      fallbackFlash.fillCircle(18, 13, 2);
      fallbackFlash.fillStyle(0x7a1818, 0.14);
      fallbackFlash.fillCircle(12, 12, 7.5);
      fallbackFlash.generateTexture('blood-flash', 24, 24);
      fallbackFlash.destroy();
    }

    const flashColor = this.applyDaltonianColor(color);
    const scaleBase = Math.max(0.45, radiusPx / 12);

    const glow = this.add.image(x, y, 'blood-flash');
    glow.setDepth(1200);
    glow.setTint(flashColor);
    glow.setBlendMode(Phaser.BlendModes.ADD);
    glow.setScale(scaleBase * 1.4);
    glow.setAlpha(0.5 * flashIntensity);
    glow.setScrollFactor(0);

    this.tweens.add({
      targets: glow,
      alpha: 0,
      scaleX: scaleBase * 2.4,
      scaleY: scaleBase * 2.4,
      duration: 180,
      ease: 'Quad.easeOut',
      onComplete: () => {
        glow.destroy();
      },
    });

    const ring = this.add.image(x, y, 'blood-flash');
    ring.setDepth(1201);
    ring.setTint(flashColor);
    ring.setBlendMode(Phaser.BlendModes.ADD);
    ring.setScale(scaleBase * 2);
    ring.setAlpha(0.22 * flashIntensity);
    ring.setScrollFactor(0);

    this.tweens.add({
      targets: ring,
      alpha: 0,
      scaleX: scaleBase * 2.7,
      scaleY: scaleBase * 2.7,
      duration: 240,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        ring.destroy();
      },
    });
  }

  private getHudFontSize(basePx: number, hudScale = this.getHudScale()): string {
    return `${Math.max(12, Math.round(basePx * hudScale))}px`;
  }

  private getPlayerColors(): number[] {
    const playerColors = UI_THEME.gameplay.playerColors;
    return playerColors.map((color) => this.applyDaltonianColor(color));
  }

  private getPlayerCharacterPrefix(index: number): string {
    const profile = this.getPlayerCharacterProfile(index);
    const paletteCount = Math.max(1, profile.paletteVariants.length);
    const paletteIndex = index % paletteCount;
    const selectedPalette =
      paletteCount > 1
        ? profile.paletteVariants[paletteIndex]
        : {
            id: 'base',
            label: 'Standard',
            bodyFill: profile.bodyFill,
            eyeFill: profile.eyeFill,
            chestFill: profile.chestFill,
            accentFill: profile.accentFill,
          };
    return paletteIndex === 0 ? profile.spritePrefix : `${profile.spritePrefix}-${selectedPalette?.id ?? 'alt'}`;
  }

  private getPlayerCharacterProfile(index: number): CharacterProfile {
    const selectedCharacterId = this.selectedCharacterIds[index];
    const selectedProfile = selectedCharacterId ? this.getCharacterProfileById(selectedCharacterId) : undefined;

    if (selectedProfile) {
      return selectedProfile;
    }

    if (!CHARACTER_PROFILES.length) {
      return {
        id: 'fallback',
        name: 'Fallback',
        description: 'Profil de secours pour conserver une expérience cohérente.',
        paletteVariants: [
          {
            id: 'base',
            label: 'Standard',
            bodyFill: 0x6bbcff,
            eyeFill: 0x101a28,
            chestFill: 0x1f3350,
            accentFill: 0x88d0ff,
          },
          {
            id: 'nuit',
            label: 'Nuit',
            bodyFill: 0x4a83ea,
            eyeFill: 0x0f1d33,
            chestFill: 0x294166,
            accentFill: 0x6cb0ff,
          },
          {
            id: 'soufre',
            label: 'Soufre',
            bodyFill: 0xa97f5f,
            eyeFill: 0x2c1c13,
            chestFill: 0x653f25,
            accentFill: 0xffc57e,
          },
          {
            id: 'glace',
            label: 'Glace',
            bodyFill: 0x6dd4ff,
            eyeFill: 0x16344a,
            chestFill: 0x2f4f6d,
            accentFill: 0xd9f6ff,
          },
        ],
        spritePrefix: 'player',
        bodyFill: 0x6bbcff,
        eyeFill: 0x101a28,
        chestFill: 0x1f3350,
        accentFill: 0x88d0ff,
        eyeOffset: 0,
        chestOffset: 1,
        moveSpeed: 240,
        acceleration: 900,
        jumpStrength: 560,
        dodgeSpeed: 420,
        dodgeDurationMs: 140,
        dodgeCooldownMs: 520,
        drag: 1400,
        maxFallSpeed: 1100,
        maxHealth: 100,
        maxBloodReserve: 140,
        transfusionCooldownMs: 780,
        transfusionDurationMs: 520,
        transfusionUnitsPerSecond: 30,
        transfusionHealingMultiplier: 1.15,
        meleeCooldownMs: 420,
        meleeDurationMs: 150,
        meleeWindupMs: 85,
        hemorrhageCriticalHealthThreshold: 34,
        hemorrhageLossUnitsPerSecond: 2,
        interactionCooldownMs: 420,
      };
    }

    return CHARACTER_PROFILES[index % CHARACTER_PROFILES.length];
  }

  private getCharacterProfileById(profileId: string): CharacterProfile | undefined {
    return CHARACTER_PROFILES.find((profile) => profile.id === profileId);
  }

  private applyDaltonianColor(color: number): number {
    return this.gameOptions.daltonianMode ? getDaltonianColor(color) : color;
  }

  private updateBloodProjectionVisuals(): void {
    if (!this.bloodProjectionEmitter) {
      return;
    }

    const multiplier = this.getBloodProjectionVisualMultiplier();
    this.bloodProjectionEmitter.setScale({ start: 0.12 * multiplier, end: 0.02 * multiplier });
    this.bloodProjectionEmitter.setAlpha({ start: 0.75 * multiplier, end: 0.02 });
  }

  private triggerImpactShake(): void {
    const intensity = this.getCameraShakeIntensity();
    if (intensity <= 0) {
      return;
    }

    this.cameras.main.shake(this.cameraShakeDuration, intensity, false);
  }

  private triggerImpactDistortion(x: number, y: number, impactDamage: number, knockbackForce: number): void {
    const now = this.time.now;
    const impactStrength = impactDamage + (knockbackForce * 0.05);
    if (impactStrength < this.heavyImpactDistortionThreshold || now - this.lastHeavyImpactDistortionAt < this.heavyImpactCooldownMs) {
      return;
    }

    this.lastHeavyImpactDistortionAt = now;
    const normalized = Phaser.Math.Clamp(impactStrength / this.heavyImpactDistortionScale, 0.08, 1);
    const distortionPulse = this.cameras.main;
    const baseZoom = distortionPulse.zoom;
    const baseAngle = distortionPulse.angle;
    const baseScrollX = distortionPulse.scrollX;
    const baseScrollY = distortionPulse.scrollY;

    const horizontalBias = (x - ARENA_WIDTH / 2) / ARENA_WIDTH;
    const verticalBias = (y - ARENA_HEIGHT / 2) / ARENA_HEIGHT;

    this.tweens.add({
      targets: distortionPulse,
      zoom: { from: baseZoom + 0.015 * normalized, to: baseZoom },
      angle: { from: baseAngle + normalized * 0.9, to: baseAngle },
      scrollX: { from: baseScrollX + horizontalBias * 14 * normalized, to: baseScrollX },
      scrollY: { from: baseScrollY + verticalBias * 10 * normalized, to: baseScrollY },
      duration: this.heavyImpactDistortionDurationMs,
      ease: 'Cubic.easeInOut',
      yoyo: true,
      hold: 25,
      onComplete: () => {
        distortionPulse.setZoom(baseZoom);
        distortionPulse.setAngle(baseAngle);
        distortionPulse.setScroll(baseScrollX, baseScrollY);
      },
    });
  }

  private triggerImpactLocalVibration(
    impactX: number,
    impactY: number,
    impactDamage: number,
    knockbackForce: number,
  ): void {
    const now = this.time.now;
    const impactStrength = impactDamage + (knockbackForce * 0.05);
    if (
      impactStrength < this.localImpactVibrationThreshold
      || now - this.lastLocalImpactVibrationAt < this.localImpactVibrationCooldownMs
    ) {
      return;
    }

    this.lastLocalImpactVibrationAt = now;
    const intensity = Phaser.Math.Clamp(impactStrength / this.localImpactVibrationScale, 0.22, 1);
    const jitterAmplitude = this.localImpactVibrationAmplitudePx * intensity;
    const jitterDuration = Math.max(12, Math.floor(this.localImpactVibrationDurationMs / 3));

    const vibration = this.add.container(impactX, impactY);
    vibration.setDepth(1210);

    const outerGlow = this.add.circle(0, 0, 16 + intensity * 26, 0xffffff, 0.17 * intensity);
    outerGlow.setBlendMode(Phaser.BlendModes.ADD);
    outerGlow.setAlpha(0.55);

    const innerFlash = this.add.circle(0, 0, 7 + intensity * 14, 0xfff5c8, 0.28 * intensity);
    innerFlash.setBlendMode(Phaser.BlendModes.ADD);
    innerFlash.setStrokeStyle(Math.max(1, Math.round(1.5 + intensity * 2)), 0xffffff, 0.45 * intensity);

    vibration.add([outerGlow, innerFlash]);

    this.tweens.add({
      targets: vibration,
      x: impactX + jitterAmplitude,
      y: impactY + jitterAmplitude,
      duration: jitterDuration,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: 2,
    });

    this.tweens.add({
      targets: [outerGlow, innerFlash],
      alpha: 0,
      scaleX: 1.7,
      scaleY: 1.7,
      duration: this.localImpactVibrationDurationMs,
      ease: 'Quad.easeOut',
      onComplete: () => {
        vibration.destroy();
      },
    });
  }

  private createMatchHud(): void {
    const isTeamMode = this.matchMode === 'relay' || this.matchMode === 'bloodBank';
    const startX = this.hudMargin;
    const startY = 118;
    const rowHeight = (this.matchMode === 'relay' || this.matchMode === 'bloodBank')
      ? Math.max(36, Math.round(36 * this.getHudScale()))
      : Math.max(52, Math.round(52 * this.getHudScale()));
    const hudWidth = Math.min(560, Math.max(220, this.scale.width - this.hudMargin * 2));
    const rowCount = isTeamMode ? this.getRelayTeamIds().length : this.players.length;
    const panelHeight = Math.max(24, Math.max(1, rowCount) * rowHeight + 4);

    this.add
      .image(startX, 108, 'ui-panel-large')
      .setOrigin(0, 0)
      .setDisplaySize(hudWidth, panelHeight)
      .setDepth(1001)
      .setScrollFactor(0);
    this.add
      .rectangle(startX + 2, 110, hudWidth - 4, panelHeight - 4, UI_THEME.scene.panel.inner, 0.18)
      .setAlpha(0.22)
      .setOrigin(0, 0)
      .setDepth(1001)
      .setScrollFactor(0);

    if (isTeamMode) {
      const relayTeamIds = this.getRelayTeamIds();

      for (let index = 0; index < relayTeamIds.length; index += 1) {
        const teamId = relayTeamIds[index];
        if (teamId === undefined) {
          continue;
        }

        const rowY = startY + index * rowHeight;
        const teamColor = this.applyDaltonianColor(this.getRelayTeamColor(teamId));
        const marker = this.add
          .rectangle(startX, rowY + 8, 11, 11, teamColor, 1)
          .setOrigin(0, 0.5)
          .setDepth(1002)
          .setScrollFactor(0);
        const text = this.add
          .text(startX + 16, rowY + 3, '', {
            color: UI_THEME.text.body,
            fontFamily: UI_THEME.font.mono,
            fontSize: this.getHudFontSize(13),
            lineSpacing: 3,
          })
          .setDepth(1002)
          .setScrollFactor(0);

        this.relayTeamHudRows.push({
          teamId,
          colorMarker: marker,
          text,
        });
      }

      return;
    }

    for (let index = 0; index < this.players.length; index += 1) {
      const player = this.players[index];
      if (!player) {
        continue;
      }

      const rowY = startY + index * rowHeight;
      const marker = this.add
        .rectangle(startX, rowY + 8, 11, 11, player.bloodColor, 1)
        .setOrigin(0, 0.5)
        .setDepth(1002)
        .setScrollFactor(0);
      const text = this.add
        .text(startX + 16, rowY + 3, '', {
          color: UI_THEME.text.body,
          fontFamily: UI_THEME.font.mono,
          fontSize: this.getHudFontSize(14),
          lineSpacing: 3,
        })
        .setDepth(1002)
        .setScrollFactor(0);

      this.matchHudRows.push({
        profileId: player.profile.id,
        colorMarker: marker,
        text,
      });
    }
  }

  private updateMatchHud(roundState: RoundManagerState): void {
    const isTeamMode = this.matchMode === 'relay' || this.matchMode === 'bloodBank';
    const isSurvivalMode = this.matchMode === 'survival';
    const matchState = this.matchManager.getState();
    const remainingLabel =
      roundState.phase === 'countdown'
        ? `${Math.max(0, Math.ceil(roundState.countdownRemainingMs / 1000))} s`
        : roundState.phase === 'active'
          ? this.formatRoundTime(roundState.roundRemainingMs)
          : 'Terminé';

    const phaseLabel = roundState.phase === 'countdown' ? 'Compte à rebours' : roundState.phase === 'active' ? 'En cours' : 'Fin de manche';
    this.matchHudHeaderText.setText(
      `Manche ${matchState.roundCount + 1}/${matchState.maxRounds} • ${phaseLabel} • ${this.getArenaLabel()}\n`
      + `Temps ${remainingLabel} • ${this.getSelectedWeaponLabel()}`
      + `${isSurvivalMode ? ` • Réserve survie ${this.survivalTeamBloodPool}/${this.survivalTeamBloodPoolMax}` : ''}`,
    );

    if (isTeamMode) {
      for (let rowIndex = 0; rowIndex < this.relayTeamHudRows.length; rowIndex += 1) {
        const entry = this.relayTeamHudRows[rowIndex];
        const teamColor = this.applyDaltonianColor(this.getRelayTeamColor(entry.teamId));
        const pool = this.getRelayTeamBloodPool(entry.teamId);
        const poolMax = this.getRelayTeamBloodPoolMax(entry.teamId);
        const victories = this.relayTeamMatchVictories.get(entry.teamId) ?? 0;
        const roundScore = this.relayTeamMatchScore.get(entry.teamId) ?? 0;

        entry.colorMarker.setFillStyle(teamColor, 1);
        entry.text.setColor(`#${teamColor.toString(16).padStart(6, '0').toUpperCase()}`);
        entry.text.setText(
          `Équipe ${entry.teamId + 1} • Sang ${pool}/${poolMax}\n`
          + `Victoires ${victories} • Score ${roundScore}`,
        );
      }

      return;
    }

    for (let rowIndex = 0; rowIndex < this.matchHudRows.length; rowIndex += 1) {
      const entry = this.matchHudRows[rowIndex];
      const player = this.getPlayerById(entry.profileId);
      if (!player) {
        continue;
      }

      const state = player.debugState;
      const playerResult = this.roundManager.getPlayerResult(player.profile.id);
      const exsangueRemainingMs = player.getExsangueRemainingMs();
      const activeFlags = [
        state.bleeding ? '🩸 Hémorragie' : '',
        state.exsangue
          ? `🫀 Exsangue ${Math.max(1, Math.ceil(exsangueRemainingMs / 1000))}s`
          : '',
        state.transfusing ? '💉 Transfusion' : '',
      ].filter(Boolean);

      entry.colorMarker.setFillStyle(player.bloodColor, 1);
      entry.text.setColor(`#${player.bloodColor.toString(16).padStart(6, '0').toUpperCase()}`);
      entry.text.setText(
        `${player.profile.label} • ${player.equippedWeapon.config.label}\n`
        + `PV ${state.health}/${state.maxHealth} • Sang ${player.bloodReserve}/${player.maxBloodReserve}\n`
        + `Score ${playerResult?.score ?? 0} • KO ${playerResult?.eliminations ?? 0} `
        + `${activeFlags.length > 0 ? `• ${activeFlags.join(' • ')}` : '• Stable'}`,
      );
    }
  }

  private isSurvivalMode(): boolean {
    return this.matchMode === 'survival';
  }

  private isExsangueModeCompatible(): boolean {
    return this.matchMode === 'relay' || this.matchMode === 'survival';
  }

  private getSurvivalTeamBloodBonus(): number {
    if (!this.isSurvivalMode()) {
      return 0;
    }

    return Math.min(this.survivalTeamBloodReviveUnit, this.survivalTeamBloodPool);
  }

  private addSurvivalTeamBlood(units: number): number {
    if (units <= 0) {
      return 0;
    }

    const normalizedUnits = Math.max(0, Math.floor(units));
    if (normalizedUnits <= 0) {
      return 0;
    }

    if (this.survivalTeamBloodPoolMax <= 0) {
      return 0;
    }

    const nextUnits = Math.min(this.survivalTeamBloodPoolMax, this.survivalTeamBloodPool + normalizedUnits);
    const addedUnits = nextUnits - this.survivalTeamBloodPool;
    this.survivalTeamBloodPool = nextUnits;

    return addedUnits;
  }

  private consumeSurvivalTeamBlood(units: number): number {
    if (units <= 0) {
      return 0;
    }

    const normalizedUnits = Math.max(0, Math.floor(units));
    if (normalizedUnits <= 0) {
      return 0;
    }

    const consumedUnits = Math.min(this.survivalTeamBloodPool, normalizedUnits);
    this.survivalTeamBloodPool -= consumedUnits;

    return consumedUnits;
  }

  private resetSurvivalTeamBloodReserves(): void {
    const maxUnits = this.players.reduce((sum, player) => sum + (player?.maxBloodReserve ?? 0), 0);
    this.survivalTeamBloodPoolMax = Math.max(0, Math.floor(maxUnits));
    this.survivalTeamBloodPool = 0;
  }

  private resetEnemyWaveState(nowMs: number): void {
    this.enemyWaveIndex = 0;
    this.enemySpawnCounter = 0;
    this.nextEnemyWaveAtMs = nowMs + 1500;
    this.removeInactiveEnemies();
    this.nextTrainingMannequinSpawnAtMs = nowMs + 500;

    if (this.isTrainingMode()) {
      this.spawnTrainingMannequins();
    }
  }

  private removeInactiveEnemies(): void {
    if (!this.enemies) {
      return;
    }

    const enemies = this.enemies.getChildren();
    for (let index = enemies.length - 1; index >= 0; index -= 1) {
      const enemy = enemies[index] as Enemy | undefined;
      if (!enemy || !enemy.active || enemy.health.isDead()) {
        this.enemies.remove(enemy as Phaser.GameObjects.GameObject, true, true);
      }
    }
  }

  private updateEnemyWaves(nowMs: number): void {
    if (!this.isSurvivalMode() || !this.enemies) {
      return;
    }

    if (nowMs < this.nextEnemyWaveAtMs) {
      return;
    }

    const aliveEnemies = this.getActiveEnemyCount();
    if (aliveEnemies >= this.enemyWaveConfig.maxAlive) {
      this.nextEnemyWaveAtMs = nowMs + this.enemyWaveConfig.intervalMs;
      return;
    }

    const waveIndex = this.enemyWaveIndex;
    const waveSize = Math.min(
      this.enemyWaveConfig.baseSize + waveIndex,
      this.enemyWaveConfig.maxAlive - aliveEnemies,
    );

    for (let index = 0; index < waveSize; index += 1) {
      this.spawnSurvivalEnemy(waveIndex);
    }

    this.enemyWaveIndex += 1;
    this.nextEnemyWaveAtMs = nowMs + this.enemyWaveConfig.intervalMs;
  }

  private getActiveEnemyCount(): number {
    return this.enemies ? this.enemies.countActive(true) : 0;
  }

  private spawnSurvivalEnemy(waveIndex: number): void {
    if (!this.enemies || this.getActiveEnemyCount() >= this.enemyWaveConfig.maxAlive) {
      return;
    }

    const spawnY = this.getEnemyWaveSpawnY();
    const spawnX = Math.random() < 0.5
      ? 24 + Math.random() * 30
      : ARENA_WIDTH - 24 - Math.random() * 30;
    const enemy = this.createSurvivalEnemyAt(spawnX, spawnY, waveIndex);
    if (!enemy) {
      return;
    }

    this.enemies.add(enemy);
  }

  private getEnemyWaveSpawnY(): number {
    const firstSpawnPoint = this.spawnPoints[0];
    const baseSpawnY = firstSpawnPoint ? firstSpawnPoint.y : ARENA_HEIGHT - 82;
    return Math.max(120, Math.min(ARENA_HEIGHT - 82, baseSpawnY));
  }

  private createSurvivalEnemyAt(x: number, y: number, waveIndex: number): Enemy | undefined {
    const difficultyBoost = Math.max(0, Math.floor(waveIndex / 4));
    const enemyId = `npc-survival-${this.enemySpawnCounter}`;
    this.enemySpawnCounter += 1;
    const enemy = new Enemy(this, x, y, 'enemy-body', enemyId, {
      maxHealth: this.enemyWaveConfig.health + difficultyBoost * 8,
      speed: this.enemyWaveConfig.speed + difficultyBoost,
      contactDamage: this.enemyWaveConfig.contactDamage,
      attackRangePx: this.enemyWaveConfig.contactRangePx,
      contactKnockback: this.enemyWaveConfig.contactKnockback,
      attackCooldownMs: this.enemyWaveConfig.contactCooldownMs,
      scoreValue: this.enemyWaveConfig.scoreValue + difficultyBoost,
    });

    enemy.setDepth(6);
    enemy.setTint(0xc74b4b);
    return enemy;
  }

  private updateEnemies(nowMs: number): void {
    if (!this.enemies) {
      return;
    }

    if (this.isTrainingMode()) {
      this.maintainTrainingMannequins(nowMs);
      return;
    }

    if (!this.isSurvivalMode()) {
      return;
    }

    const enemies = this.enemies.getChildren() as Enemy[];
    for (let index = 0; index < enemies.length; index += 1) {
      const enemy = enemies[index];
      if (!enemy) {
        continue;
      }

      if (enemy.health.isDead()) {
        enemy.disableBody(true, true);
        continue;
      }

      const target = this.getNearestAlivePlayer(enemy.x, enemy.y);
      enemy.updateMovement(target);

      if (!target) {
        continue;
      }

      const distanceX = Math.abs(target.x - enemy.x);
      const distanceY = Math.abs(target.y - enemy.y);
      const contactDamage = enemy.attackContactDamage(nowMs);
      if (distanceX <= enemy.attackRange && distanceY <= 44 && contactDamage > 0) {
        const preHealth = target.debugState.health;
        const damaged = enemy.applyContactDamage(target, nowMs, {
          sourceProfileId: enemy.sourceProfileId,
          attackAt: nowMs,
          damage: contactDamage,
          knockback: enemy.knockback,
        });

        if (damaged && contactDamage > 0 && preHealth >= this.eliminationSlowMotionThreshold) {
          this.triggerEliminationSlowMotion(enemy.knockback);
        }
      }
    }

    this.removeInactiveEnemies();
  }

  private isTrainingMode(): boolean {
    return this.matchMode === 'training';
  }

  private maintainTrainingMannequins(nowMs: number): void {
    if (!this.enemies) {
      return;
    }

    this.removeInactiveEnemies();
    const enemies = this.enemies.getChildren() as Enemy[];
    for (let index = 0; index < enemies.length; index += 1) {
      const enemy = enemies[index];
      const body = enemy?.body as Phaser.Physics.Arcade.Body | undefined;
      if (!body) {
        continue;
      }

      if (body.velocity.x !== 0 || body.velocity.y !== 0) {
        body.setVelocity(0, 0);
      }
    }

    if (nowMs < this.nextTrainingMannequinSpawnAtMs) {
      return;
    }

    const aliveMannequins = this.getActiveEnemyCount();
    if (aliveMannequins >= this.trainingMannequinConfig.count) {
      return;
    }

    this.spawnTrainingMannequins();
    this.nextTrainingMannequinSpawnAtMs = nowMs + this.trainingMannequinConfig.respawnDelayMs;
  }

  private spawnTrainingMannequins(): void {
    if (!this.enemies) {
      return;
    }

    const targetCount = Math.max(0, this.trainingMannequinConfig.count - this.getActiveEnemyCount());
    if (targetCount <= 0) {
      return;
    }

    const spawnPoints = this.getTrainingMannequinSpawnPoints();
    const fallbackSpawn = this.getFallbackEnemySpawnPoint();
    for (let index = 0; index < targetCount; index += 1) {
      const spawnPoint = spawnPoints[index] ?? fallbackSpawn;
      const enemy = this.createTrainingMannequinAt(spawnPoint.x, spawnPoint.y);
      if (enemy) {
        this.enemies.add(enemy);
      }
    }
  }

  private getTrainingMannequinSpawnPoints(): Array<{ x: number; y: number }> {
    if (this.spawnPoints.length <= 0) {
      return [];
    }

    const candidateSpawnPoints = this.spawnPoints.slice(this.players.length);
    if (candidateSpawnPoints.length > 0) {
      return candidateSpawnPoints;
    }

    const fallbackBase = this.spawnPoints[0];
    return fallbackBase ? [{ x: fallbackBase.x, y: fallbackBase.y }] : [];
  }

  private getFallbackEnemySpawnPoint(): { x: number; y: number } {
    const fallbackIndex = this.spawnPoints.length ? Math.floor(this.spawnPoints.length / 2) : 0;
    const fallbackSpawn = this.spawnPoints[fallbackIndex] ?? { x: ARENA_WIDTH / 2, y: ARENA_HEIGHT - 120 };
    return {
      x: fallbackSpawn.x,
      y: fallbackSpawn.y,
    };
  }

  private createTrainingMannequinAt(x: number, y: number): Enemy | undefined {
    const enemyId = `npc-training-${this.enemySpawnCounter}`;
    this.enemySpawnCounter += 1;
    const enemy = new Enemy(this, x, y, 'enemy-body', enemyId, {
      maxHealth: this.trainingMannequinConfig.maxHealth,
      speed: this.trainingMannequinConfig.speed,
      contactDamage: this.trainingMannequinConfig.contactDamage,
      attackRangePx: this.trainingMannequinConfig.attackRangePx,
      contactKnockback: this.trainingMannequinConfig.contactKnockback,
      attackCooldownMs: this.trainingMannequinConfig.attackCooldownMs,
      scoreValue: this.trainingMannequinConfig.scoreValue,
    });

    enemy.setDepth(6);
    enemy.setTint(0x8bb9ea);
    enemy.setImmovable(true);
    return enemy;
  }

  private ensureEnemyBodyTexture(): void {
    if (this.textures.exists('enemy-body')) {
      return;
    }

    const mannequin = this.make.graphics({ x: 0, y: 0, add: false });
    mannequin.fillStyle(0x7f93a8, 0.96);
    mannequin.fillRoundedRect(2, 2, 28, 48, 4);
    mannequin.fillStyle(0xffffff, 0.96);
    mannequin.fillRect(10, 14, 5, 5);
    mannequin.fillStyle(0x4b5a69, 0.95);
    mannequin.fillRect(4, 38, 20, 10);
    mannequin.fillStyle(0x9fb9d4, 0.85);
    mannequin.fillRect(6, 20, 16, 20);
    mannequin.fillStyle(0x8d7c5c, 0.95);
    mannequin.fillRect(0, 0, 2, 56);
    mannequin.fillRect(30, 0, 2, 56);
    mannequin.generateTexture('enemy-body', 34, 56);
    mannequin.destroy();
  }

  private getNearestAlivePlayer(x: number, y: number): Player | undefined {
    let selected: Player | undefined;
    let nearestDistanceSq = Number.POSITIVE_INFINITY;

    for (let index = 0; index < this.players.length; index += 1) {
      const player = this.players[index];
      if (!player || player.health.isDead()) {
        continue;
      }

      const distanceSq = Phaser.Math.Distance.Squared(player.x, player.y, x, y);
      if (distanceSq < nearestDistanceSq) {
        nearestDistanceSq = distanceSq;
        selected = player;
      }
    }

    return selected;
  }

  private startNextRound(timeNow: number): void {
    this.clearRoundArtifacts();
    this.roundManager = this.matchManager.createRoundManager();
    this.roundManager.start(timeNow);
    this.roundFinishedProcessed = false;
    this.resetEnemyWaveState(timeNow);

    if (this.matchMode === 'relay' || this.matchMode === 'bloodBank') {
      this.resetRelayTeamBloodPools();
      this.relayTransfusionRemainderByProfileId.clear();
    }
    if (this.matchMode === 'survival') {
      this.resetSurvivalTeamBloodReserves();
    }

    for (let playerIndex = 0; playerIndex < this.players.length; playerIndex += 1) {
      const player = this.players[playerIndex];
      if (!player) {
        continue;
      }

      const spawnPoint = this.playerSpawnPoints.get(player.profile.id);
      if (spawnPoint) {
        if (this.matchMode !== 'relay' && player.bloodReserve > 0) {
          player.consumeBloodReserve(player.bloodReserve);
        }

        player.respawnAt(spawnPoint.x, spawnPoint.y);
        player.stopTransfusion(timeNow);
      }
    }

    this.syncRelayTeamBloodReserves();
  }

  private clearRoundArtifacts(): void {
    const now = this.time.now;
    for (let index = this.bloodPools.length - 1; index >= 0; index -= 1) {
      const pool = this.bloodPools[index];
      if (!pool) {
        continue;
      }

      this.removeBloodPool(pool);
    }

    this.cleanupGroundTraces(now);
    this.bullets.clear(true, true);
    this.meleeZones.clear(true, true);
    this.enemies.clear(true, true);
  }

  private triggerSlowMotion(durationMs: number, timeScale = 0.25): void {
    const restoreTimeScale = this.time.timeScale;
    const restorePhysicsScale = this.physics.world.timeScale;
    const restoreTweenScale = this.tweens.timeScale;

    this.time.timeScale = timeScale;
    this.physics.world.timeScale = timeScale;
    this.tweens.timeScale = timeScale;

    this.time.delayedCall(durationMs, () => {
      this.time.timeScale = restoreTimeScale;
      this.physics.world.timeScale = restorePhysicsScale;
      this.tweens.timeScale = restoreTweenScale;
    });
  }

  private triggerImpactHitStop(
    impactDamage: number,
    knockbackForce: number,
  ): void {
    const now = this.time.now;
    const impactStrength = impactDamage + (knockbackForce * 0.05);
    if (impactStrength < this.heavyImpactHitStopThreshold || now - this.lastHeavyImpactHitStopAt < this.heavyImpactHitStopCooldownMs) {
      return;
    }

    this.lastHeavyImpactHitStopAt = now;
    const restoreTimeScale = this.time.timeScale;
    const restorePhysicsScale = this.physics.world.timeScale;
    const restoreTweenScale = this.tweens.timeScale;

    this.time.timeScale = this.heavyImpactHitStopScale;
    this.physics.world.timeScale = this.heavyImpactHitStopScale;
    this.tweens.timeScale = this.heavyImpactHitStopScale;

    this.time.delayedCall(this.heavyImpactHitStopDurationMs, () => {
      this.time.timeScale = restoreTimeScale;
      this.physics.world.timeScale = restorePhysicsScale;
      this.tweens.timeScale = restoreTweenScale;
    });
  }

  private triggerEliminationSlowMotion(impactDamage: number): void {
    if (impactDamage < this.eliminationSlowMotionThreshold) {
      return;
    }

    this.triggerSlowMotion(this.eliminationSlowMotionDurationMs, this.eliminationSlowMotionScale);
  }

  private resetMatchTestMetrics(): void {
    this.matchTestMetrics = {
      roundsPlayed: 0,
      totalBloodSpilled: 0,
      totalBloodRecovered: 0,
      totalTransfusions: 0,
      totalTransfusionAttempts: 0,
      totalTransfusionsStarted: 0,
      totalTransfusionsBlockedByCooldown: 0,
      totalPoolAbsorptions: 0,
      poolAbsorptionsByPlayer: new Map(),
      transfusionAttemptsByPlayer: new Map(),
      transfusionSuccessByPlayer: new Map(),
      roundDurationsMs: [],
      lowHealthTimeMsByPlayer: new Map(),
      eliminationsByWeapon: {},
    };
  }

  private recordRoundTestMetrics(roundResult: RoundResult): void {
    this.matchTestMetrics.roundsPlayed += 1;
    this.matchTestMetrics.roundDurationsMs.push(Math.max(0, roundResult.endedAtMs - roundResult.startedAtMs));
  }

  private recordPlayerLowHealthTime(player: Player, deltaMs: number): void {
    const maxHealth = player.debugState.max;
    if (maxHealth <= 0) {
      return;
    }

    if (player.debugState.health > maxHealth * this.lowHealthWarningThreshold) {
      return;
    }

    const previous = this.matchTestMetrics.lowHealthTimeMsByPlayer.get(player.profile.id) ?? 0;
    this.matchTestMetrics.lowHealthTimeMsByPlayer.set(player.profile.id, previous + deltaMs);
  }

  private recordWeaponElimination(weaponId: string): void {
    const current = this.matchTestMetrics.eliminationsByWeapon[weaponId] ?? 0;
    this.matchTestMetrics.eliminationsByWeapon[weaponId] = current + 1;
  }

  private recordTransfusionAttempt(profileId: string, outcome: 'none' | 'started' | 'cooldown'): void {
    if (outcome === 'none') {
      return;
    }

    this.matchTestMetrics.totalTransfusionAttempts += 1;
    const attempts = (this.matchTestMetrics.transfusionAttemptsByPlayer.get(profileId) ?? 0) + 1;
    this.matchTestMetrics.transfusionAttemptsByPlayer.set(profileId, attempts);

    if (outcome === 'started') {
      this.matchTestMetrics.totalTransfusionsStarted += 1;
      const successful = (this.matchTestMetrics.transfusionSuccessByPlayer.get(profileId) ?? 0) + 1;
      this.matchTestMetrics.transfusionSuccessByPlayer.set(profileId, successful);
      return;
    }

    this.matchTestMetrics.totalTransfusionsBlockedByCooldown += 1;
  }

  private recordPoolAbsorption(profileId: string, absorbedUnits: number): void {
    if (absorbedUnits <= 0) {
      return;
    }

    const current = (this.matchTestMetrics.poolAbsorptionsByPlayer.get(profileId) ?? 0) + 1;
    this.matchTestMetrics.poolAbsorptionsByPlayer.set(profileId, current);
  }

  private logMatchTestMetrics(): void {
    if (this.isPlaytestMode) {
      console.info(`${this.playtestMessagePrefix} match-finished`);
    }
    const roundsPlayed = this.matchTestMetrics.roundsPlayed;
    const averageRoundDurationMs = this.matchTestMetrics.roundDurationsMs.length > 0
      ? this.matchTestMetrics.roundDurationsMs.reduce((acc, value) => acc + value, 0) / this.matchTestMetrics.roundDurationsMs.length
      : 0;
    const totalLowHealthTimeMs = Array.from(this.matchTestMetrics.lowHealthTimeMsByPlayer.values()).reduce((acc, value) => acc + value, 0);
    const eliminationWeaponEntries = Object.entries(this.matchTestMetrics.eliminationsByWeapon)
      .sort((left, right) => right[1] - left[1]);
    const averageBloodSpilledPerRound = roundsPlayed > 0 ? this.matchTestMetrics.totalBloodSpilled / roundsPlayed : 0;
    const averageBloodRecoveredPerRound = roundsPlayed > 0 ? this.matchTestMetrics.totalBloodRecovered / roundsPlayed : 0;
    const averageTransfusionsPerRound = roundsPlayed > 0 ? this.matchTestMetrics.totalTransfusions / roundsPlayed : 0;
    const averagePoolAbsorptionsPerRound = roundsPlayed > 0 ? this.matchTestMetrics.totalPoolAbsorptions / roundsPlayed : 0;
    const uniquePoolUsers = this.matchTestMetrics.poolAbsorptionsByPlayer.size;
    const uniqueTransfusionUsers = this.matchTestMetrics.transfusionSuccessByPlayer.size;
    const totalPlayersForMatch = Math.max(1, this.players.length);
    const transfusionSuccessRate = this.matchTestMetrics.totalTransfusionAttempts > 0
      ? this.matchTestMetrics.totalTransfusionsStarted / this.matchTestMetrics.totalTransfusionAttempts
      : 0;

    if (this.isPlaytestMode) {
      console.info(
        `${this.playtestMessagePrefix} blood-flow `
          + `spilled=${this.matchTestMetrics.totalBloodSpilled} `
          + `recovered=${this.matchTestMetrics.totalBloodRecovered} `
          + `poolAbsorptions=${this.matchTestMetrics.totalPoolAbsorptions} `
          + `transfusions=${this.matchTestMetrics.totalTransfusions} `
          + `transfusionAttempts=${this.matchTestMetrics.totalTransfusionAttempts}`,
      );
    }

    console.table({
      roundsPlayed: this.matchTestMetrics.roundsPlayed,
      averageRoundDurationMs: Math.round(averageRoundDurationMs),
      totalBloodSpilled: this.matchTestMetrics.totalBloodSpilled,
      averageBloodSpilledPerRound: Math.round(averageBloodSpilledPerRound),
      totalBloodRecovered: this.matchTestMetrics.totalBloodRecovered,
      averageBloodRecoveredPerRound: Math.round(averageBloodRecoveredPerRound),
      totalTransfusions: this.matchTestMetrics.totalTransfusions,
      averageTransfusionsPerRound: Math.round(averageTransfusionsPerRound),
      totalTransfusionAttempts: this.matchTestMetrics.totalTransfusionAttempts,
      transfusionsStarted: this.matchTestMetrics.totalTransfusionsStarted,
      transfusionSuccessRate: `${Math.round(transfusionSuccessRate * 100)}%`,
      transfusionsBlockedByCooldown: this.matchTestMetrics.totalTransfusionsBlockedByCooldown,
      totalPoolAbsorptions: this.matchTestMetrics.totalPoolAbsorptions,
      averagePoolAbsorptionsPerRound: Math.round(averagePoolAbsorptionsPerRound),
      poolUsers: uniquePoolUsers,
      transfusionUsers: uniqueTransfusionUsers,
      percentPlayersUsingPools: `${Math.round((uniquePoolUsers / totalPlayersForMatch) * 100)}%`,
      percentPlayersUsingTransfusion: `${Math.round((uniqueTransfusionUsers / totalPlayersForMatch) * 100)}%`,
      totalLowHealthTimeSeconds: Math.round(totalLowHealthTimeMs / 1000),
      topEliminationWeapons: eliminationWeaponEntries,
    });
  }

  private updateRoundStatus(roundState: RoundManagerState): void {
    const matchState = this.matchManager.getState();

    if (roundState.phase === 'countdown') {
      const remainingSeconds = Math.max(0, Math.ceil(roundState.countdownRemainingMs / 1000));
      this.roundStatusText.setText(`Manche ${matchState.nextRoundNumber} — Début dans ${remainingSeconds} s`);
      return;
    }

    if (roundState.phase === 'active') {
      this.roundStatusText.setText(`Temps restant : ${this.formatRoundTime(roundState.roundRemainingMs)}`);
      return;
    }

    if (this.nextRoundAtMs !== null && !this.matchManager.getState().isFinished) {
      this.roundStatusText.setText(`Manche ${roundState.roundNumber} terminée — prochaine manche ${matchState.nextRoundNumber}`);
      return;
    }

    this.roundStatusText.setText('Fin de match...');
  }

  private formatRoundTime(totalMs: number): string {
    const totalSeconds = Math.max(0, Math.ceil(totalMs / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private createBloodProjectionParticles(): void {
    if (!this.textures.exists('blood-splat')) {
      const texture = this.make.graphics({ x: 0, y: 0, add: false });
      texture.fillStyle(0x7a1818, 1);
      texture.fillCircle(12, 9, 6);
      texture.fillEllipse(12, 12, 11, 7);
      texture.fillEllipse(7, 7, 4, 3);
      texture.fillCircle(17, 16, 2.6);
      texture.fillCircle(15, 16, 2);
      texture.fillRect(4, 12, 5, 2.8);
      texture.fillRect(16, 3, 4, 2);
      texture.fillRect(1, 14, 3, 4.5);
      texture.generateTexture('blood-splat', 24, 24);
      texture.destroy();
    }

    if (!this.textures.exists('blood-splat-large')) {
      const texture = this.make.graphics({ x: 0, y: 0, add: false });
      texture.fillStyle(0x7a1818, 1);
      texture.fillCircle(14, 14, 9);
      texture.fillEllipse(14, 15, 18, 11);
      texture.fillEllipse(6, 12, 4.5, 3.5);
      texture.fillEllipse(20, 16, 5.5, 4.5);
      texture.fillEllipse(10, 22, 5, 3);
      texture.fillCircle(18, 7, 3.2);
      texture.fillRect(2, 14, 6, 4.5);
      texture.fillRect(20, 9, 3.8, 4);
      texture.fillRect(14, 2, 4, 2.5);
      texture.generateTexture('blood-splat-large', 30, 30);
      texture.destroy();
    }

    if (!this.textures.exists('blood-wall-mark')) {
      const texture = this.make.graphics({ x: 0, y: 0, add: false });
      texture.fillStyle(0x7a1818, 1);
      texture.fillEllipse(14, 5, 14, 3.7);
      texture.fillEllipse(6, 5, 4.2, 1.8);
      texture.fillEllipse(20, 5, 5.4, 2);
      texture.fillRect(0, 3.4, 6, 1.5);
      texture.fillRect(22, 4, 4.5, 1.7);
      texture.generateTexture('blood-wall-mark', 28, 12);
      texture.destroy();
    }

    if (!this.textures.exists('blood-trace')) {
      const texture = this.make.graphics({ x: 0, y: 0, add: false });
      texture.fillStyle(0x7a1818, 1);
      texture.fillEllipse(22, 2.5, 20, 3.2);
      texture.fillEllipse(9, 2.3, 5.3, 1.9);
      texture.fillEllipse(16, 2.8, 4.1, 1.5);
      texture.fillEllipse(28, 2.5, 2.7, 1.2);
      texture.generateTexture('blood-trace', 44, 6);
      texture.destroy();
    }

    if (!this.textures.exists('blood-flash')) {
      const texture = this.make.graphics({ x: 0, y: 0, add: false });
      texture.fillStyle(0xffffff, 1);
      texture.fillCircle(12, 12, 10);
      texture.fillCircle(12, 6, 3.2);
      texture.fillCircle(6, 12, 2.5);
      texture.fillCircle(18, 13, 2);
      texture.fillStyle(0x7a1818, 0.14);
      texture.fillCircle(12, 12, 7.5);
      texture.generateTexture('blood-flash', 24, 24);
      texture.destroy();
    }

    this.bloodProjectionEmitter = this.add.particles(0, 0, 'blood-splat', {
      lifespan: { min: 220, max: 500 },
      speed: { min: 40, max: 180 },
      gravityY: 220,
      scale: { start: 0.12, end: 0.02 },
      alpha: { start: 0.75, end: 0.02 },
      quantity: 0,
      maxParticles: 200,
      blendMode: Phaser.BlendModes.SCREEN,
      on: false,
    });
  }

  private createDustParticles(): void {
    if (!this.textures.exists('dust-puff')) {
      const texture = this.make.graphics({ x: 0, y: 0, add: false });
      texture.fillStyle(0xd7e0ee, 0.95);
      texture.fillEllipse(4, 4, 4.5, 2.5);
      texture.fillCircle(3.2, 3.8, 1.1);
      texture.generateTexture('dust-puff', 8, 8);
      texture.destroy();
    }

    this.dustEmitter = this.add.particles(0, 0, 'dust-puff', {
      lifespan: { min: 120, max: 300 },
      speed: { min: 25, max: 90 },
      gravityY: -45,
      scale: { start: 0.18, end: 0.02 },
      alpha: { start: 0.45, end: 0 },
      quantity: 0,
      maxParticles: 260,
      blendMode: Phaser.BlendModes.SCREEN,
      on: false,
    });
  }

  private createSparkParticles(): void {
    if (!this.textures.exists('impact-spark')) {
      const texture = this.make.graphics({ x: 0, y: 0, add: false });
      texture.fillStyle(0xfff9d0, 1);
      texture.fillRect(2, 0, 2, 6);
      texture.fillRect(0, 2, 6, 2);
      texture.fillRect(1, 1, 4, 4);
      texture.generateTexture('impact-spark', 6, 6);
      texture.destroy();
    }

    this.sparkEmitter = this.add.particles(0, 0, 'impact-spark', {
      lifespan: { min: 80, max: 220 },
      speed: { min: 60, max: 210 },
      gravityY: -30,
      scale: { start: 0.16, end: 0.01 },
      alpha: { start: 0.85, end: 0 },
      rotate: { start: 0, end: 360 },
      tint: 0xfff4a9,
      quantity: 0,
      maxParticles: 240,
      blendMode: Phaser.BlendModes.ADD,
      on: false,
    });
  }

  private spawnImpactSparks(
    x: number,
    y: number,
    directionX: number,
    directionY: number,
    intensityMultiplier = 1,
  ): void {
    if (!this.sparkEmitter) {
      return;
    }

    const directionMagnitude = Math.max(0.001, Math.hypot(directionX, directionY));
    const normalizedIntensity = Phaser.Math.Clamp((directionMagnitude / 320) * intensityMultiplier, 0.22, 1.65);
    const angle = Phaser.Math.RadToDeg(Math.atan2(directionY, directionX));
    const count = Math.max(3, Math.round(12 * normalizedIntensity));

    this.sparkEmitter.setAngle({ min: angle - 50, max: angle + 50 });
    this.sparkEmitter.setSpeed({ min: 80 * normalizedIntensity, max: 220 * normalizedIntensity });
    this.sparkEmitter.setLifespan({ min: 90, max: 220 });
    this.sparkEmitter.setScale({ start: 0.18 * normalizedIntensity, end: 0.01 });
    this.registerParticleSpawn(count);
    this.sparkEmitter.explode(count, x, y);
  }

  private spawnLandingDust(x: number, y: number, impactVelocityY: number): void {
    if (!this.dustEmitter) {
      return;
    }

    const normalizedSpeed = Phaser.Math.Clamp(impactVelocityY / 420, 0.3, 1.3);
    const particleCount = Math.max(6, Math.round(14 * normalizedSpeed));
    const speed = Math.max(30, Math.round(70 * normalizedSpeed));
    this.dustEmitter.setSpeed({ min: speed * 0.35, max: speed });
    this.dustEmitter.setScale({ start: normalizedSpeed * 0.28, end: 0.02 });
    this.dustEmitter.setLifespan({ min: 130, max: 280 });
    this.registerParticleSpawn(particleCount);
    this.dustEmitter.explode(particleCount, x, y);
  }

  private handleGamepadConnected(): void {
    this.refreshConnectedGamepads();
  }

  private handleGamepadDisconnected(): void {
    this.refreshConnectedGamepads();
  }

  private refreshConnectedGamepads(): void {
    const plugin = this.input.gamepad;
    if (!plugin) {
      this.detectedGamepads = [];
      return;
    }

    const threshold = typeof this.registry.get('gamepadDeadZone') === 'number'
      ? (this.registry.get('gamepadDeadZone') as number)
      : undefined;
    this.detectedGamepads = getConnectedGamepadProfiles(plugin, threshold);
  }

  private spawnProjectile(shooter: Player): void {
    const weapon = shooter.equippedWeapon;
    const projectileTexture = this.getWeaponProjectileTexture(weapon);
    if (!this.textures.exists(projectileTexture)) {
      const fallbackProjectile = this.make.graphics({ x: 0, y: 0, add: false });
      fallbackProjectile.fillStyle(UI_THEME.gameplay.projectile);
      fallbackProjectile.fillRoundedRect(0, 0, 12, 4, 2);
      fallbackProjectile.generateTexture(projectileTexture, 12, 4);
      fallbackProjectile.destroy();
    }

    const direction = shooter.getFacingDirection();
    const projectileConfig = weapon.config.projectile;
    const spreadDegrees =
      (projectileConfig.spreadDegrees ?? 0) + shooter.getCurrentShootSpreadBonusDegrees(this.time.now);
    const pelletCount = Math.max(1, Math.floor(projectileConfig.pelletCount ?? 1));
    const maxRangePx = projectileConfig.maxRangePx;
    const explosionRadiusPx = projectileConfig.explosionRadiusPx ?? 0;
    const explosionDamage = projectileConfig.explosionDamage ?? weapon.config.damage;
    const explosionKnockback = projectileConfig.explosionKnockback ?? weapon.config.recoilForce;
    const explosionDelayMs = projectileConfig.explosionDelayMs ?? 0;
    const explosionPoolCount = projectileConfig.explosionPoolCount ?? 0;
    const trailIntervalMs = projectileConfig.trailIntervalMs ?? 0;
    const trailParticleScale = projectileConfig.trailParticleScale ?? 0.35;
    const maxPlayerHits = Math.max(1, Math.floor(projectileConfig.maxPlayerHits ?? 1));
    const projectileBehavior = weapon.config.projectileBehavior ?? 'straight';
    const gravityScale = projectileConfig.gravityScale ?? 0;
    const muzzleX = shooter.x + shooter.getMuzzleOffset();
    const muzzleY = shooter.y + 16;

    this.spawnMuzzleFlash(shooter, direction, weapon);
    this.playTemporaryShootSound(weapon);

    for (let index = 0; index < pelletCount; index += 1) {
      const bullet = this.bullets.get(muzzleX, muzzleY, projectileTexture) as Phaser.Physics.Arcade.Image | null;

      if (!bullet) {
        continue;
      }

      this.registerProjectileSpawn();
      bullet.setTexture(projectileTexture);

      const spreadOffset =
        pelletCount > 1
          ? (spreadDegrees * (index - (pelletCount - 1) / 2)) / Math.max(1, pelletCount - 1)
          : 0;
      const spread = Phaser.Math.DegToRad(spreadOffset);
      const spreadY = Math.sin(spread);
      const yMotion = (() => {
        if (projectileBehavior === 'arc') {
          return -0.38 + spreadY * 0.18;
        }

        if (projectileBehavior === 'drop') {
          return 0.12 + spreadY * 0.2;
        }

        return spreadY;
      })();
      const velocityX = direction * Math.cos(spread) * projectileConfig.speed;
      const velocityY = yMotion * projectileConfig.speed;

      bullet.setActive(true);
      bullet.setVisible(true);
      bullet.body?.destroy();
      this.physics.world.enable(bullet);
      const body = bullet.body as Phaser.Physics.Arcade.Body;
      bullet.setData('owner', shooter.profile.id);
      bullet.setData('spawnAt', this.time.now);
      bullet.setData('spawnX', muzzleX);
      bullet.setData('maxRangePx', maxRangePx);
      const shooterMultiplier = shooter.getCombatDamageMultiplier();
      bullet.setData('damage', Math.max(1, Math.round(weapon.config.damage * shooterMultiplier)));
      bullet.setData('knockback', weapon.config.recoilForce);
      bullet.setData('maxPlayerHits', maxPlayerHits);
      bullet.setData('remainingPlayerHits', maxPlayerHits);
      bullet.setData('hitTargets', []);
      bullet.setData('wallInteraction', weapon.config.wallInteraction ?? this.fallbackWeapon.config.wallInteraction ?? 'destroy');
      bullet.setData('wallStickingMs', weapon.config.wallStickingMs ?? 0);
      bullet.setData('embeddedProjectileTexture', `${projectileTexture}-embedded`);
      bullet.setData('isStuckToWall', false);
      bullet.setData('wallStuckUntil', 0);
      bullet.setData('explodesOnImpact', explosionRadiusPx > 0);
      bullet.setData('hasExploded', false);
      bullet.setData('explosionRadiusPx', explosionRadiusPx);
      bullet.setData('explosionDamage', explosionDamage);
      bullet.setData('explosionKnockback', explosionKnockback);
      bullet.setData('explosionFuseMs', explosionDelayMs);
      bullet.setData('explosionPoolCount', explosionPoolCount);
      bullet.setData('velocityX', velocityX);
      bullet.setData('velocityY', velocityY);
      if (trailIntervalMs > 0) {
        bullet.setData('trailIntervalMs', trailIntervalMs);
        bullet.setData('trailParticleScale', trailParticleScale);
        bullet.setData('trailLastAt', this.time.now);
      }
      bullet.setScale(direction === -1 ? -1 : 1, 1);
      body.setSize(12, 4);
      bullet.setAngle(direction === -1 ? 180 : 0);
      body.setCollideWorldBounds(false);
      body.setVelocity(velocityX, velocityY);
      if (gravityScale > 0) {
        body.setGravityY(this.physics.world.gravity.y * gravityScale);
      } else {
        body.setAllowGravity(false);
      }
      body.setImmovable(false);
    }

    shooter.applyShootRecoil();
  }

  private getWeaponProjectileTexture(weapon: Weapon): string {
    return weapon.projectileTexture ?? 'projectile';
  }

  private getWeaponMuzzleFlashTexture(weapon: Weapon): string {
    return weapon.muzzleFlashTexture ?? 'muzzle-flash';
  }

  private getWeaponMuzzleFlashAnimation(weapon: Weapon): string | null {
    return weapon.muzzleFlashAnimation ?? null;
  }

  private getWeaponMeleeEffectTexture(_weapon: Weapon): string {
    return 'melee-hit';
  }

  private getWeaponMeleeConfig(weapon: Weapon): {
    damage: number;
    rangeWidth: number;
    rangeHeight: number;
    rangeOffset: number;
    knockback: number;
    comboDamageMultiplier: number[];
    bloodParticleScale: number;
    dashSpeed: number;
    dashDurationMs: number;
    bloodProjectionParticleMultiplier: number;
  } {
    const meleeConfig = weapon.config.melee;
    return {
      damage: meleeConfig?.damage ?? this.meleeDamage,
      rangeWidth: meleeConfig?.rangeWidth ?? this.meleeWidth,
      rangeHeight: meleeConfig?.rangeHeight ?? this.meleeHeight,
      rangeOffset: meleeConfig?.rangeOffset ?? this.meleeRangeOffset,
      knockback: meleeConfig?.knockback ?? this.meleeKnockback,
      comboDamageMultiplier: meleeConfig?.comboDamageMultiplier ?? [1],
      bloodParticleScale: meleeConfig?.bloodParticleScale ?? 1,
      dashSpeed: meleeConfig?.dashSpeed ?? 0,
      dashDurationMs: meleeConfig?.dashDurationMs ?? 0,
      bloodProjectionParticleMultiplier: meleeConfig?.bloodParticleScale ?? 1,
    };
  }

  private getProjectionConfig(weapon: Weapon): {
    spreadDegrees: number;
    particleCount: number;
    speedMin: number;
    speedMax: number;
    sprayOffset: number;
    lifetimeMin: number;
    lifetimeMax: number;
  } {
    if (weapon.config.bloodProjection) {
      return weapon.config.bloodProjection;
    }

    return {
      spreadDegrees: 18,
      particleCount: 8,
      speedMin: 50,
      speedMax: 130,
      sprayOffset: 6,
      lifetimeMin: 180,
      lifetimeMax: 420,
    };
  }

  private playAudioProfile(context: AudioContext, profile: Array<{ startFrequency: number; endFrequency: number; durationMs: number; gain: number; delayMs?: number }>): void {
    profile.forEach((step) => {
      this.createBeep(context, step.startFrequency, step.durationMs, step.endFrequency, step.gain, step.delayMs);
    });
  }

  private getWeaponAudioProfile(
    weapon: Weapon,
    event: 'shoot' | 'impact' | 'projection',
  ): Array<{ startFrequency: number; endFrequency: number; durationMs: number; gain: number; delayMs?: number }> {
    const profile = weapon.config.audio?.[event];
    if (profile && profile.length > 0) {
      return profile;
    }

    if (event === 'shoot') {
      return [{ startFrequency: 420, endFrequency: 220, durationMs: 80, gain: 0.05 }];
    }

    if (event === 'projection') {
      return [{ startFrequency: 760, endFrequency: 520, durationMs: 35, gain: 0.018 }];
    }

    return [{ startFrequency: 190, endFrequency: 70, durationMs: 75, gain: 0.05 }];
  }

  private getMeleeProjectionConfig(): {
    particleCount: number;
    speedMin: number;
    speedMax: number;
    spreadDegrees: number;
    sprayOffset: number;
    lifetimeMin: number;
    lifetimeMax: number;
  } {
    return {
      particleCount: 6,
      speedMin: 25,
      speedMax: 90,
      spreadDegrees: 28,
      sprayOffset: 4,
      lifetimeMin: 140,
      lifetimeMax: 260,
    };
  }

  private isWideBloodProjection(weapon: Weapon): boolean {
    return this.getProjectionConfig(weapon).spreadDegrees >= 30;
  }

  private spawnBloodProjection(
    x: number,
    y: number,
    directionX: number,
    directionY: number,
    weapon: Weapon,
    color: number,
    isWide = false,
    options?: {
      playSound?: boolean;
      particleScale?: number;
    },
  ): void {
    if (options?.playSound !== false) {
      this.playProjectionSound(this.time.now, weapon);
    }
    const config = this.getProjectionConfig(weapon);
    const baseSpread = isWide ? config.spreadDegrees * 1.3 : config.spreadDegrees;
    const angle = Phaser.Math.RadToDeg(Math.atan2(directionY, directionX));
    const colorWithMode = this.applyDaltonianColor(color);
    const particleScale = Math.max(0.1, options?.particleScale ?? 1);
    const particleCount = Math.max(
      1,
      Math.round(
        (config.particleCount + config.sprayOffset) * this.getBloodProjectionVisualMultiplier() * particleScale,
      ),
    );

    this.bloodProjectionEmitter.setTexture('blood-splat');
    this.bloodProjectionEmitter.setTint(colorWithMode);
    this.bloodProjectionEmitter.setAngle({ min: angle - baseSpread, max: angle + baseSpread });
    this.bloodProjectionEmitter.setSpeed({ min: config.speedMin, max: config.speedMax });
    this.bloodProjectionEmitter.setLifespan({ min: config.lifetimeMin, max: config.lifetimeMax });
    this.registerParticleSpawn(particleCount);
    this.bloodProjectionEmitter.explode(particleCount, x + directionX * 2, y + directionY * 2);
  }

  private spawnMeleeBloodProjection(
    x: number,
    y: number,
    directionX: number,
    directionY: number,
    color: number,
    options?: {
      particleScale?: number;
    },
  ): void {
    this.playProjectionSound(this.time.now, this.fallbackWeapon);
    const config = this.getMeleeProjectionConfig();
    const angle = Phaser.Math.RadToDeg(Math.atan2(directionY, directionX));
    const colorWithMode = this.applyDaltonianColor(color);
    const particleScale = Math.max(0.1, options?.particleScale ?? 1);
    const particleCount = Math.max(
      1,
      Math.round(config.particleCount * this.getBloodProjectionVisualMultiplier() * particleScale),
    );

    this.bloodProjectionEmitter.setTexture('blood-splat');
    this.bloodProjectionEmitter.setTint(colorWithMode);
    this.bloodProjectionEmitter.setAngle({ min: angle - config.spreadDegrees, max: angle + config.spreadDegrees });
    this.bloodProjectionEmitter.setSpeed({ min: config.speedMin, max: config.speedMax });
    this.bloodProjectionEmitter.setLifespan({ min: config.lifetimeMin, max: config.lifetimeMax });
    this.registerParticleSpawn(particleCount);
    this.bloodProjectionEmitter.explode(particleCount, x + directionX * 3, y + directionY * 3);
  }

  private spawnWallProjection(
    x: number,
    y: number,
    impactX: number,
    impactY: number,
    weapon: Weapon,
    color: number,
  ): void {
    this.playProjectionSound(this.time.now, weapon);
    const config = this.getProjectionConfig(weapon);
    const dirX = x - impactX;
    const dirY = y - impactY;
    const angle = Phaser.Math.RadToDeg(Math.atan2(dirY, dirX));
    const colorWithMode = this.applyDaltonianColor(color);
    const particleCount = Math.max(2, Math.round((config.particleCount - 1) * this.getBloodProjectionVisualMultiplier()));
    const markWidth = Math.max(10, Math.round((config.particleCount * 2) * this.getBloodProjectionVisualMultiplier()));
    const markHeight = Math.max(6, Math.round((4 + config.particleCount * 0.25) * this.getBloodProjectionVisualMultiplier()));
    const markAlpha = 0.14 * this.getBloodTraceVisualMultiplier();

    this.bloodProjectionEmitter.setTexture('blood-splat-large');
    this.bloodProjectionEmitter.setTint(colorWithMode);
    this.bloodProjectionEmitter.setAngle({ min: angle - config.spreadDegrees, max: angle + config.spreadDegrees });
    this.bloodProjectionEmitter.setSpeed({ min: config.speedMin, max: config.speedMax * 0.6 });
    this.bloodProjectionEmitter.setLifespan({ min: config.lifetimeMin * 0.8, max: config.lifetimeMax * 0.8 });
    this.registerParticleSpawn(particleCount);
    this.bloodProjectionEmitter.explode(particleCount, impactX, impactY);

    const wallMark = this.add.image(impactX, impactY, 'blood-wall-mark');
    wallMark.setAngle(angle + 90);
    wallMark.setDepth(2);
    wallMark.setTint(colorWithMode);
    wallMark.setScale(markWidth / 28, markHeight / 12);
    wallMark.setAlpha(markAlpha);
    this.tweens.add({
      targets: wallMark,
      alpha: 0,
      duration: 600,
      yoyo: false,
      onComplete: () => {
        wallMark.destroy();
      },
    });
  }

  private playTemporaryShootSound(weapon: Weapon): void {
    const context = this.getAudioContext();
    if (!context) {
      return;
    }

    if (context.state === 'suspended') {
      context.resume().catch(() => undefined);
    }

    this.playAudioProfile(context, this.getWeaponAudioProfile(weapon, 'shoot'));
  }

  private createBeep(
    context: AudioContext,
    startFrequency: number,
    durationMs: number,
    endFrequency: number,
    gain: number,
    delayMs = 0,
  ): void {
    const safeMasterGain = this.getEffectGain();
    if (safeMasterGain <= 0) {
      return;
    }

    if (!this.canPlayAudioSource()) {
      return;
    }

    const now = context.currentTime + delayMs / 1000;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const safeGain = Math.max(0.001, gain * safeMasterGain * this.getAudioSaturationScale());

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(startFrequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, now + durationMs / 1000);
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(safeGain, now + 0.005);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);

    oscillator.connect(envelope);
    envelope.connect(context.destination);

    this.activeAudioSources += 1;
    oscillator.addEventListener('ended', () => {
      this.activeAudioSources = Math.max(0, this.activeAudioSources - 1);
    });
    oscillator.start(now);
    oscillator.stop(now + durationMs / 1000);
  }

  private createMeleeImpactSound(context: AudioContext): void {
    if (context.state === 'suspended') {
      context.resume().catch(() => undefined);
    }

    this.createBeep(context, 360, 55, 140, 0.035);
    this.createBeep(context, 500, 40, 280, 0.028, 45);
  }

  private playMeleeImpactSound(now: number): void {
    if (now < this.lastMeleeImpactSoundAt) {
      return;
    }

    const context = this.getAudioContext();
    if (!context) {
      return;
    }

    this.createMeleeImpactSound(context);
    this.lastMeleeImpactSoundAt = now + this.meleeImpactSoundCooldownMs;
  }

  private playImpactSound(now: number, impactDamage: number, weapon?: Weapon): void {
    if (now < this.lastImpactSoundAt) {
      return;
    }

    const context = this.getAudioContext();
    if (!context) {
      return;
    }

    if (context.state === 'suspended') {
      context.resume().catch(() => undefined);
    }

    this.playAudioProfile(context, this.getWeaponAudioProfile(weapon ?? this.fallbackWeapon, 'impact'));
    this.lastImpactSoundAt = now + this.impactSoundCooldownMs;
  }

  private playProjectionSound(now: number, weapon: Weapon): void {
    if (now < this.lastProjectionSoundAt) {
      return;
    }

    const context = this.getAudioContext();
    if (!context) {
      return;
    }

    if (context.state === 'suspended') {
      context.resume().catch(() => undefined);
    }

    this.playAudioProfile(context, this.getWeaponAudioProfile(weapon, 'projection'));
    this.lastProjectionSoundAt = now + this.projectionSoundCooldownMs;
  }

  private playRespawnSound(now: number): void {
    if (now < this.lastRespawnSoundAt) {
      return;
    }

    const context = this.getAudioContext();
    if (!context) {
      return;
    }

    this.createBeep(context, 680, 95, 320, 0.028);
    this.createBeep(context, 340, 95, 190, 0.022, 30);
    this.lastRespawnSoundAt = now + this.respawnSoundCooldownMs;
  }

  private playDeathSound(now: number): void {
    if (now < this.lastDeathSoundAt) {
      return;
    }

    const context = this.getAudioContext();
    if (!context) {
      return;
    }

    this.createBeep(context, 90, 120, 35, 0.05);
    this.createBeep(context, 190, 100, 70, 0.03, 25);
    this.lastDeathSoundAt = now + this.deathSoundCooldownMs;
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const ctor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!ctor) {
      return null;
    }

    if (!this.audioContext) {
      this.audioContext = new ctor();
    }

    return this.audioContext;
  }

  private getLowHealthAudioScale(): number {
    if (this.players.length <= 0) {
      return 1;
    }

    let minHealthRatio = 1;
    for (let index = 0; index < this.players.length; index += 1) {
      const player = this.players[index];
      if (!player) {
        continue;
      }

      const current = player.debugState.health;
      const max = player.debugState.maxHealth;
      if (max <= 0) {
        continue;
      }

      const ratio = current / max;
      if (ratio < minHealthRatio) {
        minHealthRatio = ratio;
      }
    }

    if (minHealthRatio >= 0.35) {
      return 1;
    }

    const tension = Phaser.Math.Clamp((0.35 - minHealthRatio) / 0.35, 0, 1);
    return 1 + 0.4 * tension;
  }

  private startAmbientMusicLoop(): void {
    if (this.ambientMusicLoop) {
      return;
    }

    this.ambientMusicLoop = this.time.addEvent({
      delay: this.ambientMusicLoopMs,
      loop: true,
      callback: () => {
        this.playAmbientMusicTick();
      },
    });
  }

  private stopAmbientMusicLoop(): void {
    if (!this.ambientMusicLoop) {
      return;
    }

    this.ambientMusicLoop.remove(false);
    this.ambientMusicLoop = undefined;
  }

  private playAmbientMusicTick(): void {
    const context = this.getAudioContext();
    if (!context) {
      return;
    }

    const lowHealthScale = this.getLowHealthAudioScale();
    const startFrequency = Math.round(90 * lowHealthScale);
    const endFrequency = Math.round(58 * lowHealthScale);
    const gain = 0.004 * lowHealthScale;
    this.createBeep(context, startFrequency, 1300, endFrequency, gain);
  }

  private spawnMuzzleFlash(shooter: Player, direction: number, weapon: Weapon): void {
    const flashDurationMs = weapon.muzzleFlashMs ?? 0;
    if (flashDurationMs <= 0) {
      return;
    }

    const flashIntensity = this.getFlashIntensity();
    if (flashIntensity <= 0) {
      return;
    }

    const flashLengthPx = Math.max(1, weapon.muzzleFlashLengthPx ?? 22);
    const flashHeightPx = Math.max(1, weapon.muzzleFlashHeightPx ?? 6);
    const flashOffsetPx = direction === 1 ? flashLengthPx / 2 : -flashLengthPx / 2;
    const flashTexture = this.getWeaponMuzzleFlashTexture(weapon);
    if (!this.textures.exists(flashTexture)) {
      const fallbackFlash = this.make.graphics({ x: 0, y: 0, add: false });
      fallbackFlash.fillStyle(0xfff0ab, 0.9);
      fallbackFlash.fillRect(0, 0, 22, 12);
      fallbackFlash.generateTexture(flashTexture, 22, 12);
      fallbackFlash.destroy();
    }

    const flashAnimation = this.getWeaponMuzzleFlashAnimation(weapon);
    if (flashAnimation && this.anims.exists(flashAnimation)) {
      const flashSprite = this.add
        .sprite(
          shooter.x + shooter.getMuzzleOffset() + flashOffsetPx,
          shooter.y + 16,
          flashTexture,
        )
        .setDisplaySize(flashLengthPx, flashHeightPx)
        .setTint(0xffddb6)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setAlpha(0.95 * flashIntensity)
        .setDepth(5);
      if (direction === -1) {
        flashSprite.setFlipX(true);
      }
      flashSprite.setOrigin(0.5, 0.5);
      flashSprite.play(flashAnimation);

      flashSprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        flashSprite.destroy();
      });
      return;
    }

    const flash = this.add.image(
      shooter.x + shooter.getMuzzleOffset() + flashOffsetPx,
      shooter.y + 16,
      flashTexture,
    );
    flash.setDepth(5);
    flash.setDisplaySize(flashLengthPx, flashHeightPx);
    flash.setTint(0xffddb6);
    flash.setAlpha(0.95 * flashIntensity);
    flash.setBlendMode(Phaser.BlendModes.ADD);
    if (direction === -1) {
      flash.setFlipX(true);
    }

    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: flashDurationMs,
      ease: 'Quad.easeOut',
      onComplete: () => {
        flash.destroy();
      },
    });
  }

  private spawnMeleeZone(player: Player): void {
    const meleeConfig = this.getWeaponMeleeConfig(player.equippedWeapon);
    const comboStep = player.getMeleeComboStep();
    const comboMultiplier = meleeConfig.comboDamageMultiplier[Math.max(0, comboStep - 1)] ?? 1;
    const meleeDamage = Math.max(1, Math.round(meleeConfig.damage * comboMultiplier * player.getCombatDamageMultiplier()));
    const zone = this.meleeZones.get(
      player.x + player.getFacingDirection() * meleeConfig.rangeOffset,
      player.y + 12,
      'melee',
    ) as Phaser.Physics.Arcade.Image | null;

    if (!zone) {
      return;
    }

    this.registerMeleeZoneSpawn();
    zone.setActive(true).setVisible(true);
    this.meleeZones.add(zone);
    zone.setDisplaySize(meleeConfig.rangeWidth, meleeConfig.rangeHeight);
    zone.setData('owner', player.profile.id);
    zone.setData('hitTargets', []);
    zone.setData('damage', meleeDamage);
    zone.setData('knockback', meleeConfig.knockback);
    zone.setData('bloodParticleScale', meleeConfig.bloodParticleScale);
    zone.setData('expiresAt', this.time.now + this.meleeEffectDurationMs);
    zone.body?.destroy();
    this.physics.world.enable(zone);
    const body = zone.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocity(0, 0);
    body.setImmovable(true);

    const direction = player.getFacingDirection();
    const meleeEffectTexture = this.getWeaponMeleeEffectTexture(player.equippedWeapon);
    if (!this.textures.exists(meleeEffectTexture)) {
      const fallbackMelee = this.make.graphics({ x: 0, y: 0, add: false });
      fallbackMelee.fillStyle(UI_THEME.gameplay.melee, 0.75);
      fallbackMelee.fillEllipse(0, 16, 36, 20);
      fallbackMelee.fillEllipse(14, 8, 18, 7);
      fallbackMelee.generateTexture('melee-hit', 54, 32);
      fallbackMelee.destroy();
    }

    const meleeVisual = this.add.image(
      player.x + direction * meleeConfig.rangeOffset,
      player.y + 12,
      meleeEffectTexture,
    );
    meleeVisual.setDepth(4);
    meleeVisual.setTint(0xffd8a2);
    meleeVisual.setAlpha(0.55);
    meleeVisual.setDisplaySize(meleeConfig.rangeWidth, meleeConfig.rangeHeight);
    meleeVisual.setOrigin(0.5, 0.5);
    meleeVisual.setAngle(direction * 8);
    if (direction === -1) {
      meleeVisual.setFlipX(true);
    }
      this.tweens.add({
      targets: meleeVisual,
      alpha: 0,
      duration: this.meleeEffectDurationMs,
      ease: 'Quad.easeOut',
      onComplete: () => {
        meleeVisual.destroy();
      },
    });

    const dashSpeed = meleeConfig.dashSpeed;
    if (dashSpeed > 0) {
      const meleeBody = player.body as Phaser.Physics.Arcade.Body;
      if (meleeBody) {
        meleeBody.setVelocityX(direction * dashSpeed);
      }

      if (meleeConfig.dashDurationMs > 0) {
        this.time.delayedCall(meleeConfig.dashDurationMs, () => {
          const playerBody = player.body as Phaser.Physics.Arcade.Body;
          if (!playerBody) {
            return;
          }

          const currentVelocityX = playerBody.velocity.x;
          if (Math.sign(currentVelocityX) === direction) {
            playerBody.setVelocityX(currentVelocityX * 0.22);
          }
        });
      }
    }
  }

  private cleanupTransientAttacks(): void {
    const now = this.time.now;
    const meleeChildren = this.meleeZones.getChildren();
    for (let index = meleeChildren.length - 1; index >= 0; index -= 1) {
      const zoneObj = meleeChildren[index];
      if (!zoneObj) {
        continue;
      }

      const zone = zoneObj as Phaser.Physics.Arcade.Image;
      const expiresAt = zone.getData('expiresAt') as number | undefined;

      if (expiresAt !== undefined && expiresAt <= now) {
        zone.destroy();
      }
    }

    const bulletChildren = this.bullets.getChildren();
    for (let index = bulletChildren.length - 1; index >= 0; index -= 1) {
      const bulletObj = bulletChildren[index];
      if (!bulletObj) {
        continue;
      }

      const bullet = bulletObj as Phaser.Physics.Arcade.Image;
      const maxRangePx = bullet.getData('maxRangePx') as number | undefined;
      const body = bullet.body as Phaser.Physics.Arcade.Body;
      const trailIntervalMs = (bullet.getData('trailIntervalMs') as number | undefined) ?? 0;
      const isStuckToWall = bullet.getData('isStuckToWall') === true;
      const wallStuckUntil = (bullet.getData('wallStuckUntil') as number | undefined) ?? 0;
      const explodeOnImpact = bullet.getData('explodesOnImpact') === true;
      const hasExploded = bullet.getData('hasExploded') === true;
      const explosionFuseMs = (bullet.getData('explosionFuseMs') as number | undefined) ?? 0;
      const spawnAt = bullet.getData('spawnAt') as number | undefined;

      if (explodeOnImpact && !hasExploded && explosionFuseMs > 0 && spawnAt !== undefined && now >= spawnAt + explosionFuseMs) {
        this.explodeProjectile(bullet);
        continue;
      }

      if (isStuckToWall && wallStuckUntil > 0 && now >= wallStuckUntil) {
        bullet.destroy();
        continue;
      }

      if (trailIntervalMs > 0) {
        const shooterId = bullet.getData('owner') as string | undefined;
        const owner = shooterId ? this.getPlayerById(shooterId) : undefined;
        const lastTrailAt = (bullet.getData('trailLastAt') as number | undefined) ?? 0;
        if (owner && now - lastTrailAt >= trailIntervalMs) {
          const trailWeapon = owner.equippedWeapon;
          const trailParticleScale = (bullet.getData('trailParticleScale') as number | undefined) ?? 0.35;
          const speedX = body?.velocity.x ?? 0;
          const speedY = body?.velocity.y ?? 0;
          const speedNorm = Math.hypot(speedX, speedY);
          if (speedNorm > 0) {
            this.spawnBloodProjection(
              bullet.x,
              bullet.y,
              -speedX / speedNorm,
              -speedY / speedNorm,
              trailWeapon,
              owner.bloodColor,
              false,
              { playSound: false, particleScale: trailParticleScale },
            );
            bullet.setData('trailLastAt', now);
          }
        }
      }
      if (!body) {
        continue;
      }

      const spawnX = bullet.getData('spawnX') as number | undefined;
      if (
        maxRangePx !== undefined &&
        spawnX !== undefined &&
        Math.abs(bullet.x - spawnX) >= maxRangePx
      ) {
        bullet.destroy();
        continue;
      }

      if (bullet.x < -40 || bullet.x > ARENA_WIDTH + 40 || bullet.y < -40 || bullet.y > ARENA_HEIGHT + 40) {
        bullet.destroy();
      }
    }
  }

  private cleanupGroundTraces(now = this.time.now): void {
    for (let index = this.groundTraces.length - 1; index >= 0; index -= 1) {
      const entry = this.groundTraces[index];
      if (!entry) {
        continue;
      }

      if (entry.expiresAt <= now) {
        entry.marker.destroy();
        this.groundTraces.splice(index, 1);
      }
    }
  }

  private processTransfusions(now: number, deltaMs: number): void {
    if (this.matchMode === 'relay') {
      for (let index = 0; index < this.players.length; index += 1) {
        const player = this.players[index];
        if (!player || !player.isTransfusing()) {
          continue;
        }

        this.processRelayTransfusion(player, now, deltaMs);
      }

      return;
    }

    if (this.matchMode === 'survival') {
      for (let index = 0; index < this.players.length; index += 1) {
        const player = this.players[index];
        if (!player || !player.isTransfusing()) {
          continue;
        }

        this.processSurvivalTransfusion(player, now, deltaMs);
      }

      return;
    }

    for (let index = 0; index < this.players.length; index += 1) {
      const player = this.players[index];
      if (!player || !player.isTransfusing()) {
        continue;
      }
      const healPerSecond = player.getTransfusionUnitsPerSecond();
      const requestedUnits = (healPerSecond * deltaMs) / 1000;
      const consumed = player.transfuse(requestedUnits);

      if (consumed <= 0) {
        continue;
      }

      this.matchTestMetrics.totalTransfusions += 1;
      this.matchTestMetrics.totalBloodRecovered += consumed;
      this.roundManager.recordSuccessfulTransfusion(player.profile.id, consumed);
      this.playTransfusionFeedback(player, now);
      if (!this.canProcessTransfusionSound(now)) {
        continue;
      }

      this.createTransfusionSound();
      this.lastTransfusionSoundAt = now + this.transfusionSoundCooldownMs;
    }
  }

  private processRelayTransfusion(source: Player, now: number, deltaMs: number): void {
    const healingTarget = this.findRelayHealingTarget(source, this.relayTransfusionRangePx);
    if (healingTarget) {
      this.processRelayHealing(source, healingTarget, now, deltaMs);
      return;
    }

    const reviveTarget = this.findRelayReviveTarget(source, this.relayReviveRangePx);
    if (reviveTarget) {
      this.processRelayRevive(source, reviveTarget, now);
      return;
    }

    source.stopTransfusion(now);
    this.relayTransfusionRemainderByProfileId.delete(source.profile.id);
  }

  private processRelayHealing(source: Player, target: Player, now: number, deltaMs: number): void {
    const sourceProfileId = source.profile.id;
    const sourceTeamId = this.getRelayTeamIdForProfile(sourceProfileId);
    const previousRemainder = this.relayTransfusionRemainderByProfileId.get(sourceProfileId) ?? 0;
    const rawRequest = source.getTransfusionUnitsPerSecond() * (deltaMs / 1000);
    const requestedUnits = Math.max(0, rawRequest + previousRemainder);
    const wantedUnits = target.getTransfusionConsumption(requestedUnits);

    if (wantedUnits <= 0) {
      source.stopTransfusion(now);
      this.relayTransfusionRemainderByProfileId.set(sourceProfileId, Math.max(0, requestedUnits));
      return;
    }

    if (sourceTeamId === undefined) {
      source.stopTransfusion(now);
      this.relayTransfusionRemainderByProfileId.delete(sourceProfileId);
      return;
    }

    const consumedFromTeam = this.consumeRelayTeamBlood(sourceTeamId, wantedUnits);
    if (consumedFromTeam <= 0) {
      source.stopTransfusion(now);
      this.relayTransfusionRemainderByProfileId.set(sourceProfileId, requestedUnits);
      return;
    }

    const healedUnits = target.applyTransfusionHealing(consumedFromTeam);
    if (healedUnits <= 0) {
      source.stopTransfusion(now);
      this.relayTransfusionRemainderByProfileId.set(sourceProfileId, requestedUnits);
      return;
    }

    this.relayTransfusionRemainderByProfileId.set(sourceProfileId, Math.max(0, requestedUnits - healedUnits));
    this.matchTestMetrics.totalTransfusions += 1;
    this.matchTestMetrics.totalBloodRecovered += healedUnits;
    this.roundManager.recordSuccessfulTransfusion(sourceProfileId, healedUnits);
    this.playTransfusionFeedback(source, now);
    if (!this.canProcessTransfusionSound(now)) {
      return;
    }

    this.createTransfusionSound();
    this.lastTransfusionSoundAt = now + this.transfusionSoundCooldownMs;
  }

  private processRelayRevive(source: Player, target: Player, now: number): void {
    const sourceProfileId = source.profile.id;
    const sourceTeamId = this.getRelayTeamIdForProfile(sourceProfileId);
    const spawnPoint = this.playerSpawnPoints.get(target.profile.id);
    if (sourceTeamId === undefined || !spawnPoint) {
      source.stopTransfusion(now);
      return;
    }

    if (this.getRelayTeamBloodPool(sourceTeamId) < this.relayReviveCostUnits) {
      source.stopTransfusion(now);
      this.relayTransfusionRemainderByProfileId.delete(sourceProfileId);
      return;
    }

    const consumedFromTeam = this.consumeRelayTeamBlood(sourceTeamId, this.relayReviveCostUnits);
    if (consumedFromTeam < this.relayReviveCostUnits) {
      source.stopTransfusion(now);
      return;
    }

    target.respawnAt(spawnPoint.x, spawnPoint.y);
    source.stopTransfusion(now);
    this.relayTransfusionRemainderByProfileId.delete(sourceProfileId);
    this.matchTestMetrics.totalTransfusions += 1;
    this.roundManager.recordSuccessfulTransfusion(sourceProfileId, consumedFromTeam);
    this.playTransfusionFeedback(source, now);
    if (!this.canProcessTransfusionSound(now)) {
      return;
    }

    this.createTransfusionSound();
    this.lastTransfusionSoundAt = now + this.transfusionSoundCooldownMs;
  }

  private processSurvivalTransfusion(source: Player, now: number, deltaMs: number): void {
    const sourceProfileId = source.profile.id;
    const reviveTarget = this.findSurvivalReviveTarget(source, this.survivalReviveRangePx);
    if (reviveTarget) {
      const reviveSpawnPoint = this.playerSpawnPoints.get(reviveTarget.profile.id);
      if (!reviveSpawnPoint) {
        source.stopTransfusion(now);
        return;
      }

      const consumedFromPool = this.consumeSurvivalTeamBlood(this.survivalTeamBloodReviveUnit);
      if (consumedFromPool <= 0) {
        source.stopTransfusion(now);
        return;
      }

      reviveTarget.respawnAt(reviveSpawnPoint.x, reviveSpawnPoint.y);
      source.stopTransfusion(now);
      this.matchTestMetrics.totalTransfusions += 1;
      this.roundManager.recordSuccessfulTransfusion(sourceProfileId, consumedFromPool);
      this.playTransfusionFeedback(source, now);
      if (!this.canProcessTransfusionSound(now)) {
        return;
      }

      this.createTransfusionSound();
      this.lastTransfusionSoundAt = now + this.transfusionSoundCooldownMs;
      return;
    }

    const healPerSecond = source.getTransfusionUnitsPerSecond();
    const requestedUnits = (healPerSecond * deltaMs) / 1000;
    const consumedFromReserve = source.transfuse(requestedUnits);
    if (consumedFromReserve <= 0) {
      return;
    }

    this.matchTestMetrics.totalTransfusions += 1;
    this.matchTestMetrics.totalBloodRecovered += consumedFromReserve;
    this.roundManager.recordSuccessfulTransfusion(sourceProfileId, consumedFromReserve);
    this.playTransfusionFeedback(source, now);
    if (!this.canProcessTransfusionSound(now)) {
      return;
    }

    this.createTransfusionSound();
    this.lastTransfusionSoundAt = now + this.transfusionSoundCooldownMs;
  }

  private findRelayHealingTarget(source: Player, maxRangePx: number): Player | undefined {
    const sourceProfileId = source.profile.id;
    const maxDistanceSq = maxRangePx * maxRangePx;
    let selected: Player | undefined;
    let selectedDistanceSq = Number.POSITIVE_INFINITY;

    for (let index = 0; index < this.players.length; index += 1) {
      const candidate = this.players[index];
      if (!candidate) {
        continue;
      }

      if (!isRelayAlly(this.playerTeamIdByProfileId, sourceProfileId, candidate.profile.id)) {
        continue;
      }

      if (candidate.health.isDead()) {
        continue;
      }

      if (candidate.isExsangue()) {
        continue;
      }

      const missingHealth = candidate.health.state.max - candidate.health.state.current;
      if (missingHealth <= 0) {
        continue;
      }

      const distanceSq = Phaser.Math.Distance.Squared(candidate.x, candidate.y, source.x, source.y);
      if (distanceSq <= maxDistanceSq && distanceSq < selectedDistanceSq) {
        selectedDistanceSq = distanceSq;
        selected = candidate;
      }
    }

    return selected;
  }

  private findRelayReviveTarget(source: Player, maxRangePx: number): Player | undefined {
    const sourceProfileId = source.profile.id;
    const maxDistanceSq = maxRangePx * maxRangePx;
    let selected: Player | undefined;
    let selectedDistanceSq = Number.POSITIVE_INFINITY;

    for (let index = 0; index < this.players.length; index += 1) {
      const candidate = this.players[index];
      if (!candidate || candidate.profile.id === sourceProfileId) {
        continue;
      }

      if (!isRelayAlly(this.playerTeamIdByProfileId, sourceProfileId, candidate.profile.id)) {
        continue;
      }

      if (!candidate.health.isDead() && !candidate.isExsangue()) {
        continue;
      }

      const distanceSq = Phaser.Math.Distance.Squared(candidate.x, candidate.y, source.x, source.y);
      if (distanceSq <= maxDistanceSq && distanceSq < selectedDistanceSq) {
        selectedDistanceSq = distanceSq;
        selected = candidate;
      }
    }

    return selected;
  }

  private findSurvivalReviveTarget(source: Player, maxRangePx: number): Player | undefined {
    const sourceProfileId = source.profile.id;
    const maxDistanceSq = maxRangePx * maxRangePx;
    let selected: Player | undefined;
    let selectedDistanceSq = Number.POSITIVE_INFINITY;

    for (let index = 0; index < this.players.length; index += 1) {
      const candidate = this.players[index];
      if (!candidate || candidate.profile.id === sourceProfileId) {
        continue;
      }

      if (!candidate.health.isDead() && !candidate.isExsangue()) {
        continue;
      }

      const distanceSq = Phaser.Math.Distance.Squared(candidate.x, candidate.y, source.x, source.y);
      if (distanceSq <= maxDistanceSq && distanceSq < selectedDistanceSq) {
        selectedDistanceSq = distanceSq;
        selected = candidate;
      }
    }

    return selected;
  }

  private processHemorrhages(now: number, deltaMs: number): void {
    for (let index = 0; index < this.players.length; index += 1) {
      const player = this.players[index];
      if (!player) {
        continue;
      }

      const lostHealth = player.processHemorrhage(now, deltaMs);
      if (lostHealth <= 0) {
        continue;
      }

      this.triggerHemorrhageTrace(player);
      if (!this.canProcessHemorrhageSound(now)) {
        continue;
      }

      this.createHemorrhageSound();
      this.lastHemorrhageSoundAt = now + this.hemorrhageSoundCooldownMs;
    }
  }

  private canProcessHemorrhageSound(now: number): boolean {
    return now >= this.lastHemorrhageSoundAt;
  }

  private canProcessTransfusionSound(now: number): boolean {
    return now >= this.lastTransfusionSoundAt;
  }

  private createHemorrhageSound(): void {
    const context = this.getAudioContext();
    if (!context) {
      return;
    }

    if (context.state === 'suspended') {
      context.resume().catch(() => undefined);
    }

    this.createBeep(context, 165, 45, 115, 0.02, 0);
  }

  private createTransfusionSound(): void {
    const context = this.getAudioContext();
    if (!context) {
      return;
    }

    if (context.state === 'suspended') {
      context.resume().catch(() => undefined);
    }

    this.createBeep(context, 640, 80, 360, 0.045, 0);
  }

  private createExsangueSound(): void {
    const now = this.time.now;
    if (now < this.lastExsangueSoundAt) {
      return;
    }

    const context = this.getAudioContext();
    if (!context) {
      return;
    }

    if (context.state === 'suspended') {
      context.resume().catch(() => undefined);
    }

    this.createBeep(context, 280, 70, 135, 0.028);
    this.createBeep(context, 110, 110, 45, 0.022, 30);
    this.lastExsangueSoundAt = now + this.exsangueSoundCooldownMs;
  }

  private playTransfusionFeedback(player: Player, now: number): void {
    if (now - this.lastTransfusionVisualAt < this.transfusionVisualCooldownMs) {
      return;
    }

    this.triggerProfileVibration(player.profile, 0.18, 60);
    this.triggerTransfusionVisualEffect(player);
    this.lastTransfusionVisualAt = now;
  }

  private updateBloodPools(now: number, deltaMs: number): void {
    for (let index = this.bloodPools.length - 1; index >= 0; index -= 1) {
      const pool = this.bloodPools[index];

      if (!pool) {
        this.bloodPools.splice(index, 1);
        continue;
      }

      const alive = pool.update(now, deltaMs);
      if (!alive) {
        this.removeBloodPool(pool);
        continue;
      }

      const absorber = this.pickAbsorbingPlayer(pool);
      if (!absorber) {
        continue;
      }

      const absorbRate = (this.bloodPoolAbsorbUnitsPerSecond * deltaMs) / 1000;
      const maxToAbsorb = Math.max(1, Math.floor(absorbRate));
      if (maxToAbsorb <= 0) {
        continue;
      }

      const consumedByPool = pool.consumeUnits(maxToAbsorb);
      if (consumedByPool <= 0) {
        continue;
      }

      const absorberTeamId = this.getRelayTeamIdForProfile(absorber.profile.id);
      const absorbedUnits =
        this.matchMode === 'relay' && absorberTeamId !== undefined
          ? this.addRelayTeamBlood(absorberTeamId, consumedByPool)
          : this.matchMode === 'survival'
            ? this.addSurvivalTeamBlood(consumedByPool)
            : absorber.addBloodReserve(consumedByPool);
      if (absorbedUnits <= 0) {
        continue;
      }

      this.matchTestMetrics.totalBloodRecovered += absorbedUnits;
      this.recordPoolAbsorption(absorber.profile.id, absorbedUnits);
      this.matchTestMetrics.totalPoolAbsorptions += 1;
      this.roundManager.recordBloodRecovered(absorber.profile.id, absorbedUnits);
      this.playBloodAbsorbFeedback(now, absorber);
      pool.pulseAbsorption();
    }
  }

  private pickAbsorbingPlayer(pool: BloodPool): Player | undefined {
    let selected: Player | undefined;
    let closestDistanceSq = Number.POSITIVE_INFINITY;

    for (let index = 0; index < this.players.length; index += 1) {
      const player = this.players[index];
      if (!player) {
        continue;
      }

      if (!canBeAbsorbingCandidate(player)) {
        continue;
      }

      if (!isPlayerWithinBloodPoolContact(player.x, player.y, {
        poolX: pool.x,
        poolY: pool.y,
        playerX: player.x,
        playerY: player.y,
        poolRadius: pool.currentRadius,
        absorbContactRadiusPx: this.bloodPoolAbsorbContactRadiusPx,
      })) {
        continue;
      }

      const distanceSq = Phaser.Math.Distance.Squared(player.x, player.y, pool.x, pool.y);
      if (distanceSq < closestDistanceSq) {
        closestDistanceSq = distanceSq;
        selected = player;
      }
    }

    return selected;
  }

  private playBloodAbsorbFeedback(now: number, player: Player): void {
    this.triggerProfileVibration(player.profile, 0.2, 65);

    if (now < this.lastBloodAbsorbSoundAt) {
      return;
    }

    const context = this.getAudioContext();
    if (!context) {
      return;
    }

    if (context.state === 'suspended') {
      context.resume().catch(() => undefined);
    }

    this.createBeep(context, 360, 80, 280, 0.035, 0);
    this.lastBloodAbsorbSoundAt = now + this.bloodPoolSoundCooldownMs;
  }

  private triggerHemorrhageTrace(player: Player): void {
    const trace = this.add.ellipse(player.x, player.y + 24, 18, 5, 0x6b0e1d, 0.28);
    trace.setDepth(4);
    trace.setRotation(-Math.PI / 6);

    this.tweens.add({
      targets: trace,
      alpha: 0,
      scaleX: 1.2,
      scaleY: 0.55,
      duration: this.hemorrhageTraceCooldownMs,
      onComplete: () => {
        trace.destroy();
      },
    });
  }

  private spawnBloodPool(
    x: number,
    y: number,
    units: number,
    ownerProfileId: string,
    color: number,
  ): void {
    const clampedUnits = Math.max(0, Math.floor(units));
    if (clampedUnits <= 0) {
      return;
    }

    const existing = this.findMergeableBloodPool(x, y);
    const now = this.time.now;

    const poolColor = this.applyDaltonianColor(color);
    if (existing) {
      existing.mergeUnits(clampedUnits, ownerProfileId, poolColor, now);
      return;
    }

    if (this.bloodPools.length >= this.bloodPoolMaxCount) {
      const expendable = this.findSmallestBloodPool();
      if (expendable) {
        this.removeBloodPool(expendable);
      } else {
        return;
      }
    }

    const pool = new BloodPool(this, x, y, clampedUnits, ownerProfileId, poolColor, {
      now,
      lifetimeMs: this.bloodLedger.config.spillLifetimeMs,
      minRadiusPx: 12,
      maxRadiusPx: 56,
      radiusPerUnit: 0.9,
      growthSpeedMs: 120,
      minAlpha: 0.12 * this.getBloodProjectionVisualMultiplier(),
      maxAlpha: 0.35 * this.getBloodProjectionVisualMultiplier(),
      fadeDurationMs: 520,
      maxUnits: this.bloodLedger.config.maxUnitsPerImpact ? this.bloodLedger.config.maxUnitsPerImpact * 2 : 180,
    });
    this.bloodPools.push(pool);
  }

  private findMergeableBloodPool(x: number, y: number): BloodPool | undefined {
    for (const pool of this.bloodPools) {
      const distanceSq = Phaser.Math.Distance.Squared(x, y, pool.x, pool.y);
      if (distanceSq <= this.bloodPoolMergeDistancePx * this.bloodPoolMergeDistancePx) {
        return pool;
      }
    }

    return undefined;
  }

  private findSmallestBloodPool(): BloodPool | undefined {
    let chosen: BloodPool | undefined;
    let smallestUnits = Number.POSITIVE_INFINITY;

    for (let index = 0; index < this.bloodPools.length; index += 1) {
      const pool = this.bloodPools[index];
      if (pool.units < smallestUnits) {
        smallestUnits = pool.units;
        chosen = pool;
      }
    }

    return chosen;
  }

  private removeBloodPool(pool: BloodPool): void {
    const index = this.bloodPools.indexOf(pool);
    if (index >= 0) {
      this.bloodPools.splice(index, 1);
    }

    pool.destroy();
  }

  private explodeProjectile(projectileObj: Phaser.GameObjects.GameObject): void {
    const projectile = projectileObj as Phaser.Physics.Arcade.Image;
    if (projectile.getData('hasExploded') === true) {
      return;
    }

    const ownerId = projectile.getData('owner') as string | undefined;
    const attacker = this.getPlayerById(ownerId);
    const attackerWeapon = attacker?.equippedWeapon ?? this.fallbackWeapon;
    const impactX = projectile.x;
    const impactY = projectile.y;
    const now = this.time.now;
    const explosionRadiusPx = Math.max(
      0,
      Math.floor((projectile.getData('explosionRadiusPx') as number | undefined) ?? 0),
    );
    const explosionDamage = Math.max(
      1,
      Math.round((projectile.getData('explosionDamage') as number | undefined) ?? attackerWeapon.config.projectile.damage ?? 1),
    );
    const explosionKnockback = Math.max(
      1,
      Math.round(
        (projectile.getData('explosionKnockback') as number | undefined)
        ?? attackerWeapon.config.recoilForce,
      ),
    );
    const poolCount = Math.max(2, Math.floor((projectile.getData('explosionPoolCount') as number | undefined) ?? 2));
    const bloodSourceProfileId = ownerId ?? 'grenade';

    projectile.setData('hasExploded', true);
    projectile.destroy();

    if (explosionRadiusPx <= 0) {
      return;
    }

    const impactColor = this.applyDaltonianColor(attacker?.bloodColor ?? 0xbb4444);
    this.spawnWallProjection(impactX, impactY, impactX, impactY, attackerWeapon, impactColor);
    this.spawnWallGroundTrace(impactX, impactY, impactColor);
    this.spawnImpactFlash(impactX, impactY, impactColor, Math.max(14, Math.round(explosionRadiusPx * 0.18)));
    this.spawnImpactSparks(impactX, impactY, 0, 0, 1.25);
    this.playImpactSound(now, explosionDamage, attackerWeapon);
    this.triggerImpactDistortion(impactX, impactY, explosionDamage, explosionKnockback);
    this.triggerImpactLocalVibration(impactX, impactY, explosionDamage, explosionKnockback);
    this.triggerImpactCameraRecoil(impactX, impactY, explosionDamage, explosionKnockback);
    this.triggerImpactHitStop(explosionDamage, explosionKnockback);
    this.triggerImpactShake();

    const blastRadiusSq = explosionRadiusPx * explosionRadiusPx;
    const hasAttacker = !!attacker;
    for (let index = 0; index < this.players.length; index += 1) {
      const player = this.players[index];
      if (!player || player.health.isDead()) {
        continue;
      }

      if (hasAttacker && player.profile.id === attacker.profile.id) {
        continue;
      }

      const deltaX = player.x - impactX;
      const deltaY = player.y - impactY;
      const distanceSq = Phaser.Math.Distance.Squared(impactX, impactY, player.x, player.y);
      if (distanceSq > blastRadiusSq) {
        continue;
      }

      const distance = Math.max(1, Math.hypot(deltaX, deltaY));
      const distanceFactor = Phaser.Math.Clamp(1 - distance / explosionRadiusPx, 0.06, 1);
      const blastDamage = Math.max(1, Math.round(explosionDamage * (0.45 + distanceFactor * 0.55)));
      const blastKnockback = Math.max(1, Math.round(explosionKnockback * (0.45 + distanceFactor * 0.55)));
      const preHealth = player.debugState.health;
      const knockbackDirection = deltaX !== 0 ? Math.sign(deltaX) : (attacker ? Math.sign(player.x - attacker.x) : 1);

      const damaged = player.takeDamage(blastDamage, ownerId, now, blastKnockback, knockbackDirection || 1);
      if (!damaged) {
        continue;
      }

      const wasEliminated = player.health.isDead();
      const body = player.body as Phaser.Physics.Arcade.Body | undefined;
      if (body) {
        body.setVelocityX(knockbackDirection * blastKnockback);
        if (body.velocity.y >= -10) {
          body.setVelocityY(-Math.min(260, blastKnockback * 0.6));
        }
      }

      if (ownerId) {
        this.roundManager.recordDamageDealt(ownerId, blastDamage);
      }
      const dirX = deltaX / distance;
      const dirY = deltaY / distance;
      this.spawnBloodProjection(player.x, player.y, dirX, dirY, attackerWeapon, impactColor);
      this.spawnWallGroundTrace(player.x, player.y + 4, impactColor);
      this.spawnImpactFlash(player.x, player.y + 4, impactColor, 13);
      this.spawnImpactSparks(player.x, player.y + 4, dirX, dirY, 0.75);
      this.triggerImpactLocalVibration(player.x, player.y + 4, blastDamage, blastKnockback);
      this.triggerImpactCameraRecoil(player.x, player.y + 4, blastDamage, blastKnockback);
      this.triggerImpactHitStop(blastDamage, blastKnockback);

      if (wasEliminated) {
        this.recordWeaponElimination(attackerWeapon.config.id);
      }

      if (wasEliminated && preHealth >= this.eliminationSlowMotionThreshold) {
        this.triggerEliminationSlowMotion(blastDamage);
      }
    }

    const centerPoolUnits = Math.max(1, Math.round(explosionDamage * 1.4));
    this.spawnBloodPool(impactX, impactY, centerPoolUnits, bloodSourceProfileId, impactColor);
    for (let index = 0; index < poolCount; index += 1) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const travel = Phaser.Math.FloatBetween(Math.max(12, explosionRadiusPx * 0.22), Math.max(12, explosionRadiusPx * 0.72));
      const poolX = impactX + Math.cos(angle) * travel;
      const poolY = impactY + Math.sin(angle) * travel * 0.45;
      this.spawnBloodPool(poolX, poolY, Math.max(1, Math.round(centerPoolUnits * 0.5)), bloodSourceProfileId, impactColor);
    }
    const sprayCount = Math.max(4, poolCount + 1);
    for (let index = 0; index < sprayCount; index += 1) {
      const sprayAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const sprayX = Math.cos(sprayAngle);
      const sprayY = Math.sin(sprayAngle);
      this.spawnBloodProjection(impactX, impactY, sprayX, sprayY, attackerWeapon, impactColor, true, {
        particleScale: 0.78,
      });
    }
  }

  private destroyBullet(
    projectileObj: Phaser.GameObjects.GameObject,
    platformObj: Phaser.GameObjects.GameObject,
  ): void {
    const projectile = projectileObj as Phaser.Physics.Arcade.Image;
    if (projectile.getData('explodesOnImpact') === true) {
      this.explodeProjectile(projectile);
      return;
    }

    const projectileOwner = this.getPlayerById(projectile.getData('owner') as string | undefined);
    const now = this.time.now;
    const wallX = projectile.x;
    const wallY = projectile.y;
    const impactX = wallX;
    const impactY = wallY;
    const vx = projectile.body?.velocity.x ?? 0;
    const vy = projectile.body?.velocity.y ?? 0;
    const wallHit = projectile.getData('wallHit') as boolean | undefined;

    if (projectileOwner && !wallHit && Math.abs(vx) + Math.abs(vy) > 0) {
      const markerColor = projectileOwner.bloodColor;
      const weapon = projectileOwner.equippedWeapon;
      this.spawnWallProjection(
        platformObj.x,
        platformObj.y,
        impactX,
        impactY,
        weapon,
        markerColor,
      );
      this.spawnWallGroundTrace(impactX, impactY, markerColor);
      this.spawnImpactFlash(impactX, impactY, markerColor, 20);
      this.spawnImpactSparks(impactX, impactY, -vx, -vy, 0.95);
      this.playImpactSound(now, weapon.config.damage, weapon);
      this.triggerImpactDistortion(impactX, impactY, 0, weapon.config.recoilForce ?? 0);
      this.triggerImpactLocalVibration(impactX, impactY, 0, weapon.config.recoilForce ?? 0);
      this.triggerImpactCameraRecoil(impactX, impactY, 0, weapon.config.recoilForce ?? 0);
      this.triggerImpactHitStop(0, weapon.config.recoilForce ?? 0);
      this.triggerImpactShake();
    }

    const wallInteraction = (projectile.getData('wallInteraction') as 'destroy' | 'passThrough' | undefined)
      ?? (projectileOwner?.equippedWeapon.config.wallInteraction ?? this.fallbackWeapon.config.wallInteraction ?? 'destroy');
    projectile.setData('wallHit', true);

    if (wallInteraction === 'passThrough') {
      const wallStickingMs = (projectile.getData('wallStickingMs') as number | undefined) ?? 0;
      if (wallStickingMs > 0) {
        const embeddedTexture = (projectile.getData('embeddedProjectileTexture') as string | undefined) ?? 'projectile-crossbow-embedded';
        if (this.textures.exists(embeddedTexture)) {
          projectile.setTexture(embeddedTexture);
        }
        projectile.setData('isStuckToWall', true);
        projectile.setData('wallStuckUntil', now + wallStickingMs);
        const body = projectile.body as Phaser.Physics.Arcade.Body | undefined;
        if (body) {
          body.enable = false;
        }
        return;
      }

      const body = projectile.body as Phaser.Physics.Arcade.Body | undefined;
      if (body) {
        const velocityX = (projectile.getData('velocityX') as number | undefined) ?? vx;
        const velocityY = (projectile.getData('velocityY') as number | undefined) ?? vy;
        body.setVelocity(velocityX, velocityY);
      }
      return;
    }

    projectileObj.destroy();
  }

  private spawnWallGroundTrace(x: number, y: number, color: number): void {
    const markWidth = 26 * this.getBloodProjectionVisualMultiplier();
    const markHeight = 4 * this.getBloodProjectionVisualMultiplier();
    const mark = this.add.image(
      x,
      y - 2,
      'blood-trace',
    );
    mark.setDepth(2);
    mark.setTint(this.applyDaltonianColor(color));
    mark.setScale(markWidth / 44, markHeight / 6);
    mark.setAngle(Phaser.Math.Between(0, 360));
    mark.setAlpha(0.16 * this.getBloodTraceVisualMultiplier());

    this.tweens.add({
      targets: mark,
      alpha: 0,
      duration: 420,
      onComplete: () => {
        mark.destroy();
      },
    });

    this.groundTraces.push({ marker: mark, expiresAt: this.time.now + 420 });
  }

  private spawnBloodFootprint(player: Player, now: number): void {
    const profileId = player.profile.id;
    const lastFootprint = this.playerLastBloodFootstep.get(profileId) ?? 0;
    if (now - lastFootprint < this.bloodFootprintCooldownMs) {
      return;
    }

    const body = player.body as Phaser.Physics.Arcade.Body | undefined;
    const stepDistance = Math.abs(body?.velocity.x ?? 0) / 100;
    if (stepDistance <= 0.5) {
      return;
    }

    this.playerLastBloodFootstep.set(profileId, now);
    const direction = body?.velocity.x ? Math.sign(body.velocity.x) : (player.debugState.facing === 'right' ? 1 : -1);
    const stepOffsetX = direction * 8 + Phaser.Math.Between(-2, 2);
    const markWidth = (8 + stepDistance * 3) * this.getBloodTraceVisualMultiplier();
    const markHeight = 3 * this.getBloodTraceVisualMultiplier();
    const mark = this.add.rectangle(
      player.x + stepOffsetX,
      player.y + 11,
      Math.max(6, markWidth),
      Math.max(2, markHeight),
      this.applyDaltonianColor(player.bloodColor),
      0.13 * this.getBloodTraceVisualMultiplier(),
    );
    mark.setDepth(2);
    mark.setAngle(Phaser.Math.Between(-16, 16));
    mark.setAlpha(0.13 * this.getBloodTraceVisualMultiplier());
    mark.setScale(1, 1.1);

    const lifespanMs = 700 + Math.min(380, stepDistance * 60);
    this.tweens.add({
      targets: mark,
      alpha: 0,
      duration: lifespanMs,
      onComplete: () => {
        mark.destroy();
      },
    });

    this.groundTraces.push({ marker: mark, expiresAt: now + lifespanMs });
  }

  private shouldHitWithProjectile(projectileObj: Phaser.GameObjects.GameObject, playerObj: Phaser.GameObjects.GameObject): boolean {
    const projectile = projectileObj as Phaser.Physics.Arcade.Image;
    if (projectile.getData('hasExploded') === true) {
      return false;
    }

    if (playerObj && playerObj instanceof Player && playerObj.isParrying(this.time.now)) {
      return false;
    }

    if (projectile.getData('isStuckToWall') === true) {
      return false;
    }

    const player = playerObj as Player;
    const ownerId = projectile.getData('owner') as string | undefined;
    const remainingPlayerHits = projectile.getData('remainingPlayerHits') as number | undefined;
    const hitTargets = projectile.getData('hitTargets') as string[] | undefined;

    if (player.health.isDead()) {
      return false;
    }

    if (ownerId === player.profile.id) {
      return false;
    }

    if (remainingPlayerHits !== undefined && remainingPlayerHits <= 0) {
      return false;
    }

    return !(hitTargets ?? []).includes(player.profile.id);
  }

  private onProjectileHit(
    projectileObj: Phaser.GameObjects.GameObject,
    playerObj: Phaser.GameObjects.GameObject,
  ): void {
    const player = playerObj as Player;
    const projectile = projectileObj as Phaser.Physics.Arcade.Image;

    if (projectile.getData('explodesOnImpact') === true) {
      this.explodeProjectile(projectile);
      return;
    }

    const ownerId = projectile.getData('owner') as string | undefined;
    const attackerProfile = this.getProfileById(ownerId);
    const attacker = this.getPlayerById(ownerId);
    const hitTargets = projectile.getData('hitTargets') as string[] | undefined;
    const maxPlayerHits = Math.max(1, Math.floor((projectile.getData('maxPlayerHits') as number | undefined) ?? 1));
    const remainingPlayerHits = Math.max(0, Math.floor((projectile.getData('remainingPlayerHits') as number | undefined) ?? maxPlayerHits));
    const preHealth = player.debugState.health;
    const knockbackDirection = attacker ? Math.sign(player.x - attacker.x) : Math.sign(player.x - projectile.x);
    const spreadDirectionX = (attacker ? attacker.x : projectile.x) - player.x;
    const spreadDirectionY = (attacker ? attacker.y : projectile.y) - player.y;
    const now = this.time.now;
    const bulletVelocityX = projectile.body?.velocity.x ?? 0;
    const bulletVelocityY = projectile.body?.velocity.y ?? 0;
    const bulletDamage = (projectile.getData('damage') as number | undefined)
      ?? this.fallbackWeapon.config.damage;
    const knockbackForce = (projectile.getData('knockback') as number | undefined) ?? this.fallbackWeapon.config.recoilForce;
    const nextTargets = hitTargets ? [...hitTargets] : [];
    const wasAlreadyHit = nextTargets.includes(player.profile.id);
    const nextRemainingHits = remainingPlayerHits - 1;

    if (wasAlreadyHit) {
      return;
    }

    if (remainingPlayerHits <= 0) {
      projectile.destroy();
      return;
    }

    const damaged = player.takeDamage(
      bulletDamage,
      ownerId,
      this.time.now,
      knockbackForce,
      knockbackDirection !== 0 ? knockbackDirection : 1,
    );
    const wasEliminated = player.health.isDead();

    if (!damaged) {
      return;
    }

    nextTargets.push(player.profile.id);
    projectile.setData('hitTargets', nextTargets);
    projectile.setData('remainingPlayerHits', nextRemainingHits);

    if (ownerId) {
      this.roundManager.recordDamageDealt(ownerId, bulletDamage);
    }

    const impactWeapon = attacker?.equippedWeapon ?? this.fallbackWeapon;
    const impactColor = this.applyDaltonianColor(attacker?.bloodColor ?? 0xbb4444);
    const dirNorm = Math.max(0.001, Math.hypot(spreadDirectionX, spreadDirectionY));
    this.spawnBloodProjection(
      player.x,
      player.y,
      spreadDirectionX / dirNorm,
      spreadDirectionY / dirNorm,
      impactWeapon,
      impactColor,
      this.isWideBloodProjection(impactWeapon),
    );
    this.spawnWallGroundTrace(player.x, player.y, impactColor);
    this.spawnImpactFlash(player.x, player.y, impactColor, 16);
    this.spawnImpactSparks(player.x, player.y, -bulletVelocityX, -bulletVelocityY, 1.15);
    this.playImpactSound(now, bulletDamage, impactWeapon);
    this.triggerImpactDistortion(player.x, player.y, bulletDamage, knockbackForce);
    this.triggerImpactLocalVibration(player.x, player.y, bulletDamage, knockbackForce);
    this.triggerImpactCameraRecoil(player.x, player.y, bulletDamage, knockbackForce);
    this.triggerImpactHitStop(bulletDamage, knockbackForce);
    if (wasEliminated) {
      this.recordWeaponElimination(impactWeapon.config.id);
    }
    if (wasEliminated && preHealth >= this.eliminationSlowMotionThreshold) {
      this.triggerEliminationSlowMotion(bulletDamage);
    }
    this.triggerImpactShake();

    this.triggerProfileVibration(player.profile, 0.7, 80);
    if (attackerProfile) {
      this.triggerProfileVibration(attackerProfile, 0.25, 80);
    }

    if (nextRemainingHits <= 0) {
      projectile.destroy();
    }
  }

  private getProjectileRemainingHits(projectile: Phaser.Physics.Arcade.Image, maxHitDataKey: string, remainingHitDataKey: string): number {
    const maxHits = Math.max(
      1,
      Math.floor((projectile.getData(maxHitDataKey) as number | undefined) ?? 1),
    );
    return Math.max(0, Math.floor((projectile.getData(remainingHitDataKey) as number | undefined) ?? maxHits));
  }

  private shouldHitWithProjectileEnemy(
    projectileObj: Phaser.GameObjects.GameObject,
    enemyObj: Phaser.GameObjects.GameObject,
  ): boolean {
    const projectile = projectileObj as Phaser.Physics.Arcade.Image;
    if (projectile.getData('hasExploded') === true) {
      return false;
    }

    if (projectile.getData('isStuckToWall') === true) {
      return false;
    }

    const enemy = enemyObj as Enemy;
    const ownerId = projectile.getData('owner') as string | undefined;
    const remainingEnemyHits = this.getProjectileRemainingHits(projectile, 'maxEnemyHits', 'remainingEnemyHits');
    const hitTargets = projectile.getData('hitTargets') as string[] | undefined;

    if (!enemy.active || enemy.health.isDead()) {
      return false;
    }

    if (ownerId === enemy.sourceProfileId) {
      return false;
    }

    if (remainingEnemyHits <= 0) {
      return false;
    }

    return !(hitTargets ?? []).includes(enemy.id);
  }

  private onProjectileHitEnemy(
    projectileObj: Phaser.GameObjects.GameObject,
    enemyObj: Phaser.GameObjects.GameObject,
  ): void {
    const projectile = projectileObj as Phaser.Physics.Arcade.Image;
    const enemy = enemyObj as Enemy;

    if (projectile.getData('explodesOnImpact') === true) {
      this.explodeProjectile(projectile);
      return;
    }

    const ownerId = projectile.getData('owner') as string | undefined;
    const attackerProfile = this.getProfileById(ownerId);
    const attacker = this.getPlayerById(ownerId);
    const hitTargets = projectile.getData('hitTargets') as string[] | undefined;
    const maxEnemyHits = Math.max(1, Math.floor((projectile.getData('maxEnemyHits') as number | undefined) ?? 1));
    const remainingEnemyHits = Math.max(0, Math.floor((projectile.getData('remainingEnemyHits') as number | undefined) ?? maxEnemyHits));
    const preHealth = enemy.health.state.current;
    const knockbackDirection = attacker ? Math.sign(enemy.x - attacker.x) : Math.sign(enemy.x - projectile.x);
    const spreadDirectionX = (attacker ? attacker.x : projectile.x) - enemy.x;
    const spreadDirectionY = (attacker ? attacker.y : projectile.y) - enemy.y;
    const now = this.time.now;
    const bulletVelocityX = projectile.body?.velocity.x ?? 0;
    const bulletVelocityY = projectile.body?.velocity.y ?? 0;
    const bulletDamage = (projectile.getData('damage') as number | undefined) ?? this.fallbackWeapon.config.damage;
    const knockbackForce = (projectile.getData('knockback') as number | undefined) ?? this.fallbackWeapon.config.recoilForce;
    const nextTargets = hitTargets ? [...hitTargets] : [];
    const wasAlreadyHit = nextTargets.includes(enemy.id);
    const nextRemainingHits = remainingEnemyHits - 1;

    if (wasAlreadyHit) {
      return;
    }

    if (remainingEnemyHits <= 0) {
      projectile.destroy();
      return;
    }

    const damaged = enemy.takeDamage(
      bulletDamage,
      ownerId,
      now,
      knockbackForce,
      knockbackDirection !== 0 ? knockbackDirection : 1,
    );
    if (!damaged) {
      return;
    }

    nextTargets.push(enemy.id);
    projectile.setData('hitTargets', nextTargets);
    projectile.setData('remainingEnemyHits', nextRemainingHits);

    if (ownerId) {
      this.roundManager.recordDamageDealt(ownerId, bulletDamage);
    }

    const impactWeapon = attacker?.equippedWeapon ?? this.fallbackWeapon;
    const impactColor = this.applyDaltonianColor(attacker?.bloodColor ?? 0xbb4444);
    const dirNorm = Math.max(0.001, Math.hypot(spreadDirectionX, spreadDirectionY));
    this.spawnBloodProjection(
      enemy.x,
      enemy.y,
      spreadDirectionX / dirNorm,
      spreadDirectionY / dirNorm,
      impactWeapon,
      impactColor,
      this.isWideBloodProjection(impactWeapon),
    );
    this.spawnWallGroundTrace(enemy.x, enemy.y, impactColor);
    this.spawnImpactFlash(enemy.x, enemy.y, impactColor, 16);
    this.spawnImpactSparks(enemy.x, enemy.y, -bulletVelocityX, -bulletVelocityY, 1.15);
    this.playImpactSound(now, bulletDamage, impactWeapon);
    this.triggerImpactDistortion(enemy.x, enemy.y, bulletDamage, knockbackForce);
    this.triggerImpactLocalVibration(enemy.x, enemy.y, bulletDamage, knockbackForce);
    this.triggerImpactCameraRecoil(enemy.x, enemy.y, bulletDamage, knockbackForce);
    this.triggerImpactHitStop(bulletDamage, knockbackForce);

    if (enemy.health.isDead() && ownerId) {
      this.roundManager.recordScore(ownerId, enemy.scoreValue);
      this.recordWeaponElimination(impactWeapon.config.id);
      if (preHealth >= this.eliminationSlowMotionThreshold) {
        this.triggerEliminationSlowMotion(knockbackForce);
      }
    }

    if (attackerProfile) {
      this.triggerProfileVibration(attackerProfile, 0.25, 80);
    }

    if (nextRemainingHits <= 0) {
      projectile.destroy();
    }
  }

  private shouldHitWithMeleeEnemy(
    attackObj: Phaser.GameObjects.GameObject,
    enemyObj: Phaser.GameObjects.GameObject,
  ): boolean {
    const attack = attackObj as Phaser.Physics.Arcade.Image;
    const enemy = enemyObj as Enemy;
    const ownerId = attack.getData('owner') as string | undefined;

    if (enemy.health.isDead()) {
      return false;
    }

    if (ownerId === enemy.id) {
      return false;
    }

    return true;
  }

  private onMeleeHitEnemy(
    attackObj: Phaser.GameObjects.GameObject,
    enemyObj: Phaser.GameObjects.GameObject,
  ): void {
    const enemy = enemyObj as Enemy;
    const attackerId = attackObj.getData('owner') as string | undefined;
    const attacker = this.getPlayerById(attackerId);
    const now = this.time.now;
    const preHealth = enemy.health.state.current;
    const hitTargets = attackObj.getData('hitTargets') as string[] | undefined;
    const resolvedDamage = Math.max(1, (attackObj.getData('damage') as number | undefined) ?? this.meleeDamage);
    const resolvedKnockback = (attackObj.getData('knockback') as number | undefined) ?? this.meleeKnockback;
    const spreadDirectionX = (attacker ? attacker.x : enemy.x) - enemy.x;
    const spreadDirectionY = (attacker ? attacker.y : enemy.y) - enemy.y;
    const knockbackDirection = attacker ? Math.sign(enemy.x - attacker.x) : 1;

    if (hitTargets && hitTargets.includes(enemy.id)) {
      return;
    }

    const damaged = enemy.takeDamage(
      resolvedDamage,
      attackerId,
      now,
      resolvedKnockback,
      knockbackDirection !== 0 ? knockbackDirection : 1,
    );
    if (!damaged) {
      return;
    }

    const nextTargets = hitTargets ? [...hitTargets] : [];
    nextTargets.push(enemy.id);
    attackObj.setData('hitTargets', nextTargets);

    if (attackerId) {
      this.roundManager.recordDamageDealt(attackerId, resolvedDamage);
    }

    const impactColor = this.applyDaltonianColor(attacker?.bloodColor ?? 0xbb4444);
    const dirNorm = Math.max(0.001, Math.hypot(spreadDirectionX, spreadDirectionY));
    this.spawnMeleeBloodProjection(
      enemy.x,
      enemy.y,
      spreadDirectionX / dirNorm,
      spreadDirectionY / dirNorm,
      impactColor,
      { particleScale: 1 },
    );
    this.spawnWallGroundTrace(enemy.x, enemy.y + 4, impactColor);
    this.spawnImpactFlash(enemy.x, enemy.y + 4, impactColor, 12);
    this.playMeleeImpactSound(now);
    this.triggerImpactLocalVibration(enemy.x, enemy.y + 4, resolvedDamage, resolvedKnockback);
    this.triggerImpactCameraRecoil(enemy.x, enemy.y + 4, resolvedDamage, resolvedKnockback);
    this.triggerImpactHitStop(resolvedDamage, resolvedKnockback);

    if (enemy.health.isDead() && attackerId) {
      this.roundManager.recordScore(attackerId, enemy.scoreValue);
      this.recordWeaponElimination('melee');
      if (preHealth >= this.eliminationSlowMotionThreshold) {
        this.triggerEliminationSlowMotion(resolvedDamage);
      }
    }
  }

  private shouldHitWithMelee(attackObj: Phaser.GameObjects.GameObject, playerObj: Phaser.GameObjects.GameObject): boolean {
    const attack = attackObj as Phaser.Physics.Arcade.Image;
    const player = playerObj as Player;
    const ownerId = attack.getData('owner') as string | undefined;
    const now = this.time.now;

    if (player.isParrying(now)) {
      return false;
    }

    if (player.health.isDead()) {
      return false;
    }

    return ownerId !== player.profile.id;
  }

  private onMeleeHit(attackObj: Phaser.GameObjects.GameObject, playerObj: Phaser.GameObjects.GameObject): void {
    const player = playerObj as Player;
    const attackerId = attackObj.getData('owner') as string | undefined;
    const attackerProfile = this.getProfileById(attackerId);
    const now = this.time.now;
    const attacker = this.getPlayerById(attackerId);
    const preHealth = player.debugState.health;
    const hitTargets = attackObj.getData('hitTargets') as string[] | undefined;
    const knockbackDirection = attacker ? Math.sign(player.x - attacker.x) : player.profile.actions.left.isDown ? -1 : 1;

    if (attackerId === player.profile.id) {
      return;
    }

    if (hitTargets && hitTargets.includes(player.profile.id)) {
      return;
    }

    const spreadDirectionX = attacker ? (attacker.x - player.x) : 1;
    const spreadDirectionY = attacker ? (attacker.y - player.y) : 0;
    const meleeDamage = attackObj.getData('damage') as number | undefined;
    const meleeKnockback = attackObj.getData('knockback') as number | undefined;
    const meleeBloodScale = attackObj.getData('bloodParticleScale') as number | undefined;
    const impactDamage = Math.max(1, meleeDamage ?? this.meleeDamage);

    const damaged = player.takeDamage(
      impactDamage,
      attackerId,
      now,
      meleeKnockback ?? this.meleeKnockback,
      knockbackDirection !== 0 ? knockbackDirection : 1,
    );
    const wasEliminated = player.health.isDead();

    if (!damaged) {
      return;
    }

    const nextTargets = hitTargets ?? [];
    nextTargets.push(player.profile.id);
    attackObj.setData('hitTargets', nextTargets);

    if (attackerId) {
      this.roundManager.recordDamageDealt(attackerId, impactDamage);
    }

    const impactColor = this.applyDaltonianColor(attacker?.bloodColor ?? 0xbb4444);
    const dirNorm = Math.max(0.001, Math.hypot(spreadDirectionX, spreadDirectionY));
    this.spawnMeleeBloodProjection(
      player.x,
      player.y,
      spreadDirectionX / dirNorm,
      spreadDirectionY / dirNorm,
      impactColor,
      { particleScale: meleeBloodScale ?? 1 },
    );
    this.spawnWallGroundTrace(player.x, player.y + 4, impactColor);
    this.spawnImpactFlash(player.x, player.y + 4, impactColor, 14);
    this.spawnImpactSparks(player.x, player.y + 4, spreadDirectionX / dirNorm, spreadDirectionY / dirNorm, 0.85);
    this.playImpactSound(now, impactDamage);
    this.playMeleeImpactSound(now);
    this.triggerImpactDistortion(
      player.x,
      player.y + 4,
      impactDamage,
      meleeKnockback ?? this.meleeKnockback,
    );
    this.triggerImpactLocalVibration(
      player.x,
      player.y + 4,
      impactDamage,
      meleeKnockback ?? this.meleeKnockback,
    );
    this.triggerImpactCameraRecoil(
      player.x,
      player.y + 4,
      impactDamage,
      meleeKnockback ?? this.meleeKnockback,
    );
    this.triggerImpactHitStop(impactDamage, meleeKnockback ?? this.meleeKnockback);
    if (wasEliminated) {
      this.recordWeaponElimination('melee');
    }
    if (wasEliminated && preHealth >= this.eliminationSlowMotionThreshold) {
      this.triggerEliminationSlowMotion(impactDamage);
    }
    this.triggerImpactShake();

    this.triggerProfileVibration(player.profile, 0.45, 80);
    if (attackerProfile) {
      this.triggerProfileVibration(attackerProfile, 0.35, 80);
    }
  }

  private bindPlayerLifecycle(player: Player): void {
    const spawnPoint = this.playerSpawnPoints.get(player.profile.id);
    if (!spawnPoint) {
      return;
    }

    player.health.on('playerDamaged', (payload) => {
      this.roundManager.recordDamage(player.profile.id, payload.sourceProfileId);
      const sourceProfileId = payload.sourceProfileId ?? player.profile.id;
      const sourceProfile = this.getPlayerById(sourceProfileId);
      const sourceColor = this.applyDaltonianColor(sourceProfile?.bloodColor ?? player.bloodColor);
      const spill = this.bloodLedger.addSpill(payload.playerId, payload.amount, sourceProfileId, sourceColor);
      this.matchTestMetrics.totalBloodSpilled += spill.units;
      if (spill.units <= 0) {
        return;
      }

      this.spawnBloodPool(player.x, player.y + 8, spill.units, sourceProfileId, sourceColor);
    });

    player.health.on('playerRespawned', () => {
      this.triggerSpawnVisualEffect(player);
      this.playRespawnSound(this.time.now);
    });

    player.health.on('playerKilled', () => {
      this.triggerDeathVisualEffect(player);
      this.playDeathSound(this.time.now);
      this.roundManager.recordElimination(player.profile.id);
      if (this.matchMode === 'lastSurvivor') {
        this.handleLastSurvivorRoundProgression();
        return;
      }

      if (this.matchMode === 'survival') {
        const survivalReviveBonus = this.getSurvivalTeamBloodBonus();
        const remainingCapacity = Math.max(0, player.maxBloodReserve - player.bloodReserve);
        const bonusToApply = Math.min(survivalReviveBonus, remainingCapacity);
        if (bonusToApply > 0) {
          const consumedFromSurvival = this.consumeSurvivalTeamBlood(bonusToApply);
          player.addBloodReserve(consumedFromSurvival);
        }
      }

      if (this.matchMode === 'relay') {
        return;
      }
      if (this.matchMode === 'bloodBank') {
        this.applyBloodBankDeathPenalty(player);
      }

      this.time.delayedCall(this.respawnDelayMs, () => {
        if (!player.health.isDead()) {
          return;
        }

        player.respawnAt(spawnPoint.x, spawnPoint.y);
      });
    });
  }

  private handleLastSurvivorRoundProgression(): void {
    const alivePlayers = this.players.filter((player) => !player.health.isDead());
    if (alivePlayers.length <= 1) {
      const winnerProfileIds = alivePlayers.length === 1 ? [alivePlayers[0].profile.id] : [];
      this.roundManager.forceFinish(this.time.now, winnerProfileIds);
    }
  }

  private normalizeGameMode(value?: string): ArenaGameMode | null {
    if (!value || typeof value !== 'string') {
      return null;
    }

    const normalized = value.toLowerCase();
    if (normalized === 'carnage') {
      return 'carnage';
    }

    if (normalized === 'lastsurvivor' || normalized === 'last-survivor' || normalized === 'last_survivor') {
      return 'lastSurvivor';
    }

    if (normalized === 'relay') {
      return 'relay';
    }

    if (normalized === 'bloodbank' || normalized === 'blood-bank' || normalized === 'blood_bank') {
      return 'bloodBank';
    }

    if (normalized === 'survival') {
      return 'survival';
    }

    if (normalized === 'training') {
      return 'training';
    }

    return null;
  }

  private applyRelayMatchStateFromRoundResult(roundResult: RoundResult): void {
    if (this.matchMode !== 'relay' && this.matchMode !== 'bloodBank') {
      return;
    }

    if (roundResult.teamScores && roundResult.teamScores.length > 0) {
      for (let scoreIndex = 0; scoreIndex < roundResult.teamScores.length; scoreIndex += 1) {
        const teamScore = roundResult.teamScores[scoreIndex];
        const teamId = this.parseRelayTeamId(teamScore.teamId);
        if (teamId === undefined) {
          continue;
        }

        this.relayTeamMatchScore.set(teamId, teamScore.score);
      }
    }

    if (roundResult.isTie) {
      return;
    }

    const winnerTeamIds = (roundResult.winnerTeamIds ?? []).map((teamId) => this.parseRelayTeamId(teamId)).filter(
      (teamId): teamId is RelayTeamId => teamId !== undefined,
    );
    if (winnerTeamIds.length !== 1) {
      return;
    }

    const winnerTeamId = winnerTeamIds[0];
    this.relayTeamMatchVictories.set(
      winnerTeamId,
      (this.relayTeamMatchVictories.get(winnerTeamId) ?? 0) + 1,
    );
  }

  private parseRelayTeamId(rawTeamId: string): RelayTeamId | undefined {
    const normalizedTeamId = rawTeamId.trim();
    if (!/^\d+$/.test(normalizedTeamId)) {
      return undefined;
    }

    const parsed = Number.parseInt(normalizedTeamId, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private getRelayTeamIdForPlayerIndex(index: number): RelayTeamId {
    if (this.matchMode !== 'relay' && this.matchMode !== 'bloodBank') {
      return 0;
    }

    const availableTeamCount = Math.max(1, Math.min(this.relayTeamCount, Math.max(1, index + 1)));
    return getRelayTeamId(index, availableTeamCount);
  }

  private getRelayTeamIdForProfile(profileId: string | undefined): RelayTeamId | undefined {
    if (!profileId) {
      return undefined;
    }

    return this.playerTeamIdByProfileId.get(profileId);
  }

  private getRelayTeamIds(): RelayTeamId[] {
    return Array.from(this.relayTeamBloodPool.keys()).sort((left, right) => left - right);
  }

  private getRelayTeamColor(teamId: RelayTeamId): number {
    return this.relayTeamColors[Math.abs(teamId) % this.relayTeamColors.length];
  }

  private getRelayTeamBloodPool(teamId?: RelayTeamId): number {
    if (teamId === undefined) {
      return 0;
    }

    return this.relayTeamBloodPool.get(teamId) ?? 0;
  }

  private getRelayTeamBloodPoolMax(teamId?: RelayTeamId): number {
    if (teamId === undefined) {
      return 0;
    }

    return this.relayTeamBloodPoolMax.get(teamId) ?? 0;
  }

  private setRelayTeamBloodPool(teamId: RelayTeamId, units: number): number {
    const maxUnits = this.getRelayTeamBloodPoolMax(teamId);
    const normalizedUnits = Math.max(0, Math.floor(units));
    const nextUnits = maxUnits <= 0 ? 0 : Math.min(maxUnits, normalizedUnits);
    this.relayTeamBloodPool.set(teamId, nextUnits);
    return nextUnits;
  }

  private addRelayTeamBlood(teamId: RelayTeamId, units: number): number {
    if (units <= 0) {
      return 0;
    }

    const normalizedUnits = Math.max(0, Math.floor(units));
    if (normalizedUnits <= 0) {
      return 0;
    }

    const currentUnits = this.getRelayTeamBloodPool(teamId);
    const maxUnits = this.getRelayTeamBloodPoolMax(teamId);
    const nextUnits = maxUnits <= 0 ? 0 : Math.min(maxUnits, currentUnits + normalizedUnits);
    const addedUnits = nextUnits - currentUnits;
    this.relayTeamBloodPool.set(teamId, nextUnits);

    if (addedUnits > 0) {
      this.syncRelayTeamBloodReserves();
    }

    return addedUnits;
  }

  private consumeRelayTeamBlood(teamId: RelayTeamId, units: number): number {
    if (units <= 0) {
      return 0;
    }

    const normalizedUnits = Math.max(0, Math.floor(units));
    if (normalizedUnits <= 0) {
      return 0;
    }

    const currentUnits = this.getRelayTeamBloodPool(teamId);
    const consumedUnits = Math.min(currentUnits, normalizedUnits);
    this.relayTeamBloodPool.set(teamId, Math.max(0, currentUnits - consumedUnits));

    if (consumedUnits > 0) {
      this.syncRelayTeamBloodReserves();
    }

    return consumedUnits;
  }

  private resetRelayTeamBloodPools(): void {
    for (const teamId of this.getRelayTeamIds()) {
      this.relayTeamBloodPool.set(teamId, 0);
    }

    this.syncRelayTeamBloodReserves();
  }

  private syncRelayTeamBloodReserves(): void {
    if (this.matchMode !== 'relay') {
      return;
    }

    for (let index = 0; index < this.players.length; index += 1) {
      const player = this.players[index];
      if (!player) {
        continue;
      }

      const teamId = this.getRelayTeamIdForProfile(player.profile.id);
      const teamPool = this.getRelayTeamBloodPool(teamId);
      const teamMax = this.getRelayTeamBloodPoolMax(teamId);
      const sharedUnits = teamMax > 0 ? Math.floor((teamPool * player.maxBloodReserve) / teamMax) : 0;
      player.setBloodReserve(sharedUnits);
    }
  }

  private triggerProfileVibration(profile: InputProfile, strength = 0.35, durationMs = 110): void {
    if (!this.gameOptions.vibrationEnabled) {
      return;
    }

    if (typeof profile.vibrate !== 'function') {
      return;
    }

    profile.vibrate(strength, durationMs);
  }

  private getProfileById(profileId: string | undefined): InputProfile | undefined {
    if (!profileId) {
      return undefined;
    }

    const player = this.players.find((value) => value.profile.id === profileId);
    return player?.profile;
  }

  private getPlayerById(profileId: string | undefined): Player | undefined {
    if (!profileId) {
      return undefined;
    }

    return this.players.find((value) => value.profile.id === profileId);
  }

  private shouldInteractWithZone(
    _stationObj: Phaser.GameObjects.GameObject,
    playerObj: Phaser.GameObjects.GameObject,
  ): boolean {
    const player = playerObj as Player;
    return player.debugState.interacting;
  }

  private onInteractionZoneOverlap(
    stationObj: Phaser.GameObjects.GameObject,
    playerObj: Phaser.GameObjects.GameObject,
  ): void {
    const station = stationObj as Phaser.Physics.Arcade.Image;
    const player = playerObj as Player;
    const now = this.time.now;
    const stationCooldown = (station.getData('cooldownMs') as number | undefined) ?? this.interactionStationCooldownMs;
    const nextUseAt = (station.getData('cooldownUntil') as number | undefined) ?? 0;
    const label = (station.getData('label') as string | undefined) ?? 'zone';
    const isBloodBank = station.getData('isBloodBank') === true;

    if (now < nextUseAt) {
      return;
    }

    station.setData('cooldownUntil', now + stationCooldown);
    station.setTint(0xb9ff9e);
    this.time.delayedCall(120, () => {
      if (station.active) {
        station.clearTint();
      }
    });

    if (this.matchMode === 'bloodBank' && isBloodBank) {
      const depositedUnits = this.depositPlayerBloodToBank(player);
      if (depositedUnits <= 0) {
        if (player.bloodReserve <= 0) {
          this.interactionFeedbackText.setText(`Aucun sang à déposer: ${player.profile.label}`);
        } else {
          this.interactionFeedbackText.setText(`Cuve pleine: ${label}`);
        }
      } else {
        this.interactionFeedbackText.setText(`Dépôt: ${player.profile.label} +${depositedUnits} unités (${label})`);
      }
      this.interactionFeedbackUntil = now + 800;
      return;
    }

    this.interactionFeedbackText.setText(`Interaction réussie: ${player.profile.label} -> ${label}`);
    this.interactionFeedbackUntil = now + 800;
  }

  private depositPlayerBloodToBank(player: Player): number {
    if (this.matchMode !== 'bloodBank') {
      return 0;
    }

    const teamId = this.getRelayTeamIdForProfile(player.profile.id);
    if (teamId === undefined) {
      return 0;
    }

    const teamPool = this.getRelayTeamBloodPool(teamId);
    const teamPoolMax = this.getRelayTeamBloodPoolMax(teamId);
    const availableCapacity = Math.max(0, teamPoolMax - teamPool);
    const depositableUnits = Math.min(player.bloodReserve, availableCapacity);
    if (depositableUnits <= 0) {
      return 0;
    }

    const consumedUnits = player.consumeBloodReserve(depositableUnits);
    const addedUnits = this.addRelayTeamBlood(teamId, consumedUnits);
    if (addedUnits <= 0) {
      return 0;
    }

    this.roundManager.recordScore(player.profile.id, addedUnits);
    return addedUnits;
  }

  private applyBloodBankDeathPenalty(player: Player): void {
    const teamId = this.getRelayTeamIdForProfile(player.profile.id);
    if (teamId === undefined) {
      return;
    }

    const teamPool = this.getRelayTeamBloodPool(teamId);
    if (teamPool <= 0) {
      return;
    }

    const penaltyUnits = Math.max(1, Math.floor(teamPool * this.bloodBankDeathPenaltyRate));
    const lostUnits = this.consumeRelayTeamBlood(teamId, penaltyUnits);
    if (lostUnits <= 0) {
      return;
    }

    this.roundManager.recordScore(player.profile.id, -lostUnits);
    this.interactionFeedbackText.setText(`Pénalité de banque: -${lostUnits} (Équipe ${teamId + 1})`);
    this.interactionFeedbackUntil = this.time.now + 800;
  }

  private updateInteractionFeedback(): void {
    if (this.time.now >= this.interactionFeedbackUntil) {
      this.interactionFeedbackText.setText('');
      return;
    }
  }

  private collectPerformanceSamples(deltaMs: number): void {
    this.performanceSampleElapsedMs += Math.max(0.001, deltaMs);
    this.performanceSampleFrames += 1;
    this.accumulatedProjectilesThisWindow += this.performanceSpawnedProjectilesThisFrame;
    this.accumulatedMeleeZonesThisWindow += this.performanceSpawnedMeleeZonesThisFrame;
    this.accumulatedParticlesThisWindow += this.performanceSpawnedParticlesThisFrame;
    this.performanceSpawnedProjectilesThisFrame = 0;
    this.performanceSpawnedMeleeZonesThisFrame = 0;
    this.performanceSpawnedParticlesThisFrame = 0;

    if (this.performanceSampleElapsedMs >= this.performanceSampleWindowMs) {
      const sampleSeconds = this.performanceSampleElapsedMs / 1000;
      this.performanceAverageFps = this.performanceSampleFrames / sampleSeconds;
      this.projectilesPerSecond = this.accumulatedProjectilesThisWindow / sampleSeconds;
      this.meleeZonesPerSecond = this.accumulatedMeleeZonesThisWindow / sampleSeconds;
      this.particlesPerSecond = this.accumulatedParticlesThisWindow / sampleSeconds;
      this.performanceSampleElapsedMs = 0;
      this.performanceSampleFrames = 0;
      this.accumulatedProjectilesThisWindow = 0;
      this.accumulatedMeleeZonesThisWindow = 0;
      this.accumulatedParticlesThisWindow = 0;
    }
  }

  private updatePerformanceText(timeMs: number): void {
    if (!this.performanceMode) {
      return;
    }

    if (timeMs < this.nextPerformanceTextAtMs) {
      return;
    }

    const activeProjectiles = this.bullets.countActive(true);
    const activeMeleeZones = this.meleeZones.countActive(true);
    const activePools = this.bloodPools.length;
    const activeTraces = this.groundTraces.length;
    const entityCount = this.players.length + activeProjectiles + activeMeleeZones + activePools;
    const fps = this.performanceAverageFps > 0 ? this.performanceAverageFps : this.game.loop.actualFps;

    this.performanceText.setText([
      `Perf: FPS=${Math.round(fps)} (target=${Math.round(this.game.loop.targetFps)})`,
      `Actifs: joueurs=${this.players.length} projectiles=${activeProjectiles} mêlée=${activeMeleeZones} flaques=${activePools} traces=${activeTraces}`,
      `Total actifs: ${entityCount} | projectiles=${Math.round(this.projectilesPerSecond)}/s`,
      `Mêlée=${Math.round(this.meleeZonesPerSecond)}/s | particules=${Math.round(this.particlesPerSecond)}/s`,
    ]);
    this.nextPerformanceTextAtMs = timeMs + this.performanceTextRefreshMs;

    if (timeMs < this.nextPerformanceLogAtMs) {
      return;
    }

    console.info(
      `[Perf] fps=${Math.round(fps)} | projectiles=${activeProjectiles} melee=${activeMeleeZones} pools=${activePools} traces=${activeTraces} | ` +
        `spawn/s projectiles=${Math.round(this.projectilesPerSecond)} melee=${Math.round(this.meleeZonesPerSecond)} particles=${Math.round(this.particlesPerSecond)}`,
    );
    this.nextPerformanceLogAtMs = timeMs + this.performanceLogIntervalMs;
  }

  private registerProjectileSpawn(): void {
    this.performanceSpawnedProjectilesThisFrame += 1;
  }

  private registerMeleeZoneSpawn(): void {
    this.performanceSpawnedMeleeZonesThisFrame += 1;
  }

  private registerParticleSpawn(count: number): void {
    const normalized = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
    if (normalized <= 0) {
      return;
    }

    this.performanceSpawnedParticlesThisFrame += normalized;
  }

  private triggerImpactCameraRecoil(
    impactX: number,
    impactY: number,
    impactDamage: number,
    knockbackForce: number,
  ): void {
    const now = this.time.now;
    const impactStrength = impactDamage + (knockbackForce * 0.05);
    if (impactStrength < this.cameraRecoilThreshold || now - this.lastCameraRecoilAt < this.cameraRecoilCooldownMs) {
      return;
    }

    this.lastCameraRecoilAt = now;
    const intensity = Phaser.Math.Clamp(impactStrength / this.cameraRecoilScale, 0.18, 1);
    const baseScrollX = this.cameras.main.scrollX;
    const baseScrollY = this.cameras.main.scrollY;
    const pushOffsetX = (impactX < ARENA_WIDTH / 2 ? this.cameraRecoilDistance : -this.cameraRecoilDistance) * intensity;
    const pushOffsetY = (impactY < ARENA_HEIGHT / 2 ? 2 : -2) * intensity;

    this.tweens.add({
      targets: this.cameras.main,
      scrollX: baseScrollX + pushOffsetX,
      scrollY: baseScrollY - pushOffsetY,
      duration: this.cameraPushDuration,
      yoyo: true,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.cameras.main.setScroll(baseScrollX, baseScrollY);
      },
    });
  }

  private triggerTransfusionVisualEffect(player: Player): void {
    const color = this.applyDaltonianColor(player.bloodColor);
    const streamX = player.x;
    const streamY = player.y + 14;

    this.bloodProjectionEmitter.setTint(color);
    this.bloodProjectionEmitter.setAngle({ min: -105, max: -75 });
    this.bloodProjectionEmitter.setSpeed({ min: 35, max: 85 });
    this.bloodProjectionEmitter.setLifespan({ min: 90, max: 180 });
    this.bloodProjectionEmitter.setScale({ start: 0.08, end: 0.01 });
    this.registerParticleSpawn(3);
    this.bloodProjectionEmitter.explode(3, streamX, streamY);
  }

  private triggerSpawnVisualEffect(player: Player): void {
    const flashIntensity = this.getFlashIntensity();
    if (flashIntensity <= 0) {
      return;
    }

    const visibilityScale = Math.max(0.35, flashIntensity);

    const effectY = player.y + this.spawnEffectYOffset;
    const baseColor = this.applyDaltonianColor(player.bloodColor);
    const corePulse = this.add.circle(player.x, effectY, 8, 0xffffff, 0.08 * visibilityScale);
    corePulse.setBlendMode(Phaser.BlendModes.ADD);
    corePulse.setDepth(1205);

    const outerRing = this.add.circle(player.x, effectY, this.spawnEffectRadiusPx, baseColor, 0.28 * visibilityScale);
    outerRing.setBlendMode(Phaser.BlendModes.ADD);
    outerRing.setStrokeStyle(2, 0xffffff, 0.55 * visibilityScale);
    outerRing.setDepth(1205);

    this.tweens.add({
      targets: [corePulse, outerRing],
      scaleX: 1.8,
      scaleY: 1.8,
      alpha: 0,
      duration: this.spawnEffectDurationMs,
      ease: 'Quad.easeOut',
      onComplete: () => {
        corePulse.destroy();
        outerRing.destroy();
      },
    });
  }

  private triggerDeathVisualEffect(player: Player): void {
    const effectY = player.y + this.spawnEffectYOffset;
    const bloodColor = this.applyDaltonianColor(player.bloodColor);
    const coreFlash = this.add.circle(player.x, effectY, 9, 0xffffff, 0.18);
    coreFlash.setBlendMode(Phaser.BlendModes.ADD);
    coreFlash.setDepth(1212);
    coreFlash.setAlpha(0.9);

    const halo = this.add.ellipse(player.x, effectY + 4, this.deathEffectSpreadRadiusPx, 10, bloodColor, 0.22);
    halo.setBlendMode(Phaser.BlendModes.ADD);
    halo.setStrokeStyle(2, bloodColor, 0.45);
    halo.setDepth(1212);

    this.spawnWallGroundTrace(player.x, player.y + 8, bloodColor);
    this.spawnImpactFlash(player.x, player.y, bloodColor, 22);
    this.tweens.add({
      targets: [coreFlash, halo],
      alpha: 0,
      scaleX: 1.9,
      scaleY: 1.9,
      angle: 12,
      duration: this.deathEffectDurationMs,
      ease: 'Quad.easeOut',
      onComplete: () => {
        coreFlash.destroy();
        halo.destroy();
      },
    });
  }

  private configurePlaytestOverridesFromQuery(): boolean {
    const query = new URLSearchParams(window.location.search);
    const hasPlaytestHint = ['playtest', 'playtestPlayers', 'matchDurationMs', 'roundMs'].some((name) => query.has(name))
      || query.has('roundsToWin')
      || query.has('maxRounds')
      || query.has('gameMode')
      || query.has('mode')
      || query.has('countdownMs')
      || query.has('suicidePenalty');
    if (!hasPlaytestHint) {
      return false;
    }

    const roundsToWin = this.getPositiveIntegerFromQuery(query, 'roundsToWin', 10, 1);
    const maxRounds = this.getPositiveIntegerFromQuery(query, 'maxRounds', 10, 1);
    const gameMode = this.normalizeGameMode(query.get('gameMode') ?? query.get('mode') ?? undefined);
    const roundDurationMs = this.getPositiveIntegerFromQuery(
      query,
      'matchDurationMs',
      this.playtestMaxDurationMs,
      this.playtestMinDurationMs,
    ) ?? this.getPositiveIntegerFromQuery(query, 'roundMs', this.playtestMaxDurationMs, this.playtestMinDurationMs);
    const countdownMs = this.getPositiveIntegerFromQuery(query, 'countdownMs', 5000, 0);
    const suicidePenalty = this.getPositiveIntegerFromQuery(query, 'suicidePenalty', 5, 0);

    if (gameMode) {
      this.matchMode = gameMode;
    }

    if (roundsToWin !== null) {
      this.roundsToWin = roundsToWin;
    }

    if (maxRounds !== null) {
      this.maxRounds = Math.max(this.roundsToWin, maxRounds);
    }

    if (roundDurationMs !== null) {
      this.matchRoundDurationMs = this.matchRoundDurationMsClamp(roundDurationMs);
    } else if (this.matchMode === 'lastSurvivor') {
      this.matchRoundDurationMs = this.lastSurvivorRoundDurationMs;
    }

    if (countdownMs !== null) {
      this.matchCountdownMs = countdownMs;
    }

    if (suicidePenalty !== null) {
      this.matchSuicidePenalty = suicidePenalty;
    }

    return true;
  }

  private getPositiveIntegerFromQuery(
    query: URLSearchParams,
    key: string,
    max: number,
    min = 1,
  ): number | null {
    const value = query.get(key);
    if (value === null) {
      return null;
    }

    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed) || parsed < min) {
      return null;
    }

    return Math.min(max, parsed);
  }

  private matchRoundDurationMsClamp(value: number): number {
    return Math.max(this.playtestMinDurationMs, Math.min(this.playtestMaxDurationMs, value));
  }

  public shutdown(): void {
    this.stopAmbientMusicLoop();
    this.input.gamepad?.off(Phaser.Input.Gamepad.Events.BUTTON_DOWN, this.handleGamepadPauseInput, this);
    this.input.keyboard?.removeKey(this.pauseKey);
    this.input.keyboard?.removeKey(this.toggleDebugKey);
    this.input.keyboard?.removeKey(this.performanceKey);
    this.performanceText.destroy();
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => undefined);
      this.audioContext = null;
    }
  }

  private renderDebugGrid(): void {
    this.debugGraphics.lineStyle(1, this.debugGridColor, 0.5);

    for (let x = 0; x <= ARENA_WIDTH; x += this.debugGridStep) {
      this.debugGraphics.beginPath();
      this.debugGraphics.moveTo(x, 0);
      this.debugGraphics.lineTo(x, ARENA_HEIGHT);
      this.debugGraphics.closePath();
      this.debugGraphics.strokePath();
    }

    for (let y = 0; y <= ARENA_HEIGHT; y += this.debugGridStep) {
      this.debugGraphics.beginPath();
      this.debugGraphics.moveTo(0, y);
      this.debugGraphics.lineTo(ARENA_WIDTH, y);
      this.debugGraphics.closePath();
      this.debugGraphics.strokePath();
    }
  }
}
