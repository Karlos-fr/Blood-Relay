import { BRAND_PALETTE } from './brand';

export const LOGICAL_RESOLUTION = {
  width: 1280,
  height: 720,
} as const;

export const PLAYER_SPRITE_SIZE = {
  width: 48,
  height: 64,
} as const;

export const MAIN_PALETTE = {
  sceneBackground: BRAND_PALETTE.scene.background,
  bootBackground: BRAND_PALETTE.scene.bootBackground,
  sceneShadow: BRAND_PALETTE.scene.shadow,
  panelOuter: BRAND_PALETTE.scene.panelOuter,
  panelInner: BRAND_PALETTE.scene.panelInner,
} as const;

export const PLAYER_PALETTES = [
  0x6bbcff,
  0xf4a742,
  0x7ef48a,
  0xb15de0,
] as const;

export const DECOR_CHARACTER_CONTRAST = {
  gameplay: {
    playerBodyFill: 0x2f6ca8,
    playerEyeFill: 0x101a28,
    playerChest: 0x1f3350,
    platform: 0x2f3f5f,
    bloodFill: 0x0e0f13,
  },
  gameplayContrastBoost: 0x88d0ff,
} as const;
