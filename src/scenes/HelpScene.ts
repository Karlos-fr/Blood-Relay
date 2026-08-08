import Phaser from 'phaser';
import { UI_THEME } from '../app/config/uiTheme';

export class HelpScene extends Phaser.Scene {
  public static readonly KEY = 'HelpScene';
  private returnKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: HelpScene.KEY });
  }

  public create(): void {
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
      .image(width / 2, 22, 'ui-panel-large')
      .setOrigin(0.5, 0)
      .setDisplaySize(contentWidth, 92)
      .setScrollFactor(0)
      .setAlpha(0.96);

    this.add
      .text(width / 2, 52, 'Aide', {
        fontSize: '56px',
        color: UI_THEME.text.titleMuted,
        fontFamily: UI_THEME.font.body,
      })
      .setOrigin(0.5, 0)
      .setShadow(2, 2, UI_THEME.scene.shadow, UI_THEME.font.shadow);

    this.add
      .image(contentX, 120, 'ui-panel-large')
      .setOrigin(0, 0)
      .setDisplaySize(contentWidth, 500)
      .setScrollFactor(0)
      .setDepth(1);

    this.add
      .text(
        contentX + 16,
        136,
        [
          'Objectif',
          'Survivre, tirer, mêlée et transfuser pour prendre l’ascendant.',
          '',
          'Controls',
          '- Déplacement: ←/→, A/D (clavier) + analogique (manette)',
          '- Saut: Z/S / Haut, W / espace pour certaines variantes clavier',
          '- Tir: C / clic / X',
          '- Melee: V / shift / B',
          '- Esquive: E / A / Y',
          '- Transfusion: R / LMB / LeftTrigger',
          '- Interaction: F / Droit',
          '- Pause: TAB (clavier) / START (manette)',
          '',
          'Match',
          'Les matchs sont en best-of : le premier joueur à atteindre les manches gagnantes remporte.',
          'Le sang reste dans l’arène et sert à refaire des réserves.',
          '',
          'Astuces',
          '- Reste en mouvement pour éviter les tirs soutenus',
          '- Utilise la fuite en cas de vie basse',
          '- Les flaques situées au centre sont des zones de risque et de rebond',
        ].join('\n'),
        {
          fontSize: '20px',
          color: UI_THEME.text.body,
          fontFamily: UI_THEME.font.mono,
          lineSpacing: 7,
        },
      )
      .setScrollFactor(0)
      .setDepth(2);

    this.add
      .text(contentX + 18, 640, 'Retour: ESC', {
        fontSize: '20px',
        color: UI_THEME.text.link,
        fontFamily: UI_THEME.font.body,
      })
      .setScrollFactor(0);

    this.returnKey = this.input.keyboard?.addKey('ESC') as Phaser.Input.Keyboard.Key;
  }

  public update(): void {
    if (Phaser.Input.Keyboard.JustDown(this.returnKey)) {
      this.scene.start('MenuScene');
    }
  }
}
