import type { CharacterAppearance } from './CharacterAppearance';
import type { CharacterModuleDefinition } from './moduleGeometry';
import { ACCESSORY_MODULES } from './modules/accessories';
import { ARMS_MODULES } from './modules/arms';
import { HEAD_MODULES } from './modules/heads';
import { LEGS_MODULES } from './modules/legs';
import { TORSO_MODULES } from './modules/torsos';
import { WEAPON_MODULES } from './modules/weapons';

export function resolveAppearanceModules(
  appearance: CharacterAppearance,
): CharacterModuleDefinition[] {
  return [
    LEGS_MODULES[appearance.legs],
    TORSO_MODULES[appearance.torso],
    ARMS_MODULES[appearance.arms],
    HEAD_MODULES[appearance.head],
    WEAPON_MODULES[appearance.weapon],
    ...appearance.accessories.map((id) => ACCESSORY_MODULES[id]),
  ];
}

export function getAllCharacterModules(): CharacterModuleDefinition[] {
  return [
    ...Object.values(HEAD_MODULES),
    ...Object.values(TORSO_MODULES),
    ...Object.values(LEGS_MODULES),
    ...Object.values(ARMS_MODULES),
    ...Object.values(ACCESSORY_MODULES),
    ...Object.values(WEAPON_MODULES),
  ];
}
