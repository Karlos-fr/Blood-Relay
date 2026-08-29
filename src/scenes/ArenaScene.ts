import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_VERSION, GAME_WIDTH } from '../config/game';

const FLOOR_HEIGHT = 64;

export class ArenaScene extends Phaser.Scene {
  public constructor() {
    super('ArenaScene');
  }

  public create(): void {
    this.cameras.main.setBackgroundColor(0x09090f);

    const floor = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT - FLOOR_HEIGHT / 2,
      GAME_WIDTH,
      FLOOR_HEIGHT,
      0x24242e,
    );

    this.physics.add.existing(floor, true);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 24, 'BLOOD RELAY', {
        color: '#f2f2f5',
        fontFamily: 'monospace',
        fontSize: '28px',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 18, 'Phase 0 · Arena bootstrap', {
        color: '#8d8d99',
        fontFamily: 'monospace',
        fontSize: '14px',
      })
      .setOrigin(0.5);

    if (import.meta.env.DEV) {
      this.add.text(12, 12, `v${GAME_VERSION} · 960×540`, {
        color: '#c4c4cc',
        fontFamily: 'monospace',
        fontSize: '12px',
      });
    }
  }
}
