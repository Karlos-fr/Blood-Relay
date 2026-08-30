# Detailed Procedural Characters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace detached miniature fighter parts with connected, realistic `32 × 48` procedural pixel-art characters rendered as one cached sprite per frame.

**Architecture:** Pure TypeScript builds a connected anatomical pose on a fixed `48 × 56` semantic-pixel canvas, applies deterministic appearance layers, and returns a complete frame. Phaser converts complete frames to cached textures lazily; the runtime view owns one image and selects discrete frame keys from motion state.

**Tech Stack:** TypeScript 6 strict mode, Phaser 3.90, Vitest 4, Vite 8, ESLint 10, HTML Canvas 2D.

**Spec:** `docs/superpowers/specs/2026-08-30-detailed-procedural-characters-design.md`

## Global Constraints

- Every fighter uses the same exact `32 × 48` Arcade Physics body.
- Every complete visual frame uses a fixed `48 × 56` canvas with the body in the central `32 × 48` region.
- The canonical art faces right in a subtle three-quarter profile; left output mirrors by default and supports explicit asymmetric overrides.
- Coordinates, frame selection, and raster output remain integer and deterministic.
- Rendering uses one active Phaser image per fighter and performs no texture creation in the gameplay update loop after a frame has been cached.
- Clone-prisoner, industrial mercenary, laboratory mutant, and mixed appearances remain visual-only and mechanically equivalent.
- Current movement constants remain unchanged unless an objective traversal assertion fails.
- Future animation frames are previewable but remain disconnected from unavailable gameplay actions.
- Add no dependency and no external production sprite asset.
- Preserve all pre-existing working-tree changes. Stage only the exact files listed by each task.
- Human validation remains mandatory before checking manual `PLAN.md` items or advancing to Phase 2.

## File Structure

### New focused files

- `src/presentation/character/characterDimensions.ts` — fixed body, canvas, origin, and contact-line constants.
- `src/presentation/character/frame/PixelCanvas.ts` — pure semantic-pixel raster primitives.
- `src/presentation/character/frame/PixelCanvas.test.ts` — clipping, integer rasterization, polygon, segment, mirror, and connectivity tests.
- `src/presentation/character/anatomy/AnatomicalPose.ts` — landmark and animation frame contracts.
- `src/presentation/character/anatomy/anatomicalAnimations.ts` — all current and future anatomical keyframes.
- `src/presentation/character/anatomy/anatomicalAnimations.test.ts` — frame counts, bounds, contact, and integer-coordinate tests.
- `src/presentation/character/anatomy/anatomicalBodyRenderer.ts` — connected underbody and mask rendering.
- `src/presentation/character/anatomy/anatomicalBodyRenderer.test.ts` — connected silhouette and contact-line tests.
- `src/presentation/character/rendering/CharacterRenderModule.ts` — appearance-layer renderer contract and layer order.
- `src/presentation/character/rendering/characterFrameComposer.ts` — complete pure frame composition and facing resolution.
- `src/presentation/character/rendering/characterFrameComposer.test.ts` — determinism, bounds, family, mirror, and connection tests.
- `src/presentation/character/rendering/characterFrameBaker.ts` — lazy Phaser canvas texture creation.
- `src/presentation/character/rendering/characterFrameBaker.test.ts` — stable texture keys and cache reuse tests.
- `src/presentation/character/preview/characterPreviewModel.ts` — pure appearance, animation, facing, playback, and hitbox selection state.
- `src/presentation/character/preview/characterPreviewModel.test.ts` — preview cycling and completeness tests.
- `src/scenes/CharacterPreviewScene.ts` — deployed desktop/touch validation surface.
- `src/scenes/bootTarget.ts` — pure URL-query startup selection.
- `src/scenes/bootTarget.test.ts` — normal and preview startup tests.

### Existing files to modify

- `src/presentation/character/CharacterAppearance.ts` — add body, armor, and mutation module identifiers.
- `src/presentation/character/characterPalettes.ts` — add semantic material roles required by detailed art.
- `src/presentation/character/deterministicCharacter.ts` — generate and expose representative family appearances.
- `src/presentation/character/modules/heads.ts` — convert heads to landmark-aware overlay renderers.
- `src/presentation/character/modules/torsos.ts` — convert torso clothing to connected overlays.
- `src/presentation/character/modules/legs.ts` — convert trousers and footwear to posed limb overlays.
- `src/presentation/character/modules/arms.ts` — convert sleeves, forearms, and hands to posed overlays.
- `src/presentation/character/modules/accessories.ts` — render tubes, bags, packs, plates, implants, and holsters into complete frames.
- `src/presentation/character/modules/weapons.ts` — attach the relay pistol to the posed front hand.
- `src/presentation/character/characterModuleCatalog.ts` — resolve ordered render modules instead of detached pieces.
- `src/presentation/character/PixelPoseAnimator.ts` — return animation/frame references rather than piece offsets.
- `src/presentation/character/ProceduralCharacterView.ts` — replace the container and many images with one image.
- `src/gameplay/player/playerGeometry.ts` — set the exact shared `32 × 48` body.
- `src/gameplay/player/Player.ts` — keep decoration and debug alignment correct for the larger body.
- `src/config/arena.test.ts` — add objective clearance checks for the larger body.
- `src/scenes/BootScene.ts` — route explicit preview URLs.
- `src/main.ts` — register `CharacterPreviewScene`.
- `src/scenes/ArenaScene.ts` — retain current gameplay flow while using the new view.
- `README.md` — document the detailed procedural fighters and preview URL.
- `PLAN.md` — record implementation tasks and leave human validation unchecked.

### Legacy files removed after migration

- `src/presentation/character/CharacterRig.ts`
- `src/presentation/character/pixelPoses.ts`
- `src/presentation/character/moduleGeometry.ts`
- `src/presentation/character/characterModuleBaker.ts`
- Their superseded unit tests.

---

### Task 1: Lock Character Dimensions and Contact Geometry

**Files:**
- Create: `src/presentation/character/characterDimensions.ts`
- Create: `src/presentation/character/characterDimensions.test.ts`

**Interfaces:**
- Consumes: no character implementation.
- Produces: `CHARACTER_BODY_WIDTH`, `CHARACTER_BODY_HEIGHT`, `CHARACTER_FRAME_WIDTH`, `CHARACTER_FRAME_HEIGHT`, `CHARACTER_BODY_LEFT`, `CHARACTER_BODY_TOP`, `CHARACTER_ORIGIN_X`, and `CHARACTER_ORIGIN_Y` numeric constants.

- [ ] **Step 1: Install the declared dependencies without creating a lockfile**

Run: `npm install --no-audit --no-fund --no-package-lock`

Expected: dependencies install successfully, `node_modules/` remains ignored, and no `package-lock.json` is created.

- [ ] **Step 2: Write the failing dimension test**

```ts
import { describe, expect, it } from 'vitest';
import {
  CHARACTER_BODY_HEIGHT,
  CHARACTER_BODY_LEFT,
  CHARACTER_BODY_TOP,
  CHARACTER_BODY_WIDTH,
  CHARACTER_FRAME_HEIGHT,
  CHARACTER_FRAME_WIDTH,
  CHARACTER_ORIGIN_X,
  CHARACTER_ORIGIN_Y,
} from './characterDimensions';

describe('detailed character dimensions', () => {
  it('centers the 32 × 48 body inside the 48 × 56 frame', () => {
    expect([CHARACTER_BODY_WIDTH, CHARACTER_BODY_HEIGHT]).toEqual([32, 48]);
    expect([CHARACTER_FRAME_WIDTH, CHARACTER_FRAME_HEIGHT]).toEqual([48, 56]);
    expect([CHARACTER_BODY_LEFT, CHARACTER_BODY_TOP]).toEqual([8, 4]);
    expect([CHARACTER_ORIGIN_X, CHARACTER_ORIGIN_Y]).toEqual([24, 52]);
    expect(CHARACTER_BODY_LEFT * 2 + CHARACTER_BODY_WIDTH).toBe(CHARACTER_FRAME_WIDTH);
    expect(CHARACTER_BODY_TOP + CHARACTER_BODY_HEIGHT).toBe(CHARACTER_ORIGIN_Y);
  });
});
```

- [ ] **Step 3: Run the test and confirm the missing-module failure**

Run: `npm run test -- src/presentation/character/characterDimensions.test.ts`

Expected: FAIL because `./characterDimensions` does not exist.

- [ ] **Step 4: Add the exact dimension constants**

```ts
export const CHARACTER_BODY_WIDTH = 32;
export const CHARACTER_BODY_HEIGHT = 48;
export const CHARACTER_FRAME_WIDTH = 48;
export const CHARACTER_FRAME_HEIGHT = 56;
export const CHARACTER_BODY_LEFT = 8;
export const CHARACTER_BODY_TOP = 4;
export const CHARACTER_ORIGIN_X = CHARACTER_FRAME_WIDTH / 2;
export const CHARACTER_ORIGIN_Y = CHARACTER_BODY_TOP + CHARACTER_BODY_HEIGHT;
```

- [ ] **Step 5: Run the focused test**

Run: `npm run test -- src/presentation/character/characterDimensions.test.ts`

Expected: PASS with one test.

- [ ] **Step 6: Commit the dimension contract**

```bash
git add src/presentation/character/characterDimensions.ts src/presentation/character/characterDimensions.test.ts
git commit -m "feat: define detailed fighter dimensions"
```

---

### Task 2: Extend Appearance and Palette Contracts

**Files:**
- Modify: `src/presentation/character/CharacterAppearance.ts`
- Modify: `src/presentation/character/characterPalettes.ts`
- Modify: `src/presentation/character/deterministicCharacter.ts`
- Modify: `src/presentation/character/deterministicCharacter.test.ts`
- Modify: `src/presentation/character/characterModuleCatalog.test.ts`

**Interfaces:**
- Consumes: existing typed head, torso, legs, arms, weapon, accessory, and palette identifiers.
- Produces: `BodyId`, `ArmorId`, `MutationId`, expanded `CharacterAppearance`, expanded `CharacterPalette`, `PREVIEW_APPEARANCES`, and deterministic selection of every required module category.

- [ ] **Step 1: Add failing schema and deterministic-family assertions**

Add imports for `ARMOR_IDS`, `BODY_IDS`, `MUTATION_IDS`, and `PREVIEW_APPEARANCES`, then add:

```ts
it('selects valid body, armor, and mutation ids', () => {
  const appearance = buildCharacterAppearance(0x0badcafe);
  expect(BODY_IDS).toContain(appearance.body);
  expect(ARMOR_IDS).toContain(appearance.armor);
  expect(MUTATION_IDS).toContain(appearance.mutation);
});

it('provides clone, mercenary, mutant, and mixed preview appearances', () => {
  expect(Object.keys(PREVIEW_APPEARANCES)).toEqual(['clone', 'mercenary', 'mutant', 'mixed']);
  expect(new Set(Object.values(PREVIEW_APPEARANCES).map((value) => value.seed)).size).toBe(4);
});
```

In `characterModuleCatalog.test.ts`, assert every palette has these roles:

```ts
expect(Object.keys(CHARACTER_PALETTES['inmate-red']).sort()).toEqual(
  [
    'accent', 'blood', 'cloth', 'clothDark', 'clothLight', 'metal', 'metalDark',
    'metalLight', 'mutation', 'mutationDark', 'outline', 'shadow', 'skin',
    'skinDark', 'skinLight',
  ].sort(),
);
```

- [ ] **Step 2: Run focused tests and confirm type/export failures**

Run: `npm run test -- src/presentation/character/deterministicCharacter.test.ts src/presentation/character/characterModuleCatalog.test.ts`

Expected: FAIL because the new identifiers, appearance fields, preview appearances, and palette roles do not exist.

- [ ] **Step 3: Extend the contracts and deterministic generator**

Add the exact identifiers:

```ts
export const BODY_IDS = ['standard', 'heavy', 'gaunt'] as const;
export const ARMOR_IDS = ['none', 'scrap-plate', 'industrial-vest'] as const;
export const MUTATION_IDS = ['none', 'blood-veins', 'bone-growth', 'grafted-arm'] as const;

export type BodyId = (typeof BODY_IDS)[number];
export type ArmorId = (typeof ARMOR_IDS)[number];
export type MutationId = (typeof MUTATION_IDS)[number];
```

Add `body`, `armor`, and `mutation` to `CharacterAppearance`. Add `skinLight`, `metalDark`, `mutationDark`, and `mutation` to `CharacterPalette`; assign concrete colors in all five existing palettes. Update `buildCharacterAppearance(seed)` to pick the three new categories with the existing seeded random function.

Define `PREVIEW_APPEARANCES` as a typed record with four explicit configurations:

```ts
export const PREVIEW_APPEARANCES: Readonly<
  Record<'clone' | 'mercenary' | 'mutant' | 'mixed', CharacterAppearance>
> = {
  clone: { ...PLAYER_APPEARANCES[1], body: 'standard', armor: 'none', mutation: 'none' },
  mercenary: { ...PLAYER_APPEARANCES[2], body: 'heavy', armor: 'industrial-vest', mutation: 'none' },
  mutant: {
    ...PLAYER_APPEARANCES[1], body: 'gaunt', armor: 'none', mutation: 'bone-growth',
    head: 'implants', palette: 'ash-violet', seed: 0xb100d003,
  },
  mixed: {
    ...PLAYER_APPEARANCES[2], body: 'standard', armor: 'scrap-plate',
    mutation: 'blood-veins', torso: 'torn-suit', seed: 0xb100d004,
  },
};
```

Update both `PLAYER_APPEARANCES` entries with explicit `body`, `armor`, and `mutation` values before using them above.

- [ ] **Step 4: Run focused tests and TypeScript build**

Run: `npm run test -- src/presentation/character/deterministicCharacter.test.ts src/presentation/character/characterModuleCatalog.test.ts && npm run build`

Expected: PASS. Existing module files continue compiling because the added appearance fields are additive.

- [ ] **Step 5: Commit the expanded appearance contract**

```bash
git add src/presentation/character/CharacterAppearance.ts src/presentation/character/characterPalettes.ts src/presentation/character/deterministicCharacter.ts src/presentation/character/deterministicCharacter.test.ts src/presentation/character/characterModuleCatalog.test.ts
git commit -m "feat: expand procedural fighter appearances"
```

---

### Task 3: Build the Pure Semantic-Pixel Canvas

**Files:**
- Create: `src/presentation/character/frame/PixelCanvas.ts`
- Create: `src/presentation/character/frame/PixelCanvas.test.ts`
- Modify: `src/presentation/character/characterPalettes.ts`

**Interfaces:**
- Consumes: `PaletteRole` from `characterPalettes.ts` after that type is moved there from legacy geometry.
- Produces: `PixelPoint`, `CharacterPixelFrame`, `PixelCanvas`, `mirrorCharacterFrame(frame)`, and `isMaskConnected(mask, width, height)`.

- [ ] **Step 1: Write failing raster and connectivity tests**

```ts
import { describe, expect, it } from 'vitest';
import { PixelCanvas, isMaskConnected, mirrorCharacterFrame } from './PixelCanvas';

describe('semantic pixel canvas', () => {
  it('clips integer primitives to the canvas', () => {
    const canvas = new PixelCanvas(5, 4);
    canvas.fillRect(-1, 1, 3, 2, 'cloth');
    expect(canvas.countRole('cloth')).toBe(4);
  });

  it('draws a connected thick segment between integer landmarks', () => {
    const canvas = new PixelCanvas(8, 8);
    canvas.drawThickSegment({ x: 1, y: 1 }, { x: 6, y: 6 }, 1, 'skin');
    expect(isMaskConnected(canvas.toMask(), 8, 8)).toBe(true);
  });

  it('mirrors complete frames without changing semantic roles', () => {
    const canvas = new PixelCanvas(4, 2);
    canvas.setPixel(0, 0, 'accent');
    const mirrored = mirrorCharacterFrame(canvas.snapshot());
    expect(mirrored.pixels[3]).toBe('accent');
    expect(mirrored.pixels[0]).toBeNull();
  });
});
```

- [ ] **Step 2: Run the focused test and confirm the missing-module failure**

Run: `npm run test -- src/presentation/character/frame/PixelCanvas.test.ts`

Expected: FAIL because `PixelCanvas.ts` does not exist.

- [ ] **Step 3: Implement the integer raster API**

Export the semantic role type from `characterPalettes.ts` before implementing the canvas:

```ts
export type PaletteRole = keyof CharacterPalette;
```

Use this public contract:

```ts
export interface PixelPoint { x: number; y: number }
export type CharacterPixel = PaletteRole | null;
export interface CharacterPixelFrame {
  width: number;
  height: number;
  pixels: readonly CharacterPixel[];
  bodyMask: readonly boolean[];
}

export class PixelCanvas {
  public constructor(public readonly width: number, public readonly height: number) {}
  public setPixel(x: number, y: number, role: PaletteRole, body = false): void;
  public getPixel(x: number, y: number): CharacterPixel;
  public fillRect(x: number, y: number, width: number, height: number, role: PaletteRole, body?: boolean): void;
  public drawLine(start: PixelPoint, end: PixelPoint, role: PaletteRole, body?: boolean): void;
  public drawThickSegment(start: PixelPoint, end: PixelPoint, radius: number, role: PaletteRole, body?: boolean): void;
  public fillPolygon(points: readonly PixelPoint[], role: PaletteRole, body?: boolean): void;
  public countRole(role: PaletteRole): number;
  public toMask(): boolean[];
  public snapshot(): CharacterPixelFrame;
}
```

Implement `drawLine` with integer Bresenham stepping. Implement `drawThickSegment` by drawing a Bresenham line and filling a square radius around each visited pixel. Implement `fillPolygon` with an integer scanline fill using edge intersections rounded inward. Ignore writes outside the canvas. Reject non-integer coordinates with `throw new Error('Pixel coordinates must be integers.')`.

Implement connectivity as a four-neighbor flood fill from the first `true` cell and compare the visited count with the total mask count. Mirror `pixels` and `bodyMask` with destination x equal to `width - 1 - sourceX`.

- [ ] **Step 4: Run the focused canvas tests**

Run: `npm run test -- src/presentation/character/frame/PixelCanvas.test.ts`

Expected: PASS with clipping, connected segment, and mirror coverage.

- [ ] **Step 5: Commit the pure raster layer**

```bash
git add src/presentation/character/frame/PixelCanvas.ts src/presentation/character/frame/PixelCanvas.test.ts src/presentation/character/characterPalettes.ts
git commit -m "feat: add semantic pixel frame canvas"
```

---

### Task 4: Define the Complete Anatomical Animation Catalog

**Files:**
- Create: `src/presentation/character/anatomy/AnatomicalPose.ts`
- Create: `src/presentation/character/anatomy/anatomicalAnimations.ts`
- Create: `src/presentation/character/anatomy/anatomicalAnimations.test.ts`

**Interfaces:**
- Consumes: `PixelPoint` and the fixed frame/body constants.
- Produces: `AnatomicalLandmark`, `AnatomicalPose`, `CharacterAnimationName`, `CharacterPoseFrame`, `CharacterAnimationDefinition`, `CHARACTER_ANIMATIONS`, and `getAnimationFrame(name, index)`.

- [ ] **Step 1: Write failing catalog completeness and geometry tests**

```ts
import { describe, expect, it } from 'vitest';
import { CHARACTER_BODY_LEFT, CHARACTER_ORIGIN_Y } from '../characterDimensions';
import { CHARACTER_ANIMATIONS } from './anatomicalAnimations';

const expectedCounts = {
  idle: 6, run: 8, takeoff: 2, rise: 2, apex: 1, fall: 2, landing: 3,
  shoot: 4, melee: 6, hurt: 3, transfuse: 6, death: 8, respawn: 6,
} as const;

describe('anatomical animation catalog', () => {
  it('contains every approved animation with the approved frame count', () => {
    expect(Object.keys(CHARACTER_ANIMATIONS).sort()).toEqual(Object.keys(expectedCounts).sort());
    for (const [name, count] of Object.entries(expectedCounts)) {
      expect(CHARACTER_ANIMATIONS[name as keyof typeof expectedCounts].frames).toHaveLength(count);
    }
  });

  it('keeps every landmark integer and inside the body region', () => {
    for (const animation of Object.values(CHARACTER_ANIMATIONS)) {
      for (const frame of animation.frames) {
        expect(frame.durationMs).toBeGreaterThan(0);
        for (const point of Object.values(frame.pose)) {
          expect(Number.isInteger(point.x)).toBe(true);
          expect(Number.isInteger(point.y)).toBe(true);
          expect(point.x).toBeGreaterThanOrEqual(CHARACTER_BODY_LEFT);
          expect(point.x).toBeLessThan(CHARACTER_BODY_LEFT + 32);
          expect(point.y).toBeGreaterThanOrEqual(4);
          expect(point.y).toBeLessThan(CHARACTER_ORIGIN_Y);
        }
      }
    }
  });

  it('places both idle feet on the contact pixel row', () => {
    for (const frame of CHARACTER_ANIMATIONS.idle.frames) {
      expect(frame.pose.footRear.y).toBe(CHARACTER_ORIGIN_Y - 1);
      expect(frame.pose.footFront.y).toBe(CHARACTER_ORIGIN_Y - 1);
    }
  });
});
```

- [ ] **Step 2: Run the focused test and confirm missing catalog exports**

Run: `npm run test -- src/presentation/character/anatomy/anatomicalAnimations.test.ts`

Expected: FAIL because the anatomy files do not exist.

- [ ] **Step 3: Implement landmark types and all approved discrete frames**

Use these exact public contracts:

```ts
export const ANATOMICAL_LANDMARKS = [
  'headCenter', 'neck', 'shoulderRear', 'shoulderFront',
  'elbowRear', 'elbowFront', 'handRear', 'handFront',
  'hipRear', 'hipFront', 'kneeRear', 'kneeFront',
  'footRear', 'footFront', 'weaponMount',
] as const;

export type AnatomicalLandmark = (typeof ANATOMICAL_LANDMARKS)[number];
export type AnatomicalPose = Readonly<Record<AnatomicalLandmark, PixelPoint>>;
export type CharacterAnimationName =
  | 'idle' | 'run' | 'takeoff' | 'rise' | 'apex' | 'fall' | 'landing'
  | 'shoot' | 'melee' | 'hurt' | 'transfuse' | 'death' | 'respawn';

export interface CharacterPoseFrame {
  durationMs: number;
  pose: AnatomicalPose;
  accessoryPhase: 0 | 1 | 2 | 3;
}

export interface CharacterAnimationDefinition {
  loop: boolean;
  frames: readonly CharacterPoseFrame[];
}
```

Start from this canonical three-quarter stance and create immutable frames by merging explicit landmark overrides:

```ts
const BASE_POSE: AnatomicalPose = {
  headCenter: { x: 27, y: 11 }, neck: { x: 24, y: 17 },
  shoulderRear: { x: 20, y: 20 }, shoulderFront: { x: 27, y: 19 },
  elbowRear: { x: 18, y: 28 }, elbowFront: { x: 31, y: 27 },
  handRear: { x: 21, y: 35 }, handFront: { x: 33, y: 34 },
  hipRear: { x: 21, y: 34 }, hipFront: { x: 27, y: 34 },
  kneeRear: { x: 20, y: 42 }, kneeFront: { x: 29, y: 42 },
  footRear: { x: 18, y: 51 }, footFront: { x: 31, y: 51 },
  weaponMount: { x: 34, y: 33 },
};
```

Use exact frame timing and loop flags:

| Animation | Durations in ms | Loop |
| --- | --- | --- |
| idle | `180, 180, 180, 180, 180, 180` | yes |
| run | `80, 80, 80, 80, 80, 80, 80, 80` | yes |
| takeoff | `70, 70` | no |
| rise | `140, 140` | yes |
| apex | `100` | yes |
| fall | `140, 140` | yes |
| landing | `60, 70, 70` | no |
| shoot | `70, 60, 90, 110` | no |
| melee | `80, 70, 60, 70, 90, 120` | no |
| hurt | `70, 90, 130` | no |
| transfuse | `160, 160, 160, 160, 160, 160` | yes |
| death | `90, 90, 90, 100, 110, 120, 140, 180` | no |
| respawn | `100, 100, 90, 90, 80, 120` | no |

Author every frame as an explicit integer override of `BASE_POSE`. Preserve foot y `51` in grounded idle, run, landing, shoot, melee, hurt, and transfuse frames. Run alternates contact and passing positions across all eight frames. Takeoff compresses both knees before extension. Rise and fall lift both feet above y `51`. Death lowers head, shoulders, hips, and knees until the final pose is horizontal while remaining inside the canvas. Respawn reverses a crouched-to-standing sequence without reusing the death array by reference.

- [ ] **Step 4: Run the anatomy catalog tests**

Run: `npm run test -- src/presentation/character/anatomy/anatomicalAnimations.test.ts`

Expected: PASS with 13 animation definitions and 57 total frames.

- [ ] **Step 5: Commit the complete pose vocabulary**

```bash
git add src/presentation/character/anatomy/AnatomicalPose.ts src/presentation/character/anatomy/anatomicalAnimations.ts src/presentation/character/anatomy/anatomicalAnimations.test.ts
git commit -m "feat: define anatomical fighter animations"
```

---

### Task 5: Render a Connected Anatomical Underbody

**Files:**
- Create: `src/presentation/character/anatomy/anatomicalBodyRenderer.ts`
- Create: `src/presentation/character/anatomy/anatomicalBodyRenderer.test.ts`

**Interfaces:**
- Consumes: `PixelCanvas`, `AnatomicalPose`, `BodyId`, and character dimension constants.
- Produces: `renderAnatomicalBody(canvas, pose, bodyId): void` and a connected `bodyMask` in the canvas snapshot.

- [ ] **Step 1: Write failing connected-body tests for all builds and poses**

```ts
import { describe, expect, it } from 'vitest';
import { BODY_IDS } from '../CharacterAppearance';
import { CHARACTER_BODY_LEFT, CHARACTER_ORIGIN_Y } from '../characterDimensions';
import { PixelCanvas, isMaskConnected } from '../frame/PixelCanvas';
import { CHARACTER_ANIMATIONS } from './anatomicalAnimations';
import { renderAnatomicalBody } from './anatomicalBodyRenderer';

describe('connected anatomical underbody', () => {
  it('keeps every body build connected in every approved pose', () => {
    for (const body of BODY_IDS) {
      for (const animation of Object.values(CHARACTER_ANIMATIONS)) {
        for (const frame of animation.frames) {
          const canvas = new PixelCanvas(48, 56);
          renderAnatomicalBody(canvas, frame.pose, body);
          const snapshot = canvas.snapshot();
          expect(isMaskConnected(snapshot.bodyMask, 48, 56)).toBe(true);
        }
      }
    }
  });

  it('keeps the body inside its region and grounded feet on the contact row', () => {
    const canvas = new PixelCanvas(48, 56);
    renderAnatomicalBody(canvas, CHARACTER_ANIMATIONS.idle.frames[0].pose, 'standard');
    const mask = canvas.snapshot().bodyMask;
    for (let index = 0; index < mask.length; index += 1) {
      if (!mask[index]) continue;
      const x = index % 48;
      const y = Math.floor(index / 48);
      expect(x).toBeGreaterThanOrEqual(CHARACTER_BODY_LEFT);
      expect(x).toBeLessThan(40);
      expect(y).toBeLessThan(CHARACTER_ORIGIN_Y);
    }
    expect(mask[(CHARACTER_ORIGIN_Y - 1) * 48 + 18]).toBe(true);
    expect(mask[(CHARACTER_ORIGIN_Y - 1) * 48 + 31]).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test and confirm the missing renderer failure**

Run: `npm run test -- src/presentation/character/anatomy/anatomicalBodyRenderer.test.ts`

Expected: FAIL because `anatomicalBodyRenderer.ts` does not exist.

- [ ] **Step 3: Implement connected limbs, torso, head, and outline**

Use the following thickness table:

```ts
const BODY_THICKNESS = {
  standard: { limb: 2, torso: 4, head: 4 },
  heavy: { limb: 3, torso: 5, head: 4 },
  gaunt: { limb: 2, torso: 3, head: 4 },
} as const;
```

Render rear limbs first, then a pelvis polygon, torso polygon, neck segment, head ellipse/polygon, front limbs, hands, and feet. Every anatomical write passes `body: true`. Join each limb segment with a filled joint square centered on the shared landmark. Build an outline by copying the body mask, painting every empty eight-neighbor cell as `outline`, then paint the interior using `skinDark`, `skin`, and `skinLight` according to x position and the principal upper-left light direction.

The torso polygon uses `shoulderRear`, `shoulderFront`, `hipFront`, and `hipRear`. The head occupies an 8- or 9-pixel-high connected shape centered on `headCenter`. Clamp outline growth to the central body region; feet occupy y `49..51` and never write y `52`.

- [ ] **Step 4: Run underbody and canvas tests**

Run: `npm run test -- src/presentation/character/anatomy/anatomicalBodyRenderer.test.ts src/presentation/character/frame/PixelCanvas.test.ts`

Expected: PASS for all three builds across all 57 approved frames.

- [ ] **Step 5: Commit the connected anatomical base**

```bash
git add src/presentation/character/anatomy/anatomicalBodyRenderer.ts src/presentation/character/anatomy/anatomicalBodyRenderer.test.ts
git commit -m "feat: render connected fighter anatomy"
```

---

### Task 6: Migrate the Complete Module Library to Landmark-Aware Renderers

**Files:**
- Create: `src/presentation/character/rendering/CharacterRenderModule.ts`
- Create: `src/presentation/character/modules/bodies.ts`
- Create: `src/presentation/character/modules/armor.ts`
- Create: `src/presentation/character/modules/mutations.ts`
- Modify: `src/presentation/character/modules/heads.ts`
- Modify: `src/presentation/character/modules/torsos.ts`
- Modify: `src/presentation/character/modules/legs.ts`
- Modify: `src/presentation/character/modules/arms.ts`
- Modify: `src/presentation/character/modules/accessories.ts`
- Modify: `src/presentation/character/modules/weapons.ts`
- Modify: `src/presentation/character/characterModuleCatalog.ts`
- Modify: `src/presentation/character/bodyModules.test.ts`
- Modify: `src/presentation/character/characterModuleCatalog.test.ts`

**Interfaces:**
- Consumes: `PixelCanvas`, `AnatomicalPose`, `CharacterAppearance`, and semantic palette roles.
- Produces: `CharacterRenderLayer`, `CharacterRenderContext`, `CharacterRenderModule`, every typed renderer record, `resolveAppearanceRenderModules(appearance)`, and `getAllCharacterRenderModules()`.

- [ ] **Step 1: Replace detached-piece assertions with failing complete-renderer assertions**

```ts
it('implements every body-overlay id as a landmark-aware renderer', () => {
  expect(Object.keys(HEAD_MODULES).sort()).toEqual([...HEAD_IDS].sort());
  expect(Object.keys(TORSO_MODULES).sort()).toEqual([...TORSO_IDS].sort());
  expect(Object.keys(LEGS_MODULES).sort()).toEqual([...LEGS_IDS].sort());
  expect(Object.keys(ARMS_MODULES).sort()).toEqual([...ARMS_IDS].sort());
  for (const module of [
    ...Object.values(HEAD_MODULES), ...Object.values(TORSO_MODULES),
    ...Object.values(LEGS_MODULES), ...Object.values(ARMS_MODULES),
  ]) {
    expect(typeof module.renderRight).toBe('function');
    expect(['rearBody', 'body', 'frontBody']).toContain(module.layer);
  }
});

it('implements every body, armor, mutation, accessory, and weapon id', () => {
  expect(Object.keys(BODY_MODULES).sort()).toEqual([...BODY_IDS].sort());
  expect(Object.keys(ARMOR_MODULES).sort()).toEqual([...ARMOR_IDS].sort());
  expect(Object.keys(MUTATION_MODULES).sort()).toEqual([...MUTATION_IDS].sort());
  expect(Object.keys(ACCESSORY_MODULES).sort()).toEqual([...ACCESSORY_IDS].sort());
  expect(Object.keys(WEAPON_MODULES).sort()).toEqual([...WEAPON_IDS].sort());
});

it('resolves appearance modules in semantic layer order', () => {
  const modules = resolveAppearanceRenderModules(PREVIEW_APPEARANCES.mixed);
  const indexes = modules.map((module) => CHARACTER_RENDER_LAYERS.indexOf(module.layer));
  expect(indexes).toEqual([...indexes].sort((a, b) => a - b));
});
```

- [ ] **Step 2: Run module tests and confirm old-contract failures**

Run: `npm run test -- src/presentation/character/bodyModules.test.ts src/presentation/character/characterModuleCatalog.test.ts`

Expected: FAIL because existing modules expose detached `pieces`, body/armor/mutation records do not exist, and the catalog does not resolve render functions.

- [ ] **Step 3: Define the renderer contract and migrate every module category atomically**

```ts
export const CHARACTER_RENDER_LAYERS = [
  'rearAccessory', 'rearBody', 'anatomy', 'body', 'armor',
  'frontBody', 'weapon', 'frontAccessory', 'mutationAccent',
] as const;
export type CharacterRenderLayer = (typeof CHARACTER_RENDER_LAYERS)[number];

export interface CharacterRenderContext {
  canvas: PixelCanvas;
  pose: AnatomicalPose;
  appearance: CharacterAppearance;
  seed: number;
  accessoryPhase: 0 | 1 | 2 | 3;
}

export interface CharacterRenderModule {
  id: string;
  layer: CharacterRenderLayer;
  renderRight(context: CharacterRenderContext): void;
  renderLeft?(context: CharacterRenderContext): void;
}
```

Rewrite each module to paint along the posed body rather than around static anchors:

- heads use `headCenter` and `neck`, preserving an 8- or 9-pixel head and adding masks, respirators, visors, or implants as overlays;
- torsos fill the shoulder-to-hip polygon with cloth roles and keep neck/pelvis overlap;
- legs draw thick segments from hips through knees to feet, add footwear on y `49..51`, and overlap the pelvis by at least two pixels;
- arms draw from shoulders through elbows to hands, overlap shoulders by at least two pixels, and preserve visible hands at the posed endpoints.

Keep the existing head, torso, legs, arms, accessory, and weapon identifiers and visual intent. Add renderers for the exact new IDs from Task 2:

- body renderers apply `standard`, `heavy`, and `gaunt` secondary shading without changing the shared canvas or hitbox;
- `none` armor and mutation renderers are no-op modules with stable IDs;
- `scrap-plate` and `industrial-vest` cover torso landmarks while preserving neck, arm, and pelvis connections;
- `blood-veins`, `bone-growth`, and `grafted-arm` add localized mutation pixels without moving landmarks;
- accessories attach to `hipRear`, `shoulderRear`, `shoulderFront`, or `hipFront`; tubes use `accessoryPhase` to select one of four integer paths;
- the relay pistol starts at `weaponMount`, overlaps `handFront`, and remains inside the `48 × 56` frame.

Resolve modules by collecting selected records and sorting with `CHARACTER_RENDER_LAYERS.indexOf(module.layer)`. Preserve appearance array order for accessories that share a layer.

Do not retain `pieces`, `slot`, `anchor`, or `views` in any rewritten module file or the new catalog API.

- [ ] **Step 4: Run every module test and the TypeScript build**

Run: `npm run test -- src/presentation/character/bodyModules.test.ts src/presentation/character/characterModuleCatalog.test.ts src/presentation/character/deterministicCharacter.test.ts src/presentation/character/anatomy/anatomicalBodyRenderer.test.ts && npm run build`

Expected: PASS with every identifier resolved, every preview family materially distinct, and no half-migrated catalog type error.

- [ ] **Step 5: Commit the complete module migration**

```bash
git add src/presentation/character/rendering/CharacterRenderModule.ts src/presentation/character/modules/bodies.ts src/presentation/character/modules/armor.ts src/presentation/character/modules/mutations.ts src/presentation/character/modules/heads.ts src/presentation/character/modules/torsos.ts src/presentation/character/modules/legs.ts src/presentation/character/modules/arms.ts src/presentation/character/modules/accessories.ts src/presentation/character/modules/weapons.ts src/presentation/character/characterModuleCatalog.ts src/presentation/character/bodyModules.test.ts src/presentation/character/characterModuleCatalog.test.ts
git commit -m "feat: migrate procedural fighter modules"
```

---

### Task 7: Compose Deterministic Complete Character Frames

**Files:**
- Create: `src/presentation/character/rendering/characterFrameComposer.ts`
- Create: `src/presentation/character/rendering/characterFrameComposer.test.ts`

**Interfaces:**
- Consumes: `CharacterAppearance`, `CharacterAnimationName`, `CharacterPoseFrame`, anatomy renderer, render modules, layer order, and `PixelCanvas`.
- Produces: `composeCharacterFrame(appearance, animation, frameIndex, facing): CharacterPixelFrame`, `mirrorAnatomicalPose(pose): AnatomicalPose`, and fail-fast validation for invalid frame indexes.

- [ ] **Step 1: Write failing determinism, mirror, connectivity, and bounds tests**

```ts
import { describe, expect, it } from 'vitest';
import { CHARACTER_ANIMATIONS } from '../anatomy/anatomicalAnimations';
import type { CharacterAnimationName } from '../anatomy/AnatomicalPose';
import { PREVIEW_APPEARANCES } from '../deterministicCharacter';
import { isMaskConnected } from '../frame/PixelCanvas';
import { composeCharacterFrame } from './characterFrameComposer';

describe('complete character frame composer', () => {
  it('is deterministic for identical complete-frame inputs', () => {
    const first = composeCharacterFrame(PREVIEW_APPEARANCES.mixed, 'run', 3, 'right');
    const second = composeCharacterFrame(PREVIEW_APPEARANCES.mixed, 'run', 3, 'right');
    expect(second).toEqual(first);
  });

  it('keeps the anatomical body connected for every preview family and animation', () => {
    for (const appearance of Object.values(PREVIEW_APPEARANCES)) {
      for (const animation of Object.keys(CHARACTER_ANIMATIONS) as CharacterAnimationName[]) {
        for (let index = 0; index < CHARACTER_ANIMATIONS[animation].frames.length; index += 1) {
          const frame = composeCharacterFrame(appearance, animation, index, 'right');
          expect(frame.pixels).toHaveLength(48 * 56);
          expect(isMaskConnected(frame.bodyMask, 48, 56)).toBe(true);
        }
      }
    }
  });

  it('mirrors default output and preserves semantic roles', () => {
    const right = composeCharacterFrame(PREVIEW_APPEARANCES.clone, 'idle', 0, 'right');
    const left = composeCharacterFrame(PREVIEW_APPEARANCES.clone, 'idle', 0, 'left');
    for (let y = 0; y < 56; y += 1) {
      for (let x = 0; x < 48; x += 1) {
        expect(left.pixels[y * 48 + x]).toBe(right.pixels[y * 48 + (47 - x)]);
      }
    }
  });

  it('rejects unavailable animation frame indexes', () => {
    expect(() => composeCharacterFrame(PREVIEW_APPEARANCES.clone, 'idle', 6, 'right'))
      .toThrow('Invalid idle frame index 6.');
  });
});
```

- [ ] **Step 2: Run the focused test and confirm the missing composer failure**

Run: `npm run test -- src/presentation/character/rendering/characterFrameComposer.test.ts`

Expected: FAIL because `characterFrameComposer.ts` does not exist.

- [ ] **Step 3: Implement layered frame composition and facing resolution**

Use this exact signature:

```ts
export type RenderFacing = 'left' | 'right';

export function composeCharacterFrame(
  appearance: CharacterAppearance,
  animation: CharacterAnimationName,
  frameIndex: number,
  facing: RenderFacing,
): CharacterPixelFrame;
```

For each semantic layer, render into its own transparent `PixelCanvas`. Insert `renderAnatomicalBody` at the `anatomy` layer. For right output, blend layers in `CHARACTER_RENDER_LAYERS` order. For left output:

1. mirror the anatomical pose with x equal to `47 - x`;
2. mirror every canonical right layer;
3. when a module defines `renderLeft`, render that module on a fresh canvas with the mirrored pose and use it instead of the mirrored canonical layer;
4. blend the resolved left layers in the same semantic order.

Blending copies non-null semantic pixels and ORs `bodyMask` cells. Throw the exact invalid-index error before any rendering. Return a fresh immutable snapshot; never expose mutable canvas arrays.

- [ ] **Step 4: Run composer and all character-pure tests**

Run: `npm run test -- src/presentation/character/rendering/characterFrameComposer.test.ts src/presentation/character/anatomy src/presentation/character/frame src/presentation/character/bodyModules.test.ts src/presentation/character/characterModuleCatalog.test.ts`

Expected: PASS across all preview families, animations, frames, and facings.

- [ ] **Step 5: Commit complete pure-frame composition**

```bash
git add src/presentation/character/rendering/characterFrameComposer.ts src/presentation/character/rendering/characterFrameComposer.test.ts
git commit -m "feat: compose complete procedural fighter frames"
```

---

### Task 8: Bake Cached Phaser Textures and Use One Runtime Sprite

**Files:**
- Create: `src/presentation/character/rendering/characterFrameBaker.ts`
- Create: `src/presentation/character/rendering/characterFrameBaker.test.ts`
- Modify: `src/presentation/character/PixelPoseAnimator.ts`
- Modify: `src/presentation/character/PixelPoseAnimator.test.ts`
- Modify: `src/presentation/character/ProceduralCharacterView.ts`
- Create: `src/presentation/character/ProceduralCharacterView.test.ts`

**Interfaces:**
- Consumes: complete semantic frames, palette values, animation catalog, motion snapshot, and Phaser texture/image APIs.
- Produces: `CharacterFrameSelection`, `buildCharacterFrameTextureKey(...)`, `bakeCharacterFrame(...)`, and a `ProceduralCharacterView` that owns exactly one Phaser image.

- [ ] **Step 1: Write failing animator, cache-key, and single-image tests**

Replace offset expectations in `PixelPoseAnimator.test.ts` with frame references:

```ts
it('returns deterministic animation and frame indexes', () => {
  const animator = new PixelPoseAnimator();
  expect(animator.update(0, { grounded: true, velocityX: 0, velocityY: 0 }))
    .toEqual({ animationName: 'idle', frameIndex: 0 });
  expect(animator.update(181, { grounded: true, velocityX: 0, velocityY: 0 }))
    .toEqual({ animationName: 'idle', frameIndex: 1 });
});
```

Add cache-key coverage:

```ts
it('keys complete frames by appearance, animation, frame, and facing', () => {
  const right = buildCharacterFrameTextureKey(PREVIEW_APPEARANCES.mixed, 'run', 3, 'right');
  const left = buildCharacterFrameTextureKey(PREVIEW_APPEARANCES.mixed, 'run', 3, 'left');
  expect(right).toContain('char-frame:');
  expect(right).toContain(':run:3:right');
  expect(left).not.toBe(right);
});
```

In `ProceduralCharacterView.test.ts`, use a small scene double whose `add.image` is a `vi.fn()` returning an object with `setOrigin`, `setDepth`, `setPosition`, `setTexture`, and `destroy`. Construct one view, update it twice, and assert `scene.add.image` was called exactly once while `setTexture` was called twice.

- [ ] **Step 2: Run focused tests and confirm old return-contract failures**

Run: `npm run test -- src/presentation/character/PixelPoseAnimator.test.ts src/presentation/character/rendering/characterFrameBaker.test.ts src/presentation/character/ProceduralCharacterView.test.ts`

Expected: FAIL because the animator still returns piece offsets, the complete-frame baker is absent, and the view creates multiple images.

- [ ] **Step 3: Implement frame selection, lazy baking, and the single-image view**

Use these contracts:

```ts
export interface CharacterFrameSelection {
  animationName: CharacterAnimationName;
  frameIndex: number;
}

export interface BakedCharacterFrame {
  textureKey: string;
  originX: number;
  originY: number;
}

export function buildCharacterFrameTextureKey(
  appearance: CharacterAppearance,
  animation: CharacterAnimationName,
  frameIndex: number,
  facing: RenderFacing,
): string {
  const appearanceKey = [
    appearance.body, appearance.head, appearance.torso, appearance.legs,
    appearance.arms, appearance.armor, appearance.mutation, appearance.weapon,
    appearance.accessories.join(','), appearance.palette,
    (appearance.seed >>> 0).toString(16),
  ].join(':');
  return `char-frame:${appearanceKey}:${animation}:${frameIndex}:${facing}`;
}

export function bakeCharacterFrame(
  scene: Phaser.Scene,
  appearance: CharacterAppearance,
  animation: CharacterAnimationName,
  frameIndex: number,
  facing: RenderFacing,
): BakedCharacterFrame {
  const textureKey = buildCharacterFrameTextureKey(appearance, animation, frameIndex, facing);
  if (!scene.textures.exists(textureKey)) {
    const frame = composeCharacterFrame(appearance, animation, frameIndex, facing);
    const texture = scene.textures.createCanvas(textureKey, 48, 56);
    if (!texture) throw new Error(`Could not create texture ${textureKey}.`);
    const palette = getCharacterPalette(appearance.palette);
    texture.context.imageSmoothingEnabled = false;
    frame.pixels.forEach((role, index) => {
      if (!role) return;
      texture.context.fillStyle = `#${palette[role].toString(16).padStart(6, '0')}`;
      texture.context.fillRect(index % 48, Math.floor(index / 48), 1, 1);
    });
    texture.refresh();
  }
  return { textureKey, originX: 0.5, originY: 52 / 56 };
}
```

`PixelPoseAnimator.update(timeMs, motion)` retains the current motion transitions and run-rate scaling, then returns the selected animation name and discrete frame index. Use cumulative frame durations from `CHARACTER_ANIMATIONS` rather than offset objects. Future animation names are never selected by current movement.

Build the texture key from every appearance field in stable field order, accessories joined in stored order, seed encoded as unsigned hexadecimal, animation, frame index, and facing. `bakeCharacterFrame` calls `composeCharacterFrame` only when `scene.textures.exists(key)` is false, creates a `48 × 56` canvas texture, disables smoothing, paints every non-null pixel from the selected palette, calls `refresh()`, and returns:

```ts
{ textureKey, originX: 0.5, originY: 52 / 56 }
```

Mock `bakeCharacterFrame` in `ProceduralCharacterView.test.ts` to return a stable `{ textureKey, originX, originY }`; the scene double therefore tests image ownership and update behavior without requiring a real Phaser texture manager.

`ProceduralCharacterView` stores one `Phaser.GameObjects.Image`. During update, set its position to the rounded physics body x and rounded body-bottom y (`state.y + PLAYER_HEIGHT / 2`), resolve/bake the selected complete frame, and call `setTexture`. Remove the container, render-piece array, per-piece origin work, and detached anchor offsets.

- [ ] **Step 4: Run focused tests, full tests, and build**

Run: `npm run test -- src/presentation/character && npm run test && npm run build`

Expected: PASS. TypeScript confirms no current gameplay path can request a future action animation.

- [ ] **Step 5: Commit the single-sprite runtime**

```bash
git add src/presentation/character/rendering/characterFrameBaker.ts src/presentation/character/rendering/characterFrameBaker.test.ts src/presentation/character/PixelPoseAnimator.ts src/presentation/character/PixelPoseAnimator.test.ts src/presentation/character/ProceduralCharacterView.ts src/presentation/character/ProceduralCharacterView.test.ts
git commit -m "feat: render fighters as cached complete frames"
```

---

### Task 9: Enlarge the Shared Physics Body and Prove Arena Clearance

**Files:**
- Modify: `src/gameplay/player/playerGeometry.ts`
- Modify: `src/gameplay/player/playerGeometry.test.ts`
- Modify: `src/gameplay/player/Player.ts`
- Modify: `src/config/arena.test.ts`

**Interfaces:**
- Consumes: `CHARACTER_BODY_WIDTH`, `CHARACTER_BODY_HEIGHT`, arena geometry, gravity, jump speed, and current `Player` collision setup.
- Produces: exact `PLAYER_WIDTH = 32`, `PLAYER_HEIGHT = 48`, aligned P1/P2 labels, and objective traversal assertions.

- [ ] **Step 1: Replace the old-footprint test and add clearance assertions**

```ts
it('uses the approved shared 32 × 48 physics body', () => {
  expect(PLAYER_WIDTH).toBe(32);
  expect(PLAYER_HEIGHT).toBe(48);
});
```

Add to `arena.test.ts`:

```ts
it('keeps the larger fighter inside the arena at every spawn', () => {
  for (const spawn of SPAWN_POINTS) {
    expect(spawn.x - PLAYER_WIDTH / 2).toBeGreaterThanOrEqual(0);
    expect(spawn.x + PLAYER_WIDTH / 2).toBeLessThanOrEqual(ARENA_WIDTH);
    expect(spawn.y - PLAYER_HEIGHT / 2).toBeGreaterThanOrEqual(0);
  }
});

it('keeps a full top-tier jump inside the arena', () => {
  const maxJumpHeight = (PLAYER_JUMP_SPEED ** 2) / (2 * GRAVITY_Y);
  const topTier = PLATFORM_LAYOUT.find((platform) => platform.tier === 4);
  if (!topTier) throw new Error('Missing platform tier 4.');
  const standingCenterY = topTier.y - PLATFORM_HEIGHT / 2 - PLAYER_HEIGHT / 2;
  expect(standingCenterY - maxJumpHeight - PLAYER_HEIGHT / 2).toBeGreaterThanOrEqual(0);
});
```

Import `SPAWN_POINTS`, `PLAYER_WIDTH`, and `PLAYER_HEIGHT` into the arena test.

- [ ] **Step 2: Run geometry tests and confirm the old-footprint failure**

Run: `npm run test -- src/gameplay/player/playerGeometry.test.ts src/config/arena.test.ts`

Expected: FAIL because the physics rectangle still derives from the old `22.5 × 34.5` base.

- [ ] **Step 3: Apply the approved shared body dimensions**

```ts
import { CHARACTER_BODY_HEIGHT, CHARACTER_BODY_WIDTH } from '../../presentation/character/characterDimensions';

export const PLAYER_WIDTH = CHARACTER_BODY_WIDTH;
export const PLAYER_HEIGHT = CHARACTER_BODY_HEIGHT;
```

Keep `Player.body.setSize(PLAYER_WIDTH, PLAYER_HEIGHT, true)`. Replace the scaled label offset with `const LABEL_OFFSET = 7;` and `const LABEL_FONT_SIZE = 9;` so labels remain above the larger head. Do not alter movement speed, acceleration, drag, gravity, jump speed, drop-through duration, or platform collision tolerance in this task.

- [ ] **Step 4: Run geometry, movement, full tests, and build**

Run: `npm run test -- src/gameplay/player src/config/arena.test.ts && npm run test && npm run build`

Expected: PASS. The top-tier clearance assertion proves the current jump remains within the arena.

- [ ] **Step 5: Commit the shared gameplay footprint**

```bash
git add src/gameplay/player/playerGeometry.ts src/gameplay/player/playerGeometry.test.ts src/gameplay/player/Player.ts src/config/arena.test.ts
git commit -m "feat: enlarge fighter gameplay footprint"
```

---

### Task 10: Add the Explicit Character Preview Mode

**Files:**
- Create: `src/presentation/character/preview/characterPreviewModel.ts`
- Create: `src/presentation/character/preview/characterPreviewModel.test.ts`
- Create: `src/scenes/bootTarget.ts`
- Create: `src/scenes/bootTarget.test.ts`
- Create: `src/scenes/CharacterPreviewScene.ts`
- Modify: `src/scenes/BootScene.ts`
- Modify: `src/main.ts`

**Interfaces:**
- Consumes: `PREVIEW_APPEARANCES`, all animation names, complete-frame baker, and hitbox dimensions.
- Produces: `CharacterPreviewState`, pure cycling functions, `selectBootTarget(search)`, and the `CharacterPreviewScene` validation surface.

- [ ] **Step 1: Write failing preview-state and startup-routing tests**

```ts
it('cycles every preview appearance and animation deterministically', () => {
  let state = createCharacterPreviewState();
  expect(state).toMatchObject({ appearance: 'clone', animation: 'idle', facing: 'right' });
  state = cyclePreviewAppearance(state, -1);
  expect(state.appearance).toBe('mixed');
  state = cyclePreviewAnimation(state, 1);
  expect(state.animation).toBe('run');
});

it('routes only the explicit preview query to the preview scene', () => {
  expect(selectBootTarget('?character-preview=1')).toBe('CharacterPreviewScene');
  expect(selectBootTarget('?character-preview=0')).toBe('ArenaScene');
  expect(selectBootTarget('')).toBe('ArenaScene');
});
```

Also assert the model's animation list equals all keys of `CHARACTER_ANIMATIONS` and appearance list equals all keys of `PREVIEW_APPEARANCES`.

- [ ] **Step 2: Run preview tests and confirm missing modules**

Run: `npm run test -- src/presentation/character/preview/characterPreviewModel.test.ts src/scenes/bootTarget.test.ts`

Expected: FAIL because the preview model and boot-target selector do not exist.

- [ ] **Step 3: Implement pure state, URL routing, and the preview scene**

Use this state contract:

```ts
export interface CharacterPreviewState {
  appearance: keyof typeof PREVIEW_APPEARANCES;
  animation: CharacterAnimationName;
  facing: 'left' | 'right';
  playing: boolean;
  showHitbox: boolean;
  frameIndex: number;
}
```

Cycle indexes with positive modulo so decrementing the first item selects the last. `selectBootTarget(search)` uses `new URLSearchParams(search).get('character-preview') === '1'`.

`CharacterPreviewScene` displays all four representative fighters at normal scale in a row against a neutral dark background and repeats the selected fighter as one enlarged nearest-neighbor preview. Add Phaser text buttons with `setInteractive()` for appearance previous/next, animation previous/next, facing, play/pause, previous/next frame while paused, and hitbox visibility. Buttons use pointer input so the deployed mode works on touch devices. Display selected family, seed in hexadecimal, animation, frame index, facing, and `32 × 48` hitbox label.

`BootScene.create()` calls `selectBootTarget(window.location.search)`. Register `CharacterPreviewScene` after `ArenaScene` in `main.ts`'s scene list. Normal URLs still start `ArenaScene`.

- [ ] **Step 4: Run preview tests, full tests, and build**

Run: `npm run test -- src/presentation/character/preview src/scenes/bootTarget.test.ts && npm run test && npm run build`

Expected: PASS, and Vite production build includes `CharacterPreviewScene` without changing the default startup route.

- [ ] **Step 5: Commit the validation surface**

```bash
git add src/presentation/character/preview/characterPreviewModel.ts src/presentation/character/preview/characterPreviewModel.test.ts src/scenes/bootTarget.ts src/scenes/bootTarget.test.ts src/scenes/CharacterPreviewScene.ts src/scenes/BootScene.ts src/main.ts
git commit -m "feat: add procedural fighter preview mode"
```

---

### Task 11: Remove the Detached-Piece Rendering System

**Files:**
- Delete: `src/presentation/character/CharacterRig.ts`
- Delete: `src/presentation/character/pixelPoses.ts`
- Delete: `src/presentation/character/moduleGeometry.ts`
- Delete: `src/presentation/character/characterModuleBaker.ts`
- Delete: `src/presentation/character/moduleGeometry.test.ts`
- Delete: `src/presentation/character/characterModuleBaker.test.ts`
- Modify: `src/presentation/character/PixelPoseAnimator.test.ts`
- Modify: `src/presentation/character/characterModuleCatalog.test.ts`

**Interfaces:**
- Consumes: new anatomical, frame-composer, and frame-baker replacements.
- Produces: zero source imports of detached piece, rig-anchor, primitive-view, or per-module texture APIs.

- [ ] **Step 1: Add a failing legacy-import guard**

Add to `characterModuleCatalog.test.ts`:

```ts
it('exposes render modules without detached piece data', () => {
  for (const module of getAllCharacterRenderModules()) {
    expect('pieces' in module).toBe(false);
    expect('renderRight' in module).toBe(true);
  }
});
```

- [ ] **Step 2: Run the guard and inspect remaining legacy references**

Run: `npm run test -- src/presentation/character/characterModuleCatalog.test.ts`

Expected: FAIL while `getAllCharacterRenderModules` or old piece-backed modules remain.

Run: `rg -n "CharacterRig|pixelPoses|moduleGeometry|characterModuleBaker|CharacterModulePieceDefinition|RigAnchorName|bakeModulePiece" src`

Expected: matches only in the legacy files and tests scheduled for deletion, plus imports that must be migrated before deletion.

- [ ] **Step 3: Remove legacy files and migrate every remaining import**

Delete the six listed source/test files. Export `PaletteRole = keyof CharacterPalette` from `characterPalettes.ts` and ensure all new raster/render modules import it there. Remove rig render-order and lower/upper detached-slot assertions from `PixelPoseAnimator.test.ts`; retain movement-transition and frame-selection coverage.

- [ ] **Step 4: Prove no legacy reference remains**

Run: `rg -n "CharacterRig|pixelPoses|moduleGeometry|characterModuleBaker|CharacterModulePieceDefinition|RigAnchorName|bakeModulePiece" src`

Expected: no output and exit code 1.

Run: `npm run test && npm run lint && npm run build`

Expected: all commands PASS.

- [ ] **Step 5: Commit legacy-system removal**

```bash
git add -u -- src/presentation/character/CharacterRig.ts src/presentation/character/pixelPoses.ts src/presentation/character/moduleGeometry.ts src/presentation/character/characterModuleBaker.ts src/presentation/character/moduleGeometry.test.ts src/presentation/character/characterModuleBaker.test.ts
git add -- src/presentation/character/characterPalettes.ts src/presentation/character/PixelPoseAnimator.test.ts src/presentation/character/characterModuleCatalog.test.ts
git commit -m "refactor: remove detached fighter rendering"
```

---

### Task 12: Document, Verify, and Hand Off Human Validation

**Files:**
- Modify: `README.md`
- Modify: `PLAN.md`
- Modify: `docs/visual/README.md`

**Interfaces:**
- Consumes: completed character pipeline, preview query, test/build commands, and repository validation rules.
- Produces: accurate user/developer documentation and an explicit unchecked human-validation gate.

- [ ] **Step 1: Update documentation with exact implemented behavior**

In `README.md`, describe:

- connected detailed `32 × 48` procedural fighters;
- one cached complete sprite per animation frame;
- clone, mercenary, mutant, and mixed visual families;
- normal playable URL `https://karlos-fr.github.io/blood-relay/`;
- preview URL `https://karlos-fr.github.io/blood-relay/?character-preview=1`.

In `docs/visual/README.md`, document that the visual reference remains directional and that the generated frame canvas is `48 × 56` around a shared `32 × 48` hitbox.

In `PLAN.md`, add checked technical tasks for the implemented anatomy, complete-frame baker, modules, animations, and preview mode. Add separate unchecked tasks for human validation of anatomy, animation naturalness, arena traversal, collisions, desktop readability, mobile readability, and future-pose previews.

- [ ] **Step 2: Check formatting before the full verification run**

Run: `npm run format:check`

Expected: PASS. When it fails, run `npx prettier --write README.md PLAN.md docs/visual/README.md`, inspect `git diff`, and confirm formatting touched only task files before continuing.

- [ ] **Step 3: Run the complete local quality gate**

Run in this exact order:

```bash
npm run lint
npm run test
npm run build
```

Expected: all three commands exit 0. Record the Vitest file/test totals and the generated `dist` size in the task handoff.

- [ ] **Step 4: Inspect both local runtime routes**

Run: `npm run dev -- --host 127.0.0.1`

Inspect:

- `http://127.0.0.1:5173/blood-relay/` starts the normal arena;
- `http://127.0.0.1:5173/blood-relay/?character-preview=1` starts the preview;
- each fighter is a connected silhouette at normal scale;
- all 13 animations are selectable in both facings;
- pause and manual frame stepping work;
- hitbox overlay reads `32 × 48` and aligns with both feet;
- touch/pointer buttons respond;
- no browser console error appears.

Stop the development server after inspection.

- [ ] **Step 5: Commit documentation without marking human gates complete**

```bash
git add README.md PLAN.md docs/visual/README.md
git commit -m "docs: document detailed procedural fighters"
```

Do not check the new human-validation tasks. Do not claim visual or gameplay approval. Hand off both URLs and ask the human tester to validate anatomy, connected body parts, animation naturalness, platform traversal, collisions, desktop/mobile readability, and prepared future poses.

---

## Completion Gate

Implementation is technically complete only when every task commit exists and local lint, tests, build, normal arena inspection, and preview inspection have succeeded. The playable lot remains human-unvalidated until the deployed GitHub Pages workflow succeeds and the tester explicitly approves every new manual item in `PLAN.md`.
