# Relay Blood Cycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Center the relay machine and make it visibly collect blood from the six pipes, raise pressure on a physical gauge, trigger a steam-assisted purge, drain the chamber, and return to filling, while replacing invisible dust with luminous rising motes.

**Architecture:** `ArenaBackdropAnimation.ts` remains the coordinator. A focused `relayMachineSystem.ts` owns the visual machine loop and delegates pure deterministic cycle, reservoir physics, and pressure gauge models; `bloodPipeEffects.ts` reports arrivals, `steamParticles.ts` accepts a purge boost, and `glowingMotes.ts` replaces `arenaDust.ts`.

**Tech Stack:** TypeScript strict, Phaser 3.90, deterministic fixed-step simulation, Vitest, existing Vite/ESLint/Pages pipeline.

**Spec:** `docs/superpowers/specs/2026-08-30-relay-blood-cycle-design.md`

## Global Constraints

- Keep arena dimensions 1120×540, player controls, spawn points, movement parameters, and floor unchanged.
- Center the machine at x=560, y=270.
- Replace the single tier-2 center platform with two shorter symmetric tier-2 platforms at the same Y.
- No new dependency, shader, fluid engine, or per-frame object creation.
- Internal blood uses bounded deterministic particles and fixed-step integration; it should look physically plausible, not be a CFD simulation.
- Keep a maximum reservoir capacity of 36 blood units/particles.
- Human validation on GitHub Pages remains mandatory for motion, timing, readability, and visual quality.

---

### Task 1: Centered layout and luminous rising motes

**Files:**
- Modify: `src/config/arena.ts`
- Modify: `src/config/arena.test.ts`
- Modify: `src/presentation/ProceduralArenaBackdrop.ts`
- Modify: `src/presentation/ProceduralArenaBackdrop.test.ts`
- Create: `src/presentation/glowingMotes.ts`
- Create: `src/presentation/glowingMotes.test.ts`
- Modify: `src/presentation/ArenaBackdropAnimation.ts`
- Delete after integration: `src/presentation/arenaDust.ts`
- Delete after integration: `src/presentation/arenaDust.test.ts`

**Interfaces:**
- `buildGlowingMoteSeeds(width, height, count = 16)` returns deterministic mote seeds.
- `sampleGlowingMote(seed, timeMs, width, height)` returns position/alpha/scale with upward travel and twinkle.

- [x] Write failing layout tests requiring the relay machine center to be `(560, 270)` and exactly two tier-2 platforms symmetric around x=560, with neither intersecting the machine chamber horizontal footprint.
- [x] Write failing mote tests requiring exactly 16 deterministic seeds, negative vertical velocity, visible alpha peaks, twinkling over time, and respawn/wrap from bottom after disappearing at the top.
- [x] Verify the new tests fail for the existing y≈142 machine, single tier-2 platform, and old dust system.
- [x] Update the machine layout to y=270 and split tier 2 into two symmetric shorter platforms at the existing tier-2 Y.
- [x] Implement `glowingMotes.ts` with a small runtime-generated glow texture, upward motion, mild horizontal wander, deterministic twinkle, and fade-in/fade-out.
- [x] Replace `createArenaDustSystem` with `createGlowingMoteSystem` in `ArenaBackdropAnimation.ts`, then delete the old dust files.
- [x] Verify tests/lint/build and commit.

### Task 2: Relay cycle and physical gauge model

**Files:**
- Create: `src/presentation/relayMachineCycle.ts`
- Create: `src/presentation/relayMachineCycle.test.ts`
- Create: `src/presentation/relayPressureGauge.ts`
- Create: `src/presentation/relayPressureGauge.test.ts`

**Interfaces:**
- `RelayMachinePhase = 'filling' | 'pressurizing' | 'purging' | 'cooldown'`.
- `createRelayMachineCycle()` returns mutable deterministic state with `phase`, `fill`, `pressure`, `phaseTimeMs`.
- `stepRelayMachineCycle(state, dtMs, arrivals)` advances the state; threshold begins near 0.88 fill, pressurizing lasts about 800 ms, purge drains toward zero over about 1200 ms, cooldown lasts about 1200–1800 ms.
- `stepGaugeNeedle(state, target, dtSeconds)` implements a spring/damper needle with bounded normalized position and velocity.

- [x] Write failing tests for filling from arrivals, phase transitions in order, no purge before threshold, purge decreasing fill, and cooldown preventing immediate re-trigger.
- [x] Write failing gauge tests requiring the needle to lag target pressure, remain bounded, and settle after overshoot.
- [x] Verify red.
- [x] Implement the minimal pure state machine and gauge integrator.
- [x] Verify tests and commit.

### Task 3: Fixed-step blood reservoir physics

**Files:**
- Create: `src/presentation/relayBloodReservoir.ts`
- Create: `src/presentation/relayBloodReservoir.test.ts`

**Interfaces:**
- `RelayBloodParticle` stores local `x`, `y`, `vx`, `vy`, `active`, `age`.
- `createReservoirState(capacity = 36)` preallocates a bounded pool.
- `injectReservoirParticle(state, entryPoint, entryVelocity)` activates one free particle and returns success/failure.
- `stepReservoir(state, dtSeconds, options)` applies gravity, damping/viscosity, weak tangential swirl, wall collision with restitution, and purge suction toward the center.
- `getReservoirFill(state)` returns active/capacity.

- [x] Write failing tests requiring capacity ≤36, deterministic injection, particles remaining inside the chamber radius, gravity changing velocity, wall collisions remaining bounded, and purge suction reducing particle radius from center.
- [x] Verify red.
- [x] Implement fixed-step integration and simple pairwise soft separation for active particles only.
- [x] Verify tests and commit.

### Task 4: Pipe arrivals, dynamic chamber, gauge needle, and purge steam

**Files:**
- Modify: `src/presentation/bloodPipeEffects.ts`
- Modify: `src/presentation/bloodPipeEffects.test.ts`
- Modify: `src/presentation/steamParticles.ts`
- Modify: `src/presentation/steamParticles.test.ts`
- Create: `src/presentation/relayMachineSystem.ts`
- Create: `src/presentation/relayMachineSystem.test.ts`
- Modify: `src/presentation/ProceduralArenaBackdrop.ts`
- Modify: `src/presentation/ArenaBackdropAnimation.ts`

**Interfaces:**
- `BloodPipeEffect.update(progress, shimmer): { arrived: boolean; entryPoint?: {x,y}; entryVelocity?: {x,y} }` reports a wrap from near 1 back to near 0 exactly once per pass.
- `SteamParticleSystem.update(time, pressureBoost = 0)` scales opacity, outward displacement, and particle scale during purge without allocating new objects.
- `createRelayMachineSystem(scene, container, machine)` owns reservoir sprites, dynamic glass contents, dynamic gauge needle, machine cycle, and purge visuals.
- `relayMachineSystem.acceptBlood(entryPoint, entryVelocity)` injects arrivals.
- `relayMachineSystem.update(time, dtMs)` advances the fixed-step simulation and exposes current pressure/purge boost for lighting/steam.

- [x] Write failing blood-pipe tests for exactly-one arrival notification per completed pass.
- [x] Write failing steam tests requiring pressure boost 1 to produce stronger/larger/outward samples than boost 0 while leaving normal mode unchanged.
- [x] Write failing relay-machine integration tests for arrivals increasing fill, gauge target following pressure, and purge eventually reducing fill.
- [x] Verify red.
- [x] Change the static chamber in `ProceduralArenaBackdrop.ts` from pre-filled red to a dark glass reservoir shell; keep fixed dial body but remove its static needle.
- [x] Implement dynamic bounded reservoir sprites inside the physically constrained circular chamber, with up to 36 preallocated small blood particles.
- [x] Implement the gauge needle as a Phaser object driven by the pure spring model.
- [x] Connect pipe arrivals to reservoir injection and cycle fill.
- [x] During purge, increase swirl/suction, drain particles near the central outlet, brighten machine lighting, and pass `pressureBoost` to the existing steam system.
- [x] Verify tests/lint/build and commit.

### Task 5: Integration verification and publish

**Files:**
- Modify only demonstrated integration failures.
- Update: `docs/superpowers/plans/2026-08-30-relay-blood-cycle.md`

- [x] Run full CI (`lint`, all Vitest tests, TypeScript/Vite build).
- [x] Confirm GitHub Pages deployment succeeds.
- [x] Mark technical steps complete in this plan.
- [x] Leave manual visual validation open.

### Manual visual validation

- [ ] Machine composition centered at `(560, 270)` feels balanced.
- [ ] Split tier-2 platforms leave the relay unobstructed and remain playable.
- [ ] Luminous motes are visible, float upward naturally, and scintillate without distracting.
- [ ] Blood visibly enters from all six pipes and accumulates naturally in the chamber.
- [ ] Stored blood motion feels physically plausible: gravity, inertia, collisions, swirl, and separation.
- [ ] Gauge needle rises with pressure, has believable inertia, and reaches the danger zone before purge.
- [ ] Purge timing reads clearly: pressure peak → stronger steam → vortex/suction → chamber drains.
- [ ] Steam boost during purge is noticeable without obscuring gameplay.
- [ ] Full cycle restarts cleanly after cooldown.
- [ ] Desktop and mobile remain smooth and readable.
