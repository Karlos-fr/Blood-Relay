import Phaser from 'phaser';
import {
  createKeyboardProfile,
  defaultKeyboardProfiles,
  KeyboardBindingSet,
} from '../input/profiles/keyboard';
import {
  getConnectedGamepadProfiles,
  getDefaultGamepadMovementThreshold,
  getGamepadThresholdStep,
} from '../input/profiles/gamepad';
import { InputProfile } from '../input/profiles/input';
import { Weapon, weaponRegistry } from '../gameplay/combat/weapons';
import { GAME_VERSION } from '../app/config/game';
import { ARENA_PRESETS } from '../app/config/arenas';
import { CHARACTER_PROFILES } from '../app/config/characters';
import type { CharacterPalette, CharacterProfile } from '../app/config/characters';
import { UI_THEME } from '../app/config/uiTheme';

type MenuGameMode = 'carnage' | 'lastSurvivor' | 'relay' | 'bloodBank' | 'survival' | 'training';

type RemappableAction = keyof KeyboardBindingSet;

const remappableActions: RemappableAction[] = [
  'left',
  'right',
  'jump',
  'down',
  'shoot',
  'melee',
  'dodge',
  'transfusion',
  'interact',
  'join',
  'leave',
];

const remapActionLabels: Record<RemappableAction, string> = {
  left: 'Déplacement gauche',
  right: 'Déplacement droite',
  jump: 'Saut',
  down: 'Descente',
  shoot: 'Tir',
  melee: 'Mêlée',
  dodge: 'Esquive',
  transfusion: 'Transfusion',
  interact: 'Interaction',
  join: 'Rejoindre',
  leave: 'Quitter',
};

interface LobbyProfileInfo {
  id: string;
  label: string;
  source: InputProfile['source'];
  binding?: KeyboardBindingSet;
}

export class MenuScene extends Phaser.Scene {
  public static readonly KEY = 'MenuScene';
  private readonly maxPlayers = 4;
  private readonly defaultMinPlayersToStart = 2;
  private selectedPlayerCount = 2;
  private selectedGameMode: MenuGameMode = 'carnage';
  private readonly arenaPresets = ARENA_PRESETS;
  private selectedWeaponIndex = 0;
  private selectedArenaIndex = 0;
  private readonly maxKeyboardProfiles = defaultKeyboardProfiles.length;
  private decreaseDeadZoneKey!: Phaser.Input.Keyboard.Key;
  private increaseDeadZoneKey!: Phaser.Input.Keyboard.Key;
  private keyboardBindings: KeyboardBindingSet[] = defaultKeyboardProfiles.map((binding) => ({ ...binding }));
  private keyboardProfiles: InputProfile[] = [];
  private gamepadProfiles: InputProfile[] = [];
  private readonly gamepadThresholdStep = getGamepadThresholdStep();
  private gamepadDeadZone = getDefaultGamepadMovementThreshold();
  private gamepadDeadZoneLabel!: Phaser.GameObjects.Text;
  private remapProfileIndex = 0;
  private remapActionIndex = 0;
  private remapProfileId: string | null = null;
  private remapSlotText!: Phaser.GameObjects.Text;
  private remapGuideText!: Phaser.GameObjects.Text;
  private remapActionNextKey!: Phaser.Input.Keyboard.Key;
  private remapActionPrevKey!: Phaser.Input.Keyboard.Key;
  private remapSlotNextKey!: Phaser.Input.Keyboard.Key;
  private remapSlotPrevKey!: Phaser.Input.Keyboard.Key;
  private enterRemapKey!: Phaser.Input.Keyboard.Key;
  private cancelRemapKey!: Phaser.Input.Keyboard.Key;
  private onePlayersKey!: Phaser.Input.Keyboard.Key;
  private twoPlayersKey!: Phaser.Input.Keyboard.Key;
  private threePlayersKey!: Phaser.Input.Keyboard.Key;
  private fourPlayersKey!: Phaser.Input.Keyboard.Key;
  private optionsKey!: Phaser.Input.Keyboard.Key;
  private creditsKey!: Phaser.Input.Keyboard.Key;
  private helpKey!: Phaser.Input.Keyboard.Key;
  private privacyKey!: Phaser.Input.Keyboard.Key;
  private prevWeaponKey!: Phaser.Input.Keyboard.Key;
  private nextWeaponKey!: Phaser.Input.Keyboard.Key;
  private prevArenaKey!: Phaser.Input.Keyboard.Key;
  private nextArenaKey!: Phaser.Input.Keyboard.Key;
  private prevCharacterKey!: Phaser.Input.Keyboard.Key;
  private nextCharacterKey!: Phaser.Input.Keyboard.Key;
  private playerProfiles: LobbyProfileInfo[] = [];
  private characterSelectionProfileIndex = 0;
  private selectedCharacterIdByProfileId: Record<string, string> = {};
  private characterPreviewPanel!: Phaser.GameObjects.Image;
  private characterPreviewSprite!: Phaser.GameObjects.Image;
  private characterPreviewNameText!: Phaser.GameObjects.Text;
  private characterPreviewStatsText!: Phaser.GameObjects.Text;
  private selectedWeaponIcon!: Phaser.GameObjects.Image;
  private startHintText!: Phaser.GameObjects.Text;
  private playerListText!: Phaser.GameObjects.Text;
  private actionText!: Phaser.GameObjects.Text;
  private warningText!: Phaser.GameObjects.Text;
  private startKey!: Phaser.Input.Keyboard.Key;
  private playtestAutoStartAt: number | null = null;
  private readonly playtestAutoStartDelayMs = 900;
  private readonly playtestMessagePrefix = '[playtest]';

  constructor() {
    super({ key: MenuScene.KEY });
  }

  public create(): void {
    this.playerProfiles = [];
    this.keyboardProfiles = this.createKeyboardProfiles();
    this.refreshGamepadProfiles();

    this.cameras.main.setBackgroundColor(UI_THEME.scene.background);
    const width = this.scale.width;
    const maxContentWidth = Math.min(1100, width - 120);
    const leftPadding = (width - maxContentWidth) / 2;

    this.add
      .image(0, 0, 'ui-grid-snare')
      .setOrigin(0, 0)
      .setDisplaySize(width, this.scale.height)
      .setAlpha(0.24)
      .setScrollFactor(0);

    this.add.image(width / 2, 30, 'ui-panel-large')
      .setOrigin(0.5, 0)
      .setDisplaySize(maxContentWidth, 116)
      .setScrollFactor(0)
      .setAlpha(0.95);

    this.add
      .text(width / 2, 56, 'BLOOD RELAY', {
        fontSize: '52px',
        color: UI_THEME.text.titleMuted,
        fontFamily: UI_THEME.font.title,
      })
      .setOrigin(0.5, 0)
      .setShadow(2, 2, UI_THEME.scene.shadow, UI_THEME.font.shadow);

    this.add
      .text(width / 2, 110, `Prototype local - Version ${GAME_VERSION}`, {
        fontSize: '18px',
        color: UI_THEME.text.link,
        fontFamily: UI_THEME.font.body,
      })
      .setOrigin(0.5, 0);

    this.add
      .text(width / 2, 138, 'Connexion des joueurs', {
        fontSize: '28px',
        color: UI_THEME.text.body,
        fontFamily: UI_THEME.font.body,
      })
      .setOrigin(0.5, 0);

    const actionRowY = 174;
    this.add
      .image(width / 2, actionRowY + 11, 'ui-panel-strip')
      .setOrigin(0.5, 0)
      .setDisplaySize(Math.min(980, maxContentWidth - 80), 46)
      .setScrollFactor(0);

    const addKeyHint = (x: number, keyLabel: string, actionLabel: string): void => {
      this.add.image(x, actionRowY + 11, 'ui-keycap').setOrigin(0, 0.5).setScrollFactor(0);
      this.add
        .text(x + 33, actionRowY + 11, keyLabel, {
          color: UI_THEME.text.title,
          fontFamily: UI_THEME.font.mono,
          fontSize: '12px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0);
      this.add
        .text(x + 86, actionRowY + 11, actionLabel, {
          color: UI_THEME.text.link,
          fontFamily: UI_THEME.font.body,
          fontSize: '16px',
        })
        .setOrigin(0, 0.5)
        .setScrollFactor(0);
    };

    addKeyHint(leftPadding + 24, 'ESPACE', 'Lancer la partie');
    addKeyHint(leftPadding + 180, 'F1', 'Options');
    addKeyHint(leftPadding + 280, 'F2', 'Crédits');
    addKeyHint(leftPadding + 390, 'F3', 'Aide');
    addKeyHint(leftPadding + 500, 'F4', 'Confidentialité');

    this.add
      .image(leftPadding, 228, 'ui-panel-large')
      .setOrigin(0, 0)
      .setDisplaySize(maxContentWidth, 430)
      .setScrollFactor(0);

    this.playerListText = this.add
      .text(leftPadding + 16, 238, '', {
        fontSize: '20px',
        color: UI_THEME.text.body,
        fontFamily: UI_THEME.font.mono,
        lineSpacing: 5,
      })
      .setScrollFactor(0);

    this.selectedWeaponIcon = this.add
      .image(leftPadding + maxContentWidth - 16, 246, this.getSelectedWeaponIconTexture())
      .setOrigin(1, 0)
      .setDisplaySize(44, 30)
      .setTint(0xffefc9)
      .setAlpha(0.95)
      .setScrollFactor(0);

    this.actionText = this.add
      .text(leftPadding + 16, 404, 'Contrôles disponibles :\n  - clavier: rejoindre/quitter\n  - manette: START/SELECT', {
        fontSize: '18px',
        color: UI_THEME.text.secondary,
        fontFamily: UI_THEME.font.body,
        lineSpacing: 6,
      })
      .setScrollFactor(0);

    this.remapSlotText = this.add
      .text(leftPadding + 16, 476, '', {
        fontSize: '16px',
        color: UI_THEME.text.status,
        fontFamily: UI_THEME.font.body,
      })
      .setScrollFactor(0);

    this.remapGuideText = this.add
      .text(leftPadding + 16, 516, '', {
        fontSize: '16px',
        color: UI_THEME.text.secondary,
        fontFamily: UI_THEME.font.body,
        lineSpacing: 4,
      })
      .setScrollFactor(0);

    this.gamepadDeadZoneLabel = this.add
      .text(leftPadding + maxContentWidth - 252, 404, this.getDeadZoneLine(), {
        fontSize: '18px',
        color: UI_THEME.text.secondary,
        fontFamily: UI_THEME.font.body,
        lineSpacing: 6,
      })
      .setScrollFactor(0);

    this.startHintText = this.add
      .text(leftPadding + 16, actionRowY + 15, `Appuie sur ESPACE pour démarrer (${this.selectedPlayerCount} joueurs).`, {
        fontSize: '18px',
        color: UI_THEME.text.warning,
        fontFamily: UI_THEME.font.body,
      })
      .setScrollFactor(0);

    const previewPanelWidth = 300;
    const previewPanelHeight = 180;
    const previewX = leftPadding + maxContentWidth - previewPanelWidth / 2 - 4;
    const previewY = 320;
    this.characterPreviewPanel = this.add
      .image(previewX, previewY, 'ui-panel-large')
      .setOrigin(0.5, 0)
      .setDisplaySize(previewPanelWidth, previewPanelHeight)
      .setScrollFactor(0);
    this.characterPreviewPanel.setTint(0x89c4ff);
    this.characterPreviewPanel.setAlpha(0.82);

    this.characterPreviewSprite = this.add
      .image(previewX - 114, previewY + 128, 'char-balanced-idle')
      .setOrigin(0, 0.5)
      .setScale(1.85)
      .setScrollFactor(0);

    this.characterPreviewNameText = this.add
      .text(previewX - 114, previewY + 22, 'Aucune sélection', {
        fontSize: '18px',
        color: UI_THEME.text.body,
        fontFamily: UI_THEME.font.mono,
        lineSpacing: 2,
      })
      .setScrollFactor(0);

    this.characterPreviewStatsText = this.add
      .text(previewX - 114, previewY + 58, 'Sélectionne un joueur puis Q/E pour parcourir les personnages.', {
        fontSize: '15px',
        color: UI_THEME.text.secondary,
        fontFamily: UI_THEME.font.body,
        wordWrap: {
          width: 185,
        },
        lineSpacing: 4,
      })
      .setScrollFactor(0);

    this.decreaseDeadZoneKey = this.input.keyboard?.addKey('O') as Phaser.Input.Keyboard.Key;
    this.increaseDeadZoneKey = this.input.keyboard?.addKey('P') as Phaser.Input.Keyboard.Key;
    this.remapActionNextKey = this.input.keyboard?.addKey('RIGHT') as Phaser.Input.Keyboard.Key;
    this.remapActionPrevKey = this.input.keyboard?.addKey('LEFT') as Phaser.Input.Keyboard.Key;
    this.remapSlotNextKey = this.input.keyboard?.addKey('DOWN') as Phaser.Input.Keyboard.Key;
    this.remapSlotPrevKey = this.input.keyboard?.addKey('UP') as Phaser.Input.Keyboard.Key;
    this.enterRemapKey = this.input.keyboard?.addKey('R') as Phaser.Input.Keyboard.Key;
    this.cancelRemapKey = this.input.keyboard?.addKey('ESC') as Phaser.Input.Keyboard.Key;
    this.prevCharacterKey = this.input.keyboard?.addKey('Q') as Phaser.Input.Keyboard.Key;
    this.nextCharacterKey = this.input.keyboard?.addKey('E') as Phaser.Input.Keyboard.Key;

    this.warningText = this.add
      .text(leftPadding + 16, 546, '', {
        fontSize: '18px',
        color: UI_THEME.text.warning,
        fontFamily: UI_THEME.font.body,
      })
      .setScrollFactor(0);

    this.startKey = this.input.keyboard?.addKey('SPACE') as Phaser.Input.Keyboard.Key;
    this.onePlayersKey = this.input.keyboard?.addKey('ONE') as Phaser.Input.Keyboard.Key;
    this.twoPlayersKey = this.input.keyboard?.addKey('TWO') as Phaser.Input.Keyboard.Key;
    this.threePlayersKey = this.input.keyboard?.addKey('THREE') as Phaser.Input.Keyboard.Key;
    this.fourPlayersKey = this.input.keyboard?.addKey('FOUR') as Phaser.Input.Keyboard.Key;
    this.optionsKey = this.input.keyboard?.addKey('F1') as Phaser.Input.Keyboard.Key;
    this.creditsKey = this.input.keyboard?.addKey('F2') as Phaser.Input.Keyboard.Key;
    this.helpKey = this.input.keyboard?.addKey('F3') as Phaser.Input.Keyboard.Key;
    this.privacyKey = this.input.keyboard?.addKey('F4') as Phaser.Input.Keyboard.Key;
    this.prevWeaponKey = this.input.keyboard?.addKey('COMMA') as Phaser.Input.Keyboard.Key;
    this.nextWeaponKey = this.input.keyboard?.addKey('PERIOD') as Phaser.Input.Keyboard.Key;
    this.prevArenaKey = this.input.keyboard?.addKey('LEFT_BRACKET') as Phaser.Input.Keyboard.Key;
    this.nextArenaKey = this.input.keyboard?.addKey('RIGHT_BRACKET') as Phaser.Input.Keyboard.Key;
    this.startHintText.setText(`Appuie sur ESPACE pour démarrer (${this.selectedPlayerCount} joueurs). Mode: ${this.getModeLabel()}.`);

    this.input.gamepad?.on('connected', () => {
      this.refreshGamepadProfiles();
    });

    this.input.gamepad?.on('disconnected', () => {
      this.refreshGamepadProfiles();
      this.pruneMissingGamepads();
    });

    this.input.keyboard?.on('keydown', this.handleRemapInput, this);

    this.updatePlayerList();

    const autoPlayers = this.getAutoPlaytestPlayerCount();
    if (autoPlayers !== null) {
      this.startPlaytestAutoSetup(autoPlayers);
    }
  }

  public update(): void {
    const profiles = [...this.keyboardProfiles, ...this.gamepadProfiles];
    const isRemapping = Boolean(this.remapProfileId);

    if (!isRemapping) {
      profiles.forEach((profile) => {
        profile.update();

        if (profile.actions.join.consumeJustDown()) {
          this.joinPlayer(profile);
        }

        if (profile.actions.leave.consumeJustDown()) {
          this.leavePlayer(profile.id);
        }
      });
    }

    if (isRemapping) {
      if (Phaser.Input.Keyboard.JustDown(this.cancelRemapKey)) {
        this.remapProfileId = null;
        this.warningText.setText('Remappage annulé.');
      }

      if (Phaser.Input.Keyboard.JustDown(this.remapActionNextKey)) {
        this.remapActionIndex = (this.remapActionIndex + 1) % remappableActions.length;
      }

      if (Phaser.Input.Keyboard.JustDown(this.remapActionPrevKey)) {
        this.remapActionIndex = (this.remapActionIndex - 1 + remappableActions.length) % remappableActions.length;
      }

      if (Phaser.Input.Keyboard.JustDown(this.remapSlotNextKey)) {
        this.moveRemapSelection(1);
        this.moveCharacterSelection(1);
      }

      if (Phaser.Input.Keyboard.JustDown(this.remapSlotPrevKey)) {
        this.moveRemapSelection(-1);
        this.moveCharacterSelection(-1);
      }

      this.updatePlayerList();
      return;
    }

    this.pruneMissingGamepads();
    this.syncJoinedKeyboardBindings();
    this.ensureRemapProfileSelectionIsValid();

    this.updatePlayerList();
    this.updateRemapMenuHints();

    if (Phaser.Input.Keyboard.JustDown(this.optionsKey)) {
      this.scene.start('OptionsScene');
    }

    if (Phaser.Input.Keyboard.JustDown(this.creditsKey)) {
      this.scene.start('CreditsScene');
    }

    if (Phaser.Input.Keyboard.JustDown(this.helpKey)) {
      this.scene.start('HelpScene');
    }

    if (Phaser.Input.Keyboard.JustDown(this.privacyKey)) {
      this.scene.start('PrivacyScene');
    }

    if (Phaser.Input.Keyboard.JustDown(this.prevWeaponKey)) {
      this.setWeaponSelection(this.selectedWeaponIndex - 1);
    }

    if (Phaser.Input.Keyboard.JustDown(this.nextWeaponKey)) {
      this.setWeaponSelection(this.selectedWeaponIndex + 1);
    }

    if (Phaser.Input.Keyboard.JustDown(this.prevArenaKey)) {
      this.setArenaSelection(this.selectedArenaIndex - 1);
    }

    if (Phaser.Input.Keyboard.JustDown(this.nextArenaKey)) {
      this.setArenaSelection(this.selectedArenaIndex + 1);
    }

    if (Phaser.Input.Keyboard.JustDown(this.prevCharacterKey)) {
      this.cycleSelectedCharacter(-1);
    }

    if (Phaser.Input.Keyboard.JustDown(this.nextCharacterKey)) {
      this.cycleSelectedCharacter(1);
    }

    if (Phaser.Input.Keyboard.JustDown(this.twoPlayersKey)) {
      this.setSelectedGameMode('carnage');
      this.setPlayerCountSelection(2);
    }

    if (Phaser.Input.Keyboard.JustDown(this.threePlayersKey)) {
      this.setSelectedGameMode('carnage');
      this.setPlayerCountSelection(3);
    }

    if (Phaser.Input.Keyboard.JustDown(this.fourPlayersKey)) {
      this.setSelectedGameMode('carnage');
      this.setPlayerCountSelection(4);
    }

    if (Phaser.Input.Keyboard.JustDown(this.onePlayersKey)) {
      this.setSelectedGameMode('training');
      this.setPlayerCountSelection(1);
    }

    if (this.playtestAutoStartAt !== null && this.time.now >= this.playtestAutoStartAt) {
      if (this.playerProfiles.length === this.selectedPlayerCount) {
        this.scene.start('ArenaScene', {
          selectedProfiles: this.playerProfiles,
          selectedCharacterIds: this.getSelectedCharacterIdsForLaunch(),
          selectedWeaponId: this.getSelectedWeaponId(),
          selectedArenaIndex: this.selectedArenaIndex,
          selectedGameMode: this.selectedGameMode,
        });
        this.playtestAutoStartAt = null;
      } else {
        this.warningText.setText(`Playtest: attente ${this.selectedPlayerCount} joueurs connectés...`);
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.startKey) && this.playerProfiles.length === this.selectedPlayerCount) {
      this.scene.start('ArenaScene', {
        selectedProfiles: this.playerProfiles,
        selectedCharacterIds: this.getSelectedCharacterIdsForLaunch(),
        selectedWeaponId: this.getSelectedWeaponId(),
        selectedArenaIndex: this.selectedArenaIndex,
        selectedGameMode: this.selectedGameMode,
      });
      return;
    }

    if (
      Phaser.Input.Keyboard.JustDown(this.startKey) &&
      this.playerProfiles.length > 0 &&
      this.playerProfiles.length !== this.selectedPlayerCount
    ) {
      this.warningText.setText(`Sélectionne ${this.selectedPlayerCount} joueurs puis lance une manche.`);
    }

    if (Phaser.Input.Keyboard.JustDown(this.decreaseDeadZoneKey)) {
      this.setGamepadDeadZone(this.gamepadDeadZone - this.gamepadThresholdStep);
    }

    if (Phaser.Input.Keyboard.JustDown(this.increaseDeadZoneKey)) {
      this.setGamepadDeadZone(this.gamepadDeadZone + this.gamepadThresholdStep);
    }

    if (Phaser.Input.Keyboard.JustDown(this.remapSlotNextKey)) {
      this.moveRemapSelection(1);
      this.moveCharacterSelection(1);
    }

    if (Phaser.Input.Keyboard.JustDown(this.remapSlotPrevKey)) {
      this.moveRemapSelection(-1);
      this.moveCharacterSelection(-1);
    }

    if (Phaser.Input.Keyboard.JustDown(this.enterRemapKey)) {
      this.beginRemapForSelection();
    }
  }

  private updateRemapMenuHints(): void {
    const keyboardSlots = this.getRemappablePlayerIndexes();
    if (!keyboardSlots.length) {
      this.remapSlotText.setText('Aucun joueur clavier détecté pour le remappage.');
      this.remapGuideText.setText('');
      return;
    }

    const current = this.remapProfileId ? this.playerProfiles.find((value) => value.id === this.remapProfileId) : this.getRemappedSelection();
    const actionName = remapActionLabels[remappableActions[this.remapActionIndex]];
    if (current && current.source === 'keyboard') {
      this.remapSlotText.setText(`Cible: ${current.label} -> ${actionName}`);
    } else {
      this.remapSlotText.setText('Aucun joueur clavier sélectionné.');
    }

    this.remapGuideText.setText(
      [
        'R: démarrer remappage clavier',
        '↑/↓: changer de joueur',
        '←/→: changer d’action',
        'Échap: annuler le remappage',
      ].join(' / '),
    );
  }

  private refreshGamepadProfiles(): void {
    const plugin = this.input.gamepad;
    if (!plugin) {
      this.gamepadProfiles = [];
      return;
    }

    this.gamepadProfiles = getConnectedGamepadProfiles(plugin, this.gamepadDeadZone);
    this.registry.set('gamepadDeadZone', this.gamepadDeadZone);
  }

  private getDeadZoneLine(): string {
    return `Zone morte gamepad : ${this.gamepadDeadZone.toFixed(2)}\n  - O : diminuer\n  - P : augmenter`;
  }

  private setPlayerCountSelection(target: number): void {
    const value = Math.min(this.maxPlayers, Math.max(this.getMinPlayersToStart(), target));
    this.selectedPlayerCount = value;
    this.startHintText.setText(`Appuie sur ESPACE pour démarrer (${this.selectedPlayerCount} joueurs). Mode: ${this.getModeLabel()}.`);

    if (this.playerProfiles.length > this.selectedPlayerCount) {
      this.playerProfiles = this.playerProfiles.slice(0, this.selectedPlayerCount);
      this.remapProfileIndex = Math.min(this.remapProfileIndex, Math.max(this.playerProfiles.length - 1, 0));
      if (this.remapProfileId && !this.playerProfiles.find((profile) => profile.id === this.remapProfileId)) {
        this.remapProfileId = null;
      }
    }
    this.ensureCharacterSelectionProfileIndexIsValid();
    this.updatePlayerList();
  }

  private setSelectedGameMode(gameMode: MenuGameMode): void {
    this.selectedGameMode = gameMode;
    if (gameMode === 'training' && this.selectedPlayerCount > 1) {
      this.setPlayerCountSelection(1);
      return;
    }

    if (gameMode !== 'training' && this.selectedPlayerCount < this.defaultMinPlayersToStart) {
      this.setPlayerCountSelection(this.defaultMinPlayersToStart);
      return;
    }
    this.startHintText.setText(`Appuie sur ESPACE pour démarrer (${this.selectedPlayerCount} joueurs). Mode: ${this.getModeLabel()}.`);
    this.updatePlayerList();
  }

  private getMinPlayersToStart(): number {
    return this.selectedGameMode === 'training' ? 1 : this.defaultMinPlayersToStart;
  }

  private getModeLabel(): string {
    return this.selectedGameMode === 'training' ? 'Entraînement' : 'Carnage';
  }

  private setWeaponSelection(target: number): void {
    if (!weaponRegistry.length) {
      return;
    }

    const weaponCount = weaponRegistry.length;
    const nextIndex = ((target % weaponCount) + weaponCount) % weaponCount;
    this.selectedWeaponIndex = nextIndex;
    this.updatePlayerList();
  }

  private setArenaSelection(target: number): void {
    const arenaCount = this.arenaPresets.length;
    const nextIndex = ((target % arenaCount) + arenaCount) % arenaCount;
    this.selectedArenaIndex = nextIndex;
    this.updatePlayerList();
  }

  private getSelectedWeaponId(): string {
    return weaponRegistry[this.selectedWeaponIndex]?.config.id ?? weaponRegistry[0]?.config.id ?? 'revolver';
  }

  private getSelectedWeapon(): Weapon | undefined {
    return weaponRegistry[this.selectedWeaponIndex];
  }

  private getSelectedWeaponLabel(): string {
    return this.getSelectedWeapon()?.config.label ?? weaponRegistry[0]?.config.label ?? 'Arme inconnue';
  }

  private getSelectedWeaponIconTexture(): string {
    return this.getSelectedWeapon()?.iconTexture ?? this.getSelectedWeapon()?.projectileTexture ?? 'projectile';
  }

  private getSelectedArenaLabel(): string {
    return this.arenaPresets[this.selectedArenaIndex]?.label ?? this.arenaPresets[0]?.label ?? 'Arène inconnue';
  }

  private getSelectedArenaPreview(): string[] {
    return this.arenaPresets[this.selectedArenaIndex]?.preview ?? [];
  }

  private setGamepadDeadZone(value: number): void {
    this.gamepadDeadZone = Math.max(0.01, Math.min(0.95, value));
    this.refreshGamepadProfiles();
    this.gamepadDeadZoneLabel.setText(this.getDeadZoneLine());
  }

  private handleRemapInput(event: KeyboardEvent): void {
    if (!this.remapProfileId) {
      return;
    }

    if (event.key === 'Escape') {
      this.remapProfileId = null;
      this.warningText.setText('Remappage annulé.');
      this.updatePlayerList();
      return;
    }

    const key = this.normalizeKeyboardInput(event);
    if (!key) {
      this.warningText.setText('Touche non valide pour le remappage.');
      return;
    }

    const profile = this.playerProfiles.find((value) => value.id === this.remapProfileId);
    if (!profile || profile.source !== 'keyboard') {
      this.remapProfileId = null;
      this.warningText.setText('Profil clavier introuvable.');
      return;
    }

    const action = remappableActions[this.remapActionIndex];
    const binding = this.getKeyboardBinding(profile.id);
    if (!binding) {
      this.remapProfileId = null;
      this.warningText.setText('Impossible d’appliquer le remappage.');
      return;
    }

    binding[action] = key;
    this.refreshKeyboardProfiles();
    this.syncJoinedKeyboardBindings();
    this.remapProfileId = null;
    this.warningText.setText(`${profile.label} - ${remapActionLabels[action]} = ${key}`);
    this.updatePlayerList();
  }

  private normalizeKeyboardInput(event: KeyboardEvent): string | null {
    const code = event.code;
    const normalizedKey = event.key?.toUpperCase?.();

    if (code === 'Space') {
      return 'SPACE';
    }
    if (code === 'Backspace') {
      return 'BACKSPACE';
    }
    if (code === 'Escape') {
      return 'ESC';
    }
    if (code === 'Enter') {
      return 'ENTER';
    }
    if (code === 'Tab') {
      return 'TAB';
    }
    if (code === 'ArrowLeft') {
      return 'LEFT';
    }
    if (code === 'ArrowRight') {
      return 'RIGHT';
    }
    if (code === 'ArrowUp') {
      return 'UP';
    }
    if (code === 'ArrowDown') {
      return 'DOWN';
    }
    if (code === 'ShiftLeft' || code === 'ShiftRight') {
      return 'SHIFT';
    }
    if (code === 'ControlLeft' || code === 'ControlRight') {
      return 'CTRL';
    }
    if (code === 'AltLeft' || code === 'AltRight') {
      return 'ALT';
    }

    const digitMatch = /^Digit([0-9])$/.exec(code);
    if (digitMatch) {
      const map: Record<string, string> = {
        '0': 'ZERO',
        '1': 'ONE',
        '2': 'TWO',
        '3': 'THREE',
        '4': 'FOUR',
        '5': 'FIVE',
        '6': 'SIX',
        '7': 'SEVEN',
        '8': 'EIGHT',
        '9': 'NINE',
      };

      return map[digitMatch[1]];
    }

    const numPadMatch = /^Numpad([0-9])$/.exec(code);
    if (numPadMatch) {
      const map: Record<string, string> = {
        '0': 'NUMPAD_ZERO',
        '1': 'NUMPAD_ONE',
        '2': 'NUMPAD_TWO',
        '3': 'NUMPAD_THREE',
        '4': 'NUMPAD_FOUR',
        '5': 'NUMPAD_FIVE',
        '6': 'NUMPAD_SIX',
        '7': 'NUMPAD_SEVEN',
        '8': 'NUMPAD_EIGHT',
        '9': 'NUMPAD_NINE',
      };

      return map[numPadMatch[1]];
    }

    const alphaMatch = /^Key([A-Z])$/.exec(code);
    if (alphaMatch) {
      return alphaMatch[1];
    }

    if (normalizedKey && normalizedKey.length === 1) {
      return normalizedKey;
    }

    return null;
  }

  private createKeyboardProfiles(): InputProfile[] {
    return this.keyboardBindings
      .slice(0, this.maxKeyboardProfiles)
      .map((binding, index) =>
        createKeyboardProfile(
          this,
          `keyboard-${index + 1}`,
          `Clavier ${index + 1}`,
          {
            ...binding,
            leave: index === 0 ? 'ESC' : 'BACKSPACE',
          },
        ),
      );
  }

  private getAutoPlaytestPlayerCount(): number | null {
    const value = new URLSearchParams(window.location.search).get('playtestPlayers');
    const count = Number(value);

    if (!Number.isInteger(count) || count < 2 || count > 4) {
      return null;
    }

    return count;
  }

  private startPlaytestAutoSetup(targetPlayers: number): void {
    this.setPlayerCountSelection(targetPlayers);
    this.playerProfiles = [];
    this.characterSelectionProfileIndex = 0;
    this.selectedCharacterIdByProfileId = {};

    const fallbackProfiles = this.keyboardProfiles.slice(0, targetPlayers);
    fallbackProfiles.forEach((profile) => this.joinPlayer(profile));
    this.warningText.setText(`Mode playtest: auto-jointure ${targetPlayers} joueurs.`);
    console.info(
      `${this.playtestMessagePrefix} menu-autojoin targetPlayers=${targetPlayers} joinedPlayers=${this.playerProfiles.length} joinedProfileIds=${this.playerProfiles.map((profile) => profile.id).join(',')}`,
    );
    this.playtestAutoStartAt = this.time.now + this.playtestAutoStartDelayMs;
    this.updatePlayerList();
  }

  private refreshKeyboardProfiles(): void {
    this.keyboardProfiles = this.createKeyboardProfiles();
  }

  private syncJoinedKeyboardBindings(): void {
    this.playerProfiles = this.playerProfiles.map((profile) => {
      if (profile.source !== 'keyboard') {
        return profile;
      }

      const binding = this.getKeyboardBinding(profile.id);
      return {
        ...profile,
        binding: binding ? { ...binding } : profile.binding,
      };
    });
  }

  private getKeyboardBinding(profileId: string): KeyboardBindingSet | undefined {
    const match = /^keyboard-(\d+)$/.exec(profileId);
    if (!match) {
      return undefined;
    }

    const profileIndex = Number(match[1]) - 1;
    return this.keyboardBindings[profileIndex];
  }

  private getRemappablePlayerIndexes(): number[] {
    const indexes: number[] = [];
    this.playerProfiles.forEach((profile, index) => {
      if (profile.source === 'keyboard') {
        indexes.push(index);
      }
    });

    return indexes;
  }

  private ensureRemapProfileSelectionIsValid(): void {
    const remappableIndexes = this.getRemappablePlayerIndexes();

    if (!remappableIndexes.length) {
      this.remapProfileIndex = 0;
      return;
    }

    if (!remappableIndexes.includes(this.remapProfileIndex)) {
      this.remapProfileIndex = remappableIndexes[0];
    }
  }

  private moveRemapSelection(direction: 1 | -1): void {
    const remappableIndexes = this.getRemappablePlayerIndexes();
    if (!remappableIndexes.length) {
      return;
    }

    const currentPosition = remappableIndexes.indexOf(this.remapProfileIndex);
    const nextPosition = (currentPosition + direction + remappableIndexes.length) % remappableIndexes.length;
    this.remapProfileIndex = remappableIndexes[nextPosition];
  }

  private getRemappedSelection(): LobbyProfileInfo | undefined {
    return this.playerProfiles[this.remapProfileIndex];
  }

  private beginRemapForSelection(): void {
    const selectedProfile = this.getRemappedSelection();
    if (!selectedProfile || selectedProfile.source !== 'keyboard') {
      this.warningText.setText('Sélectionne un joueur clavier pour remapper.');
      return;
    }

    const binding = this.getKeyboardBinding(selectedProfile.id);
    if (!binding) {
      this.warningText.setText('Profil clavier introuvable.');
      return;
    }

    this.remapProfileId = selectedProfile.id;
    selectedProfile.binding = { ...binding };
    this.remapActionIndex = 0;
    this.warningText.setText(`Remappage actif: ${selectedProfile.label} - ${remapActionLabels[remappableActions[0]]}`);
  }

  private getCharacterProfileById(profileId?: string): (typeof CHARACTER_PROFILES)[number] | undefined {
    if (!profileId) {
      return undefined;
    }

    return CHARACTER_PROFILES.find((profile) => profile.id === profileId);
  }

  private getFallbackCharacterId(): string {
    return CHARACTER_PROFILES[0]?.id ?? 'balanced';
  }

  private getSelectedCharacterIdForProfile(profileId: string): string {
    const selectedId = this.selectedCharacterIdByProfileId[profileId];
    const fallbackId = this.getFallbackCharacterId();
    if (!selectedId || !this.getCharacterProfileById(selectedId)) {
      this.selectedCharacterIdByProfileId[profileId] = fallbackId;
      return fallbackId;
    }

    return selectedId;
  }

  private getSelectedCharacterName(profileId: string): string {
    const selectedId = this.getSelectedCharacterIdForProfile(profileId);
    const profile = this.getCharacterProfileById(selectedId);
    return profile?.name ?? selectedId;
  }

  private ensureCharacterSelectionProfileIndexIsValid(): void {
    if (!this.playerProfiles.length) {
      this.characterSelectionProfileIndex = 0;
      return;
    }

    if (this.characterSelectionProfileIndex < 0) {
      this.characterSelectionProfileIndex = 0;
      return;
    }

    if (this.characterSelectionProfileIndex >= this.playerProfiles.length) {
      this.characterSelectionProfileIndex = this.playerProfiles.length - 1;
    }
  }

  private moveCharacterSelection(direction: 1 | -1): void {
    if (!this.playerProfiles.length) {
      this.characterSelectionProfileIndex = 0;
      return;
    }

    const maxSlots = this.playerProfiles.length;
    const nextIndex = (this.characterSelectionProfileIndex + direction + maxSlots) % maxSlots;
    this.characterSelectionProfileIndex = nextIndex;
  }

  private cycleSelectedCharacter(direction: 1 | -1): void {
    if (!this.playerProfiles.length || !CHARACTER_PROFILES.length) {
      this.warningText.setText('Ajoute un joueur avant de choisir un personnage.');
      return;
    }

    const selectedProfile = this.playerProfiles[this.characterSelectionProfileIndex];
    if (!selectedProfile) {
      this.warningText.setText('Aucun joueur sélectionné.');
      return;
    }

    const selectedIds = CHARACTER_PROFILES.map((profile) => profile.id);
    const currentId = this.getSelectedCharacterIdForProfile(selectedProfile.id);
    const currentIndex = selectedIds.indexOf(currentId);
    const nextIndex = (currentIndex + direction + selectedIds.length) % selectedIds.length;
    this.selectedCharacterIdByProfileId[selectedProfile.id] = selectedIds[nextIndex];
    this.warningText.setText(`${selectedProfile.label}: ${this.getSelectedCharacterName(selectedProfile.id)}`);
    this.updatePlayerList();
  }

  private getSelectedCharacterProfileForCurrentSelection(): CharacterProfile | undefined {
    const active = this.playerProfiles[this.characterSelectionProfileIndex];
    if (!active) {
      return undefined;
    }

    const characterId = this.getSelectedCharacterIdForProfile(active.id);
    return this.getCharacterProfileById(characterId);
  }

  private getCharacterPaletteForProfile(profile: CharacterProfile, playerSlotIndex: number): CharacterPalette {
    const paletteOptions =
      profile.paletteVariants.length > 0
        ? profile.paletteVariants
        : [
            {
              id: 'base',
              label: 'Standard',
              bodyFill: profile.bodyFill,
              eyeFill: profile.eyeFill,
              chestFill: profile.chestFill,
              accentFill: profile.accentFill,
            },
          ];
    const paletteIndex = playerSlotIndex % paletteOptions.length;
    return paletteOptions[paletteIndex];
  }

  private getCharacterPalettePrefixForProfile(profile: CharacterProfile, playerSlotIndex: number): string {
    const paletteOptions =
      profile.paletteVariants.length > 0
        ? profile.paletteVariants
        : [
            {
              id: 'base',
              label: 'Standard',
              bodyFill: profile.bodyFill,
              eyeFill: profile.eyeFill,
              chestFill: profile.chestFill,
              accentFill: profile.accentFill,
            },
          ];
    const paletteIndex = playerSlotIndex % paletteOptions.length;
    const palette = paletteOptions[paletteIndex] ?? {
      id: 'base',
      label: 'Standard',
      bodyFill: profile.bodyFill,
      eyeFill: profile.eyeFill,
      chestFill: profile.chestFill,
      accentFill: profile.accentFill,
    };
    return paletteIndex === 0 ? profile.spritePrefix : `${profile.spritePrefix}-${palette.id}`;
  }

  private formatPreviewNumber(value: number): string {
    return value.toString();
  }

  private updateCharacterPreview(): void {
    const profile = this.getSelectedCharacterProfileForCurrentSelection();
    if (!profile) {
      this.characterPreviewNameText.setText('Aucune sélection');
      this.characterPreviewStatsText.setText('Sélectionne un joueur puis Q/E pour parcourir les personnages.');
      this.characterPreviewSprite.setTexture('char-balanced-idle');
      return;
    }

    const selectedPalette = this.getCharacterPaletteForProfile(profile, this.characterSelectionProfileIndex);
    this.characterPreviewNameText.setText(`Prévisualisation: ${profile.name}`);
    const lines = [
      profile.description ?? '',
      `Palette: ${selectedPalette.label}`,
      `Vitesse: ${this.formatPreviewNumber(profile.moveSpeed)}`,
      `Saut: ${this.formatPreviewNumber(profile.jumpStrength)}`,
      `Réserve: ${this.formatPreviewNumber(profile.maxBloodReserve)}`,
      `Transfusion: ${this.formatPreviewNumber(profile.transfusionUnitsPerSecond)} /s`,
      `Bonus soin: ${profile.transfusionHealingMultiplier.toFixed(2)}x`,
      `Hémorragie: ${this.formatPreviewNumber(profile.hemorrhageLossUnitsPerSecond)}/s`,
    ];
    this.characterPreviewStatsText.setText(lines.join('\n'));
    const palettePrefix = this.getCharacterPalettePrefixForProfile(profile, this.characterSelectionProfileIndex);
    this.characterPreviewSprite.setTexture(`${palettePrefix}-idle`);
  }

  private getSelectedCharacterIdsForLaunch(): string[] {
    return this.playerProfiles.map((profile) => this.getSelectedCharacterIdForProfile(profile.id));
  }

  private getBindingSummary(binding: KeyboardBindingSet): string {
    return `G:${binding.left} D:${binding.right} J:${binding.jump} T:${binding.down} S:${binding.shoot} M:${binding.melee}`;
  }

  private joinPlayer(profile: InputProfile): void {
    if (this.playerProfiles.find((value) => value.id === profile.id)) {
      return;
    }

    if (this.playerProfiles.length >= this.selectedPlayerCount) {
      this.warningText.setText('Limite de joueurs atteinte.');
      return;
    }

    this.playerProfiles.push({
      id: profile.id,
      label: profile.label,
      source: profile.source,
      binding: profile.source === 'keyboard' ? this.getKeyboardBinding(profile.id) : undefined,
    });
    const defaultCharacterId = this.getFallbackCharacterId();
    if (defaultCharacterId) {
      this.selectedCharacterIdByProfileId[profile.id] = defaultCharacterId;
    }
    this.characterSelectionProfileIndex = this.playerProfiles.length - 1;
    this.ensureRemapProfileSelectionIsValid();
    this.ensureCharacterSelectionProfileIndexIsValid();

    this.warningText.setText('');
  }

  private leavePlayer(profileId: string): void {
    this.playerProfiles = this.playerProfiles.filter((profile) => profile.id !== profileId);
    delete this.selectedCharacterIdByProfileId[profileId];
    this.ensureRemapProfileSelectionIsValid();
    this.ensureCharacterSelectionProfileIndexIsValid();
    if (this.remapProfileId === profileId) {
      this.remapProfileId = null;
    }
  }

  private pruneMissingGamepads(): void {
    const activeIds = new Set(this.gamepadProfiles.map((profile) => profile.id));
    this.playerProfiles = this.playerProfiles.filter((player) => {
      if (player.source !== 'gamepad') {
        return true;
      }

      return activeIds.has(player.id);
    });

    const validActiveIds = new Set(
      this.input.gamepad?.gamepads
        .filter((gamepad) => Boolean(gamepad?.connected))
        .map((gamepad) => `gamepad-${gamepad?.index}`)
        .filter((value): value is string => typeof value === 'string') ?? [],
    );

    this.gamepadProfiles = this.gamepadProfiles.filter((profile) => validActiveIds.has(profile.id));
  }

  private updatePlayerList(): void {
    const lines = [
      `Joueurs connectés (${this.playerProfiles.length}/${this.selectedPlayerCount})`,
      '',
      `Mode: ${this.getModeLabel()}`,
      `Nombre de joueurs : [1] [2] [3] [4] — cible ${this.selectedPlayerCount}`,
      `Arme: ${this.getSelectedWeaponLabel()}`,
      `Arène: ${this.getSelectedArenaLabel()}`,
    ];

    const arenaPreview = this.getSelectedArenaPreview();
    if (arenaPreview.length > 0) {
      lines.push(`Aperçu: ${arenaPreview.join(' • ')}`);
    }
    lines.push('');

    const maxSlots = this.maxPlayers;
    for (let index = 1; index <= maxSlots; index += 1) {
      const active = this.playerProfiles[index - 1];
      if (!active) {
        lines.push(`Place ${index}: [vide]`);
        continue;
      }

      const source = active.source === 'keyboard' ? 'Clavier' : 'Manette';
      const selectedCharacterName = this.getSelectedCharacterName(active.id);
      const isCharacterTarget = this.characterSelectionProfileIndex === index - 1;
      const playerPrefix = this.remapProfileIndex === index - 1 ? '[>]' : '[ ]';
      const characterPrefix = isCharacterTarget ? '[C]' : '[ ]';
      let controlsLine = '';
      if (active.source === 'keyboard' && active.binding) {
        controlsLine = ` ${this.getBindingSummary(active.binding)}`;
      }

      lines.push(
        `${playerPrefix} ${characterPrefix} Place ${index}: ${active.label} (${source})${controlsLine} — ${selectedCharacterName}`,
      );
    }

    lines.push('', `Manettes connectées: ${this.gamepadProfiles.length}`);
    lines.push('Actions:');
    lines.push('- Arme: , / . (changer)');
    lines.push('- Arène: [ / ] (changer)');
    lines.push('- Personnage: Q / E (changer), ↑ / ↓ (sélectionner le joueur)');
    lines.push('- Join clavier: touches 1 (P1) / 2 (P2) / 3 (P3) / 4 (P4)');
    lines.push('- Quitter: ESC');
    lines.push('- Options: F1');
    lines.push('- Crédits: F2');
    lines.push('- Aide: F3');
    lines.push('- Confidentialité: F4');
    lines.push('- Nombre joueurs: appuie sur 1 / 2 / 3 / 4');
    lines.push('- Manette: START (rejoindre), SELECT/BACK (quitter)');
    lines.push('');
    lines.push(`Zone morte manette: ${this.gamepadDeadZone.toFixed(2)} (O/P)`);

    this.playerListText.setText(lines.join('\n'));
    this.selectedWeaponIcon.setTexture(this.getSelectedWeaponIconTexture());
    this.updateCharacterPreview();
  }
}
