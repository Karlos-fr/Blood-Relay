import Phaser from 'phaser';
import {
  DEFAULT_GAME_OPTIONS,
  GameOptions,
  loadGameOptions,
  normalizeGameOptions,
  saveGameOptions,
} from '../app/config/options';
import { UI_THEME } from '../app/config/uiTheme';

interface SceneOption {
  key: keyof GameOptions;
  label: string;
  type: 'range' | 'boolean';
  step?: number;
}

export class OptionsScene extends Phaser.Scene {
  public static readonly KEY = 'OptionsScene';
  private readonly options: SceneOption[] = [
    {
      key: 'masterVolume',
      label: 'Volume général',
      type: 'range',
      step: 0.05,
    },
    {
      key: 'musicVolume',
      label: 'Volume musique',
      type: 'range',
      step: 0.05,
    },
    {
      key: 'effectsVolume',
      label: 'Volume effets',
      type: 'range',
      step: 0.05,
    },
    {
      key: 'cameraShakeIntensity',
      label: 'Intensité des secousses',
      type: 'range',
      step: 0.1,
    },
    {
      key: 'flashIntensity',
      label: 'Intensité des flashes',
      type: 'range',
      step: 0.1,
    },
    {
      key: 'vibrationEnabled',
      label: 'Vibration',
      type: 'boolean',
    },
    {
      key: 'daltonianMode',
      label: 'Mode daltonien',
      type: 'boolean',
    },
    {
      key: 'reducedBloodVisual',
      label: 'Réduction du sang visuel',
      type: 'boolean',
    },
  ];

  private gameOptions: GameOptions = { ...DEFAULT_GAME_OPTIONS };
  private selectedOptionIndex = 0;
  private optionRows: Phaser.GameObjects.Text[] = [];
  private upKey!: Phaser.Input.Keyboard.Key;
  private downKey!: Phaser.Input.Keyboard.Key;
  private leftKey!: Phaser.Input.Keyboard.Key;
  private rightKey!: Phaser.Input.Keyboard.Key;
  private toggleKey!: Phaser.Input.Keyboard.Key;
  private saveKey!: Phaser.Input.Keyboard.Key;
  private backKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: OptionsScene.KEY });
  }

  public init(): void {
    const local = loadGameOptions();
    const registryOptions = this.registry.get('gameOptions');
    const fromRegistry =
      registryOptions && typeof registryOptions === 'object' ? (registryOptions as Partial<GameOptions>) : {};
    this.gameOptions = normalizeGameOptions({ ...local, ...fromRegistry });
  }

  public create(): void {
    this.cameras.main.setBackgroundColor(UI_THEME.scene.background);
    const width = this.scale.width;
    const contentWidth = Math.min(1100, width - 120);
    const contentX = (width - contentWidth) / 2;

    this.add
      .image(0, 0, 'ui-grid-snare')
      .setOrigin(0, 0)
      .setDisplaySize(width, this.scale.height)
      .setAlpha(0.18)
      .setScrollFactor(0);

    this.add
      .image(width / 2, 22, 'ui-panel-large')
      .setOrigin(0.5, 0)
      .setDisplaySize(contentWidth, 92)
      .setScrollFactor(0)
      .setAlpha(0.96);

    this.add
      .text(width / 2, 52, 'Options', {
        fontSize: '56px',
        color: UI_THEME.text.titleMuted,
        fontFamily: UI_THEME.font.body,
      })
      .setOrigin(0.5, 0)
      .setShadow(2, 2, UI_THEME.scene.shadow, UI_THEME.font.shadow);

    this.add
      .image(contentX, 130, 'ui-panel-large')
      .setOrigin(0, 0)
      .setDisplaySize(contentWidth, 370)
      .setScrollFactor(0)
      .setDepth(1);

    const listTop = 140;
    const rowHeight = 36;
    const left = contentX + 18;

    this.options.forEach((option, index) => {
      const y = listTop + index * rowHeight;
      const row = this.add.text(left, y, '', {
        fontSize: '24px',
        color: UI_THEME.text.status,
        fontFamily: UI_THEME.font.mono,
        lineSpacing: 4,
      });
      this.optionRows.push(row);
    });

    this.add
      .text(left, 500, '↑/↓ sélectionner • ←/→ modifier', {
        fontSize: '20px',
        color: UI_THEME.text.accent,
        fontFamily: UI_THEME.font.mono,
      })
      .setScrollFactor(0);

    this.add
      .text(left, 540, 'Entrée: sauvegarder • Échap: sauvegarder et retourner', {
        fontSize: '20px',
        color: UI_THEME.text.accent,
        fontFamily: UI_THEME.font.mono,
      })
      .setScrollFactor(0);

    this.upKey = this.input.keyboard?.addKey('UP') as Phaser.Input.Keyboard.Key;
    this.downKey = this.input.keyboard?.addKey('DOWN') as Phaser.Input.Keyboard.Key;
    this.leftKey = this.input.keyboard?.addKey('LEFT') as Phaser.Input.Keyboard.Key;
    this.rightKey = this.input.keyboard?.addKey('RIGHT') as Phaser.Input.Keyboard.Key;
    this.toggleKey = this.input.keyboard?.addKey('SPACE') as Phaser.Input.Keyboard.Key;
    this.saveKey = this.input.keyboard?.addKey('ENTER') as Phaser.Input.Keyboard.Key;
    this.backKey = this.input.keyboard?.addKey('ESC') as Phaser.Input.Keyboard.Key;

    this.renderOptions();
  }

  public update(): void {
    if (Phaser.Input.Keyboard.JustDown(this.upKey)) {
      this.selectedOptionIndex = (this.selectedOptionIndex - 1 + this.options.length) % this.options.length;
    }

    if (Phaser.Input.Keyboard.JustDown(this.downKey)) {
      this.selectedOptionIndex = (this.selectedOptionIndex + 1) % this.options.length;
    }

    const selected = this.options[this.selectedOptionIndex];

    if (Phaser.Input.Keyboard.JustDown(this.leftKey)) {
      if (selected.type === 'range') {
        this.adjustRangeOption(selected, -1);
      } else {
        this.toggleBooleanOption(selected);
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.rightKey)) {
      if (selected.type === 'range') {
        this.adjustRangeOption(selected, 1);
      } else {
        this.toggleBooleanOption(selected);
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.toggleKey) && selected.type === 'boolean') {
      this.toggleBooleanOption(selected);
    }

    if (Phaser.Input.Keyboard.JustDown(this.saveKey) || Phaser.Input.Keyboard.JustDown(this.backKey)) {
      this.saveAndExit();
      return;
    }

    this.renderOptions();
  }

  private adjustRangeOption(option: SceneOption, direction: number): void {
    if (option.type !== 'range' || option.step === undefined) {
      return;
    }

    const step = option.step;
    const next = this.clamp01((this.gameOptions[option.key] as number) + direction * step);
    (this.gameOptions as Record<string, number | boolean>)[option.key] = next;
  }

  private toggleBooleanOption(option: SceneOption): void {
    if (option.type !== 'boolean') {
      return;
    }

    const value = this.gameOptions[option.key];
    (this.gameOptions as Record<string, number | boolean>)[option.key] = !value;
  }

  private clamp01(value: number): number {
    return Math.max(0, Math.min(1, value));
  }

  private renderOptions(): void {
    this.optionRows.forEach((row, index) => {
      const option = this.options[index];
      const isSelected = this.selectedOptionIndex === index;
      const prefix = isSelected ? '→ ' : '  ';
      const value = this.getFormattedValue(option);
      row.setText(`${prefix}${option.label}: ${value}`);
      row.setColor(isSelected ? UI_THEME.text.title : UI_THEME.text.bodyDim);
      row.setFontSize(isSelected ? 26 : 24);
    });
  }

  private getFormattedValue(option: SceneOption): string {
    const value = this.gameOptions[option.key];
    if (option.type === 'boolean') {
      return value ? 'Activé' : 'Désactivé';
    }

    return `${Math.round((value as number) * 100)} %`;
  }

  private saveAndExit(): void {
    this.gameOptions = normalizeGameOptions(this.gameOptions);
    this.registry.set('gameOptions', this.gameOptions);
    saveGameOptions(this.gameOptions);
    this.scene.start('MenuScene');
  }
}
