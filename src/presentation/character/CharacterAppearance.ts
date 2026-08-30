export const HEAD_IDS = ['shaved', 'medical-mask', 'respirator', 'visor', 'implants'] as const;
export const TORSO_IDS = ['prison-jumpsuit', 'medical-suit', 'torn-suit', 'light-armor'] as const;
export const LEGS_IDS = ['prison-trousers', 'reinforced-trousers', 'torn-trousers'] as const;
export const ARMS_IDS = ['wrapped-arms', 'medical-arms'] as const;
export const ACCESSORY_IDS = [
  'blood-bag',
  'dorsal-tube',
  'medical-pack',
  'shoulder-plate',
  'external-implant',
  'holster',
] as const;
export const WEAPON_IDS = ['relay-pistol'] as const;
export const BODY_IDS = ['standard', 'heavy', 'gaunt'] as const;
export const ARMOR_IDS = ['none', 'scrap-plate', 'industrial-vest'] as const;
export const MUTATION_IDS = ['none', 'blood-veins', 'bone-growth', 'grafted-arm'] as const;
export const PALETTE_IDS = [
  'inmate-red',
  'lab-cyan',
  'hazard-amber',
  'surgical-green',
  'ash-violet',
] as const;

export type HeadId = (typeof HEAD_IDS)[number];
export type TorsoId = (typeof TORSO_IDS)[number];
export type LegsId = (typeof LEGS_IDS)[number];
export type ArmsId = (typeof ARMS_IDS)[number];
export type AccessoryId = (typeof ACCESSORY_IDS)[number];
export type WeaponId = (typeof WEAPON_IDS)[number];
export type BodyId = (typeof BODY_IDS)[number];
export type ArmorId = (typeof ARMOR_IDS)[number];
export type MutationId = (typeof MUTATION_IDS)[number];
export type PaletteId = (typeof PALETTE_IDS)[number];

export interface CharacterAppearance {
  head: HeadId;
  torso: TorsoId;
  legs: LegsId;
  arms: ArmsId;
  weapon: WeaponId;
  body: BodyId;
  armor: ArmorId;
  mutation: MutationId;
  accessories: AccessoryId[];
  palette: PaletteId;
  seed: number;
}
