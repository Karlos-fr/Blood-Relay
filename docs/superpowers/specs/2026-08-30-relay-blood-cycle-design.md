# Relay Blood Cycle Design

## Goal

Turn the central Blood Relay machine into a visible deterministic process: blood particles arriving through the six pipes enter and accumulate inside a physical-looking reservoir, pressure rises on a moving mechanical gauge, the machine reaches a threshold, performs a steam-assisted purge, drains the stored blood, then returns to filling. At the same time, center the machine vertically, clear the platform in front of it, and replace the nearly invisible dust with luminous rising motes.

## Constraints

- Keep player movement, collisions, controls, spawn points, and overall arena dimensions unchanged.
- Keep the arena fully procedural; no external art asset or new dependency is required.
- The internal blood motion must be physically plausible rather than a canned circular animation, but it is not a full fluid/CFD simulation.
- Use deterministic fixed-step simulation and bounded object pools so desktop and mobile remain stable.
- Keep the presentation subordinate to gameplay readability.
- Reuse the existing steam system and blood-pipe path geometry where possible.
- Keep `ArenaBackdropAnimation.ts` as an orchestrator, not a simulation monolith.
- Human/visual validation remains required after deployment.

## Architecture

`ArenaBackdropAnimation.ts` will coordinate background ambience and one new `relayMachineSystem.ts`. The relay system owns the filling/pressure/purge loop and delegates focused responsibilities:

- `glowingMotes.ts`: luminous rising motes replacing `arenaDust.ts`.
- `relayMachineCycle.ts`: pure deterministic state machine and fill/pressure/purge timing.
- `relayBloodReservoir.ts`: fixed-step particle simulation inside the circular chamber.
- `relayPressureGauge.ts`: spring/damper gauge needle model.
- `relayMachineSystem.ts`: Phaser objects and integration between pipe arrivals, reservoir, gauge, machine lighting, and steam boost.
- `steamParticles.ts`: extended to accept a pressure/purge boost.
- `bloodPipeEffects.ts`: extended to expose pipe-arrival events instead of only looping visually.

`ProceduralArenaBackdrop.ts` remains responsible for static machine body, glass chamber shell, gauge dial, pipe drawing, panels, and maintenance module. Dynamic blood and the gauge needle move to the relay machine system.

## 1. Replace Ambient Dust with Luminous Rising Motes

The existing `arenaDust.ts` is removed from the animation path and deleted once no code imports it.

The replacement uses 16 deterministic particles. Each mote:

- uses a tiny runtime-generated soft glow texture;
- rises slowly upward rather than drifting randomly in all directions;
- has a small deterministic horizontal drift and mild sinusoidal wander;
- slightly scintillates using two phase-shifted sinusoidal terms so brightness does not pulse mechanically;
- fades in after spawn and fades out before reaching the top;
- respawns lower in the arena after its lifetime using deterministic phase/offset rather than object recreation;
- remains brighter and more visible than the old dust but visually small enough not to look like fireflies.

The system preallocates all sprites and never creates/destroys motes per frame.

## 2. Center the Relay Machine and Clear Its Foreground

Arena remains 1120×540. The relay machine moves to the logical center:

- `machine.x = 560`
- `machine.y = 270`
- radius remains 110 unless visual validation later shows a size issue.

This gives both top steam vents enough room to emit naturally.

The current single tier-2 center platform is replaced by two shorter symmetric tier-2 platforms at the same Y as today. Their inner edges must stay outside the machine silhouette plus a visual clearance margin.

Recommended base-layout positions before `ARENA_CONTENT_SCALE`:

- left tier 2 center near base x=330
- right tier 2 center near base x=630
- each approximately 120–140 base px wide, constrained to widths compatible with the symmetric procedural platform renderer.

Tier 1 and tier 3 stay at their current heights and positions unless a mechanical overlap test proves a minimal adjustment is required.

No platform may cross the relay chamber or maintenance module in screen space.

## 3. Blood Pipe Arrival Becomes an Event

Current blood particles visually loop from the pipe end back to the beginning. Instead, each pipe effect tracks cycle crossings.

When a particle reaches the end of its rounded path:

1. an arrival event is emitted once for that cycle with the pipe index and the final port position/direction;
2. the visible pipe particle disappears/restarts from the beginning of the same pipe on the next cycle;
3. `relayMachineSystem` injects one unit of blood into the reservoir at the corresponding port;
4. reservoir fill count/pressure increases.

All six pipes continue flowing independently with existing phase offsets.

Arrival detection must be robust to frame time jumps: a cycle crossing is counted once, never missed or double-counted when time advances across progress 1→0.

## 4. Blood Reservoir: Physically Plausible Particle Simulation

The current static red-filled chamber is redrawn as a dark glass reservoir. Dynamic blood particles are rendered above the dark chamber interior and clipped to the circular inner reservoir.

Capacity target: 36 blood units/particles.

Each particle stores:

- position `(x, y)` relative to reservoir center;
- velocity `(vx, vy)`;
- radius/mass variant;
- active state;
- deterministic small material variation.

Simulation uses a fixed time step (target 1/60 s; capped catch-up steps per frame) so behavior is deterministic enough across variable render frame times.

Forces:

- downward gravity;
- viscous damping;
- weak tangential swirl generated by the machine rotor, increasing with pressure and during purge;
- inlet impulse aligned with the direction from the pipe port into the chamber;
- during purge only, a centripetal/drain force toward the drain center.

Boundary behavior:

- particles are constrained inside the circular reservoir radius;
- on wall contact, normal velocity reflects with low restitution and tangential damping;
- particles have lightweight pairwise separation/repulsion so they do not occupy exactly the same point;
- no particle may render outside the chamber mask.

This is deliberately a particle-based approximation: believable inertia, gravity, collision and swirling, without pretending to simulate continuous fluid.

## 5. Relay State Machine

Pure `relayMachineCycle.ts` states:

- `FILLING`
- `PRESSURIZING`
- `PURGING`
- `COOLDOWN`

Suggested initial constants:

- capacity: 36 units
- pressurize threshold: 31 units (~86%)
- `PRESSURIZING`: ~800 ms
- `PURGING`: ~1200 ms
- `COOLDOWN`: ~1400 ms

Behavior:

### FILLING

Pipe arrivals activate reservoir particles until threshold. Pressure follows fill ratio with a small dynamic contribution from incoming flow.

### PRESSURIZING

New arrivals can still visually reach the machine but reservoir acceptance is capped at capacity. Rotor/swirl strength and localized red lighting intensify. Gauge approaches the red zone.

### PURGING

The machine performs the main event:

- both normal steam vents receive a strong pressure boost;
- localized machine light briefly pulses brighter;
- reservoir particles are pulled toward the central drain with increasing swirl;
- particles deactivate/disappear when they reach the drain radius;
- fill/pressure visibly drops as actual particles drain;
- gauge needle follows the falling pressure rather than snapping down.

The purge completes when the reservoir is empty or the purge maximum duration elapses and residual particles are force-completed safely.

### COOLDOWN

Steam boost returns to zero, swirl relaxes, needle settles near baseline, then the state returns to `FILLING`.

The loop repeats indefinitely.

## 6. Pressure Gauge

The existing static gauge face remains in `ProceduralArenaBackdrop.ts`, but the static needle is removed.

`relayPressureGauge.ts` models an analog needle with a spring/damper response:

- pressure target normalized 0..1;
- angle maps from low-pressure start angle to red-zone maximum angle;
- angular velocity provides inertia;
- spring pulls angle toward the target;
- damping prevents endless oscillation;
- at high pressure, a very small deterministic vibration may be added visually, but the physical needle state remains stable.

This allows arrivals and purge to move the needle naturally with slight overshoot rather than direct interpolation.

The moving needle and center cap are rendered by `relayMachineSystem.ts` above the static gauge dial.

## 7. Steam Integration and Purge Effect

Keep the existing organic steam particle implementation. Extend its system interface to accept `boost` in the range 0..1.

At `boost = 0`, current tuned steam behavior remains essentially unchanged.

During purge, boost increases:

- particle peak alpha moderately;
- outward displacement/velocity;
- scale modestly;
- effective visible density by extending active visibility, without allocating more sprites.

The purge must read as the same vents releasing greater pressure, not as a separate unrelated effect.

A short extra pressure pulse can be layered into `machineLighting.ts`, coordinated by `relayMachineSystem`, but avoid a full-screen flash.

Existing rare `industrialEvents.ts` micro steam leak remains separate and subtle.

## 8. Static Relay Chamber Redesign

`ProceduralArenaBackdrop.ts` should no longer paint the inner chamber as permanently full of red blood.

Replace the static red fill with:

- dark reservoir interior;
- red-tinted inner rim;
- subtle glass highlight/reflection;
- mechanical spokes/ring still visible;
- gauge face without a static needle.

Dynamic reservoir particles provide the visible blood content.

The maintenance module remains attached below the machine.

## 9. Update Order

Per-frame orchestration should be explicit:

1. derive pipe progress and detect arrivals;
2. feed arrivals into relay cycle/reservoir;
3. advance machine cycle state;
4. fixed-step reservoir physics;
5. update pressure target and analog gauge;
6. derive purge/lighting/steam boost;
7. update visual objects (reservoir particles, needle, steam, lights);
8. update unrelated ambience (motes, panel ambience, rare industrial events).

This keeps cause/effect consistent: pipe arrival changes reservoir; reservoir changes pressure; pressure changes gauge; threshold changes purge; purge changes steam and drains reservoir.

## 10. Determinism and Performance

- Maximum reservoir particles: 36.
- Maximum luminous motes: 16.
- Fixed simulation timestep with capped catch-up work.
- Particle-particle separation at 36 particles is bounded O(n²) and acceptable; skip inactive particles.
- No per-frame creation/destruction of Phaser objects.
- No new dependency.
- No physics-engine bodies for reservoir particles; use pure numeric simulation to avoid Arcade Physics overhead and nondeterminism.

## Testing

Automated tests cover objective behavior only:

- old dust module is no longer wired into the arena;
- luminous motes always rise over lifetime, fade before recycle, and scintillate deterministically;
- machine center is `(560, 270)`;
- tier-2 becomes two symmetric platforms and neither overlaps the machine clearance zone;
- pipe cycle crossing emits exactly one arrival event;
- reservoir injection activates one particle until capacity and never exceeds 36;
- reservoir particles remain inside the circular boundary after physics steps;
- wall collision reduces/reflects outward normal velocity;
- pressure increases with fill;
- state transitions follow `FILLING → PRESSURIZING → PURGING → COOLDOWN → FILLING`;
- purge decreases active reservoir particles;
- gauge target angle is monotonic with pressure and spring/damper remains bounded;
- steam boost is zero outside purge and positive during purge.

Manual GitHub Pages validation is required for:

- machine placement and platform composition;
- luminous mote visibility/scintillation;
- realism of injected blood motion and accumulation;
- perceived liquid-like swirl/settling;
- gauge motion;
- fill duration/cadence;
- purge drama without distraction;
- steam appearance;
- desktop/mobile performance and readability.

## Success Criteria

- The old invisible dust is gone and replaced by clearly visible but subtle luminous rising motes.
- The machine reads as the true center of the arena with no platform obscuring it.
- Blood visibly travels through pipes, enters the machine, accumulates, and moves plausibly under gravity/inertia/swirl.
- The gauge needle visibly rises with pressure and falls during purge.
- Reaching the threshold triggers a coherent steam-pressure purge that drains the accumulated blood.
- The full cycle repeats naturally without allocations, gameplay regressions, or mobile performance issues.
