import type { PaletteId } from './CharacterAppearance';

export interface CharacterPalette {
  outline: number;
  shadow: number;
  clothDark: number;
  cloth: number;
  clothLight: number;
  skinDark: number;
  skin: number;
  metal: number;
  metalLight: number;
  accent: number;
  blood: number;
}

export const CHARACTER_PALETTES: Readonly<Record<PaletteId, CharacterPalette>> = {
  'inmate-red': {
    outline: 0x151419,
    shadow: 0x2b1c22,
    clothDark: 0x5b202a,
    cloth: 0xa93443,
    clothLight: 0xe3606b,
    skinDark: 0x6e4b40,
    skin: 0xc58b73,
    metal: 0x59616c,
    metalLight: 0xaeb7c0,
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
    metal: 0x55606c,
    metalLight: 0xb8c2cb,
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
    metal: 0x585d61,
    metalLight: 0xaeb3b4,
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
    metal: 0x536064,
    metalLight: 0xaebfc0,
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
    metal: 0x545a66,
    metalLight: 0xaab0bd,
    accent: 0x68d8e7,
    blood: 0xce2b41,
  },
};

export function getCharacterPalette(id: PaletteId): CharacterPalette {
  return CHARACTER_PALETTES[id];
}
