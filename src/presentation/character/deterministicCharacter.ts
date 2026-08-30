import {
  ACCESSORY_IDS,
  ARMOR_IDS,
  ARMS_IDS,
  BODY_IDS,
  HEAD_IDS,
  LEGS_IDS,
  MUTATION_IDS,
  PALETTE_IDS,
  TORSO_IDS,
  WEAPON_IDS,
  type CharacterAppearance,
} from './CharacterAppearance';

function createSeededRandom(seed: number): () => number {
  let state = (seed >>> 0) || 0x6d2b79f5;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function pick<T>(values: readonly T[], random: () => number): T {
  return values[Math.floor(random() * values.length)];
}

export function buildCharacterAppearance(seed: number): CharacterAppearance {
  const random = createSeededRandom(seed);
  const first = pick(ACCESSORY_IDS, random);
  let second = pick(ACCESSORY_IDS, random);
  while (second === first) second = pick(ACCESSORY_IDS, random);

  return {
    head: pick(HEAD_IDS, random),
    torso: pick(TORSO_IDS, random),
    legs: pick(LEGS_IDS, random),
    arms: pick(ARMS_IDS, random),
    weapon: pick(WEAPON_IDS, random),
    body: pick(BODY_IDS, random),
    armor: pick(ARMOR_IDS, random),
    mutation: pick(MUTATION_IDS, random),
    accessories: random() > 0.45 ? [first, second] : [first],
    palette: pick(PALETTE_IDS, random),
    seed: seed >>> 0,
  };
}

export const PLAYER_APPEARANCES: Readonly<Record<1 | 2, CharacterAppearance>> = {
  1: {
    head: 'respirator',
    torso: 'torn-suit',
    legs: 'reinforced-trousers',
    arms: 'wrapped-arms',
    weapon: 'relay-pistol',
    body: 'standard',
    armor: 'none',
    mutation: 'none',
    accessories: ['blood-bag', 'dorsal-tube'],
    palette: 'inmate-red',
    seed: 0xb100d001,
  },
  2: {
    head: 'visor',
    torso: 'light-armor',
    legs: 'torn-trousers',
    arms: 'medical-arms',
    weapon: 'relay-pistol',
    body: 'heavy',
    armor: 'industrial-vest',
    mutation: 'none',
    accessories: ['medical-pack', 'shoulder-plate'],
    palette: 'lab-cyan',
    seed: 0xb100d002,
  },
};

export const PREVIEW_APPEARANCES: Readonly<
  Record<'clone' | 'mercenary' | 'mutant' | 'mixed', CharacterAppearance>
> = {
  clone: { ...PLAYER_APPEARANCES[1], body: 'standard', armor: 'none', mutation: 'none' },
  mercenary: { ...PLAYER_APPEARANCES[2], body: 'heavy', armor: 'industrial-vest', mutation: 'none' },
  mutant: {
    ...PLAYER_APPEARANCES[1],
    body: 'gaunt',
    armor: 'none',
    mutation: 'bone-growth',
    head: 'implants',
    palette: 'ash-violet',
    seed: 0xb100d003,
  },
  mixed: {
    ...PLAYER_APPEARANCES[2],
    body: 'standard',
    armor: 'scrap-plate',
    mutation: 'blood-veins',
    torso: 'torn-suit',
    seed: 0xb100d004,
  },
};
