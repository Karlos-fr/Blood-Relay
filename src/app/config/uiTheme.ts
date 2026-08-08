import { MAIN_PALETTE, PLAYER_PALETTES, DECOR_CHARACTER_CONTRAST } from './artDirection';
import { BRAND_PALETTE } from './brand';

const playerColors = [...PLAYER_PALETTES];

export const UI_THEME = {
  scene: {
    background: MAIN_PALETTE.sceneBackground,
    bootBackground: MAIN_PALETTE.bootBackground,
    shadow: MAIN_PALETTE.sceneShadow,
    panel: {
      outer: MAIN_PALETTE.panelOuter,
      inner: MAIN_PALETTE.panelInner,
    },
  },
  text: {
    title: BRAND_PALETTE.text.title,
    titleMuted: BRAND_PALETTE.text.titleMuted,
    body: BRAND_PALETTE.text.body,
    bodyDim: BRAND_PALETTE.text.bodyDim,
    secondary: BRAND_PALETTE.text.secondary,
    muted: BRAND_PALETTE.text.muted,
    accent: BRAND_PALETTE.text.accent,
    link: BRAND_PALETTE.text.link,
    status: BRAND_PALETTE.text.status,
    warning: BRAND_PALETTE.text.warning,
  },
  font: {
    title: BRAND_PALETTE.ui.fontFamilyTitle,
    body: BRAND_PALETTE.ui.fontFamilyBody,
    mono: BRAND_PALETTE.ui.fontFamilyMono,
    shadow: BRAND_PALETTE.ui.shadow,
  },
  gameplay: {
    playerColors,
    playerBodyFill: DECOR_CHARACTER_CONTRAST.gameplay.playerBodyFill,
    playerEyeFill: DECOR_CHARACTER_CONTRAST.gameplay.playerEyeFill,
    playerFaceLight: 0xffffff,
    playerChest: DECOR_CHARACTER_CONTRAST.gameplay.playerChest,
    projectile: 0xffe06b,
    melee: 0xd64b4b,
    interactionFill: 0x57f4a7,
    interactionStroke: 0xa9ffe6,
    platform: DECOR_CHARACTER_CONTRAST.gameplay.platform,
    bloodFill: DECOR_CHARACTER_CONTRAST.gameplay.bloodFill,
    contrastBoost: DECOR_CHARACTER_CONTRAST.gameplayContrastBoost,
  },
};
