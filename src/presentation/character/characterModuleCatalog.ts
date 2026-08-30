import type { CharacterAppearance } from './CharacterAppearance';
import type { CharacterModuleDefinition } from './moduleGeometry';
import { ACCESSORY_MODULES } from './modules/accessories';
import { ARMOR_MODULES } from './modules/armor';
import { ARMS_MODULES } from './modules/arms';
import { BODY_MODULES } from './modules/bodies';
import { HEAD_MODULES } from './modules/heads';
import { LEGS_MODULES } from './modules/legs';
import { MUTATION_MODULES } from './modules/mutations';
import { TORSO_MODULES } from './modules/torsos';
import { WEAPON_MODULES } from './modules/weapons';
import {
  CHARACTER_RENDER_LAYERS,
  type CharacterRenderModule,
} from './rendering/CharacterRenderModule';

/** Temporary resolver for ProceduralCharacterView; removed with detached pieces in Task 11. */
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

/** Temporary catalog for the legacy sprite-baking runtime. */
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

export function resolveAppearanceRenderModules(
  appearance: CharacterAppearance,
): CharacterRenderModule[] {
  const selected: CharacterRenderModule[] = [
    ...appearance.accessories.map((id) => ACCESSORY_MODULES[id]),
    BODY_MODULES[appearance.body],
    LEGS_MODULES[appearance.legs],
    TORSO_MODULES[appearance.torso],
    ARMS_MODULES[appearance.arms],
    HEAD_MODULES[appearance.head],
    ARMOR_MODULES[appearance.armor],
    WEAPON_MODULES[appearance.weapon],
    MUTATION_MODULES[appearance.mutation],
  ];

  return selected.sort(
    (left, right) =>
      CHARACTER_RENDER_LAYERS.indexOf(left.layer) - CHARACTER_RENDER_LAYERS.indexOf(right.layer),
  );
}

export function getAllCharacterRenderModules(): CharacterRenderModule[] {
  return [
    ...Object.values(BODY_MODULES),
    ...Object.values(HEAD_MODULES),
    ...Object.values(TORSO_MODULES),
    ...Object.values(LEGS_MODULES),
    ...Object.values(ARMS_MODULES),
    ...Object.values(ARMOR_MODULES),
    ...Object.values(ACCESSORY_MODULES),
    ...Object.values(WEAPON_MODULES),
    ...Object.values(MUTATION_MODULES),
  ];
}
