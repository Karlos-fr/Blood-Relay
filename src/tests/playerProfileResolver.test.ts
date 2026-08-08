import { describe, expect, test } from 'vitest';
import { InputProfile } from '../input/profiles/input';
import { KeyboardBindingSet, defaultKeyboardProfiles } from '../input/profiles/keyboard';
import {
  LobbyProfileReference,
  isValidKeyboardBinding,
  resolvePlayerProfilesForLobby,
} from '../gameplay/input/resolvePlayerProfiles';

describe('resolvePlayerProfilesForLobby', () => {
  const actionNames: Array<keyof InputProfile['actions']> = [
    'left',
    'right',
    'jump',
    'down',
    'shoot',
    'melee',
    'dodge',
    'transfusion',
    'interact',
    'join',
    'leave',
  ];

  const createActionState = () => ({
    isDown: false,
    consumeJustDown: () => false,
    refresh: () => undefined,
  });

  const createGamepadProfile = (id: string): InputProfile => ({
    id,
    label: id,
    source: 'gamepad',
    actions: actionNames.reduce((acc, actionName) => {
      acc[actionName] = createActionState();
      return acc;
    }, {} as InputProfile['actions']),
    update: () => {
      // noop in unit test
    },
    vibrate: () => {
      // noop in unit test
    },
  });

  const createKeyboardFactory = (calls: string[]) => (
    id: string,
    label: string,
    binding: KeyboardBindingSet,
  ): InputProfile => {
    calls.push(`${id}|${label}|${binding.left}`);
    return {
      id,
      label,
      source: 'keyboard',
      actions: actionNames.reduce((acc, actionName) => {
        acc[actionName] = createActionState();
        return acc;
      }, {} as InputProfile['actions']),
      update: () => {
        // noop in unit test
      },
    };
  };

  test('résout deux manettes simultanées', () => {
    const calls: string[] = [];

    const selected: LobbyProfileReference[] = [
      { id: 'gamepad-0', label: 'Manette 1', source: 'gamepad' },
      { id: 'gamepad-1', label: 'Manette 2', source: 'gamepad' },
    ];

    const profiles = resolvePlayerProfilesForLobby({
      selectedProfiles: selected,
      detectedGamepads: [createGamepadProfile('gamepad-0'), createGamepadProfile('gamepad-1'), createGamepadProfile('gamepad-2')],
      maxPlayers: 4,
      createKeyboardProfile: createKeyboardFactory(calls),
      defaultKeyboardProfiles,
    });

    expect(calls).toHaveLength(0);
    expect(profiles).toHaveLength(2);
    expect(profiles[0].id).toBe('gamepad-0');
    expect(profiles[1].id).toBe('gamepad-1');
    expect(profiles[0].source).toBe('gamepad');
    expect(profiles[1].source).toBe('gamepad');
  });

  test('résout un mix clavier + manette', () => {
    const calls: string[] = [];
    const customBinding: KeyboardBindingSet = {
      ...defaultKeyboardProfiles[0],
      left: 'Q',
    };

    const selected: LobbyProfileReference[] = [
      { id: 'keyboard-1', label: 'Clavier 1', source: 'keyboard', binding: customBinding },
      { id: 'gamepad-0', label: 'Manette 1', source: 'gamepad' },
    ];

    const profiles = resolvePlayerProfilesForLobby({
      selectedProfiles: selected,
      detectedGamepads: [createGamepadProfile('gamepad-0')],
      maxPlayers: 4,
      createKeyboardProfile: createKeyboardFactory(calls),
      defaultKeyboardProfiles,
    });

    expect(calls).toHaveLength(1);
    expect(profiles).toHaveLength(2);
    expect(calls[0]).toContain('keyboard-1|Clavier 1|Q');
    expect(profiles[0].id).toBe('keyboard-1');
    expect(profiles[1].id).toBe('gamepad-0');
  });

  test('résout jusqu’à quatre périphériques', () => {
    const calls: string[] = [];

    const selected: LobbyProfileReference[] = [
      { id: 'keyboard-1', label: 'Clavier 1', source: 'keyboard' },
      { id: 'keyboard-2', label: 'Clavier 2', source: 'keyboard' },
      { id: 'gamepad-0', label: 'Manette 1', source: 'gamepad' },
      { id: 'gamepad-1', label: 'Manette 2', source: 'gamepad' },
    ];

    const profiles = resolvePlayerProfilesForLobby({
      selectedProfiles: selected,
      detectedGamepads: [createGamepadProfile('gamepad-0'), createGamepadProfile('gamepad-1')],
      maxPlayers: 4,
      createKeyboardProfile: createKeyboardFactory(calls),
      defaultKeyboardProfiles,
    });

    expect(profiles.map((profile) => profile.id)).toEqual(['keyboard-1', 'keyboard-2', 'gamepad-0', 'gamepad-1']);
    expect(profiles).toHaveLength(4);
    expect(calls).toHaveLength(2);
  });

  test('rejette une liaison clavier invalide', () => {
    expect(
      isValidKeyboardBinding({
        ...defaultKeyboardProfiles[0],
        left: '',
      } as KeyboardBindingSet),
    ).toBe(false);
  });
});
