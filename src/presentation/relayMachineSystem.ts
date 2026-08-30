import type Phaser from 'phaser';
import {
  createReservoirState,
  injectReservoirParticle,
  stepReservoir,
  type RelayBloodReservoirState,
  type ReservoirPoint,
} from './relayBloodReservoir';
import {
  RELAY_PURGE_MS,
  createRelayMachineCycle,
  getRelayPurgeBoost,
  stepRelayMachineCycle,
  type RelayMachineCycleState,
} from './relayMachineCycle';
import {
  createGaugeNeedleState,
  gaugePositionToAngle,
  stepGaugeNeedle,
  type GaugeNeedleState,
} from './relayPressureGauge';

interface Point { x: number; y: number; }

export interface RelayMachineGeometry {
  x: number;
  y: number;
  radius: number;
}

export interface RelayPurgeDynamics {
  swirlStrength: number;
  targetAngularVelocity: number;
  suctionStrength: number;
  fadeStrength: number;
}

export interface RelayMachineSimulation {
  readonly cycle: RelayMachineCycleState;
  readonly reservoir: RelayBloodReservoirState;
  readonly gauge: GaugeNeedleState;
  acceptBlood(entryPoint: ReservoirPoint, entryVelocity: ReservoirPoint): boolean;
  update(dtMs: number): void;
  getPurgeBoost(): number;
}

export interface RelayMachineVisualState {
  pressure: number;
  fill: number;
  purgeBoost: number;
  phase: RelayMachineCycleState['phase'];
}

export interface RelayMachineSystem {
  readonly simulation: RelayMachineSimulation;
  acceptBlood(worldEntryPoint: Point, worldEntryVelocity: Point): boolean;
  update(time: number, dtMs: number): RelayMachineVisualState;
}

const FIXED_STEP_MS = 1000 / 120;

export function getRelayPurgeDynamics(progress: number): RelayPurgeDynamics {
  const p = clamp01(progress);
  const spinRamp = smoothstep(0.08, 0.72, p);
  const suctionRamp = smoothstep(0.52, 1, p);
  const fadeRamp = smoothstep(0.62, 1, p);

  return {
    swirlStrength: 22 + spinRamp * 24,
    targetAngularVelocity: 7.4 + spinRamp * 1.9,
    suctionStrength: 0.06 + suctionRamp * 0.94,
    fadeStrength: fadeRamp,
  };
}

export function createRelayMachineSimulation(chamberRadius = 50): RelayMachineSimulation {
  const cycle = createRelayMachineCycle();
  const reservoir = createReservoirState();
  reservoir.chamberRadius = chamberRadius;
  const gauge = createGaugeNeedleState();
  let accumulatorMs = 0;
  let pendingArrivals = 0;

  return {
    cycle,
    reservoir,
    gauge,

    acceptBlood(entryPoint: ReservoirPoint, entryVelocity: ReservoirPoint): boolean {
      if (cycle.phase === 'purging' || cycle.phase === 'cooldown') return false;
      const accepted = injectReservoirParticle(reservoir, entryPoint, entryVelocity);
      if (accepted) pendingArrivals += 1;
      return accepted;
    },

    update(dtMs: number): void {
      accumulatorMs += Math.max(0, Math.min(100, dtMs));
      let arrivalsForNextStep = pendingArrivals;

      while (accumulatorMs >= FIXED_STEP_MS) {
        const previousPhase = cycle.phase;
        stepRelayMachineCycle(cycle, FIXED_STEP_MS, arrivalsForNextStep);
        arrivalsForNextStep = 0;
        pendingArrivals = 0;

        if (cycle.phase === 'purging') {
          const purgeProgress = clamp01(cycle.phaseTimeMs / RELAY_PURGE_MS);
          const dynamics = getRelayPurgeDynamics(purgeProgress);
          stepReservoir(reservoir, FIXED_STEP_MS / 1000, {
            purgeStrength: dynamics.suctionStrength,
            swirlStrength: dynamics.swirlStrength,
            targetAngularVelocity: dynamics.targetAngularVelocity,
          });
        } else {
          stepReservoir(reservoir, FIXED_STEP_MS / 1000, {
            swirlStrength: 18,
          });
        }
        stepGaugeNeedle(gauge, cycle.pressure, FIXED_STEP_MS / 1000);

        if (previousPhase === 'purging' && cycle.phase === 'cooldown') {
          clearReservoir(reservoir);
        }
        accumulatorMs -= FIXED_STEP_MS;
      }
    },

    getPurgeBoost(): number {
      if (cycle.phase !== 'purging') return 0;
      return getRelayPurgeBoost(cycle);
    },
  };
}

export function createRelayMachineSystem(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  machine: RelayMachineGeometry,
): RelayMachineSystem {
  const chamberRadius = machine.radius * 0.45;
  const simulation = createRelayMachineSimulation(chamberRadius);
  const bloodVisuals = simulation.reservoir.particles.map((_, index) =>
    scene.add
      .ellipse(machine.x, machine.y, 4.8 + (index % 3) * 0.35, 2.9 + (index % 2) * 0.35, 0xc63242, 1)
      .setAlpha(0),
  );

  const gaugeX = machine.x + machine.radius * 0.38;
  const gaugeY = machine.y - machine.radius * 0.46;
  const gaugeNeedle = scene.add
    .rectangle(gaugeX, gaugeY, 11.5, 1.7, 0xd34853, 1)
    .setOrigin(0, 0.5)
    .setRotation(gaugePositionToAngle(simulation.gauge.position));
  const gaugePivot = scene.add.circle(gaugeX, gaugeY, 2.1, 0xc8ccd3, 1);

  const drainGlow = scene.add.circle(machine.x, machine.y, 7, 0xe13b49, 1).setAlpha(0);
  const glassOverlay = scene.add.graphics();
  glassOverlay.lineStyle(1.2, 0xf2b9bf, 0.12);
  glassOverlay.strokeCircle(machine.x, machine.y, chamberRadius + 2.5);
  glassOverlay.fillStyle(0xffffff, 0.045);
  glassOverlay.fillEllipse(
    machine.x - chamberRadius * 0.28,
    machine.y - chamberRadius * 0.3,
    chamberRadius * 0.48,
    chamberRadius * 0.22,
  );

  container.add([...bloodVisuals, drainGlow, gaugeNeedle, gaugePivot, glassOverlay]);

  const visualState: RelayMachineVisualState = {
    pressure: simulation.cycle.pressure,
    fill: simulation.cycle.fill,
    purgeBoost: 0,
    phase: simulation.cycle.phase,
  };

  return {
    simulation,

    acceptBlood(worldEntryPoint: Point, worldEntryVelocity: Point): boolean {
      const localX = worldEntryPoint.x - machine.x;
      const localY = worldEntryPoint.y - machine.y;
      const distance = Math.max(0.0001, Math.hypot(localX, localY));
      const spawnRadius = simulation.reservoir.chamberRadius - simulation.reservoir.particleRadius - 1;
      const entryPoint = {
        x: (localX / distance) * spawnRadius,
        y: (localY / distance) * spawnRadius,
      };
      const velocityLength = Math.max(0.0001, Math.hypot(worldEntryVelocity.x, worldEntryVelocity.y));
      const inwardX = -entryPoint.x / spawnRadius;
      const inwardY = -entryPoint.y / spawnRadius;
      const entrySpeed = Math.max(24, velocityLength);
      const entryVelocity = {
        x: inwardX * entrySpeed + worldEntryVelocity.x * 0.18,
        y: inwardY * entrySpeed + worldEntryVelocity.y * 0.18,
      };
      return simulation.acceptBlood(entryPoint, entryVelocity);
    },

    update(time: number, dtMs: number): RelayMachineVisualState {
      simulation.update(dtMs);
      const purgeBoost = simulation.getPurgeBoost();
      const purgeProgress = simulation.cycle.phase === 'purging'
        ? clamp01(simulation.cycle.phaseTimeMs / RELAY_PURGE_MS)
        : 0;
      const purgeDynamics = getRelayPurgeDynamics(purgeProgress);

      bloodVisuals.forEach((visual, index) => {
        const particle = simulation.reservoir.particles[index];
        if (!particle.active) {
          visual.setAlpha(0);
          return;
        }
        const speed = Math.hypot(particle.vx, particle.vy);
        const stretch = 1 + Math.min(0.42, speed / 160);
        const distance = Math.hypot(particle.x, particle.y);
        const centerProximity = 1 - clamp01(distance / simulation.reservoir.chamberRadius);
        const purgeFade = purgeDynamics.fadeStrength * (0.22 + centerProximity * 0.78);
        const alpha = (0.78 + Math.min(0.18, speed / 280)) * (1 - purgeFade * 0.92);
        visual
          .setPosition(machine.x + particle.x, machine.y + particle.y)
          .setRotation(Math.atan2(particle.vy, particle.vx))
          .setScale(stretch, 1)
          .setAlpha(alpha);
      });

      const jitter = simulation.cycle.pressure > 0.85
        ? Math.sin(time * 0.075) * 0.018 * ((simulation.cycle.pressure - 0.85) / 0.15)
        : 0;
      gaugeNeedle.setRotation(gaugePositionToAngle(simulation.gauge.position) + jitter);
      drainGlow
        .setAlpha(purgeBoost * 0.82)
        .setScale(0.75 + purgeBoost * 1.05);

      visualState.pressure = simulation.cycle.pressure;
      visualState.fill = simulation.cycle.fill;
      visualState.purgeBoost = purgeBoost;
      visualState.phase = simulation.cycle.phase;
      return visualState;
    },
  };
}

function clearReservoir(reservoir: RelayBloodReservoirState): void {
  for (const particle of reservoir.particles) {
    particle.active = false;
    particle.vx = 0;
    particle.vy = 0;
  }
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
