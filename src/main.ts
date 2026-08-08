import Phaser from 'phaser';
import { MAIN_PALETTE } from './app/config/artDirection';
import { ARENA_HEIGHT, ARENA_WIDTH } from './app/config/game';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { ArenaScene } from './scenes/ArenaScene';
import { ResultsScene } from './scenes/ResultsScene';
import { OptionsScene } from './scenes/OptionsScene';
import { CreditsScene } from './scenes/CreditsScene';
import { HelpScene } from './scenes/HelpScene';
import { PrivacyScene } from './scenes/PrivacyScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: ARENA_WIDTH,
  height: ARENA_HEIGHT,
  backgroundColor: MAIN_PALETTE.sceneBackground,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1200 },
      debug: false,
    },
  },
  scene: [BootScene, MenuScene, ArenaScene, ResultsScene, OptionsScene, CreditsScene, HelpScene, PrivacyScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

new Phaser.Game(config);
