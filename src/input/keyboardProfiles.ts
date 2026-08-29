import Phaser from 'phaser';
import type { PlayerControls } from './playerControls';

export interface KeyboardProfile {
  controls: PlayerControls;
  label: string;
}

export function createKeyboardProfile(scene: Phaser.Scene, playerIndex: 0 | 1): KeyboardProfile {
  const keyboard = scene.input.keyboard;

  if (!keyboard) {
    throw new Error('Keyboard input is unavailable.');
  }

  const keys =
    playerIndex === 0
      ? {
          left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
          right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
          jump: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
          down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        }
      : {
          left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
          right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
          jump: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
          down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
        };

  return {
    controls: {
      isLeftDown: () => keys.left.isDown,
      isRightDown: () => keys.right.isDown,
      isDownDown: () => keys.down.isDown,
      consumeJumpPressed: () => Phaser.Input.Keyboard.JustDown(keys.jump),
    },
    label:
      playerIndex === 0
        ? 'P1  Q/D : bouger   Z : sauter   S+Z : descendre'
        : 'P2  ←/→ : bouger   ↑ : sauter   ↓+↑ : descendre',
  };
}
