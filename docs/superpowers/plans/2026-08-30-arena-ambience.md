# Arena Ambience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the eight approved ambience improvements to the first Blood Relay arena while keeping gameplay unchanged, deterministic, lightweight, and mobile-safe.

**Architecture:** Keep `ArenaBackdropAnimation.ts` as a coordinator. Add focused pure/testable modules for machine lighting, blood-pipe trails, dust, panel ambience, and rare industrial events; extend the existing steam and platform renderers; keep the static relay console in `ProceduralArenaBackdrop.ts`.

**Tech Stack:** TypeScript strict, Phaser 3.90 Graphics/GameObjects, Vitest, existing Vite/ESLint pipeline.

**Spec:** `docs/superpowers/specs/2026-08-30-arena-ambience-design.md`

## Global Constraints

- Do not change gameplay, collision geometry, movement, spawn points, or arena platform layout.
- No new dependencies, shaders, fluid simulation, or physics particles.
- Keep random-looking behavior deterministic.
- Keep additional ambience objects below 100 lightweight objects.
- Do not unit-test subjective game feel/intensity; manual GitHub Pages validation remains required.

---

### Task 1: Steam dissipates before the canvas edge

**Files:**
- Modify: `src/presentation/steamParticles.ts`
- Modify: `src/presentation/steamParticles.test.ts`
- Modify: `src/presentation/ArenaBackdropAnimation.ts`

**Interfaces:**
- `SteamOrigin` gains `outwardDirection: -1 | 1`.
- `sampleSteamParticle(seed, ageMs, outwardDirection)` returns deterministic outward-biased motion.

- [ ] **Step 1: Write failing tests** requiring every seed `riseDistance <= 55`, lifetime under 1000 ms, and mid-life X motion negative for a left vent / positive for a right vent.
- [ ] **Step 2: Run CI/test and verify red** on the current 54–88 px rise behavior.
- [ ] **Step 3: Implement minimal tuning**: rise 35–55 px, lifetime approximately 600–900 ms, outward directional bias plus existing turbulence.
- [ ] **Step 4: Pass `outwardDirection: -1/+1` from the two relay vents in `ArenaBackdropAnimation.ts`.
- [ ] **Step 5: Verify tests/lint/build and commit** `style: tune steam dissipation`.

### Task 2: Platform depth and relay maintenance console

**Files:**
- Modify: `src/presentation/PlatformVisual.ts`
- Modify: `src/presentation/platformTiles.test.ts`
- Modify: `src/presentation/ProceduralArenaBackdrop.ts`

**Interfaces:**
- Export `PLATFORM_SHADOW_CONFIG = { offsetY, nearAlpha, farAlpha }` for objective validation only.

- [ ] **Step 1: Write failing test** asserting platform shadow offset is 6–8 logical px and does not alter tile/collision layout helpers.
- [ ] **Step 2: Verify red** because no shadow config exists.
- [ ] **Step 3: Draw two shallow low-alpha shadow layers before platform metal art** at depth below platform/player art.
- [ ] **Step 4: Replace the long HUD-like relay console** with a shorter maintenance module: metal brackets, grille, screws, three small indicators; remove long red/cyan bars.
- [ ] **Step 5: Verify tests/lint/build and commit** `style: add platform depth and relay console`.

### Task 3: Localized heartbeat lighting and blood-pipe reflections

**Files:**
- Create: `src/presentation/machineLighting.ts`
- Create: `src/presentation/machineLighting.test.ts`
- Create: `src/presentation/bloodPipeEffects.ts`
- Create: `src/presentation/bloodPipeEffects.test.ts`
- Modify: `src/presentation/ArenaBackdropAnimation.ts`

**Interfaces:**
- `buildMachineLightPlacements(machine)` returns a small fixed placement list.
- `getMachineLightAlpha(baseAlpha, heartbeat)` returns localized light alpha.
- `getBloodTrailProgresses(coreProgress, count)` returns delayed rounded-path sample positions behind the core.

- [ ] **Step 1: Write failing tests** for 3–5 localized machine lights and three ordered trail progress samples behind a core at progress 0.5.
- [ ] **Step 2: Verify red** because modules do not exist.
- [ ] **Step 3: Implement machine light system** using one small runtime-generated soft red texture reused by all placements; drive alpha/scale from existing heartbeat intensity; reduce broad outer glow.
- [ ] **Step 4: Implement blood trail helper/system** with three decreasing-alpha/radius samples on the exact rounded path behind each moving blood core.
- [ ] **Step 5: Integrate both systems into `ArenaBackdropAnimation.ts` and update them each frame.
- [ ] **Step 6: Verify tests/lint/build and commit** `style: add relay light and blood reflections`.

### Task 4: Deterministic dust and panel micro-animation

**Files:**
- Create: `src/presentation/arenaDust.ts`
- Create: `src/presentation/arenaDust.test.ts`
- Create: `src/presentation/panelAmbience.ts`
- Create: `src/presentation/panelAmbience.test.ts`
- Modify: `src/presentation/ArenaBackdropAnimation.ts`

**Interfaces:**
- `buildDustSeeds(width, height, count = 16)` returns deterministic dust seeds.
- `sampleDust(seed, time, width, height)` wraps at edges.
- `selectPanelAmbienceTargets(panels, maxTargets = 3)` returns at most three deterministic target panels.

- [ ] **Step 1: Write failing tests** for exactly 16 deterministic dust seeds, wrapped bounds, and <=3 deterministic panel targets.
- [ ] **Step 2: Verify red** because modules do not exist.
- [ ] **Step 3: Implement dust system** with 1–2 px low-alpha particles and slow deterministic wrap motion.
- [ ] **Step 4: Implement panel ambience** with tiny phase-shifted LEDs and/or one thin scan line on no more than three panels.
- [ ] **Step 5: Extend animation layout typing to include wall panels and integrate both systems.
- [ ] **Step 6: Verify tests/lint/build and commit** `style: add dust and panel ambience`.

### Task 5: Rare deterministic industrial events

**Files:**
- Create: `src/presentation/industrialEvents.ts`
- Create: `src/presentation/industrialEvents.test.ts`
- Modify: `src/presentation/ArenaBackdropAnimation.ts`

**Interfaces:**
- `buildIndustrialEventSchedule(seed, count)` returns deterministic events with `type`, `startMs`, `durationMs`.
- Event types: `spark`, `led-glitch`, `steam-leak`.

- [ ] **Step 1: Write failing tests** requiring 7–14 second gaps, deterministic output, one event at a time, and all three event types represented over a long schedule.
- [ ] **Step 2: Verify red** because the module does not exist.
- [ ] **Step 3: Implement a reusable event renderer pool**: short spark lines, one tiny glitch LED, and a tiny secondary steam leak; never create/destroy objects per frame.
- [ ] **Step 4: Integrate event system into `ArenaBackdropAnimation.ts` and update it each frame.
- [ ] **Step 5: Verify tests/lint/build and commit** `style: add rare industrial events`.

### Task 6: Integration verification and publish

**Files:**
- Modify only if required by integration failures: `src/presentation/ArenaBackdropAnimation.ts` and focused ambience modules.

- [ ] **Step 1: Run full `npm run lint`, `npm run test`, `npm run build` through CI.**
- [ ] **Step 2: Fix only demonstrated integration failures; do not widen scope.**
- [ ] **Step 3: Confirm GitHub Pages deploy succeeds.**
- [ ] **Step 4: Leave subjective/manual items open for human validation**: lighting intensity, dust readability, event cadence, console appearance, steam naturalness, desktop/mobile performance.
