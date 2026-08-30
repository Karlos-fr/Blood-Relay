# Procedural Modular Character Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current rectangular player visuals with deterministic, modular, fully procedural pixel-art fighters while preserving the existing Player physics, hitbox, controls, jump, collision behavior and Phase 1 scope.

**Architecture:** Keep `Player` as the Arcade Physics/controller source of truth and add a separate `ProceduralCharacterView` presentation object. Character appearances select cached procedural module textures attached to a shared rig; a discrete `PixelPoseAnimator` applies integer-pixel offsets for idle/run/jump/fall/landing. Right-facing module art is canonical, left is mirrored unless a module provides an override, and the data contract reserves an unused future back view.

**Tech Stack:** TypeScript strict, Phaser 3.90.0, Arcade Physics, CanvasTexture/Phaser sprites, Vitest, ESLint, Vite.

**Spec:** `docs/superpowers/specs/2026-08-30-procedural-modular-character-design.md`

## Global Constraints

- Preserve the current gameplay body footprint: base `22.5 × 34.5` multiplied by `ARENA_CONTENT_SCALE = 0.9`, currently about `20.25 × 31.05` logical pixels.
- Strict side profile only in current gameplay.
- Right-facing art is canonical; left mirrors by default and may have a dedicated override.
- The module contract reserves `back`, but this implementation does not draw or select back-facing art.
- Arms and weapon remain separate modules.
- Discrete integer-pixel poses only; no smooth skeletal rotations, IK, sub-pixel character composition or animation blending framework.
- Exactly 4 torsos, 5 heads, 3 legs, 2 arms, 6 accessories, 5 palettes and 1 placeholder weapon in the first library.
- Appearance is deterministic and serializable through module IDs, palette ID and seed.
- P1 and P2 must use fixed, clearly different appearances.
- Cosmetic overhangs never affect collisions.
- No external character art assets and no runtime full-character redraw every frame.
- Do not introduce firing, health, damage, blood pools, character selection, progression or any other Phase 2 gameplay.
- Automated tests cover deterministic/structural behavior only; final appearance and animation quality require human validation on GitHub Pages.
- Keep new files focused and preferably below 200–250 lines; split module categories instead of growing a monolith.

---

## File Map

New character presentation code lives under `src/presentation/character/`:

- `CharacterAppearance.ts` — ID unions and serializable appearance contract.
- `characterPalettes.ts` — exactly five semantic palettes.
- `deterministicCharacter.ts` — seeded composer plus fixed P1/P2 appearances.
- `moduleGeometry.ts` — pixel primitives, module-piece contract, mirroring and bounds.
- `modules/heads.ts` — five head definitions.
- `modules/torsos.ts` — four torso definitions.
- `modules/legs.ts` — three two-piece leg definitions.
- `modules/arms.ts` — two two-piece arm definitions.
- `modules/accessories.ts` — six accessory definitions.
- `modules/weapons.ts` — one placeholder weapon definition.
- `characterModuleCatalog.ts` — category lookup, appearance expansion and catalog validation helpers.
- `CharacterRig.ts` — shared anchor positions and semantic render order.
- `pixelPoses.ts` — discrete animation frame data.
- `PixelPoseAnimator.ts` — deterministic animation state/frame selection.
- `characterModuleBaker.ts` — CanvasTexture baking and cache keys.
- `ProceduralCharacterView.ts` — Phaser sprite composition and per-frame presentation update.

Existing code changed:

- `src/gameplay/player/playerGeometry.ts` — extract the unchanged hitbox constants so preservation is explicit/testable.
- `src/gameplay/player/Player.ts` — keep physics/controller logic, remove placeholder body visuals/facing marker, expose presentation state.
- `src/scenes/ArenaScene.ts` — create/update one procedural view per player.
- `PLAN.md` — record the character-presentation work inside Phase 1 and leave manual visual acceptance unchecked.

Tests live next to the focused modules.

---

### Task 1: Appearance Contract, Five Palettes and Deterministic Composition

**Files:**
- Create: `src/presentation/character/CharacterAppearance.ts`
- Create: `src/presentation/character/characterPalettes.ts`
- Create: `src/presentation/character/deterministicCharacter.ts`
- Create: `src/presentation/character/deterministicCharacter.test.ts`

**Interfaces:**
- Produces: `CharacterAppearance`, `HeadId`, `TorsoId`, `LegsId`, `ArmsId`, `AccessoryId`, `WeaponId`, `PaletteId`.
- Produces: `CharacterPalette`, `CHARACTER_PALETTES`, `getCharacterPalette(id)`.
- Produces: `buildCharacterAppearance(seed: number): CharacterAppearance`.
- Produces: `PLAYER_APPEARANCES: Readonly<Record<1 | 2, CharacterAppearance>>`.

- [ ] **Step 1: Write the failing deterministic appearance tests**

```ts
import { describe, expect, it } from 'vitest';
import {
  ACCESSORY_IDS,
  ARMS_IDS,
  HEAD_IDS,
  LEGS_IDS,
  PALETTE_IDS,
  TORSO_IDS,
  WEAPON_IDS,
} from './CharacterAppearance';
import { buildCharacterAppearance, PLAYER_APPEARANCES } from './deterministicCharacter';

describe('deterministic procedural character appearance', () => {
  it('rebuilds the same appearance from the same seed', () => {
    expect(buildCharacterAppearance(0x1234abcd)).toEqual(buildCharacterAppearance(0x1234abcd));
  });

  it('only selects valid module and palette ids', () => {
    const appearance = buildCharacterAppearance(0x0badcafe);
    expect(HEAD_IDS).toContain(appearance.head);
    expect(TORSO_IDS).toContain(appearance.torso);
    expect(LEGS_IDS).toContain(appearance.legs);
    expect(ARMS_IDS).toContain(appearance.arms);
    expect(WEAPON_IDS).toContain(appearance.weapon);
    expect(PALETTE_IDS).toContain(appearance.palette);
    expect(appearance.accessories.every((id) => ACCESSORY_IDS.includes(id))).toBe(true);
  });

  it('keeps the two prototype fighters materially different', () => {
    const p1 = PLAYER_APPEARANCES[1];
    const p2 = PLAYER_APPEARANCES[2];
    expect(p1.head).not.toBe(p2.head);
    expect(p1.torso).not.toBe(p2.torso);
    expect(p1.palette).not.toBe(p2.palette);
    expect(p1.accessories).not.toEqual(p2.accessories);
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm run test -- src/presentation/character/deterministicCharacter.test.ts
```

Expected: FAIL because the new appearance modules do not exist yet.

- [ ] **Step 3: Add the exact serializable ID contract**

Create `CharacterAppearance.ts`:

```ts
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
export const PALETTE_IDS = ['inmate-red', 'lab-cyan', 'hazard-amber', 'surgical-green', 'ash-violet'] as const;

export type HeadId = (typeof HEAD_IDS)[number];
export type TorsoId = (typeof TORSO_IDS)[number];
export type LegsId = (typeof LEGS_IDS)[number];
export type ArmsId = (typeof ARMS_IDS)[number];
export type AccessoryId = (typeof ACCESSORY_IDS)[number];
export type WeaponId = (typeof WEAPON_IDS)[number];
export type PaletteId = (typeof PALETTE_IDS)[number];

export interface CharacterAppearance {
  head: HeadId;
  torso: TorsoId;
  legs: LegsId;
  arms: ArmsId;
  weapon: WeaponId;
  accessories: AccessoryId[];
  palette: PaletteId;
  seed: number;
}
```

- [ ] **Step 4: Add exactly five semantic palettes**

Create `characterPalettes.ts` with this interface and palette table:

```ts
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
    outline: 0x151419, shadow: 0x2b1c22, clothDark: 0x5b202a, cloth: 0xa93443,
    clothLight: 0xe3606b, skinDark: 0x6e4b40, skin: 0xc58b73, metal: 0x59616c,
    metalLight: 0xaeb7c0, accent: 0x6de2e8, blood: 0xd2263d,
  },
  'lab-cyan': {
    outline: 0x13171b, shadow: 0x1f3035, clothDark: 0x24505a, cloth: 0x3d91a3,
    clothLight: 0x83dce4, skinDark: 0x684a41, skin: 0xbf8974, metal: 0x55606c,
    metalLight: 0xb8c2cb, accent: 0xff6374, blood: 0xce3042,
  },
  'hazard-amber': {
    outline: 0x17150f, shadow: 0x332b16, clothDark: 0x65521b, cloth: 0xb68d25,
    clothLight: 0xf1ce62, skinDark: 0x67493e, skin: 0xba806b, metal: 0x585d61,
    metalLight: 0xaeb3b4, accent: 0x6adbe8, blood: 0xc92e3d,
  },
  'surgical-green': {
    outline: 0x101716, shadow: 0x1d3430, clothDark: 0x22574d, cloth: 0x3d8d78,
    clothLight: 0x88d5bc, skinDark: 0x6b4c42, skin: 0xc28a74, metal: 0x536064,
    metalLight: 0xaebfc0, accent: 0xff6d7e, blood: 0xd02d42,
  },
  'ash-violet': {
    outline: 0x15131a, shadow: 0x2c2338, clothDark: 0x49355f, cloth: 0x755493,
    clothLight: 0xb18ed0, skinDark: 0x654840, skin: 0xb9806f, metal: 0x545a66,
    metalLight: 0xaab0bd, accent: 0x68d8e7, blood: 0xce2b41,
  },
};

export function getCharacterPalette(id: PaletteId): CharacterPalette {
  return CHARACTER_PALETTES[id];
}
```

- [ ] **Step 5: Implement seeded composition and fixed P1/P2 configurations**

Create `deterministicCharacter.ts`:

```ts
import {
  ACCESSORY_IDS,
  ARMS_IDS,
  HEAD_IDS,
  LEGS_IDS,
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
  const firstAccessory = pick(ACCESSORY_IDS, random);
  let secondAccessory = pick(ACCESSORY_IDS, random);
  while (secondAccessory === firstAccessory) secondAccessory = pick(ACCESSORY_IDS, random);

  return {
    head: pick(HEAD_IDS, random),
    torso: pick(TORSO_IDS, random),
    legs: pick(LEGS_IDS, random),
    arms: pick(ARMS_IDS, random),
    weapon: pick(WEAPON_IDS, random),
    accessories: random() > 0.45 ? [firstAccessory, secondAccessory] : [firstAccessory],
    palette: pick(PALETTE_IDS, random),
    seed: seed >>> 0,
  };
}

export const PLAYER_APPEARANCES: Readonly<Record<1 | 2, CharacterAppearance>> = {
  1: {
    head: 'respirator', torso: 'torn-suit', legs: 'reinforced-trousers', arms: 'wrapped-arms',
    weapon: 'relay-pistol', accessories: ['blood-bag', 'dorsal-tube'], palette: 'inmate-red',
    seed: 0xb100d001,
  },
  2: {
    head: 'visor', torso: 'light-armor', legs: 'torn-trousers', arms: 'medical-arms',
    weapon: 'relay-pistol', accessories: ['medical-pack', 'shoulder-plate'], palette: 'lab-cyan',
    seed: 0xb100d002,
  },
};
```

- [ ] **Step 6: Run focused tests and commit GREEN**

```bash
npm run test -- src/presentation/character/deterministicCharacter.test.ts
git add src/presentation/character
 git commit -m "feat: define modular character appearances"
```

Expected: PASS.

---

### Task 2: Pixel Geometry Contract, Mirroring and Bounds

**Files:**
- Create: `src/presentation/character/moduleGeometry.ts`
- Create: `src/presentation/character/moduleGeometry.test.ts`

**Interfaces:**
- Consumes: `CharacterPalette` semantic role names.
- Produces: `CharacterPieceSlot`, `RigAnchorName`, `CharacterFacing`, `PixelPrimitive`, `CharacterModulePieceDefinition`, `CharacterModuleDefinition`.
- Produces: `mirrorGeometry(primitives)`, `resolveModuleGeometry(piece, facing)`, `calculateGeometryBounds(primitives)`.

- [ ] **Step 1: Write failing mirror/orientation tests**

```ts
import { describe, expect, it } from 'vitest';
import { calculateGeometryBounds, mirrorGeometry, resolveModuleGeometry } from './moduleGeometry';

describe('procedural character module geometry', () => {
  const right = [
    { kind: 'rect' as const, x: 1, y: -2, width: 3, height: 2, role: 'cloth' as const },
    { kind: 'pixels' as const, points: [[4, 1] as const], role: 'accent' as const },
  ];

  it('mirrors integer pixel geometry around the local vertical axis', () => {
    expect(mirrorGeometry(right)).toEqual([
      { kind: 'rect', x: -3, y: -2, width: 3, height: 2, role: 'cloth' },
      { kind: 'pixels', points: [[-4, 1]], role: 'accent' },
    ]);
  });

  it('prefers an explicit left override over automatic mirroring', () => {
    const piece = {
      id: 'fixture', slot: 'head' as const, anchor: 'head' as const,
      views: { right, left: [{ kind: 'rect' as const, x: -5, y: 0, width: 1, height: 1, role: 'accent' as const }] },
    };
    expect(resolveModuleGeometry(piece, 'left')).toEqual(piece.views.left);
  });

  it('reserves back without inventing missing back art', () => {
    const piece = { id: 'fixture', slot: 'head' as const, anchor: 'head' as const, views: { right } };
    expect(resolveModuleGeometry(piece, 'back')).toBeNull();
  });

  it('calculates inclusive integer geometry bounds', () => {
    expect(calculateGeometryBounds(right)).toEqual({ minX: 1, minY: -2, maxX: 4, maxY: 1 });
  });
});
```

- [ ] **Step 2: Run focused test and verify RED**

```bash
npm run test -- src/presentation/character/moduleGeometry.test.ts
```

Expected: FAIL because geometry helpers are absent.

- [ ] **Step 3: Implement the small geometry vocabulary**

Create `moduleGeometry.ts`:

```ts
import type { CharacterPalette } from './characterPalettes';

export type PaletteRole = keyof CharacterPalette;
export type CharacterFacing = 'left' | 'right' | 'back';
export type CharacterPieceSlot =
  | 'rearAccessory' | 'rearArm' | 'rearLeg' | 'torso' | 'frontLeg'
  | 'head' | 'frontArm' | 'weapon' | 'frontAccessory';
export type RigAnchorName =
  | 'hips' | 'torso' | 'neck' | 'head'
  | 'shoulderBack' | 'shoulderFront' | 'elbowBack' | 'elbowFront'
  | 'handBack' | 'handFront' | 'weaponMount'
  | 'accessoryBack' | 'accessoryHip' | 'accessoryFront';

export interface PixelRect {
  kind: 'rect'; x: number; y: number; width: number; height: number; role: PaletteRole;
}
export interface PixelPoints {
  kind: 'pixels'; points: readonly (readonly [number, number])[]; role: PaletteRole;
}
export type PixelPrimitive = PixelRect | PixelPoints;

export interface CharacterModulePieceDefinition {
  id: string;
  slot: CharacterPieceSlot;
  anchor: RigAnchorName;
  views: {
    right: readonly PixelPrimitive[];
    left?: readonly PixelPrimitive[];
    back?: readonly PixelPrimitive[];
  };
}

export interface CharacterModuleDefinition {
  id: string;
  pieces: readonly CharacterModulePieceDefinition[];
}

export function mirrorGeometry(primitives: readonly PixelPrimitive[]): PixelPrimitive[] {
  return primitives.map((primitive) => primitive.kind === 'rect'
    ? { ...primitive, x: -primitive.x - primitive.width + 1 }
    : { ...primitive, points: primitive.points.map(([x, y]) => [-x, y] as const) });
}

export function resolveModuleGeometry(
  piece: CharacterModulePieceDefinition,
  facing: CharacterFacing,
): readonly PixelPrimitive[] | null {
  if (facing === 'back') return piece.views.back ?? null;
  if (facing === 'right') return piece.views.right;
  return piece.views.left ?? mirrorGeometry(piece.views.right);
}

export function calculateGeometryBounds(primitives: readonly PixelPrimitive[]): {
  minX: number; minY: number; maxX: number; maxY: number;
} {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const primitive of primitives) {
    if (primitive.kind === 'rect') {
      xs.push(primitive.x, primitive.x + primitive.width - 1);
      ys.push(primitive.y, primitive.y + primitive.height - 1);
    } else {
      for (const [x, y] of primitive.points) { xs.push(x); ys.push(y); }
    }
  }
  if (xs.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
}
```

- [ ] **Step 4: Run tests and commit**

```bash
npm run test -- src/presentation/character/moduleGeometry.test.ts
git add src/presentation/character/moduleGeometry.*
git commit -m "feat: add pixel module geometry contract"
```

Expected: PASS.

---

### Task 3: Initial Head, Torso, Leg and Arm Library

**Files:**
- Create: `src/presentation/character/modules/heads.ts`
- Create: `src/presentation/character/modules/torsos.ts`
- Create: `src/presentation/character/modules/legs.ts`
- Create: `src/presentation/character/modules/arms.ts`
- Create: `src/presentation/character/bodyModules.test.ts`

**Interfaces:**
- Consumes: `CharacterModuleDefinition`, `PixelPrimitive`.
- Produces: `HEAD_MODULES`, `TORSO_MODULES`, `LEGS_MODULES`, `ARMS_MODULES` keyed by the ID unions from Task 1.

- [ ] **Step 1: Write failing category-count and piece-layout tests**

```ts
import { describe, expect, it } from 'vitest';
import { ARMS_IDS, HEAD_IDS, LEGS_IDS, TORSO_IDS } from './CharacterAppearance';
import { ARMS_MODULES } from './modules/arms';
import { HEAD_MODULES } from './modules/heads';
import { LEGS_MODULES } from './modules/legs';
import { TORSO_MODULES } from './modules/torsos';

describe('initial modular body library', () => {
  it('implements every locked body id exactly once', () => {
    expect(Object.keys(HEAD_MODULES).sort()).toEqual([...HEAD_IDS].sort());
    expect(Object.keys(TORSO_MODULES).sort()).toEqual([...TORSO_IDS].sort());
    expect(Object.keys(LEGS_MODULES).sort()).toEqual([...LEGS_IDS].sort());
    expect(Object.keys(ARMS_MODULES).sort()).toEqual([...ARMS_IDS].sort());
  });

  it('splits legs and arms into rear/front pieces for side-profile layering', () => {
    for (const module of Object.values(LEGS_MODULES)) {
      expect(module.pieces.map((piece) => piece.slot)).toEqual(['rearLeg', 'frontLeg']);
    }
    for (const module of Object.values(ARMS_MODULES)) {
      expect(module.pieces.map((piece) => piece.slot)).toEqual(['rearArm', 'frontArm']);
    }
  });
});
```

- [ ] **Step 2: Run focused test and verify RED**

```bash
npm run test -- src/presentation/character/bodyModules.test.ts
```

- [ ] **Step 3: Define five readable profile heads**

Use only `rect` and explicit `pixels`; all coordinates are integer and relative to the `head` anchor. Create `heads.ts` with these exact canonical signals:

```ts
import type { HeadId } from '../CharacterAppearance';
import type { CharacterModuleDefinition, PixelPrimitive } from '../moduleGeometry';

const baseHead: PixelPrimitive[] = [
  { kind: 'rect', x: -3, y: -3, width: 6, height: 6, role: 'outline' },
  { kind: 'rect', x: -2, y: -2, width: 4, height: 5, role: 'skin' },
  { kind: 'pixels', points: [[2, -1], [3, 0]], role: 'skin' },
  { kind: 'pixels', points: [[2, -2]], role: 'outline' },
];

function head(id: HeadId, extra: PixelPrimitive[]): CharacterModuleDefinition {
  return { id, pieces: [{ id: `${id}:head`, slot: 'head', anchor: 'head', views: { right: [...baseHead, ...extra] } }] };
}

export const HEAD_MODULES: Readonly<Record<HeadId, CharacterModuleDefinition>> = {
  shaved: head('shaved', [
    { kind: 'pixels', points: [[-2, -3], [-1, -3], [0, -3]], role: 'skinDark' },
  ]),
  'medical-mask': head('medical-mask', [
    { kind: 'rect', x: 1, y: 0, width: 3, height: 2, role: 'clothLight' },
    { kind: 'pixels', points: [[0, 0], [0, 1]], role: 'outline' },
  ]),
  respirator: head('respirator', [
    { kind: 'rect', x: 1, y: 0, width: 3, height: 3, role: 'metal' },
    { kind: 'pixels', points: [[2, 0], [3, 1]], role: 'metalLight' },
    { kind: 'pixels', points: [[4, 2], [4, 3], [3, 4]], role: 'accent' },
  ]),
  visor: head('visor', [
    { kind: 'rect', x: 0, y: -2, width: 4, height: 2, role: 'metal' },
    { kind: 'rect', x: 1, y: -2, width: 3, height: 1, role: 'accent' },
  ]),
  implants: head('implants', [
    { kind: 'pixels', points: [[-3, -1], [-3, 0], [-2, 1]], role: 'metal' },
    { kind: 'pixels', points: [[-3, -2], [-2, -1]], role: 'accent' },
  ]),
};
```

- [ ] **Step 4: Define four torso silhouettes**

Create `torsos.ts` with one `torso` piece per module, anchored at `torso`:

```ts
const torsoPieces = {
  'prison-jumpsuit': [
    rect(-4, -5, 8, 11, 'outline'), rect(-3, -4, 6, 9, 'cloth'),
    rect(-3, -4, 2, 9, 'clothDark'), pixels([[2, -3], [2, 1]], 'clothLight'),
  ],
  'medical-suit': [
    rect(-4, -5, 8, 11, 'outline'), rect(-3, -4, 6, 9, 'clothLight'),
    rect(-3, 1, 6, 4, 'cloth'), rect(1, -2, 2, 2, 'accent'), pixels([[-1, -3], [-1, 3]], 'metal'),
  ],
  'torn-suit': [
    rect(-4, -5, 7, 10, 'outline'), rect(-3, -4, 6, 4, 'cloth'),
    rect(-3, 0, 5, 4, 'clothDark'), pixels([[2, 0], [3, 1], [2, 2], [1, 4]], 'skinDark'),
    pixels([[-2, -3], [1, -3]], 'clothLight'),
  ],
  'light-armor': [
    rect(-4, -5, 8, 11, 'outline'), rect(-3, -4, 6, 9, 'clothDark'),
    rect(-2, -4, 5, 5, 'metal'), rect(-1, -3, 4, 1, 'metalLight'),
    pixels([[2, -1], [2, 0]], 'accent'),
  ],
} as const;
```

Implement local `rect()` and `pixels()` helpers returning `PixelPrimitive` so the file stays compact; wrap each array as `{ id, pieces: [{ id: `${id}:torso`, slot: 'torso', anchor: 'torso', views: { right: primitives } }] }`.

- [ ] **Step 5: Define three two-piece leg modules**

Create `legs.ts`. Each ID must return exactly `rearLeg` then `frontLeg`, both anchored at `hips`:

```ts
const variants = {
  'prison-trousers': {
    rear: [rect(-3, 0, 3, 8, 'outline'), rect(-2, 0, 2, 7, 'clothDark')],
    front: [rect(0, 0, 3, 9, 'outline'), rect(0, 0, 2, 8, 'cloth')],
  },
  'reinforced-trousers': {
    rear: [rect(-3, 0, 3, 8, 'outline'), rect(-2, 0, 2, 7, 'clothDark'), rect(-2, 4, 2, 2, 'metal')],
    front: [rect(0, 0, 3, 9, 'outline'), rect(0, 0, 2, 8, 'cloth'), rect(0, 4, 2, 2, 'metalLight')],
  },
  'torn-trousers': {
    rear: [rect(-3, 0, 3, 7, 'outline'), rect(-2, 0, 2, 5, 'clothDark'), pixels([[-2, 6], [-1, 7]], 'skinDark')],
    front: [rect(0, 0, 3, 8, 'outline'), rect(0, 0, 2, 6, 'cloth'), pixels([[1, 7], [2, 8]], 'skin')],
  },
} as const;
```

- [ ] **Step 6: Define two two-piece arm modules independent from weapons**

Create `arms.ts`:

```ts
const variants = {
  'wrapped-arms': {
    rear: [rect(-2, 0, 3, 7, 'outline'), rect(-1, 0, 2, 5, 'skinDark'), rect(-1, 3, 2, 2, 'clothLight')],
    front: [rect(0, 0, 3, 7, 'outline'), rect(0, 0, 2, 5, 'skin'), rect(0, 3, 2, 2, 'clothLight')],
  },
  'medical-arms': {
    rear: [rect(-2, 0, 3, 7, 'outline'), rect(-1, 0, 2, 5, 'clothDark'), rect(-1, 5, 2, 2, 'skinDark')],
    front: [rect(0, 0, 3, 7, 'outline'), rect(0, 0, 2, 5, 'clothLight'), rect(0, 5, 2, 2, 'skin')],
  },
} as const;
```

Use `shoulderBack` for the rear piece and `shoulderFront` for the front piece.

- [ ] **Step 7: Run tests, full typecheck/build, and commit**

```bash
npm run test -- src/presentation/character/bodyModules.test.ts
npm run build
git add src/presentation/character/modules src/presentation/character/bodyModules.test.ts
git commit -m "feat: add procedural fighter body modules"
```

Expected: PASS and build succeeds.

---

### Task 4: Six Accessories, Placeholder Weapon and Complete Module Catalog

**Files:**
- Create: `src/presentation/character/modules/accessories.ts`
- Create: `src/presentation/character/modules/weapons.ts`
- Create: `src/presentation/character/characterModuleCatalog.ts`
- Create: `src/presentation/character/characterModuleCatalog.test.ts`

**Interfaces:**
- Consumes all module category tables from Task 3.
- Produces `ACCESSORY_MODULES`, `WEAPON_MODULES`.
- Produces `resolveAppearanceModules(appearance: CharacterAppearance): CharacterModuleDefinition[]`.
- Produces `getAllCharacterModules(): CharacterModuleDefinition[]` for structural validation.

- [ ] **Step 1: Write failing complete-library tests**

```ts
import { describe, expect, it } from 'vitest';
import { ACCESSORY_IDS, PALETTE_IDS, WEAPON_IDS } from './CharacterAppearance';
import { CHARACTER_PALETTES } from './characterPalettes';
import { getAllCharacterModules, resolveAppearanceModules } from './characterModuleCatalog';
import { PLAYER_APPEARANCES } from './deterministicCharacter';
import { ACCESSORY_MODULES } from './modules/accessories';
import { WEAPON_MODULES } from './modules/weapons';

describe('complete procedural character module catalog', () => {
  it('implements all six accessories and the placeholder weapon', () => {
    expect(Object.keys(ACCESSORY_MODULES).sort()).toEqual([...ACCESSORY_IDS].sort());
    expect(Object.keys(WEAPON_MODULES).sort()).toEqual([...WEAPON_IDS].sort());
  });

  it('only references semantic roles available in every palette', () => {
    const paletteRoles = new Set(Object.keys(CHARACTER_PALETTES[PALETTE_IDS[0]]));
    for (const module of getAllCharacterModules()) {
      for (const piece of module.pieces) {
        for (const primitive of piece.views.right) expect(paletteRoles.has(primitive.role)).toBe(true);
      }
    }
  });

  it('expands fixed player appearances into swappable modules', () => {
    const p1 = resolveAppearanceModules(PLAYER_APPEARANCES[1]);
    const p2 = resolveAppearanceModules(PLAYER_APPEARANCES[2]);
    expect(p1.map((module) => module.id)).not.toEqual(p2.map((module) => module.id));
    expect(p1.some((module) => module.id === 'relay-pistol')).toBe(true);
  });
});
```

- [ ] **Step 2: Run focused test and verify RED**

```bash
npm run test -- src/presentation/character/characterModuleCatalog.test.ts
```

- [ ] **Step 3: Implement six recognizable accessory modules**

Use these exact slots/anchors and signals in `accessories.ts`:

```ts
const accessorySpecs = {
  'blood-bag': {
    slot: 'rearAccessory', anchor: 'accessoryHip', geometry: [
      rect(-5, -1, 4, 6, 'outline'), rect(-4, 0, 2, 4, 'blood'),
      pixels([[-3, -2], [-2, -2], [-1, -1]], 'metalLight'),
    ],
  },
  'dorsal-tube': {
    slot: 'rearAccessory', anchor: 'accessoryBack', geometry: [
      pixels([[-1, -5], [-3, -4], [-4, -2], [-4, 0], [-3, 2], [-2, 4]], 'metal'),
      pixels([[-3, -4], [-4, -2], [-3, 2]], 'accent'),
    ],
  },
  'medical-pack': {
    slot: 'rearAccessory', anchor: 'accessoryBack', geometry: [
      rect(-6, -4, 4, 8, 'outline'), rect(-5, -3, 3, 6, 'clothLight'),
      pixels([[-4, -1], [-4, 0], [-5, 0], [-3, 0]], 'accent'),
    ],
  },
  'shoulder-plate': {
    slot: 'frontAccessory', anchor: 'accessoryFront', geometry: [
      rect(-1, -2, 5, 3, 'outline'), rect(0, -2, 4, 2, 'metal'), pixels([[1, -2], [2, -2]], 'metalLight'),
    ],
  },
  'external-implant': {
    slot: 'frontAccessory', anchor: 'accessoryFront', geometry: [
      rect(1, -5, 2, 4, 'metal'), pixels([[2, -4], [3, -3]], 'accent'),
    ],
  },
  holster: {
    slot: 'frontAccessory', anchor: 'accessoryHip', geometry: [
      rect(2, 1, 3, 5, 'outline'), rect(2, 2, 2, 3, 'clothDark'), pixels([[4, 1]], 'metalLight'),
    ],
  },
} as const;
```

Wrap each as one `CharacterModuleDefinition`. Do not add a back view.

- [ ] **Step 4: Implement the independent placeholder weapon module**

Create `weapons.ts` with one `weapon` piece anchored at `weaponMount`:

```ts
export const WEAPON_MODULES = {
  'relay-pistol': {
    id: 'relay-pistol',
    pieces: [{
      id: 'relay-pistol:weapon',
      slot: 'weapon',
      anchor: 'weaponMount',
      views: { right: [
        rect(0, -1, 7, 3, 'outline'), rect(1, -1, 5, 2, 'metal'),
        rect(1, 2, 2, 3, 'outline'), rect(1, 2, 1, 2, 'metalLight'),
        pixels([[5, -1], [6, -1]], 'accent'),
      ] },
    }],
  },
} as const;
```

This weapon is visual only; do not add input, projectiles or firing.

- [ ] **Step 5: Implement catalog lookup and appearance expansion**

Create `characterModuleCatalog.ts`:

```ts
import type { CharacterAppearance } from './CharacterAppearance';
import type { CharacterModuleDefinition } from './moduleGeometry';
import { ACCESSORY_MODULES } from './modules/accessories';
import { ARMS_MODULES } from './modules/arms';
import { HEAD_MODULES } from './modules/heads';
import { LEGS_MODULES } from './modules/legs';
import { TORSO_MODULES } from './modules/torsos';
import { WEAPON_MODULES } from './modules/weapons';

export function resolveAppearanceModules(appearance: CharacterAppearance): CharacterModuleDefinition[] {
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
    ...Object.values(HEAD_MODULES), ...Object.values(TORSO_MODULES),
    ...Object.values(LEGS_MODULES), ...Object.values(ARMS_MODULES),
    ...Object.values(ACCESSORY_MODULES), ...Object.values(WEAPON_MODULES),
  ];
}
```

- [ ] **Step 6: Run tests and commit**

```bash
npm run test -- src/presentation/character/characterModuleCatalog.test.ts
npm run build
git add src/presentation/character
git commit -m "feat: complete modular fighter catalog"
```

Expected: PASS.

---

### Task 5: Shared Rig, Discrete Pose Library and PixelPoseAnimator

**Files:**
- Create: `src/presentation/character/CharacterRig.ts`
- Create: `src/presentation/character/pixelPoses.ts`
- Create: `src/presentation/character/PixelPoseAnimator.ts`
- Create: `src/presentation/character/PixelPoseAnimator.test.ts`

**Interfaces:**
- Consumes: `CharacterPieceSlot`, `RigAnchorName`, `CharacterFacing`.
- Produces: `CHARACTER_RIG`, `CHARACTER_RENDER_ORDER`, `getRigAnchor(anchor, facing)`.
- Produces: `CharacterAnimationName`, `PixelPoseFrame`, `CHARACTER_ANIMATIONS`.
- Produces: `CharacterMotionSnapshot { grounded, velocityX, velocityY }`.
- Produces: class `PixelPoseAnimator.update(timeMs, motion): PixelPoseFrame` and readonly `animationName`.

- [ ] **Step 1: Write failing rig/animation tests**

```ts
import { describe, expect, it } from 'vitest';
import { CHARACTER_RENDER_ORDER, getRigAnchor } from './CharacterRig';
import { PixelPoseAnimator } from './PixelPoseAnimator';
import { CHARACTER_ANIMATIONS } from './pixelPoses';

describe('shared procedural character rig and poses', () => {
  it('mirrors rig x positions while preserving y', () => {
    const right = getRigAnchor('weaponMount', 'right');
    const left = getRigAnchor('weaponMount', 'left');
    expect(left).toEqual({ x: -right.x, y: right.y });
  });

  it('uses the locked semantic side-profile render order', () => {
    expect(CHARACTER_RENDER_ORDER).toEqual([
      'rearAccessory', 'rearArm', 'rearLeg', 'torso', 'frontLeg',
      'head', 'frontArm', 'weapon', 'frontAccessory',
    ]);
  });

  it('contains the complete initial animation vocabulary with integer offsets', () => {
    expect(Object.keys(CHARACTER_ANIMATIONS).sort()).toEqual(
      ['apex', 'fall', 'idle', 'landing', 'rise', 'run', 'takeoff'].sort(),
    );
    for (const frames of Object.values(CHARACTER_ANIMATIONS)) {
      for (const frame of frames) {
        for (const offset of Object.values(frame.offsets)) {
          expect(Number.isInteger(offset?.x)).toBe(true);
          expect(Number.isInteger(offset?.y)).toBe(true);
        }
      }
    }
  });

  it('selects run, takeoff, rise, apex, fall and landing from motion transitions', () => {
    const animator = new PixelPoseAnimator();
    animator.update(0, { grounded: true, velocityX: 100, velocityY: 0 });
    expect(animator.animationName).toBe('run');
    animator.update(16, { grounded: false, velocityX: 80, velocityY: -300 });
    expect(animator.animationName).toBe('takeoff');
    animator.update(180, { grounded: false, velocityX: 80, velocityY: -180 });
    expect(animator.animationName).toBe('rise');
    animator.update(360, { grounded: false, velocityX: 60, velocityY: 10 });
    expect(animator.animationName).toBe('apex');
    animator.update(520, { grounded: false, velocityX: 40, velocityY: 180 });
    expect(animator.animationName).toBe('fall');
    animator.update(700, { grounded: true, velocityX: 20, velocityY: 0 });
    expect(animator.animationName).toBe('landing');
  });
});
```

- [ ] **Step 2: Run focused test and verify RED**

```bash
npm run test -- src/presentation/character/PixelPoseAnimator.test.ts
```

- [ ] **Step 3: Implement the shared rig and render order**

Create `CharacterRig.ts`:

```ts
import type { CharacterFacing, CharacterPieceSlot, RigAnchorName } from './moduleGeometry';

export interface RigPoint { x: number; y: number; }

export const CHARACTER_RIG: Readonly<Record<RigAnchorName, RigPoint>> = {
  hips: { x: 0, y: 7 }, torso: { x: 0, y: 0 }, neck: { x: 0, y: -7 }, head: { x: 1, y: -11 },
  shoulderBack: { x: -1, y: -4 }, shoulderFront: { x: 1, y: -4 },
  elbowBack: { x: -2, y: 0 }, elbowFront: { x: 4, y: -1 },
  handBack: { x: -3, y: 4 }, handFront: { x: 6, y: 1 }, weaponMount: { x: 6, y: 1 },
  accessoryBack: { x: -3, y: -1 }, accessoryHip: { x: -2, y: 6 }, accessoryFront: { x: 2, y: -4 },
};

export const CHARACTER_RENDER_ORDER: readonly CharacterPieceSlot[] = [
  'rearAccessory', 'rearArm', 'rearLeg', 'torso', 'frontLeg',
  'head', 'frontArm', 'weapon', 'frontAccessory',
];

export function getRigAnchor(anchor: RigAnchorName, facing: CharacterFacing): RigPoint {
  const point = CHARACTER_RIG[anchor];
  return { x: facing === 'left' ? -point.x : point.x, y: point.y };
}
```

Current gameplay never calls this with `back`.

- [ ] **Step 4: Implement exact discrete pose data**

Create `pixelPoses.ts`. Offsets apply to pieces, not physics coordinates:

```ts
import type { CharacterPieceSlot } from './moduleGeometry';

export type CharacterAnimationName = 'idle' | 'run' | 'takeoff' | 'rise' | 'apex' | 'fall' | 'landing';
export interface PixelOffset { x: number; y: number; }
export interface PixelPoseFrame {
  durationMs: number;
  offsets: Partial<Record<CharacterPieceSlot, PixelOffset>>;
}

const f = (durationMs: number, offsets: PixelPoseFrame['offsets'] = {}): PixelPoseFrame => ({ durationMs, offsets });

export const CHARACTER_ANIMATIONS: Readonly<Record<CharacterAnimationName, readonly PixelPoseFrame[]>> = {
  idle: [
    f(220),
    f(220, { torso: { x: 0, y: 1 }, head: { x: 0, y: 1 }, rearArm: { x: 0, y: 1 }, frontArm: { x: 0, y: 1 }, weapon: { x: 0, y: 1 } }),
    f(220),
    f(220, { frontArm: { x: 1, y: 0 }, weapon: { x: 1, y: 0 } }),
  ],
  run: [
    f(90, { rearLeg: { x: -1, y: 0 }, frontLeg: { x: 1, y: -1 }, rearArm: { x: 1, y: 0 }, frontArm: { x: -1, y: 0 }, weapon: { x: -1, y: 0 } }),
    f(90, { rearLeg: { x: -1, y: -1 }, frontLeg: { x: 1, y: 0 }, torso: { x: 1, y: 0 } }),
    f(90, { rearLeg: { x: 0, y: 0 }, frontLeg: { x: 0, y: 0 }, torso: { x: 1, y: -1 } }),
    f(90, { rearLeg: { x: 1, y: -1 }, frontLeg: { x: -1, y: 0 }, rearArm: { x: -1, y: 0 }, frontArm: { x: 1, y: 0 }, weapon: { x: 1, y: 0 } }),
    f(90, { rearLeg: { x: 1, y: 0 }, frontLeg: { x: -1, y: -1 }, torso: { x: 1, y: 0 } }),
    f(90, { rearLeg: { x: 0, y: 0 }, frontLeg: { x: 0, y: 0 }, torso: { x: 1, y: -1 } }),
  ],
  takeoff: [
    f(70, { torso: { x: 0, y: 1 }, head: { x: 0, y: 1 }, rearLeg: { x: 0, y: 1 }, frontLeg: { x: 0, y: 1 } }),
    f(70, { torso: { x: 1, y: -1 }, frontArm: { x: 1, y: -1 }, weapon: { x: 1, y: -1 } }),
  ],
  rise: [
    f(140, { rearLeg: { x: -1, y: -1 }, frontLeg: { x: 1, y: -1 }, torso: { x: 1, y: -1 }, frontArm: { x: 1, y: 0 }, weapon: { x: 1, y: 0 } }),
    f(140, { rearLeg: { x: 0, y: -2 }, frontLeg: { x: 1, y: -1 }, torso: { x: 1, y: -1 } }),
  ],
  apex: [f(100, { rearLeg: { x: -1, y: -1 }, frontLeg: { x: 1, y: -1 }, torso: { x: 0, y: -1 } })],
  fall: [
    f(140, { rearLeg: { x: -1, y: 0 }, frontLeg: { x: 1, y: 1 }, frontArm: { x: 1, y: 1 }, weapon: { x: 1, y: 1 } }),
    f(140, { rearLeg: { x: 1, y: 1 }, frontLeg: { x: -1, y: 0 }, rearArm: { x: -1, y: 1 } }),
  ],
  landing: [
    f(70, { torso: { x: 0, y: 1 }, head: { x: 0, y: 1 }, rearLeg: { x: -1, y: 1 }, frontLeg: { x: 1, y: 1 } }),
    f(70, { torso: { x: 0, y: 1 }, rearLeg: { x: 0, y: 1 }, frontLeg: { x: 0, y: 1 } }),
  ],
};
```

- [ ] **Step 5: Implement deterministic animation selection and sampling**

Create `PixelPoseAnimator.ts`:

```ts
import { PLAYER_MOVE_SPEED } from '../../gameplay/player/movement';
import { CHARACTER_ANIMATIONS, type CharacterAnimationName, type PixelPoseFrame } from './pixelPoses';

export interface CharacterMotionSnapshot { grounded: boolean; velocityX: number; velocityY: number; }

const TAKEOFF_MS = 140;
const LANDING_MS = 140;
const AIR_VERTICAL_DEADZONE = 60;
const RUN_MIN_SPEED = 10;

export class PixelPoseAnimator {
  public animationName: CharacterAnimationName = 'idle';
  private startedAt = 0;
  private initialized = false;
  private wasGrounded = true;

  public update(timeMs: number, motion: CharacterMotionSnapshot): PixelPoseFrame {
    if (!this.initialized) {
      this.initialized = true;
      this.wasGrounded = motion.grounded;
      this.start(baseAnimation(motion), timeMs);
    } else {
      const tookOff = this.wasGrounded && !motion.grounded && motion.velocityY < 0;
      const landed = !this.wasGrounded && motion.grounded;
      if (tookOff) this.start('takeoff', timeMs);
      else if (landed) this.start('landing', timeMs);
      else if (!this.isTransientStillActive(timeMs)) {
        const next = baseAnimation(motion);
        if (next !== this.animationName) this.start(next, timeMs);
      }
      this.wasGrounded = motion.grounded;
    }

    const runRate = this.animationName === 'run'
      ? Math.min(1.35, Math.max(0.65, Math.abs(motion.velocityX) / PLAYER_MOVE_SPEED))
      : 1;
    return sampleFrames(CHARACTER_ANIMATIONS[this.animationName], (timeMs - this.startedAt) * runRate);
  }

  private start(name: CharacterAnimationName, timeMs: number): void {
    this.animationName = name;
    this.startedAt = timeMs;
  }

  private isTransientStillActive(timeMs: number): boolean {
    const elapsed = timeMs - this.startedAt;
    return (this.animationName === 'takeoff' && elapsed < TAKEOFF_MS)
      || (this.animationName === 'landing' && elapsed < LANDING_MS);
  }
}

function baseAnimation(motion: CharacterMotionSnapshot): CharacterAnimationName {
  if (motion.grounded) return Math.abs(motion.velocityX) >= RUN_MIN_SPEED ? 'run' : 'idle';
  if (motion.velocityY < -AIR_VERTICAL_DEADZONE) return 'rise';
  if (motion.velocityY > AIR_VERTICAL_DEADZONE) return 'fall';
  return 'apex';
}

function sampleFrames(frames: readonly PixelPoseFrame[], elapsedMs: number): PixelPoseFrame {
  const total = frames.reduce((sum, frame) => sum + frame.durationMs, 0);
  let cursor = ((elapsedMs % total) + total) % total;
  for (const frame of frames) {
    if (cursor < frame.durationMs) return frame;
    cursor -= frame.durationMs;
  }
  return frames[frames.length - 1];
}
```

- [ ] **Step 6: Run tests and commit**

```bash
npm run test -- src/presentation/character/PixelPoseAnimator.test.ts
npm run build
git add src/presentation/character/CharacterRig.ts src/presentation/character/pixelPoses.ts src/presentation/character/PixelPoseAnimator*
git commit -m "feat: add shared pixel pose rig"
```

Expected: PASS.

---

### Task 6: Texture Baker and ProceduralCharacterView

**Files:**
- Create: `src/presentation/character/characterModuleBaker.ts`
- Create: `src/presentation/character/characterModuleBaker.test.ts`
- Create: `src/presentation/character/ProceduralCharacterView.ts`

**Interfaces:**
- Consumes: module geometry/resolver, palettes, appearance catalog, shared rig, render order, `PixelPoseAnimator`.
- Produces: `buildModuleTextureKey(pieceId, paletteId, facing): string`.
- Produces: `bakeModulePiece(scene, piece, paletteId, facing): BakedModulePiece`.
- Produces: `ProceduralCharacterView.update(timeMs, state)`.

- [ ] **Step 1: Write failing cache-key test**

```ts
import { describe, expect, it } from 'vitest';
import { buildModuleTextureKey } from './characterModuleBaker';

describe('procedural module baker cache key', () => {
  it('distinguishes module, palette and facing without depending on runtime position', () => {
    expect(buildModuleTextureKey('respirator:head', 'inmate-red', 'right'))
      .toBe('char:respirator:head:inmate-red:right');
    expect(buildModuleTextureKey('respirator:head', 'inmate-red', 'left'))
      .not.toBe(buildModuleTextureKey('respirator:head', 'inmate-red', 'right'));
  });
});
```

- [ ] **Step 2: Run focused test and verify RED**

```bash
npm run test -- src/presentation/character/characterModuleBaker.test.ts
```

- [ ] **Step 3: Implement cached CanvasTexture baking with integer fillRect only**

Create `characterModuleBaker.ts`:

```ts
import type Phaser from 'phaser';
import type { PaletteId } from './CharacterAppearance';
import { getCharacterPalette } from './characterPalettes';
import { calculateGeometryBounds, resolveModuleGeometry, type CharacterFacing, type CharacterModulePieceDefinition } from './moduleGeometry';

export interface BakedModulePiece {
  textureKey: string;
  originX: number;
  originY: number;
}

export function buildModuleTextureKey(pieceId: string, paletteId: PaletteId, facing: 'left' | 'right'): string {
  return `char:${pieceId}:${paletteId}:${facing}`;
}

export function bakeModulePiece(
  scene: Phaser.Scene,
  piece: CharacterModulePieceDefinition,
  paletteId: PaletteId,
  facing: 'left' | 'right',
): BakedModulePiece {
  const textureKey = buildModuleTextureKey(piece.id, paletteId, facing);
  const geometry = resolveModuleGeometry(piece, facing);
  if (!geometry) throw new Error(`Missing ${facing} geometry for ${piece.id}`);
  const bounds = calculateGeometryBounds(geometry);
  const padding = 1;
  const width = bounds.maxX - bounds.minX + 1 + padding * 2;
  const height = bounds.maxY - bounds.minY + 1 + padding * 2;
  const originPixelX = -bounds.minX + padding;
  const originPixelY = -bounds.minY + padding;

  if (!scene.textures.exists(textureKey)) {
    const texture = scene.textures.createCanvas(textureKey, width, height);
    if (!texture) throw new Error(`Could not create texture ${textureKey}`);
    const context = texture.context;
    context.imageSmoothingEnabled = false;
    const palette = getCharacterPalette(paletteId);
    for (const primitive of geometry) {
      context.fillStyle = `#${palette[primitive.role].toString(16).padStart(6, '0')}`;
      if (primitive.kind === 'rect') {
        context.fillRect(primitive.x - bounds.minX + padding, primitive.y - bounds.minY + padding, primitive.width, primitive.height);
      } else {
        for (const [x, y] of primitive.points) context.fillRect(x - bounds.minX + padding, y - bounds.minY + padding, 1, 1);
      }
    }
    texture.refresh();
  }

  return { textureKey, originX: originPixelX / width, originY: originPixelY / height };
}
```

Do not use canvas lines, rotations or filtering.

- [ ] **Step 4: Implement sprite composition in semantic render order**

Create `ProceduralCharacterView.ts` around this contract:

```ts
import type Phaser from 'phaser';
import type { CharacterAppearance } from './CharacterAppearance';
import { CHARACTER_RENDER_ORDER, getRigAnchor } from './CharacterRig';
import { resolveAppearanceModules } from './characterModuleCatalog';
import { bakeModulePiece, type BakedModulePiece } from './characterModuleBaker';
import type { CharacterFacing, CharacterModulePieceDefinition } from './moduleGeometry';
import { PixelPoseAnimator, type CharacterMotionSnapshot } from './PixelPoseAnimator';

export interface CharacterPresentationState extends CharacterMotionSnapshot {
  x: number;
  y: number;
  facing: -1 | 1;
}

interface RenderPiece {
  definition: CharacterModulePieceDefinition;
  sprite: Phaser.GameObjects.Image;
  baked: Record<'left' | 'right', BakedModulePiece>;
}

export class ProceduralCharacterView {
  private readonly container: Phaser.GameObjects.Container;
  private readonly animator = new PixelPoseAnimator();
  private readonly pieces: RenderPiece[];

  public constructor(scene: Phaser.Scene, appearance: CharacterAppearance) {
    this.container = scene.add.container(0, 0).setDepth(10);
    const definitions = resolveAppearanceModules(appearance).flatMap((module) => module.pieces);
    definitions.sort((a, b) => CHARACTER_RENDER_ORDER.indexOf(a.slot) - CHARACTER_RENDER_ORDER.indexOf(b.slot));
    this.pieces = definitions.map((definition) => {
      const baked = {
        right: bakeModulePiece(scene, definition, appearance.palette, 'right'),
        left: bakeModulePiece(scene, definition, appearance.palette, 'left'),
      };
      const sprite = scene.add.image(0, 0, baked.right.textureKey).setOrigin(baked.right.originX, baked.right.originY);
      this.container.add(sprite);
      return { definition, sprite, baked };
    });
  }

  public update(timeMs: number, state: CharacterPresentationState): void {
    const facing: Exclude<CharacterFacing, 'back'> = state.facing < 0 ? 'left' : 'right';
    const frame = this.animator.update(timeMs, state);
    this.container.setPosition(Math.round(state.x), Math.round(state.y));

    for (const piece of this.pieces) {
      const baked = piece.baked[facing];
      const anchor = getRigAnchor(piece.definition.anchor, facing);
      const offset = frame.offsets[piece.definition.slot] ?? { x: 0, y: 0 };
      const facingSign = facing === 'left' ? -1 : 1;
      piece.sprite
        .setTexture(baked.textureKey)
        .setOrigin(baked.originX, baked.originY)
        .setPosition(anchor.x + offset.x * facingSign, anchor.y + offset.y);
    }
  }

  public destroy(): void {
    this.container.destroy(true);
  }
}
```

The container is the visual only; it receives no physics body.

- [ ] **Step 5: Run tests/build and commit**

```bash
npm run test -- src/presentation/character/characterModuleBaker.test.ts
npm run test
npm run build
git add src/presentation/character
git commit -m "feat: render modular procedural fighters"
```

Expected: all tests and build PASS.

---

### Task 7: Integrate the Procedural View Without Changing Player Physics

**Files:**
- Create: `src/gameplay/player/playerGeometry.ts`
- Create: `src/gameplay/player/playerGeometry.test.ts`
- Modify: `src/gameplay/player/Player.ts`
- Modify: `src/scenes/ArenaScene.ts`

**Interfaces:**
- Produces: `PLAYER_WIDTH`, `PLAYER_HEIGHT` with the existing exact formulas.
- `Player` produces `presentationState: CharacterPresentationState` without importing presentation implementation.
- `ArenaScene` owns `ProceduralCharacterView[]` and updates each view after each corresponding player update.

- [ ] **Step 1: Lock the existing hitbox dimensions in a failing extraction test**

Create `playerGeometry.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { ARENA_CONTENT_SCALE } from '../../config/arenaScale';
import { PLAYER_HEIGHT, PLAYER_WIDTH } from './playerGeometry';

describe('player gameplay geometry', () => {
  it('preserves the existing player physics rectangle while visuals change', () => {
    expect(PLAYER_WIDTH).toBe(22.5 * ARENA_CONTENT_SCALE);
    expect(PLAYER_HEIGHT).toBe(34.5 * ARENA_CONTENT_SCALE);
  });
});
```

Run:

```bash
npm run test -- src/gameplay/player/playerGeometry.test.ts
```

Expected: FAIL because `playerGeometry.ts` does not exist.

- [ ] **Step 2: Extract the unchanged gameplay geometry constants**

Create `playerGeometry.ts`:

```ts
import { ARENA_CONTENT_SCALE } from '../../config/arenaScale';
export const PLAYER_WIDTH = 22.5 * ARENA_CONTENT_SCALE;
export const PLAYER_HEIGHT = 34.5 * ARENA_CONTENT_SCALE;
```

Modify `Player.ts` to import these constants and delete its private duplicate declarations. No other movement constant changes.

- [ ] **Step 3: Remove placeholder visual responsibilities from Player**

In `Player.ts`:

1. Remove `color` from `PlayerConfig`.
2. Remove `facingMarker` and all marker constants.
3. Keep the Arcade rectangle and body exactly as before, but hide the rectangle with `.setVisible(false)` after construction.
4. Keep the temporary P1/P2 label at depth 11 for validation.
5. Reduce `syncDecorations()` to label positioning only.
6. Add a pure presentation getter:

```ts
public get presentationState(): CharacterPresentationState {
  return {
    x: this.gameObject.x,
    y: this.gameObject.y,
    facing: this.facing,
    grounded: this.isGrounded,
    velocityX: this.body.velocity.x,
    velocityY: this.body.velocity.y,
  };
}
```

Avoid an implementation dependency from gameplay to `ProceduralCharacterView`: move `CharacterPresentationState` into a small neutral file `src/presentation/character/characterPresentationState.ts` if importing the interface from the view creates a circular dependency. That file contains only:

```ts
export interface CharacterPresentationState {
  x: number;
  y: number;
  facing: -1 | 1;
  grounded: boolean;
  velocityX: number;
  velocityY: number;
}
```

Then both `Player.ts` and `ProceduralCharacterView.ts` import the interface from that file.

- [ ] **Step 4: Wire fixed P1/P2 appearances into ArenaScene**

Modify `ArenaScene.ts`:

```ts
import { PLAYER_APPEARANCES } from '../presentation/character/deterministicCharacter';
import { ProceduralCharacterView } from '../presentation/character/ProceduralCharacterView';
```

Add:

```ts
private characterViews: ProceduralCharacterView[] = [];
```

Remove `color` from both `new Player(...)` calls. Immediately after `this.players = [playerOne, playerTwo];`, create:

```ts
this.characterViews = [
  new ProceduralCharacterView(this, PLAYER_APPEARANCES[1]),
  new ProceduralCharacterView(this, PLAYER_APPEARANCES[2]),
];
```

Change the update loop to preserve Player-first state updates:

```ts
for (let index = 0; index < this.players.length; index += 1) {
  const player = this.players[index];
  player.update(time);
  this.characterViews[index].update(time, player.presentationState);
}
```

Do not modify colliders, platforms, world bounds, movement constants, jump constants or control mappings.

- [ ] **Step 5: Run focused and complete verification**

```bash
npm run test -- src/gameplay/player/playerGeometry.test.ts
npm run lint
npm run test
npm run build
```

Expected: all PASS.

- [ ] **Step 6: Commit the playable integration**

```bash
git add src/gameplay/player src/scenes/ArenaScene.ts src/presentation/character
git commit -m "feat: replace player placeholders with modular fighters"
```

---

### Task 8: Record Phase 1 Character Work, Deploy, and Stop for Human Validation

**Files:**
- Modify: `PLAN.md`
- Modify: `docs/superpowers/plans/2026-08-30-procedural-modular-character.md` only to check completed technical tasks during execution.

**Interfaces:**
- No new runtime interface.
- Produces a deployed GitHub Pages build awaiting human visual/game-feel acceptance.

- [ ] **Step 1: Add the Phase 1 procedural-character subsection to PLAN.md**

Under the Phase 1 player/placeholders area, add this exact checklist after implementation is technically complete:

```md
### Personnages procéduraux modulaires

- [x] Remplacer visuellement les rectangles joueurs par des combattants procéduraux modulaires.
- [x] Conserver exactement la physique, la hitbox et les contrôles existants.
- [x] Ajouter 4 torses, 5 têtes, 3 jambes, 2 bras, 6 accessoires, 5 palettes et 1 arme placeholder.
- [x] Ajouter un rig commun et les poses idle, run, takeoff, rise, apex, fall et landing.
- [x] Ajouter le profil droit canonique et le miroir gauche avec support d’override asymétrique.
- [x] Réserver le contrat de vue dos sans l’utiliser ni la dessiner dans ce lot.
- [x] Configurer deux apparences fixes et nettement différentes pour P1 et P2.
- [ ] Valider manuellement la lisibilité, la taille apparente et les animations des personnages sur GitHub Pages.
- [ ] Confirmer manuellement que le parcours, le saut et les collisions restent inchangés.
```

Do not mark the two manual items complete without explicit user confirmation.

- [ ] **Step 2: Run fresh final verification**

```bash
npm run lint
npm run test
npm run build
```

Expected: all commands exit 0. Do not reuse earlier results for the completion claim.

- [ ] **Step 3: Commit documentation state**

```bash
git add PLAN.md docs/superpowers/plans/2026-08-30-procedural-modular-character.md
git commit -m "docs: track modular fighter validation"
```

- [ ] **Step 4: Verify GitHub Pages deployment for the final commit**

Push `main` if execution is happening locally, then inspect the repository's `Validate and deploy to GitHub Pages` workflow for the final commit. Require all of these before reporting technical completion:

```text
Install dependencies  success
Lint                  success
Test                  success
Build                 success
Configure Pages       success
Upload Pages artifact success
Deploy to Pages       success
```

- [ ] **Step 5: Hand off the deployed build for manual validation and stop**

Provide `https://karlos-fr.github.io/Blood-Relay/` and ask the human tester to verify:

- P1/P2 remain the correct apparent size in the arena;
- the two fighters are immediately distinguishable;
- left/right strict profiles are crisp;
- body modules look connected rather than layered stickers;
- idle/run/jump/fall/landing read at gameplay scale;
- masks, respirator and accessories remain recognizable;
- cosmetic overhangs do not make collisions feel larger;
- jump, platform traversal and collisions still behave exactly as before.

Do not advance to Phase 2 and do not check the two manual PLAN items until the user explicitly validates them.
