import Phaser from 'phaser';
import { UI_THEME } from '../app/config/uiTheme';

export class PrivacyScene extends Phaser.Scene {
  public static readonly KEY = 'PrivacyScene';
  private returnKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: PrivacyScene.KEY });
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
      .text(width / 2, 52, 'Politique de confidentialité', {
        fontSize: '52px',
        color: UI_THEME.text.titleMuted,
        fontFamily: UI_THEME.font.body,
      })
      .setOrigin(0.5, 0)
      .setShadow(2, 2, UI_THEME.scene.shadow, UI_THEME.font.shadow);

    this.add
      .image(contentX, 120, 'ui-panel-large')
      .setOrigin(0, 0)
      .setDisplaySize(contentWidth, 520)
      .setScrollFactor(0)
      .setDepth(1);

    this.add
      .text(
        contentX + 16,
        136,
        [
          'Le projet Blood Relay ne collecte pas de données personnelles.',
          'Données locales utilisées :',
          '- Paramètres de jeu sauvegardés (audio, visuel, contrôles).',
          '- Paramètres stockés uniquement dans le navigateur via localStorage.',
          '',
          'Données non collectées :',
          '- Aucune donnée d’identification, de compte ou de paiement.',
          '- Aucun tracking, aucune publicité, aucun cookie publicitaire.',
          '',
          'Données temporaires du jeu :',
          '- Logs de debug facultatifs (local, non transmis).',
          '- Données de session uniquement pour les recharges de jeu en cours.',
          '',
          'Pour toute question : créer un ticket sur le dépôt du projet.',
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
      .text(contentX + 18, 650, 'Retour: ESC', {
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
