import type { PaletteId } from './CharacterAppearance';

export interface CharacterPalette {
  outline: number;
  shadow: number;
  clothDark: number;
  cloth: number;
  clothLight: number;
  skinDark: number;
  skin: number;
  skinLight: number;
  metalDark: number;
  metal: number;
  metalLight: number;
  mutationDark: number;
  mutation: number;
  accent: number;
  blood: number;
}

export type PaletteRole = keyof CharacterPalette;

export const CHARACTER_PALETTES: Readonly<Record<PaletteId, CharacterPalette>> = {
  'inmate-red': {
    outline: 0x151419,
    shadow: 0x2b1c22,
    clothDark: 0x5b202a,
    cloth: 0xa93443,
    clothLight: 0xe3606b,
    skinDark: 0x6e4b40,
    skin: 0xc58b73,
    skinLight: 0xe5b29a,
    metalDark: 0x343a43,
    metal: 0x59616c,
    metalLight: 0xaeb7c0,
    mutationDark: 0x54242f,
    mutation: 0xb74358,
    accent: 0x6de2e8,
    blood: 0xd2263d,
  },
  'lab-cyan': {
    outline: 0x13171b,
    shadow: 0x1f3035,
    clothDark: 0x24505a,
    cloth: 0x3d91a3,
    clothLight: 0x83dce4,
    skinDark: 0x684a41,
    skin: 0xbf8974,
    skinLight: 0xe0ad97,
    metalDark: 0x333c46,
    metal: 0x55606c,
    metalLight: 0xb8c2cb,
    mutationDark: 0x423450,
    mutation: 0x8a6fb2,
    accent: 0xff6374,
    blood: 0xce3042,
  },
  'hazard-amber': {
    outline: 0x17150f,
    shadow: 0x332b16,
    clothDark: 0x65521b,
    cloth: 0xb68d25,
    clothLight: 0xf1ce62,
    skinDark: 0x67493e,
    skin: 0xba806b,
    skinLight: 0xdda48c,
    metalDark: 0x34393b,
    metal: 0x585d61,
    metalLight: 0xaeb3b4,
    mutationDark: 0x5c421c,
    mutation: 0xb98434,
    accent: 0x6adbe8,
    blood: 0xc92e3d,
  },
  'surgical-green': {
    outline: 0x101716,
    shadow: 0x1d3430,
    clothDark: 0x22574d,
    cloth: 0x3d8d78,
    clothLight: 0x88d5bc,
    skinDark: 0x6b4c42,
    skin: 0xc28a74,
    skinLight: 0xe2ae96,
    metalDark: 0x313c3d,
    metal: 0x536064,
    metalLight: 0xaebfc0,
    mutationDark: 0x244f46,
    mutation: 0x55ad91,
    accent: 0xff6d7e,
    blood: 0xd02d42,
  },
  'ash-violet': {
    outline: 0x15131a,
    shadow: 0x2c2338,
    clothDark: 0x49355f,
    cloth: 0x755493,
    clothLight: 0xb18ed0,
    skinDark: 0x654840,
    skin: 0xb9806f,
    skinLight: 0xdca58e,
    metalDark: 0x353943,
    metal: 0x545a66,
    metalLight: 0xaab0bd,
    mutationDark: 0x49325f,
    mutation: 0x906eb8,
    accent: 0x68d8e7,
    blood: 0xce2b41,
  },
};

export function getCharacterPalette(id: PaletteId): CharacterPalette {
  return CHARACTER_PALETTES[id];
}
