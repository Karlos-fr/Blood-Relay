export interface CharacterProfile {
  id: string;
  name: string;
  description: string;
  paletteVariants: CharacterPalette[];
  spritePrefix: string;
  bodyFill: number;
  eyeFill: number;
  chestFill: number;
  accentFill: number;
  eyeOffset: number;
  chestOffset: number;
  moveSpeed: number;
  acceleration: number;
  jumpStrength: number;
  dodgeSpeed: number;
  dodgeDurationMs: number;
  dodgeCooldownMs: number;
  drag: number;
  maxFallSpeed: number;
  maxHealth: number;
  maxBloodReserve: number;
  transfusionCooldownMs: number;
  transfusionDurationMs: number;
  transfusionUnitsPerSecond: number;
  transfusionHealingMultiplier: number;
  meleeCooldownMs: number;
  meleeDurationMs: number;
  meleeWindupMs: number;
  hemorrhageCriticalHealthThreshold: number;
  hemorrhageLossUnitsPerSecond: number;
  hemorrhageDurationMs?: number;
  interactionCooldownMs: number;
}

export interface CharacterPalette {
  id: string;
  label: string;
  bodyFill: number;
  eyeFill: number;
  chestFill: number;
  accentFill: number;
}

type CharacterRange = {
  min: number;
  max: number;
};

const CHARACTER_STAT_LIMITS: Readonly<Record<keyof Pick<
  CharacterProfile,
  | 'moveSpeed'
  | 'acceleration'
  | 'jumpStrength'
  | 'dodgeSpeed'
  | 'dodgeDurationMs'
  | 'dodgeCooldownMs'
  | 'drag'
  | 'maxFallSpeed'
  | 'maxHealth'
  | 'maxBloodReserve'
  | 'transfusionCooldownMs'
  | 'transfusionDurationMs'
  | 'transfusionUnitsPerSecond'
  | 'transfusionHealingMultiplier'
  | 'meleeCooldownMs'
  | 'meleeDurationMs'
  | 'meleeWindupMs'
  | 'hemorrhageCriticalHealthThreshold'
  | 'hemorrhageLossUnitsPerSecond'
  | 'interactionCooldownMs'
>, CharacterRange>> = {
  moveSpeed: { min: 220, max: 270 },
  acceleration: { min: 700, max: 980 },
  jumpStrength: { min: 500, max: 590 },
  dodgeSpeed: { min: 360, max: 470 },
  dodgeDurationMs: { min: 110, max: 180 },
  dodgeCooldownMs: { min: 500, max: 620 },
  drag: { min: 1250, max: 1650 },
  maxFallSpeed: { min: 1000, max: 1150 },
  maxHealth: { min: 95, max: 125 },
  maxBloodReserve: { min: 120, max: 210 },
  transfusionCooldownMs: { min: 580, max: 920 },
  transfusionDurationMs: { min: 460, max: 620 },
  transfusionUnitsPerSecond: { min: 22, max: 44 },
  transfusionHealingMultiplier: { min: 1.0, max: 1.25 },
  meleeCooldownMs: { min: 380, max: 520 },
  meleeDurationMs: { min: 140, max: 180 },
  meleeWindupMs: { min: 78, max: 100 },
  hemorrhageCriticalHealthThreshold: { min: 30, max: 40 },
  hemorrhageLossUnitsPerSecond: { min: 1.5, max: 3 },
  interactionCooldownMs: { min: 380, max: 500 },
};

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const clampProfile = (profile: CharacterProfile): CharacterProfile => {
  return {
    ...profile,
    paletteVariants: profile.paletteVariants.slice(0, 4),
    moveSpeed: clamp(profile.moveSpeed, CHARACTER_STAT_LIMITS.moveSpeed.min, CHARACTER_STAT_LIMITS.moveSpeed.max),
    acceleration: clamp(profile.acceleration, CHARACTER_STAT_LIMITS.acceleration.min, CHARACTER_STAT_LIMITS.acceleration.max),
    jumpStrength: clamp(profile.jumpStrength, CHARACTER_STAT_LIMITS.jumpStrength.min, CHARACTER_STAT_LIMITS.jumpStrength.max),
    dodgeSpeed: clamp(profile.dodgeSpeed, CHARACTER_STAT_LIMITS.dodgeSpeed.min, CHARACTER_STAT_LIMITS.dodgeSpeed.max),
    dodgeDurationMs: clamp(profile.dodgeDurationMs, CHARACTER_STAT_LIMITS.dodgeDurationMs.min, CHARACTER_STAT_LIMITS.dodgeDurationMs.max),
    dodgeCooldownMs: clamp(profile.dodgeCooldownMs, CHARACTER_STAT_LIMITS.dodgeCooldownMs.min, CHARACTER_STAT_LIMITS.dodgeCooldownMs.max),
    drag: clamp(profile.drag, CHARACTER_STAT_LIMITS.drag.min, CHARACTER_STAT_LIMITS.drag.max),
    maxFallSpeed: clamp(profile.maxFallSpeed, CHARACTER_STAT_LIMITS.maxFallSpeed.min, CHARACTER_STAT_LIMITS.maxFallSpeed.max),
    maxHealth: clamp(profile.maxHealth, CHARACTER_STAT_LIMITS.maxHealth.min, CHARACTER_STAT_LIMITS.maxHealth.max),
    maxBloodReserve: clamp(
      profile.maxBloodReserve,
      CHARACTER_STAT_LIMITS.maxBloodReserve.min,
      CHARACTER_STAT_LIMITS.maxBloodReserve.max,
    ),
    transfusionCooldownMs: clamp(
      profile.transfusionCooldownMs,
      CHARACTER_STAT_LIMITS.transfusionCooldownMs.min,
      CHARACTER_STAT_LIMITS.transfusionCooldownMs.max,
    ),
    transfusionDurationMs: clamp(
      profile.transfusionDurationMs,
      CHARACTER_STAT_LIMITS.transfusionDurationMs.min,
      CHARACTER_STAT_LIMITS.transfusionDurationMs.max,
    ),
    transfusionUnitsPerSecond: clamp(
      profile.transfusionUnitsPerSecond,
      CHARACTER_STAT_LIMITS.transfusionUnitsPerSecond.min,
      CHARACTER_STAT_LIMITS.transfusionUnitsPerSecond.max,
    ),
    transfusionHealingMultiplier: clamp(
      profile.transfusionHealingMultiplier,
      CHARACTER_STAT_LIMITS.transfusionHealingMultiplier.min,
      CHARACTER_STAT_LIMITS.transfusionHealingMultiplier.max,
    ),
    meleeCooldownMs: clamp(
      profile.meleeCooldownMs,
      CHARACTER_STAT_LIMITS.meleeCooldownMs.min,
      CHARACTER_STAT_LIMITS.meleeCooldownMs.max,
    ),
    meleeDurationMs: clamp(
      profile.meleeDurationMs,
      CHARACTER_STAT_LIMITS.meleeDurationMs.min,
      CHARACTER_STAT_LIMITS.meleeDurationMs.max,
    ),
    meleeWindupMs: clamp(
      profile.meleeWindupMs,
      CHARACTER_STAT_LIMITS.meleeWindupMs.min,
      CHARACTER_STAT_LIMITS.meleeWindupMs.max,
    ),
    hemorrhageCriticalHealthThreshold: clamp(
      profile.hemorrhageCriticalHealthThreshold,
      CHARACTER_STAT_LIMITS.hemorrhageCriticalHealthThreshold.min,
      CHARACTER_STAT_LIMITS.hemorrhageCriticalHealthThreshold.max,
    ),
    hemorrhageLossUnitsPerSecond: clamp(
      profile.hemorrhageLossUnitsPerSecond,
      CHARACTER_STAT_LIMITS.hemorrhageLossUnitsPerSecond.min,
      CHARACTER_STAT_LIMITS.hemorrhageLossUnitsPerSecond.max,
    ),
    interactionCooldownMs: clamp(
      profile.interactionCooldownMs,
      CHARACTER_STAT_LIMITS.interactionCooldownMs.min,
      CHARACTER_STAT_LIMITS.interactionCooldownMs.max,
    ),
  };
};

export const CHARACTER_PROFILES: CharacterProfile[] = [
  {
    id: 'balanced',
    name: 'Médiateur',
    description: 'Option stable et équilibrée pour contrôler le rythme du combat.',
    paletteVariants: [
      {
        id: 'base',
        label: 'Standard',
        bodyFill: 0x7f8db2,
        eyeFill: 0x0f1729,
        chestFill: 0x273858,
        accentFill: 0x8ec7ff,
      },
      {
        id: 'lumiere',
        label: 'Lumière',
        bodyFill: 0x9eb6e0,
        eyeFill: 0x121f34,
        chestFill: 0x385a8f,
        accentFill: 0xb6dbff,
      },
      {
        id: 'terre',
        label: 'Terre',
        bodyFill: 0x8d7f63,
        eyeFill: 0x18140f,
        chestFill: 0x4f4738,
        accentFill: 0xffd09a,
      },
      {
        id: 'obscure',
        label: 'Obscure',
        bodyFill: 0x5e6b96,
        eyeFill: 0x0a1120,
        chestFill: 0x242e4f,
        accentFill: 0x6d9dd4,
      },
    ],
    spritePrefix: 'char-balanced',
    bodyFill: 0x7f8db2,
    eyeFill: 0x0f1729,
    chestFill: 0x273858,
    accentFill: 0x8ec7ff,
    eyeOffset: 0,
    chestOffset: 1,
    moveSpeed: 240,
    acceleration: 900,
    jumpStrength: 545,
    dodgeSpeed: 410,
    dodgeDurationMs: 140,
    dodgeCooldownMs: 535,
    drag: 1420,
    maxFallSpeed: 1090,
    maxHealth: 105,
    maxBloodReserve: 145,
    transfusionCooldownMs: 790,
    transfusionDurationMs: 530,
    transfusionUnitsPerSecond: 30,
    transfusionHealingMultiplier: 1.1,
    meleeCooldownMs: 430,
    meleeDurationMs: 150,
    meleeWindupMs: 86,
    hemorrhageCriticalHealthThreshold: 35,
    hemorrhageLossUnitsPerSecond: 2,
    interactionCooldownMs: 430,
  },
  {
    id: 'runner',
    name: 'Runner',
    description: 'Le plus nerveux : vite sur les trajets, performant sur les déplacements.',
    paletteVariants: [
      {
        id: 'base',
        label: 'Standard',
        bodyFill: 0x2e6bd2,
        eyeFill: 0x0b1726,
        chestFill: 0x214267,
        accentFill: 0x8ff4ff,
      },
      {
        id: 'aigue',
        label: 'Aigue',
        bodyFill: 0x4f80d6,
        eyeFill: 0x111f34,
        chestFill: 0x38689c,
        accentFill: 0xb6fdff,
      },
      {
        id: 'foret',
        label: 'Forêt',
        bodyFill: 0x3e5b9d,
        eyeFill: 0x090f1c,
        chestFill: 0x273d5f,
        accentFill: 0x8ad4ff,
      },
      {
        id: 'violet',
        label: 'Violet',
        bodyFill: 0x684fb1,
        eyeFill: 0x150e1f,
        chestFill: 0x3a3f6e,
        accentFill: 0xdecbff,
      },
    ],
    spritePrefix: 'char-runner',
    bodyFill: 0x2e6bd2,
    eyeFill: 0x0b1726,
    chestFill: 0x214267,
    accentFill: 0x8ff4ff,
    eyeOffset: 0,
    chestOffset: 1,
    moveSpeed: 250,
    acceleration: 900,
    jumpStrength: 560,
    dodgeSpeed: 430,
    dodgeDurationMs: 132,
    dodgeCooldownMs: 540,
    drag: 1400,
    maxFallSpeed: 1100,
    maxHealth: 100,
    maxBloodReserve: 130,
    transfusionCooldownMs: 760,
    transfusionDurationMs: 500,
    transfusionUnitsPerSecond: 32,
    transfusionHealingMultiplier: 1.15,
    meleeCooldownMs: 400,
    meleeDurationMs: 150,
    meleeWindupMs: 84,
    hemorrhageCriticalHealthThreshold: 34,
    hemorrhageLossUnitsPerSecond: 2,
    interactionCooldownMs: 420,
  },
  {
    id: 'juggernaut',
    name: 'Juggernaut',
    description: 'Porte bien la pression avec plus de robustesse, moins de mobilité.',
    paletteVariants: [
      {
        id: 'base',
        label: 'Standard',
        bodyFill: 0x6f5bd7,
        eyeFill: 0x1f1a33,
        chestFill: 0x342e57,
        accentFill: 0xffcb6b,
      },
      {
        id: 'fer',
        label: 'Fer',
        bodyFill: 0x8270ea,
        eyeFill: 0x2b2346,
        chestFill: 0x514b74,
        accentFill: 0xffd89a,
      },
      {
        id: 'crepuscule',
        label: 'Crépuscule',
        bodyFill: 0x5a548d,
        eyeFill: 0x161125,
        chestFill: 0x28234f,
        accentFill: 0xdba24b,
      },
      {
        id: 'brume',
        label: 'Brume',
        bodyFill: 0x4c6cae,
        eyeFill: 0x1a2b46,
        chestFill: 0x32567c,
        accentFill: 0x89d3ff,
      },
    ],
    spritePrefix: 'char-juggernaut',
    bodyFill: 0x6f5bd7,
    eyeFill: 0x1f1a33,
    chestFill: 0x342e57,
    accentFill: 0xffcb6b,
    eyeOffset: -1,
    chestOffset: 3,
    moveSpeed: 230,
    acceleration: 840,
    jumpStrength: 530,
    dodgeSpeed: 390,
    dodgeDurationMs: 152,
    dodgeCooldownMs: 560,
    drag: 1500,
    maxFallSpeed: 1060,
    maxHealth: 115,
    maxBloodReserve: 155,
    transfusionCooldownMs: 830,
    transfusionDurationMs: 560,
    transfusionUnitsPerSecond: 26,
    transfusionHealingMultiplier: 1.08,
    meleeCooldownMs: 460,
    meleeDurationMs: 160,
    meleeWindupMs: 90,
    hemorrhageCriticalHealthThreshold: 37,
    hemorrhageLossUnitsPerSecond: 2,
    interactionCooldownMs: 450,
  },
  {
    id: 'transfusionist',
    name: 'Transfuseur',
    description: 'Spécialiste de la survie en duel grâce à une transfusion plus efficace.',
    paletteVariants: [
      {
        id: 'base',
        label: 'Standard',
        bodyFill: 0x47b7a0,
        eyeFill: 0x091922,
        chestFill: 0x1f685c,
        accentFill: 0xa5f5ff,
      },
      {
        id: 'emeraude',
        label: 'Émeraude',
        bodyFill: 0x4cc6ae,
        eyeFill: 0x0c2735,
        chestFill: 0x2b896e,
        accentFill: 0xb9ffcc,
      },
      {
        id: 'taupe',
        label: 'Taupe',
        bodyFill: 0x4c7b63,
        eyeFill: 0x061315,
        chestFill: 0x2a5a4c,
        accentFill: 0x8fcebc,
      },
      {
        id: 'lunaire',
        label: 'Lunaire',
        bodyFill: 0x7fae78,
        eyeFill: 0x13281c,
        chestFill: 0x366746,
        accentFill: 0xe0ff95,
      },
    ],
    spritePrefix: 'char-transfusionist',
    bodyFill: 0x47b7a0,
    eyeFill: 0x091922,
    chestFill: 0x1f685c,
    accentFill: 0xa5f5ff,
    eyeOffset: 1,
    chestOffset: 2,
    moveSpeed: 235,
    acceleration: 860,
    jumpStrength: 548,
    dodgeSpeed: 400,
    dodgeDurationMs: 146,
    dodgeCooldownMs: 525,
    drag: 1380,
    maxFallSpeed: 1080,
    maxHealth: 102,
    maxBloodReserve: 165,
    transfusionCooldownMs: 620,
    transfusionDurationMs: 470,
    transfusionUnitsPerSecond: 38,
    transfusionHealingMultiplier: 1.22,
    meleeCooldownMs: 450,
    meleeDurationMs: 150,
    meleeWindupMs: 84,
    hemorrhageCriticalHealthThreshold: 33,
    hemorrhageLossUnitsPerSecond: 2,
    interactionCooldownMs: 440,
  },
  {
    id: 'recovery',
    name: 'Récupérateur',
    description: 'Privilégie la gestion de sang avec une plus grande réserve.',
    paletteVariants: [
      {
        id: 'base',
        label: 'Standard',
        bodyFill: 0xd07a41,
        eyeFill: 0x2a1612,
        chestFill: 0x75401f,
        accentFill: 0xffd89f,
      },
      {
        id: 'corail',
        label: 'Corail',
        bodyFill: 0xdd8c55,
        eyeFill: 0x33211a,
        chestFill: 0x8a582b,
        accentFill: 0xffe3b8,
      },
      {
        id: 'ambre',
        label: 'Ambre',
        bodyFill: 0xa9683e,
        eyeFill: 0x271711,
        chestFill: 0x5f381f,
        accentFill: 0xf4a84d,
      },
      {
        id: 'foudre',
        label: 'Foudre',
        bodyFill: 0x9c75ae,
        eyeFill: 0x2f2130,
        chestFill: 0x63406f,
        accentFill: 0xffd2ff,
      },
    ],
    spritePrefix: 'char-recovery',
    bodyFill: 0xd07a41,
    eyeFill: 0x2a1612,
    chestFill: 0x75401f,
    accentFill: 0xffd89f,
    eyeOffset: -1,
    chestOffset: 1,
    moveSpeed: 232,
    acceleration: 920,
    jumpStrength: 545,
    dodgeSpeed: 402,
    dodgeDurationMs: 146,
    dodgeCooldownMs: 545,
    drag: 1350,
    maxFallSpeed: 1090,
    maxHealth: 108,
    maxBloodReserve: 190,
    transfusionCooldownMs: 760,
    transfusionDurationMs: 540,
    transfusionUnitsPerSecond: 28,
    transfusionHealingMultiplier: 1.06,
    meleeCooldownMs: 455,
    meleeDurationMs: 158,
    meleeWindupMs: 88,
    hemorrhageCriticalHealthThreshold: 36,
    hemorrhageLossUnitsPerSecond: 1.7,
    interactionCooldownMs: 430,
  },
].map(clampProfile);

export const CHARACTER_VISUAL_PROFILES = CHARACTER_PROFILES;
