# Detailed Procedural Characters — Final Fix Report

Date: 2026-08-31  
Base SHA: `268292a71912fbc9e955fe393793848274b4b3fb`

## Commits

- `09beec3fa8ff8dbfd4284e37890553296ba079e6` — `fix: address procedural character final review`
- The report itself is committed separately; its exact containing SHA is supplied in the final handoff because a Git commit cannot embed its own final hash.

## Findings addressed

### Important

1. `PixelPoseAnimator` now maintains accumulated animation time. Each update advances that clock by `deltaTime * clampedRate`; animation changes reset it to zero. Run playback is behavior-tested at the lower `0.65`, base `1`, and upper `1.35` rates, and slowdown/acceleration tests prove that changing velocity neither rewinds nor jumps the run phase.
2. Landing no longer uses the stale `140 ms` constant. Transient completion is derived from the authored catalog duration, so all `60 + 70 + 70 = 200 ms` landing intervals display. Tests cover all frame boundaries and the exact transition to both idle and run at `200 ms`.
3. `bakeCharacterFrame` performs the catalog's O(1) frame lookup before building or consulting the texture cache key. An invalid preseeded cache request now throws the exact `Invalid idle frame index 99.` error and never calls `textures.exists`.

### Minor

- Added relative landmark assertions for takeoff compression/extension and opposing run contact/passing phases.
- Expanded arena geometry coverage for spawn bottoms (arena and floor bounds), full fighter-height clearance between adjacent platform tiers, and horizontal overlap continuity between successive tiers.
- Corrected stale `PLAN.md` wording: movement constants and controls remain unchanged, while the old hitbox milestone is explicitly superseded by the approved `32 × 48` footprint. All human validation gates remain unchecked.

## Deferred findings

- The 957-line `anatomicalAnimations.ts` catalog was not split. This pass fixes runtime correctness and adds focused catalog behavior coverage; restructuring a large authored data catalog in the single final-review wave would add merge and transcription risk without changing behavior.
- A full `CharacterPreviewScene` restart integration test was not added. Constructing the scene outside Phaser would require broad, brittle stubs for scene systems, factories, textures, input, timing, cameras, scale, and lifecycle events. Existing focused coverage already verifies viewport listener cleanup on shutdown, while `CharacterPreviewScene.init()` resets all scene-owned arrays, references, state, and timing. Runtime restart remains part of human validation.

## Commands and results

### Baseline

- `npm install --no-audit --no-fund --no-package-lock; npm run test`
  - PASS; dependencies already up to date.
  - Vitest: 38 files passed, 156 tests passed.

### TDD red/green evidence

- `npm run test -- src/presentation/character/PixelPoseAnimator.test.ts`
  - RED: 3 expected failures: velocity slowdown rewound from frame 1 to 0, acceleration jumped from frame 0 to 1, and landing exited before frame 2 completed.
  - GREEN after implementation: 1 file passed, 9 tests passed.
- `npm run test -- src/presentation/character/rendering/characterFrameBaker.test.ts`
  - RED: the invalid preseeded-cache request did not throw.
  - GREEN after implementation: 1 file passed, 5 tests passed.
- `npm run test -- src/presentation/character/anatomy/anatomicalAnimations.test.ts src/config/arena.test.ts`
  - PASS: 2 files passed, 25 tests passed.
- `npm run test -- src/presentation/character/PixelPoseAnimator.test.ts src/presentation/character/rendering/characterFrameBaker.test.ts src/presentation/character/anatomy/anatomicalAnimations.test.ts src/config/arena.test.ts`
  - PASS: 4 files passed, 39 tests passed.

### Formatting and full quality gate

- `npx prettier --write PLAN.md src/config/arena.test.ts src/presentation/character/PixelPoseAnimator.ts src/presentation/character/PixelPoseAnimator.test.ts src/presentation/character/anatomy/anatomicalAnimations.test.ts src/presentation/character/rendering/characterFrameBaker.ts src/presentation/character/rendering/characterFrameBaker.test.ts`
  - PASS; formatting was scoped to wave files.
- `npm run format:check`
  - FAIL on the repository baseline: Prettier reported 91 pre-existing unformatted files, mostly untouched configs, plans, historical SDD documents, and gameplay/presentation sources. No unrelated files were reformatted.
- `npx prettier --check PLAN.md src/config/arena.test.ts src/presentation/character/PixelPoseAnimator.ts src/presentation/character/PixelPoseAnimator.test.ts src/presentation/character/anatomy/anatomicalAnimations.test.ts src/presentation/character/rendering/characterFrameBaker.ts src/presentation/character/rendering/characterFrameBaker.test.ts`
  - PASS: all scoped files match Prettier style.
- `npm run lint`
  - PASS, exit 0.
- `npm run test`
  - PASS: 38 files passed, 167 tests passed.
- `npm run build`
  - PASS: TypeScript and Vite completed; 64 modules transformed.
  - Output: `dist/index.html` 1.01 kB (0.45 kB gzip), CSS 3.44 kB (1.32 kB gzip), JS 1,281.58 kB (345.33 kB gzip).
  - Vite emitted its non-failing chunk-size warning for the main JavaScript bundle.

## Remaining validation

- No visual, gameplay, collision-feel, desktop/mobile readability, or prepared-future-pose human gate was checked.
- GitHub Pages deployment and deployed-route inspection were not part of this local final fix wave.
- Repository-wide Prettier cleanup remains separate work outside this review scope.
