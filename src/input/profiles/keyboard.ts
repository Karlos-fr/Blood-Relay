import Phaser from 'phaser';
import { ActionInputState, ActionName, DigitalActionInput, InputProfile } from './input';

export interface KeyboardBindingSet {
  left: string;
  right: string;
  jump: string;
  down: string;
  shoot: string;
  melee: string;
  dodge: string;
  transfusion: string;
  interact: string;
  join: string;
  leave: string;
}

type KeyboardProfiles = Record<'left' | 'right' | 'jump' | 'down' | 'shoot' | 'melee' | 'dodge' | 'transfusion' | 'interact' | 'join' | 'leave', string>;

export const createKeyboardProfile = (
  scene: Phaser.Scene,
  id: string,
  label: string,
  binding: KeyboardBindingSet,
): InputProfile => {
  const keys = scene.input.keyboard?.addKeys({
    left: binding.left,
    right: binding.right,
    jump: binding.jump,
    down: binding.down,
    shoot: binding.shoot,
    melee: binding.melee,
    dodge: binding.dodge,
    transfusion: binding.transfusion,
    interact: binding.interact,
    join: binding.join,
    leave: binding.leave,
  }) as unknown as { [K in keyof KeyboardProfiles]: Phaser.Input.Keyboard.Key };

  if (!keys) {
    throw new Error('Input clavier indisponible dans la scène');
  }

  const actions: Record<ActionName, ActionInputState> = {
    left: new DigitalActionInput(() => keys.left.isDown),
    right: new DigitalActionInput(() => keys.right.isDown),
    jump: new DigitalActionInput(() => keys.jump.isDown),
    down: new DigitalActionInput(() => keys.down.isDown),
    shoot: new DigitalActionInput(() => keys.shoot.isDown),
    melee: new DigitalActionInput(() => keys.melee.isDown),
    dodge: new DigitalActionInput(() => keys.dodge.isDown),
    transfusion: new DigitalActionInput(() => keys.transfusion.isDown),
    interact: new DigitalActionInput(() => keys.interact.isDown),
    join: new DigitalActionInput(() => keys.join.isDown),
    leave: new DigitalActionInput(() => keys.leave.isDown),
  };

  return {
    id,
    label,
    source: 'keyboard',
    actions,
    update: () => {
      Object.values(actions).forEach((action) => {
        action.refresh();
      });
    },
  };
};

export const defaultKeyboardProfiles: KeyboardBindingSet[] = [
  {
    left: 'A',
    right: 'D',
    jump: 'W',
    down: 'S',
    shoot: 'F',
    melee: 'G',
    dodge: 'SHIFT',
    transfusion: 'Q',
    interact: 'E',
    join: 'ONE',
    leave: 'ESC',
  },
  {
    left: 'LEFT',
    right: 'RIGHT',
    jump: 'UP',
    down: 'DOWN',
    shoot: 'NUMPAD_ZERO',
    melee: 'NUMPAD_ONE',
    dodge: 'NUMPAD_FOUR',
    transfusion: 'NUMPAD_TWO',
    interact: 'NUMPAD_THREE',
    join: 'TWO',
    leave: 'ESC',
  },
  {
    left: 'J',
    right: 'L',
    jump: 'I',
    down: 'K',
    shoot: 'U',
    melee: 'O',
    dodge: 'P',
    transfusion: 'Y',
    interact: 'T',
    join: 'THREE',
    leave: 'BACKSPACE',
  },
  {
    left: 'C',
    right: 'V',
    jump: 'B',
    down: 'N',
    shoot: 'M',
    melee: 'COMMA',
    dodge: 'PERIOD',
    transfusion: 'SLASH',
    interact: 'QUOTE',
    join: 'FOUR',
    leave: 'BACKSPACE',
  },
];
