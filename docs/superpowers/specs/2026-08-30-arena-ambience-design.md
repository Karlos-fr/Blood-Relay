# Arena Ambience Design

## Goal

Finish the first arena's visual ambience without adding gameplay complexity or obscuring player readability. The background should feel like a living industrial blood-processing installation while remaining deterministic, lightweight, and suitable for desktop and mobile.

## Constraints

- Keep gameplay, collision geometry, player movement, and arena layout unchanged.
- Preserve procedural/deterministic rendering; no external art assets are required.
- Prefer small focused modules over expanding `ArenaBackdropAnimation.ts` into a monolith.
- Avoid heavy shaders, fluid simulation, physics particles, and dependency additions.
- Keep animated ambience behind players/platforms and visually subordinate to gameplay.
- Subjective intensity remains human-validated on GitHub Pages rather than frozen by arbitrary tests.
- Objective limits and deterministic calculations should be unit-tested.

## Architecture

`ArenaBackdropAnimation.ts` remains the coordinator for ambient animation. It creates and updates specialized systems but does not own their detailed simulation.

New focused modules:

- `machineLighting.ts`: localized heartbeat-driven red illumination around the relay machine and nearby pipe ports.
- `arenaDust.ts`: deterministic slow-moving dust particles with a fixed maximum count.
- `panelAmbience.ts`: subtle animated indicators on at most three wall panels.
- `industrialEvents.ts`: rare deterministic one-shot ambience such as sparks, LED glitches, or a tiny secondary steam leak.

Existing modules extended:

- `ArenaBackdropAnimation.ts`: coordinate heartbeat lighting, blood-flow trails, steam, dust, panels, and industrial events.
- `steamParticles.ts`: shorter-lived particles with outward drift so steam dissipates before reaching the top edge.
- `PlatformVisual.ts`: add subtle static shadows below floating platforms.
- `ProceduralArenaBackdrop.ts`: redraw the relay service console as an integrated maintenance module instead of a HUD-like rectangle.

## 1. Localized Machine Lighting

The relay heartbeat should illuminate nearby surfaces without drawing a single large red disc over the scene.

Implementation:

- Generate a small reusable soft red light texture at runtime.
- Place several low-alpha light sprites around the machine: behind the blood chamber, across the inner ring, and near selected pipe connections.
- Drive their alpha/scale from the existing `getHeartbeatIntensity(time)` value.
- Reduce the existing broad `outerGlow` contribution so the effect reads as reflected illumination rather than a UI halo.
- Keep the effect behind foreground platform art and players.

## 2. Blood Reflections in Pipes

Each moving blood particle should leave a short luminous trail inside the pipe.

Implementation:

- Keep the current bright blood core.
- Add two or three small delayed samples on the same rounded path behind each core.
- Trail samples use decreasing radius and alpha.
- Samples must follow the exact rounded pipe geometry and never leave the tube path.
- Do not add persistent full-pipe glow; only the area near the moving particle brightens.

## 3. Platform Shadows

Floating platforms should gain depth without changing collision or layout.

Implementation:

- Draw a shallow black shadow under each platform before the platform itself.
- Use two low-alpha rectangular/soft-edged layers offset roughly 6–8 logical pixels downward.
- Shadow depth stays behind the platform and players.
- Floor geometry remains unchanged.

## 4. Dust

Add sparse atmospheric dust across the arena.

Implementation:

- Use exactly 16 deterministic dust particles for the current arena.
- Particles are 1–2 logical pixels, low alpha, and move very slowly.
- Each particle has deterministic initial position, velocity, phase, and alpha.
- Wrap particles at arena edges instead of destroying/recreating them.
- Dust remains visually subtle and behind combatants.

## 5. Rare Industrial Events

Ambient events should make the installation feel alive without becoming constant noise.

Implementation:

- Use a deterministic event schedule derived from arena seed/time.
- Allow only one rare event at a time.
- Event interval target: approximately 7–14 seconds.
- Supported event types for this pass:
  - short spark burst near a pipe or machine port;
  - brief LED glitch/flicker;
  - tiny secondary steam leak near a technical panel/pipe.
- Event duration remains short (roughly 0.2–0.9 s depending on type).
- No audio in this pass.

## 6. Panel Micro-Animation

Animate no more than three wall panels.

Implementation:

- Select up to three panels deterministically from the generated layout.
- Add small diagnostic details only: tiny cyan/red indicator LEDs and/or one thin scanning line.
- Different panels use phase-shifted cycles.
- Do not turn panels into large UI screens.

## 7. Relay Maintenance Console

The current long rectangle with red/cyan bars reads like a HUD. Replace it with an integrated maintenance module.

Implementation:

- Keep the console physically attached beneath the relay machine.
- Shorten and visually break up the rectangular silhouette.
- Add metal brackets, small vents/grille, screws, and three small status indicators.
- Remove the two long red/cyan bars.
- Keep the module static in this pass; panel ambience handles animated indicators elsewhere.

## 8. Steam Tuning

The new steam particle system is visually acceptable but currently rises too close to the top edge.

Implementation:

- Reduce rise distance from the current 54–88 px range to approximately 35–55 px.
- Shorten lifetime so particles dissipate before reaching the canvas edge.
- Bias left vent drift outward to the left and right vent drift outward to the right.
- Retain local turbulence and shape variation.
- Keep multiple small irregular sprites; never return to large expanding circles.

## Determinism and Performance

- No per-frame allocation of large arrays or textures.
- Reuse sprites/graphics objects created during scene setup.
- All random-looking values come from deterministic seeds/formulas.
- Target total ambience object count remains comfortably below 100 additional lightweight objects.
- No new dependency.

## Testing

Automated tests should cover only deterministic/objective behavior:

- dust count <= 20 and deterministic seeds;
- panel ambience selects <= 3 panels;
- industrial event intervals are rare and deterministic;
- steam rise distances remain below the new maximum and drift direction follows the vent side;
- blood trail sample ordering stays behind the core on the rounded path;
- platform shadow config does not modify collision dimensions.

Manual GitHub Pages validation remains required for:

- perceived lighting intensity;
- readability of platforms/players;
- dust visibility;
- event frequency feel;
- console appearance;
- steam naturalness;
- mobile performance and visual balance.

## Success Criteria

- The relay heartbeat visibly affects nearby surfaces without reading as a large circular halo.
- Moving blood visibly brightens a short portion of its pipe.
- Floating platforms read with more depth.
- Dust and rare events add life without distracting from gameplay.
- No more than three panels animate.
- The relay console reads as machinery rather than HUD.
- Steam dissipates naturally before the top canvas boundary.
- Desktop and mobile remain smooth and readable.
