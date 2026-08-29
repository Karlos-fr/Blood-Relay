import Phaser from 'phaser';

export interface PlayerControls {
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  jump: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
}

export interface KeyboardProfile {
  controls: PlayerControls;
  label: string;
}

export function createKeyboardProfile(scene: Phaser.Scene, playerIndex: 0 | 1): KeyboardProfile {
  const keyboard = scene.input.keyboard;

  if (!keyboard) {
    throw new Error('Keyboard input is unavailable.');
  }

  if (playerIndex === 0) {
    return {
      controls: {
        left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
        right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        jump: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
        down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      },
      label: 'P1  Q/D : bouger   Z : sauter   S+Z : descendre',
    };
  }

  return {
    controls: {
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      jump: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
    },
    label: 'P2  ←/→ : bouger   ↑ : sauter   ↓+↑ : descendre',
  };
}
