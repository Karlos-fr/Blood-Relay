import Phaser from 'phaser';
import { selectBootTarget } from './bootTarget';

export class BootScene extends Phaser.Scene {
  public constructor() {
    super('BootScene');
  }

  public create(): void {
    this.scene.start(selectBootTarget(window.location.search));
  }
}
