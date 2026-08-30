# Blood Relay — Procedural Modular Character Design

Date: 2026-08-30
Status: Design approved in chat, pending written-spec review

## 1. Goal

Replace the current rectangular player placeholder with a fully procedural, modular, deterministic pixel-art character system while preserving the current gameplay footprint and movement behavior.

The system must support many visually distinct clone/prisoner combatants from a small reusable library of body modules. It must also establish a common rig and animation vocabulary that later combat, weapons, damage and interaction work can reuse.

This design does **not** advance Blood Relay to Phase 2 combat. It replaces and formalizes the Phase 1 character presentation layer only.

## 2. Fixed product decisions

The following decisions are locked for the first implementation:

- Keep the **current player gameplay size and hitbox**. The new character must not become larger for collision or traversal purposes.
- Use a **strict side profile** during current gameplay.
- The canonical module orientation is **right-facing**.
- Left-facing visuals are mirrored from the right-facing module by default.
- Individual asymmetric modules may provide a dedicated left-facing override.
- The module contract reserves a **back-facing slot for future art**, but the first implementation does not need to draw or use back-facing variants.
- Arms and weapons are **separate modules**.
- Animation is driven by **discrete pixel poses**, not continuous limb rotations.
- Character appearance is **deterministic**, represented by a modular configuration plus a seed.
- P1 and P2 use two fixed, intentionally different appearances for the first visual validation.

## 3. Visual target

The rendered body must stay visually compatible with the current player footprint. The current physics rectangle is derived from `22.5 × 34.5` base units multiplied by `ARENA_CONTENT_SCALE`; at the current scale of `0.9`, that is approximately **20.25 × 31.05 logical pixels**.

The modular body should fit around that footprint. Small cosmetic overhangs are allowed for an arm, weapon, respirator, tube, blood bag or armor plate, but those overhangs never change gameplay collisions.

The goal is not miniature realism. At this resolution, every item must be reduced to its strongest readable signal:

- respirator: compact mouth mask plus short contrasting tube;
- blood bag: small bright red pouch plus connector;
- implant: a few metallic pixels and one accent light;
- torn suit: broken silhouette and exposed undersuit pixels;
- armor plate: a strong block shape and highlight edge;
- medical mask: light horizontal mask shape across the lower face.

Rendering rules:

- integer pixel coordinates only;
- no anti-aliasing;
- no arbitrary smooth rotation;
- no sub-pixel interpolation in character composition;
- strong silhouette before surface detail;
- limited palette roles instead of global tint-only recoloring.

## 4. Architectural approach

Use **procedural module textures generated once, then assembled as sprites on a shared rig**.

Do not redraw complete characters with Phaser Graphics every frame. Instead:

1. module definitions describe small pixel-art geometry in code;
2. a module baker generates reusable textures at startup/on first use;
3. a character instance selects textures according to its appearance configuration;
4. sprites are attached to rig anchors;
5. animation changes integer anchor offsets and module variants through discrete poses.

This preserves procedural authorship while giving runtime behavior similar to normal sprite composition.

## 5. Core data model

A character appearance is described independently from gameplay state.

```ts
interface CharacterAppearance {
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

The exact identifiers can evolve, but appearance must remain serializable and deterministic.

The seed may influence minor secondary details only. It must never change the core silhouette enough to invalidate readability or anchors.

Examples of allowed seeded variation:

- one-pixel scar;
- missing seam pixel;
- small patch position;
- tube routed one pixel above/below;
- tiny plate scratch;
- subtle highlight variation.

Examples of forbidden seeded variation:

- changing head category;
- moving major anchors;
- changing collision size;
- producing arbitrary unreadable silhouettes.

## 6. Initial module library

The first production library should be intentionally small but sufficient to prove combinatorial reuse.

### Torsos — 4

1. prison jumpsuit;
2. medical/lab suit;
3. torn suit;
4. light armored suit.

### Heads — 5

1. shaved head;
2. medical mask;
3. respirator;
4. face shield/visor;
5. visible implants.

### Legs — 3

1. simple prisoner trousers;
2. reinforced trousers;
3. torn/damaged trousers.

### Arms — 2

Two arm silhouettes/gear treatments, independent from weapon choice.

### Accessories — 6

1. blood bag;
2. dorsal tube;
3. medical pack;
4. shoulder plate;
5. external implant;
6. holster.

### Palettes — 5

The first implementation provides exactly five palettes. Palettes use semantic roles rather than one flat tint.

Suggested roles include:

```ts
interface CharacterPalette {
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
```

A module consumes only the roles it needs.

### Weapon

The first lot includes one placeholder weapon module attached through the real weapon slot. This is presentation scaffolding only; it does not introduce firing mechanics or Phase 2 combat.

## 7. Module orientation contract

Each module has a right-facing canonical definition.

Orientation resolution in the first implementation is:

```text
right -> canonical procedural module
left  -> mirrored right module by default
left  -> optional dedicated override for asymmetric modules
back  -> reserved contract slot for future dedicated art
```

The code/data model must make it possible to add a dedicated back variant later without changing the public module interface. **No back-facing geometry, animation or gameplay state is required in this first batch.**

## 8. Character rig

The rig is shared by every appearance.

Keep it small and purpose-driven. Initial anchor vocabulary:

- hips;
- torso;
- neck;
- head;
- shoulderBack;
- shoulderFront;
- elbowBack;
- elbowFront;
- handBack;
- handFront;
- weaponMount;
- accessoryBack;
- accessoryHip;
- accessoryFront.

The rig describes presentation coordinates relative to the player's gameplay origin. It does not own physics.

A module is authored around its own local origin and attached to a named rig anchor. Replacing a module must not require changing animation data.

## 9. Render order

Use a fixed side-profile layer order so modular pieces remain readable:

```text
rear accessories
rear arm
rear leg/body element
torso
front leg/body element
head
front arm
weapon
front accessories
```

Exact sprite depths may be represented numerically, but the semantic order should remain explicit in one place.

## 10. Animation model

Use a **PixelPoseAnimator** or equivalent small presentation component.

An animation consists of timed discrete poses. A pose contains integer offsets and, only where required, a discrete module-frame/variant selection.

No arbitrary continuous angle interpolation is required for the first implementation.

All character appearances consume the same pose library.

### Initial animation set

#### Idle

- 4 poses;
- subtle torso breathing;
- minimal head movement;
- slight arm movement.

#### Run

- 6 poses;
- alternating legs;
- opposing arm motion;
- slight forward body bias;
- playback rate scales with horizontal movement speed.

#### Takeoff

- 1–2 poses;
- short compression then extension.

#### Rising jump

- 2 poses;
- legs slightly tucked.

#### Apex

- 1 short pose.

#### Fall

- 2 poses;
- more open silhouette.

#### Landing

- 2 poses;
- short compression before idle/run resumes.

#### Drop-through

Reuse falling presentation. Do not create a dedicated animation unless later testing proves necessary.

## 11. Upper/lower body preparation

The pose data should distinguish conceptually between lower-body and upper-body channels so later weapon firing can affect the torso/arms without requiring duplicated run cycles.

Do **not** build a generic animation blending framework now.

For the first implementation this separation can remain a simple organization in pose data and rig application. It exists to avoid painting the architecture into a corner before Phase 2.

## 12. Physics and gameplay isolation

The current `Player` physics object remains the source of truth for:

- position;
- velocity;
- grounded/airborne state;
- collisions;
- platform traversal;
- facing direction;
- jump behavior.

The procedural character is presentation attached to that state.

The rendered character must not determine:

- hitbox dimensions;
- collision range;
- platform landing logic;
- movement speed;
- jump height.

Cosmetic overhangs such as masks, tubes, armor and weapons are non-colliding.

## 13. Integration with Player

Refactor `Player` only as much as needed to remove visual responsibilities from the physics/controller class.

Preferred direction:

```text
Player
  - owns Arcade Physics body and movement/control state
  - exposes presentation-relevant state

ProceduralCharacterView
  - owns modular sprites
  - owns appearance
  - owns CharacterRig
  - owns PixelPoseAnimator
  - follows Player position/facing/movement state
```

The current rectangle may remain as an invisible or debug-only physics body if convenient.

The existing `P1` / `P2` labels may remain temporarily for validation, but they are not part of the modular body itself.

## 14. Procedural module generation

Module geometry should be authored through small reusable pixel primitives rather than large monolithic drawing functions.

Useful primitive concepts may include:

- filled pixel rectangles;
- short pixel lines;
- explicit point sets;
- simple integer polygons;
- palette-role lookup;
- optional mirrored output;
- deterministic seeded micro-details.

Avoid building a general-purpose vector graphics engine. Add only primitives required by the initial module library.

Generated textures should be cached by a stable key derived from:

- module id;
- orientation/override;
- palette id;
- relevant seed detail signature where applicable.

## 15. Deterministic character generation

Provide a deterministic appearance builder for future reuse.

Example responsibility:

```ts
buildCharacterAppearance(seed: number): CharacterAppearance
```

For the first visual validation:

- P1 uses one fixed seed/configuration;
- P2 uses a clearly different fixed seed/configuration;
- their silhouettes, head treatment and palette must differ enough to test modularity, not merely recoloring.

The random builder is not a gameplay progression or cosmetics system. It is only a deterministic content composer.

## 16. File boundaries

Follow the repository rule favoring small specialized files. A likely shape is:

```text
src/presentation/character/
  CharacterAppearance.ts
  characterPalettes.ts
  characterModules.ts
  characterModuleBaker.ts
  CharacterRig.ts
  pixelPoses.ts
  PixelPoseAnimator.ts
  ProceduralCharacterView.ts
  deterministicCharacter.ts
```

If module definitions become large, split by category:

```text
modules/
  heads.ts
  torsos.ts
  legs.ts
  arms.ts
  accessories.ts
  weapons.ts
```

Do not create all files mechanically if fewer focused files are sufficient during implementation.

## 17. Testing strategy

Automated tests should cover deterministic and structural behavior, not subjective pixel-art taste.

Testable requirements:

- same seed/configuration produces the same `CharacterAppearance`;
- different fixed P1/P2 seeds produce materially different module selections;
- module identifiers resolve to valid definitions;
- right-to-left mirroring is deterministic;
- asymmetric left override wins over mirroring when supplied;
- the module contract can carry an optional future back definition without current gameplay selecting it;
- every module references valid palette roles;
- pose library contains required initial animations and integer offsets;
- render-layer order is deterministic;
- animation selection follows movement state deterministically;
- visual component does not alter gameplay hitbox configuration.

Do not test subjective claims such as “the respirator looks good” or “the run feels natural.”

## 18. Manual validation requirements

GitHub Pages remains the required visual test bench.

The first deployed character batch requires human validation of:

- characters remain the correct apparent size for the arena;
- P1 and P2 are immediately distinguishable;
- strict side profile is readable in both directions;
- modules look like one coherent body rather than disconnected layers;
- idle and run remain crisp with no anti-aliasing/sub-pixel blur;
- jump/fall/landing poses read correctly;
- respirator/mask/accessory-scale details remain understandable at gameplay zoom;
- weapon and accessories may overhang without making the player feel physically larger;
- platform traversal and jump gameplay are unchanged.

CI green does not complete these visual validation items.

## 19. First implementation scope

The first implementation batch should deliver only enough to prove the architecture:

- procedural module rendering infrastructure;
- shared rig;
- common pose animator;
- initial **4 torso / 5 head / 3 leg / 2 arm / 6 accessory / 5 palette** library;
- one placeholder weapon module;
- deterministic appearance composition;
- two fixed P1/P2 combatants;
- right and mirrored-left gameplay rendering;
- back variant support in the **module contract only**;
- idle, run, takeoff, rise, apex, fall and landing presentation;
- integration into the current Player without changing physics behavior;
- tests, build and GitHub Pages deployment.

## 20. Explicit non-goals

Do not include in this batch:

- firing mechanics;
- weapon damage;
- melee;
- health;
- blood pools;
- character selection UI;
- unlocks/cosmetics/progression;
- online persistence;
- back-facing geometry or gameplay;
- procedural anatomy resizing;
- different hitboxes per appearance;
- smooth skeletal rotation;
- IK;
- generic animation blending framework;
- runtime full-frame procedural redrawing;
- external character art assets.

## 21. Success criteria

The architectural batch is successful when:

1. the placeholder rectangles have been visually replaced by modular procedural fighters while gameplay physics remain unchanged;
2. two characters assembled from the same system visibly read as distinct fighters;
3. all initial body categories can be swapped independently without rewriting animations;
4. one common pose library drives both players;
5. right/left profile behavior works with mirror-by-default and override support;
6. the public module contract already has a place for future back-facing art without requiring back art now;
7. the result stays crisp at native gameplay scale;
8. automated deterministic tests, lint and build pass;
9. GitHub Pages deploys successfully;
10. final visual/game-feel acceptance is performed manually before treating the character presentation as validated.
