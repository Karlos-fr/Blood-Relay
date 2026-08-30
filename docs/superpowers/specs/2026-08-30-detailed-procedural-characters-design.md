# Blood Relay — Detailed Procedural Characters Design

Date: 2026-08-30
Status: Approved in chat, pending written-spec review

## 1. Goal

Replace the current small, disconnected modular fighters with more realistic and detailed pixel-art characters while preserving deterministic procedural generation and modular appearance composition.

The redesign must correct three visible weaknesses of the current system:

- anatomy that is too abstract or poorly proportioned;
- body pieces that appear detached from one another;
- movement that reads as mechanical rather than anatomical.

This work changes character presentation and the shared player footprint. It does not introduce combat, damage, blood collection, transfusion, death, or respawn gameplay.

## 2. Approved Product Decisions

- Use detailed, more realistic pixel art.
- Use a shared `32 × 48` logical-pixel gameplay hitbox for every fighter.
- Use a fixed `48 × 56` visual canvas around the `32 × 48` body for non-colliding weapons, bags, tubes, armor, and mutations.
- Use a subtle three-quarter side view while gameplay remains strictly two-dimensional.
- Preserve procedural and modular character generation.
- Support clone-prisoner, industrial mercenary, and laboratory mutant visual families.
- Keep every family mechanically equivalent.
- Replace runtime multi-sprite assembly with complete procedural frames baked into cached textures.
- Prepare future combat and interaction animations without activating their gameplay systems.
- Preserve deterministic output for a given appearance, pose, frame, orientation, and seed.

## 3. Visual Target

The new fighter uses a human, combat-ready silhouette within the shared `32 × 48` gameplay footprint.

Target proportions:

- head 8 or 9 pixels high according to the selected head module;
- a short but visible neck;
- shoulders wider than the pelvis;
- a continuous torso-to-hip connection;
- distinct upper arms, forearms, hands, thighs, knees, calves, and feet;
- a slightly flexed stance rather than a rigid vertical posture;
- feet aligned precisely with the physical body's bottom contact point.

The canonical pose faces right in a subtle three-quarter profile. The body must show enough frontal volume to make the face, chest, arms, and leg separation readable while retaining the clarity of a side-view action game.

The body occupies the central `32 × 48` region of a fixed `48 × 56` texture canvas. This reserves eight pixels of non-colliding space on each horizontal side and four pixels above and below the body region. The frame origin aligns the body's bottom center with the Arcade Physics body's bottom center; visible foot pixels may not extend below that contact line.

Pixel-art rules:

- integer coordinates only;
- no anti-aliasing or filtered scaling;
- coherent dark outlines;
- one principal light direction;
- controlled shadow, midtone, highlight, and accent roles;
- no arbitrary smooth limb rotations;
- silhouette and anatomy take priority over surface detail.

## 4. Architectural Approach

The rendering pipeline is:

```text
appearance + anatomical pose + frame + facing
  -> procedural layered composition
  -> complete baked texture
  -> cached texture key
  -> one runtime sprite
```

The existing approach moves several independent body sprites around rig anchors at runtime. The new approach composes every animation frame as one connected image before gameplay rendering.

`ProceduralCharacterView` owns one active Phaser image. It asks the animation state for a frame identifier, resolves a cached complete texture, and swaps the image texture. It no longer positions independent limbs and accessories each update.

The right-facing frame is canonical. Left-facing frames are generated during baking by mirroring the canonical composition, with a dedicated left override available for truly asymmetric equipment.

## 5. Connected Anatomical Base

Every frame begins with a connected anatomical underlayer. This underlayer is technical construction geometry and is never intended to appear as an unclothed fighter.

It provides:

- continuous neck, shoulder, torso, pelvis, arm, and leg connections;
- joint overlap at shoulders, elbows, hips, knees, and wrists;
- stable attachment regions for clothing and equipment;
- an anatomical fallback beneath torn fabric or partial armor;
- a guarantee that modular overlays cannot reveal empty gaps between pieces.

Pose data describes meaningful anatomical points such as head, neck, shoulders, elbows, hands, pelvis, knees, and feet. The frame composer reconstructs connected pixel geometry from those points before applying appearance modules.

## 6. Modular Appearance System

The public `CharacterAppearance` concept remains serializable and deterministic. The module catalog is organized by visual responsibility:

- anatomical body variation;
- heads and faces;
- torsos and clothing;
- arms, gloves, and hand treatment;
- legs and footwear;
- armor;
- mutations;
- weapons;
- accessories.

Modules draw into named anatomical regions rather than owning free-floating runtime sprites. Each module receives the resolved pose geometry, palette roles, facing, and deterministic seed details required for its layer.

The layer order is explicit and semantic. A representative order is:

```text
rear accessories
rear weapon elements
rear arm and rear leg overlays
connected anatomical base
torso and pelvis clothing
front leg overlays
head and face
front arm and hands
weapon foreground
front accessories and effects
```

Occlusion masks and intentional overlap prevent seams. Modules must not erase load-bearing anatomical connections unless they replace them with equally connected visible geometry.

## 7. Visual Families

All families use the same anatomy, hitbox, movement, and gameplay capabilities.

### Clone-prisoner

- worn fabrics and incomplete uniforms;
- exposed skin and medical interfaces;
- blood bags, tubing, restraint marks, masks, and implants;
- a vulnerable but combat-ready silhouette.

### Industrial mercenary

- armor plates layered over the same body;
- reinforced gloves, boots, belts, and harnesses;
- industrial respirators and equipment packs;
- apparent mass created visually without changing collision geometry.

### Laboratory mutant

- localized anatomical deformation;
- altered skin, scars, growths, asymmetric implants, or enlarged visual extremities;
- stable joints and the same gameplay footprint;
- mutations that remain readable at gameplay scale and never obscure the core pose.

Appearances may mix modules from all three families. Family labels organize art direction but do not impose exclusive presets.

## 8. Palette Model

Palettes use semantic roles rather than a global tint. Required roles include:

- outline;
- deep shadow;
- skin shadow, skin, and skin highlight;
- cloth shadow, cloth, and cloth highlight;
- metal shadow, metal, and metal highlight;
- mutation shadow and mutation flesh;
- blood;
- emissive or diagnostic accent.

Modules consume only the roles they require. This keeps material identity readable and allows deterministic recoloring without flattening the character into one hue.

## 9. Animation Model

Animation uses complete anatomical keyframes. Pose definitions move connected body landmarks; they do not reposition detached texture pieces.

Runtime interpolation must never produce filtered or subpixel visuals. Timing may advance according to movement speed, but the displayed result is always one discrete baked pixel-art frame.

### Immediately playable animations

- `idle`: 6 frames with breathing and subtle weight transfer;
- `run`: 8 frames covering contact, passing, push, and suspension;
- `takeoff`: 2 frames;
- `rise`: 2 frames;
- `apex`: 1 frame;
- `fall`: 2 frames;
- `landing`: 3 frames with compression and recovery.

### Future-phase animations prepared now

- `shoot`: 4 frames with anticipation and recoil;
- `melee`: 6 frames;
- `hurt`: 3 frames;
- `transfuse`: 6 frames;
- `death`: 8 frames;
- `respawn`: 6 frames.

Future animations are present in the pose catalog and can be previewed, tested, and baked. They are not connected to unavailable gameplay actions.

Flexible accessories such as tubes, bags, and straps may define small per-frame variants so they follow the motion rather than remaining rigid.

## 10. Texture Baking and Cache

Complete textures are generated lazily. The stable cache key includes:

- appearance signature;
- palette;
- seed-dependent detail signature;
- animation name;
- frame index;
- facing or asymmetric override.

No texture, large geometry array, or Phaser object is created per gameplay frame. Once baked, a texture is reused by every matching fighter configuration.

Only requested animations are baked. The presence of future animation definitions does not force all future textures to be generated during normal arena startup.

## 11. Player and Physics Integration

Both players use the same `32 × 48` Arcade Physics body. The larger body is a deliberate gameplay-footprint change approved with this design.

The visual origin is aligned to the physical body's bottom center. Non-colliding visual overhang is allowed outside the body for equipment and mutations, but all families retain identical collision dimensions.

Existing movement constants remain unchanged initially. They may change only when an objective traversal check proves the new footprint makes a required route impossible. Subjective movement and jump tuning remain human-validated.

The integration must verify:

- spawn positions;
- world-bound collision;
- player-to-player collision;
- floor contact;
- one-way platform landing;
- platform drop-through;
- clearance beneath and between platforms;
- access to all platform tiers;
- top-of-arena clearance during a complete jump.

## 12. Character Preview Mode

Add a character preview mode activated by the explicit `?character-preview=1` URL query parameter. Without that parameter, startup follows the normal arena flow.

The preview must:

- display representative clone, mercenary, mutant, and mixed configurations;
- allow every current and future animation to be selected;
- show right- and left-facing output;
- make the `32 × 48` hitbox visible on demand;
- identify the appearance seed and selected animation;
- provide simple on-screen controls for appearance, animation, facing, playback, and hitbox visibility so the preview works on desktop and touch devices;
- remain separate from combat gameplay.

The mode is a validation surface, not a character-selection menu or production UI.

## 13. Validation and Error Handling

The module and animation catalogs are closed, typed data controlled by the repository. Missing required modules, invalid animation frame references, duplicate cache keys, or invalid geometry are development errors and should fail tests or fail fast during development rather than silently substituting unrelated art.

Automated tests cover objective behavior:

- every module identifier resolves;
- every declared animation has the required frame count;
- complete frames are deterministic;
- identical inputs produce identical cache keys and geometry;
- left-facing generation mirrors correctly unless an override exists;
- required body regions remain connected;
- visible body geometry stays within the allowed frame canvas;
- foot contact aligns with the hitbox bottom;
- every family uses the same `32 × 48` hitbox;
- future animations can be resolved without activating future gameplay;
- preview selection resolves every animation and representative appearance;
- arena traversal constraints remain valid after the footprint change.

Repository completion checks remain:

```text
npm run lint
npm run test
npm run build
```

Human validation is mandatory for:

- anatomical quality and proportions;
- absence of visible detached pieces;
- animation naturalness;
- readability of all three visual families;
- distinction between representative fighters;
- weapon and accessory attachment;
- appearance at normal gameplay scale;
- arena traversal and collision feel;
- desktop and mobile readability and performance.

## 14. Scope Boundaries

This design does not add:

- firing or projectile behavior;
- melee collision or damage;
- health, death, or respawn state;
- blood collection or transfusion gameplay;
- gameplay differences between visual families;
- a production character-selection interface;
- arbitrary skeletal interpolation;
- external sprite assets or new runtime dependencies.

The future animation catalog is preparation only. Phase 2 and later gameplay remain governed by `PLAN.md` and its human validation gates.

## 15. Success Criteria

- Fighters read as detailed, proportioned human silhouettes at normal gameplay scale.
- No body part appears detached during any current animation.
- Idle, running, jumping, falling, and landing motion reads as anatomical rather than mechanical.
- Clone, mercenary, mutant, and mixed appearances remain procedurally composable.
- Every fighter uses the same `32 × 48` hitbox and remains mechanically equivalent.
- Runtime rendering uses one active character sprite and cached complete textures.
- Future combat and interaction animations are previewable without introducing their gameplay systems.
- All automated checks pass, and the deployed result remains pending until explicit human visual and gameplay validation.
