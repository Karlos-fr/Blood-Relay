import Phaser from 'phaser';
import './style.css';
import { GAME_HEIGHT, GAME_WIDTH, GRAVITY_Y } from './config/game';
import { isMobileDevice } from './platform/device';
import { ArenaScene } from './scenes/ArenaScene';
import { BootScene } from './scenes/BootScene';

const mobile = isMobileDevice();

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#09090f',
  pixelArt: true,
  roundPixels: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: GRAVITY_Y },
      debug: import.meta.env.DEV,
    },
  },
  scale: mobile
    ? {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.NO_CENTER,
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
      }
    : {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
      },
  scene: [BootScene, ArenaScene],
};

new Phaser.Game(config);
