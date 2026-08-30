export interface ReservoirPoint {
  x: number;
  y: number;
}

export interface RelayBloodParticle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
}

export interface RelayBloodReservoirState {
  chamberRadius: number;
  particleRadius: number;
  particles: RelayBloodParticle[];
}

export interface ReservoirStepOptions {
  gravityY?: number;
  damping?: number;
  swirlStrength?: number;
  targetAngularVelocity?: number;
  purgeStrength?: number;
  restitution?: number;
}

const MAX_CAPACITY = 144;
const DEFAULT_CHAMBER_RADIUS = 50;
const DEFAULT_PARTICLE_RADIUS = 1.65;
const DEFAULT_GRAVITY_Y = 26;
const DEFAULT_DAMPING = 0.985;
const DEFAULT_SWIRL_STRENGTH = 18;
const DEFAULT_RESTITUTION = 0.42;

export function createReservoirState(capacity = MAX_CAPACITY): RelayBloodReservoirState {
  const boundedCapacity = Math.min(MAX_CAPACITY, Math.max(1, Math.floor(capacity)));
  return {
    chamberRadius: DEFAULT_CHAMBER_RADIUS,
    particleRadius: DEFAULT_PARTICLE_RADIUS,
    particles: Array.from({ length: boundedCapacity }, () => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      age: 0,
    })),
  };
}

export function injectReservoirParticle(
  state: RelayBloodReservoirState,
  entryPoint: ReservoirPoint,
  entryVelocity: ReservoirPoint,
): boolean {
  const particle = state.particles.find((candidate) => !candidate.active);
  if (!particle) return false;

  const maxRadius = state.chamberRadius - state.particleRadius;
  const distance = Math.hypot(entryPoint.x, entryPoint.y);
  const scale = distance > maxRadius && distance > 0 ? maxRadius / distance : 1;

  particle.active = true;
  particle.x = entryPoint.x * scale;
  particle.y = entryPoint.y * scale;
  particle.vx = entryVelocity.x;
  particle.vy = entryVelocity.y;
  particle.age = 0;
  return true;
}

export function getReservoirFill(state: RelayBloodReservoirState): number {
  const active = state.particles.reduce((count, particle) => count + (particle.active ? 1 : 0), 0);
  return active / state.particles.length;
}

export function stepReservoir(
  state: RelayBloodReservoirState,
  dtSeconds: number,
  options: ReservoirStepOptions = {},
): void {
  const dt = Math.max(0, Math.min(0.05, dtSeconds));
  if (dt <= 0) return;

  const gravityY = options.gravityY ?? DEFAULT_GRAVITY_Y;
  const damping = options.damping ?? DEFAULT_DAMPING;
  const swirlStrength = options.swirlStrength ?? DEFAULT_SWIRL_STRENGTH;
  const targetAngularVelocity = Math.max(0, options.targetAngularVelocity ?? 0);
  const purgeStrength = Math.min(1, Math.max(0, options.purgeStrength ?? 0));
  const restitution = options.restitution ?? DEFAULT_RESTITUTION;
  const dampingFactor = Math.pow(Math.max(0, damping), dt * 60);
  const maxRadius = state.chamberRadius - state.particleRadius;

  for (const particle of state.particles) {
    if (!particle.active) continue;

    const distance = Math.hypot(particle.x, particle.y);
    const nx = distance > 0.0001 ? particle.x / distance : 1;
    const ny = distance > 0.0001 ? particle.y / distance : 0;
    const tangentX = -ny;
    const tangentY = nx;
    const radialFactor = distance / Math.max(1, maxRadius);

    particle.vy += gravityY * dt;

    const effectiveSwirl = swirlStrength * (0.35 + radialFactor * 0.65);
    particle.vx += tangentX * effectiveSwirl * dt;
    particle.vy += tangentY * effectiveSwirl * dt;

    if (targetAngularVelocity > 0 && distance > 1) {
      const currentTangentialSpeed = particle.vx * tangentX + particle.vy * tangentY;
      const targetTangentialSpeed = targetAngularVelocity * distance;
      const coupling = Math.min(1, dt * 5.8);
      const tangentialCorrection = (targetTangentialSpeed - currentTangentialSpeed) * coupling;
      particle.vx += tangentX * tangentialCorrection;
      particle.vy += tangentY * tangentialCorrection;

      const achievedTangentialSpeed = currentTangentialSpeed + tangentialCorrection;
      const centripetalAcceleration =
        (achievedTangentialSpeed * achievedTangentialSpeed) / Math.max(1, distance);
      particle.vx -= nx * centripetalAcceleration * dt;
      particle.vy -= ny * centripetalAcceleration * dt;
    }

    if (purgeStrength > 0) {
      const suction = 145 * purgeStrength * (0.65 + radialFactor * 0.55);
      particle.vx -= nx * suction * dt;
      particle.vy -= ny * suction * dt;
    }

    particle.vx *= dampingFactor;
    particle.vy *= dampingFactor;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.age += dt;

    constrainToChamber(particle, maxRadius, restitution);
  }

  separateParticles(state);

  if (purgeStrength > 0.52) {
    const drainRadius = 2.2 + purgeStrength * 4.8;
    for (const particle of state.particles) {
      if (!particle.active) continue;
      if (Math.hypot(particle.x, particle.y) <= drainRadius) {
        particle.active = false;
        particle.vx = 0;
        particle.vy = 0;
      }
    }
  }
}

function constrainToChamber(
  particle: RelayBloodParticle,
  maxRadius: number,
  restitution: number,
): void {
  const distance = Math.hypot(particle.x, particle.y);
  if (distance <= maxRadius || distance <= 0) return;

  const nx = particle.x / distance;
  const ny = particle.y / distance;
  particle.x = nx * maxRadius;
  particle.y = ny * maxRadius;

  const radialVelocity = particle.vx * nx + particle.vy * ny;
  if (radialVelocity > 0) {
    particle.vx -= (1 + restitution) * radialVelocity * nx;
    particle.vy -= (1 + restitution) * radialVelocity * ny;
  }
  particle.vx *= 0.92;
  particle.vy *= 0.92;
}

function separateParticles(state: RelayBloodReservoirState): void {
  const minDistance = state.particleRadius * 2;
  const active = state.particles.filter((particle) => particle.active);

  for (let firstIndex = 0; firstIndex < active.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < active.length; secondIndex += 1) {
      const first = active[firstIndex];
      const second = active[secondIndex];
      const dx = second.x - first.x;
      const dy = second.y - first.y;
      const distance = Math.hypot(dx, dy);
      if (distance >= minDistance) continue;

      const nx = distance > 0.0001 ? dx / distance : firstIndex % 2 === 0 ? 1 : -1;
      const ny = distance > 0.0001 ? dy / distance : 0;
      const overlap = minDistance - distance;
      const correction = overlap * 0.5;
      first.x -= nx * correction;
      first.y -= ny * correction;
      second.x += nx * correction;
      second.y += ny * correction;

      const relativeVelocity = (second.vx - first.vx) * nx + (second.vy - first.vy) * ny;
      if (relativeVelocity < 0) {
        const impulse = -relativeVelocity * 0.16;
        first.vx -= nx * impulse;
        first.vy -= ny * impulse;
        second.vx += nx * impulse;
        second.vy += ny * impulse;
      }
    }
  }

  const maxRadius = state.chamberRadius - state.particleRadius;
  for (const particle of active) {
    constrainToChamber(particle, maxRadius, 0.2);
  }
}
