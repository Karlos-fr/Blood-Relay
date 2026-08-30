# Relay Visual Tuning Design

## Goal

Refine the newly implemented relay cycle so the machine becomes more readable and dramatic: warm yellow floating motes, a slightly higher machine position, a chamber that holds at least twice as much blood, a multi-turn purge vortex, a longer/more impressive steam purge, and a much more visible beating red heart.

## Approved visual changes

- Move the relay machine from `y=270` to `y=228` while keeping `x=560` and `radius=110`.
- Keep the split tier-2 platforms and their current Y; the center remains clear in front of the machine.
- Change floating mote texture colors from cool white/blue to warm yellow / pale yellow / cream while keeping the same upward, wandering, twinkling behavior.
- Increase reservoir capacity from 36 to 72 particles and reduce particle radius enough to preserve stable bounded motion.
- Let the chamber visibly become much denser before triggering pressure.
- Keep the purge threshold near 88% fill.
- Extend pressurizing to about 1000 ms and purging to about 2400 ms; cooldown around 1600 ms.
- During the first part of purge, prioritize strong tangential swirl with weak radial suction so particles complete more than one visible turn.
- During the second part of purge, ramp radial suction strongly, fade particles as they converge, then deactivate them at the drain.
- Make the steam purge longer and stronger by increasing the purge boost envelope, outward displacement, rise, scale, opacity, and visual persistence while preserving the existing procedural texture pool.
- Strengthen the red heart: larger core, higher resting alpha, much brighter pulse, stronger pulse scale, and stronger nearby lighting response. The heartbeat remains visually distinct from purge boost.

## Architecture

Keep the current module boundaries. Changes stay focused in:

- `glowingMotes.ts`
- `ProceduralArenaBackdrop.ts`
- `relayMachineCycle.ts`
- `relayBloodReservoir.ts`
- `relayMachineSystem.ts`
- `steamParticles.ts`
- `ArenaBackdropAnimation.ts`

No new dependency and no shader is required.

## Objective tests

Automated tests cover:

- machine Y = 228;
- mote palette uses warm yellow/cream colors;
- relay capacity = 72;
- purge duration = 2400 ms and pressurize duration = 1000 ms;
- early purge swirl is strong while suction is intentionally delayed;
- late purge suction exceeds early purge suction;
- purge steam boost produces larger/brighter/farther particles than normal mode;
- heart visual parameters have stronger resting and peak visibility.

Subjective validation remains manual on GitHub Pages for density, vortex readability, perceived number of turns, purge spectacle, heart visibility, and mobile smoothness.
