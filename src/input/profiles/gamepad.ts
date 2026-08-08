import { ActionName, DigitalActionInput, InputProfile } from './input';

const defaultMovementThreshold = 0.34;
const axisThresholdStep = 0.05;

const clampMovementThreshold = (value: number): number => Math.max(0, Math.min(1, value));

const readAxis = (gamepad: Phaser.Input.Gamepad.Gamepad, axisIndex: number): number => {
  const axis = gamepad.axes?.[axisIndex];
  if (!axis) {
    return 0;
  }

  if (typeof axis.getValue === 'function') {
    return axis.getValue();
  }

  const axisValue = typeof axis === 'number' ? axis : Number(axis.value);
  if (!Number.isFinite(axisValue)) {
    return 0;
  }

  return axisValue;
};

const isButtonDown = (gamepad: Phaser.Input.Gamepad.Gamepad, buttonIndex: number): boolean => {
  const button = gamepad.buttons?.[buttonIndex];
  return Boolean(button?.pressed);
};

const getVibrationStrength = (value: number): number => {
  return Math.max(0, Math.min(1, value));
};

const triggerVibration = (
  gamepad: Phaser.Input.Gamepad.Gamepad,
  strength = 0.35,
  durationMs = 120,
): void => {
  const actuator = (gamepad as Phaser.Input.Gamepad.Gamepad).vibrationActuator;
  if (!actuator || typeof actuator.playEffect !== 'function') {
    return;
  }

  const safeStrength = getVibrationStrength(strength);
  const safeDuration = Math.max(40, Math.min(700, Math.round(durationMs)));

  actuator.playEffect('dual-rumble', {
    startDelay: 0,
    duration: safeDuration,
    weakMagnitude: safeStrength,
    strongMagnitude: safeStrength,
  });
};

export const createGamepadProfile = (
  gamepad: Phaser.Input.Gamepad.Gamepad,
  id: string,
  label: string,
  movementThreshold = defaultMovementThreshold,
): InputProfile => {
  const normalizedMovementThreshold = Number.isFinite(movementThreshold)
    ? clampMovementThreshold(movementThreshold)
    : defaultMovementThreshold;

  const actions: Record<ActionName, DigitalActionInput> = {
    left: new DigitalActionInput(() => {
      const axis = readAxis(gamepad, 0);
      return axis < -normalizedMovementThreshold || isButtonDown(gamepad, 14);
    }),
    right: new DigitalActionInput(() => {
      const axis = readAxis(gamepad, 0);
      return axis > normalizedMovementThreshold || isButtonDown(gamepad, 15);
    }),
    jump: new DigitalActionInput(() => isButtonDown(gamepad, 0)),
    down: new DigitalActionInput(() => {
      const axis = readAxis(gamepad, 1);
      return axis > normalizedMovementThreshold || isButtonDown(gamepad, 13);
    }),
    shoot: new DigitalActionInput(() => isButtonDown(gamepad, 2)),
    melee: new DigitalActionInput(() => isButtonDown(gamepad, 3)),
    dodge: new DigitalActionInput(() => isButtonDown(gamepad, 1)),
    transfusion: new DigitalActionInput(() => isButtonDown(gamepad, 4)),
    interact: new DigitalActionInput(() => isButtonDown(gamepad, 5)),
    join: new DigitalActionInput(() => isButtonDown(gamepad, 9)),
    leave: new DigitalActionInput(() => isButtonDown(gamepad, 8)),
  };

  return {
    id,
    label,
    source: 'gamepad',
    actions,
    update: () => {
      Object.values(actions).forEach((action) => {
        action.refresh();
      });
    },
    vibrate: (strength = 0.35, durationMs = 120) => {
      triggerVibration(gamepad, strength, durationMs);
    },
  };
};

export const getConnectedGamepadProfiles = (
  gamepadPlugin: Phaser.Input.Gamepad.GamepadPlugin,
  movementThreshold = defaultMovementThreshold,
): InputProfile[] => {
  const profiles: InputProfile[] = [];
  const normalizedMovementThreshold = Number.isFinite(movementThreshold)
    ? clampMovementThreshold(movementThreshold)
    : defaultMovementThreshold;

  gamepadPlugin.gamepads.forEach((gamepad) => {
    if (!gamepad || !gamepad.connected) {
      return;
    }

    const gamepadLabel = `Manette ${gamepad.index + 1}`;
    const gamepadId = `gamepad-${gamepad.index}`;
    profiles.push(createGamepadProfile(gamepad, gamepadId, gamepadLabel, normalizedMovementThreshold));
  });

  return profiles;
};

export const getDefaultGamepadMovementThreshold = (): number => {
  return defaultMovementThreshold;
};

export const getGamepadThresholdStep = (): number => {
  return axisThresholdStep;
};
