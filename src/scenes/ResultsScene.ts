import Phaser from 'phaser';
import { LobbyProfileReference } from '../gameplay/input/resolvePlayerProfiles';
import { MatchResult } from '../gameplay/match/MatchManager';
import { UI_THEME } from '../app/config/uiTheme';

interface ResultsSceneData {
  selectedProfiles?: LobbyProfileReference[];
  matchResult?: MatchResult | null;
  selectedWeaponId?: string;
  selectedArenaIndex?: number;
  selectedGameMode?: 'carnage' | 'lastSurvivor' | 'relay' | 'bloodBank' | 'survival' | 'training';
}

export class ResultsScene extends Phaser.Scene {
  public static readonly KEY = 'ResultsScene';
  private selectedProfiles: LobbyProfileReference[] = [];
  private matchResult: MatchResult | null = null;
  private selectedWeaponId: string | null = null;
  private selectedArenaIndex = 0;
  private selectedGameMode: 'carnage' | 'lastSurvivor' | 'relay' | 'bloodBank' | 'survival' | 'training' = 'carnage';

  public init(data?: ResultsSceneData): void {
    this.selectedProfiles = (data?.selectedProfiles ?? []).map((profile) => ({ ...profile }));
    this.matchResult = data?.matchResult ?? null;
    this.selectedWeaponId = typeof data?.selectedWeaponId === 'string' ? data.selectedWeaponId : null;
    const rawArenaIndex = typeof data?.selectedArenaIndex === 'number' ? data.selectedArenaIndex : 0;
    this.selectedArenaIndex = rawArenaIndex;
    const rawMode = data?.selectedGameMode;
    if (
      rawMode === 'lastSurvivor'
      || rawMode === 'carnage'
      || rawMode === 'relay'
      || rawMode === 'bloodBank'
      || rawMode === 'survival'
      || rawMode === 'training'
    ) {
      this.selectedGameMode = rawMode;
    }
  }

  constructor() {
    super({ key: ResultsScene.KEY });
  }

  public create(): void {
    const result = this.matchResult;

    this.cameras.main.setBackgroundColor(UI_THEME.scene.background);
    const width = this.scale.width;
    const contentWidth = Math.min(1120, width - 120);
    const contentX = (width - contentWidth) / 2;

    this.add
      .image(0, 0, 'ui-grid-snare')
      .setOrigin(0, 0)
      .setDisplaySize(width, this.scale.height)
      .setAlpha(0.18)
      .setScrollFactor(0);

    this.add
      .image(width / 2, 24, 'ui-panel-large')
      .setOrigin(0.5, 0)
      .setDisplaySize(contentWidth, 96)
      .setScrollFactor(0)
      .setAlpha(0.95);

    if (!result) {
      this.add
        .text(width / 2, 58, 'Fin de match', {
          fontSize: '54px',
          fontFamily: UI_THEME.font.body,
          color: UI_THEME.text.title,
        })
        .setOrigin(0.5, 0)
        .setShadow(2, 2, UI_THEME.scene.shadow, 5);

      this.add
        .text(
          width / 2,
          214,
          ['Prototype préparé pour l’extension.', 'Les résultats de match seront ajoutés prochainement.'].join('\n'),
          {
            fontSize: '20px',
            color: UI_THEME.text.muted,
            fontFamily: UI_THEME.font.body,
            align: 'center',
          },
        )
        .setOrigin(0.5, 0)
        .setScrollFactor(0);

      this.add
        .image(width / 2, 268, 'ui-keycap')
        .setScale(0.9)
        .setOrigin(0.5, 0)
        .setScrollFactor(0);
      this.add
        .text(width / 2, 268, 'ENTER', {
          color: UI_THEME.text.title,
          fontFamily: UI_THEME.font.mono,
          fontSize: '12px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0);

      this.input.keyboard?.once('keydown-ENTER', () => this.scene.start('MenuScene'));
      return;
    }

    const winnerNames = result.winnerProfileIds
      .map((winnerProfileId) => {
        const winner = result.players.find((entry) => entry.profileId === winnerProfileId);
        return winner?.label ?? winnerProfileId;
      })
      .join(', ');

    const winnerLabel = result.isTie
      ? `Égalité : ${winnerNames}`
      : `Vainqueur du match : ${winnerNames}`;

    this.add
      .text(width / 2, 58, 'Fin de match', {
        fontSize: '50px',
        fontFamily: UI_THEME.font.body,
        color: UI_THEME.text.title,
      })
      .setOrigin(0.5, 0)
      .setShadow(2, 2, UI_THEME.scene.shadow, 5);

    this.add
      .image(width / 2, 118, 'ui-panel-strip')
      .setDisplaySize(contentWidth - 24, 150)
      .setOrigin(0.5, 0)
      .setScrollFactor(0);

    this.add
      .text(
        contentX + 18,
        106,
        [
          winnerLabel,
          `Manches jouées : ${result.roundCount} / ${result.maxRounds}`,
          `Condition de victoire : ${result.roundsToWin} manches`,
          `Mode : meilleure des ${result.maxRounds}`,
        ].join('\n'),
        {
          fontSize: '20px',
          color: UI_THEME.text.status,
          fontFamily: UI_THEME.font.mono,
          lineSpacing: 4,
          wordWrap: { width: contentWidth - 130 },
        },
      )
      .setDepth(2);

    this.add
      .image(contentX + 18, 278, 'ui-panel-large')
      .setOrigin(0, 0)
      .setDisplaySize(contentWidth - 36, 170)
      .setScrollFactor(0)
      .setDepth(1);

    const playerLines = result.players
      .map(
        (entry, index) =>
          [
            `${index + 1}. ${entry.label}`,
            `manches: ${entry.roundsWon}`,
            `KO: ${entry.eliminations}`,
            `dégâts: ${entry.damageDealt}`,
            `sang récupéré: ${entry.bloodRecovered}`,
            `transfusions réussies: ${entry.successfulTransfusions}`,
            `morts: ${entry.deaths}`,
            `suicides: ${entry.suicides}`,
          ].join(' • '),
      )
      .join('\n');

    this.add
      .text(contentX + 28, 292, playerLines, {
        fontSize: '18px',
        color: UI_THEME.text.status,
        fontFamily: UI_THEME.font.mono,
        lineSpacing: 4,
      })
      .setDepth(2);

    this.add
      .text(
        contentX + 18,
        580,
        'ENTER: Retour menu  •  R: Rejouer',
        { fontSize: '20px', color: UI_THEME.text.status, fontFamily: UI_THEME.font.mono },
      )
      .setDepth(2);

    const restartProfiles = this.selectedProfiles.length > 0 ? this.selectedProfiles : [];
    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start('MenuScene'));
    this.input.keyboard?.once('keydown-ESC', () => this.scene.start('MenuScene'));
    this.input.keyboard?.once('keydown-R', () => {
      this.scene.start('ArenaScene', {
        selectedProfiles: restartProfiles,
        selectedWeaponId: this.selectedWeaponId,
        selectedArenaIndex: this.selectedArenaIndex,
        selectedGameMode: this.selectedGameMode,
      });
    });
  }
}
