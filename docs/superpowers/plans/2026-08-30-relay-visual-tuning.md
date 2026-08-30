# Relay Visual Tuning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tune the relay machine visuals and purge cycle to match the approved direction: warmer motes, higher machine, denser chamber, multi-turn vortex, longer stronger purge, and a more visible beating heart.

**Architecture:** Preserve existing presentation modules and pure deterministic simulation boundaries. Add only parameter/config helpers needed for objective tests; visual quality remains human-validated.

**Tech Stack:** TypeScript strict, Phaser 3.90, Vitest, deterministic fixed-step simulation, Vite/ESLint/GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-08-30-relay-visual-tuning-design.md`

## Global Constraints

- Keep arena dimensions and gameplay unchanged.
- Keep machine x=560, radius=110; set y=228.
- Keep split tier-2 platform center gap.
- No new dependency or shader.
- Reservoir remains bounded/deterministic.
- Manual visual validation remains required.

---

### Task 1: Warm motes and machine position

**Files:**
- Modify: `src/presentation/glowingMotes.ts`
- Modify: `src/presentation/glowingMotes.test.ts`
- Modify: `src/presentation/ProceduralArenaBackdrop.ts`
- Modify: `src/presentation/ProceduralArenaBackdrop.test.ts`

- [ ] Add failing tests for warm yellow/cream mote palette and machine y=228.
- [ ] Verify red.
- [ ] Implement palette and machine position.
- [ ] Verify green and commit.

### Task 2: Double-capacity reservoir and delayed-suction vortex

**Files:**
- Modify: `src/presentation/relayMachineCycle.ts`
- Modify: `src/presentation/relayMachineCycle.test.ts`
- Modify: `src/presentation/relayBloodReservoir.ts`
- Modify: `src/presentation/relayBloodReservoir.test.ts`
- Modify: `src/presentation/relayMachineSystem.ts`
- Modify: `src/presentation/relayMachineSystem.test.ts`

- [ ] Add failing tests for capacity 72, 1000 ms pressurization, 2400 ms purge, and early-vs-late purge force profile.
- [ ] Verify red.
- [ ] Implement capacity/timing and two-stage vortex force profile.
- [ ] Add visual fade toward drain during late purge without affecting simulation determinism.
- [ ] Verify green and commit.

### Task 3: Stronger longer steam purge and visible heart

**Files:**
- Modify: `src/presentation/steamParticles.ts`
- Modify: `src/presentation/steamParticles.test.ts`
- Modify: `src/presentation/ArenaBackdropAnimation.ts`
- Modify: `src/presentation/ArenaBackdropAnimation.test.ts`

- [ ] Add failing tests for stronger purge steam response and stronger heart visual parameters.
- [ ] Verify red.
- [ ] Strengthen purge steam scale/alpha/rise/outward displacement.
- [ ] Increase heart core size/rest alpha/pulse alpha/pulse scale and lighting response.
- [ ] Verify green and commit.

### Task 4: Full verification and publish

- [ ] Run full CI lint/test/build.
- [ ] Confirm GitHub Pages deploy succeeds.
- [ ] Mark technical tasks complete.
- [ ] Leave visual validation open for motes, machine position, chamber density, vortex turns, steam purge, heart readability, and mobile performance.
