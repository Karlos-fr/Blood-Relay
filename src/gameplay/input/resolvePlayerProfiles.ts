import { InputProfile } from '../../input/profiles/input';
import { KeyboardBindingSet } from '../../input/profiles/keyboard';

export interface LobbyProfileReference {
  id: string;
  label: string;
  source: InputProfile['source'];
  binding?: KeyboardBindingSet;
}

export interface ResolvePlayerProfileArgs {
  selectedProfiles: LobbyProfileReference[];
  detectedGamepads: InputProfile[];
  maxPlayers: number;
  createKeyboardProfile: (id: string, label: string, binding: KeyboardBindingSet) => InputProfile;
  defaultKeyboardProfiles: KeyboardBindingSet[];
}

export const isValidKeyboardBinding = (binding?: KeyboardBindingSet): binding is KeyboardBindingSet => {
  if (!binding) {
    return false;
  }

  return (
    typeof binding.left === 'string' &&
    binding.left.length > 0 &&
    typeof binding.right === 'string' &&
    binding.right.length > 0 &&
    typeof binding.jump === 'string' &&
    binding.jump.length > 0 &&
    typeof binding.down === 'string' &&
    binding.down.length > 0 &&
    typeof binding.shoot === 'string' &&
    binding.shoot.length > 0 &&
    typeof binding.melee === 'string' &&
    binding.melee.length > 0 &&
    typeof binding.dodge === 'string' &&
    binding.dodge.length > 0 &&
    typeof binding.transfusion === 'string' &&
    binding.transfusion.length > 0 &&
    typeof binding.interact === 'string' &&
    binding.interact.length > 0 &&
    typeof binding.join === 'string' &&
    binding.join.length > 0 &&
    typeof binding.leave === 'string' &&
    binding.leave.length > 0
  );
};

export const resolvePlayerProfilesForLobby = ({
  selectedProfiles,
  detectedGamepads,
  maxPlayers,
  createKeyboardProfile,
  defaultKeyboardProfiles,
}: ResolvePlayerProfileArgs): InputProfile[] => {
  const playerProfiles: InputProfile[] = [];
  const requestedPlayerCount = Math.max(selectedProfiles.length, 0);
  const availableGamepadProfiles = [...detectedGamepads];
  const usedGamepadIds = new Set<string>();
  const usedKeyboardIndexes = new Set<number>();

  const sanitizedSelected = selectedProfiles
    .filter((profile) => {
      if (!profile.id || profile.id.length <= 0) {
        return false;
      }

      return profile.source === 'keyboard' || profile.source === 'gamepad';
    })
    .slice(0, maxPlayers);

  sanitizedSelected.forEach((selection) => {
    if (selection.source === 'gamepad') {
      const profile = availableGamepadProfiles.find((candidate) => candidate.id === selection.id);
      if (profile) {
        playerProfiles.push(profile);
        usedGamepadIds.add(profile.id);
      }

      return;
    }

    const match = /^keyboard-(\d+)$/.exec(selection.id);
    if (!match) {
      return;
    }

    const keyboardIndex = Number(match[1]) - 1;
    const binding = isValidKeyboardBinding(selection.binding)
      ? selection.binding
      : defaultKeyboardProfiles[keyboardIndex];

    if (!binding) {
      return;
    }

    const profile = createKeyboardProfile(selection.id, selection.label, binding);
    if (!profile.actions || Object.keys(profile.actions).length !== 11 || profile.source !== 'keyboard') {
      throw new Error('Invalid keyboard profile factory result');
    }

    playerProfiles.push(profile);
    usedKeyboardIndexes.add(keyboardIndex);
  });

  if (playerProfiles.length < requestedPlayerCount) {
    availableGamepadProfiles.forEach((profile) => {
      if (playerProfiles.length >= requestedPlayerCount) {
        return;
      }

      if (usedGamepadIds.has(profile.id)) {
        return;
      }

      playerProfiles.push(profile);
    });
  }

  if (playerProfiles.length < requestedPlayerCount) {
    defaultKeyboardProfiles.forEach((binding, index) => {
      if (playerProfiles.length >= requestedPlayerCount) {
        return;
      }

      if (usedKeyboardIndexes.has(index)) {
        return;
      }

      playerProfiles.push(createKeyboardProfile(`player-${playerProfiles.length + 1}`, `Joueur ${playerProfiles.length + 1}`, binding));
    });
  }

  while (playerProfiles.length < requestedPlayerCount) {
    const firstBinding = defaultKeyboardProfiles[0];
    if (!firstBinding) {
      break;
    }

    playerProfiles.push(createKeyboardProfile(`player-${playerProfiles.length + 1}`, `Joueur ${playerProfiles.length + 1}`, firstBinding));
  }

  return playerProfiles;
};
