export type RelayMachinePhase = 'filling' | 'pressurizing' | 'purging' | 'cooldown';

export interface RelayMachineCycleState {
  phase: RelayMachinePhase;
  fill: number;
  pressure: number;
  phaseTimeMs: number;
}

export const RELAY_CAPACITY = 72;
export const RELAY_PRESSURE_THRESHOLD = 0.88;
export const RELAY_PRESSURIZE_MS = 1000;
export const RELAY_PURGE_MS = 2400;
export const RELAY_COOLDOWN_MS = 1600;

export function createRelayMachineCycle(): RelayMachineCycleState {
  return {
    phase: 'filling',
    fill: 0,
    pressure: 0.08,
    phaseTimeMs: 0,
  };
}

export function stepRelayMachineCycle(
  state: RelayMachineCycleState,
  dtMs: number,
  arrivals: number,
): void {
  const dt = Math.max(0, dtMs);

  if (state.phase === 'filling') {
    if (arrivals > 0) {
      state.fill = clamp01(state.fill + arrivals / RELAY_CAPACITY);
    }
    state.pressure = 0.08 + state.fill * 0.78;
    state.phaseTimeMs += dt;

    if (state.fill >= RELAY_PRESSURE_THRESHOLD) {
      state.phase = 'pressurizing';
      state.phaseTimeMs = 0;
    }
    return;
  }

  if (state.phase === 'pressurizing') {
    if (arrivals > 0) {
      state.fill = clamp01(state.fill + arrivals / RELAY_CAPACITY);
    }
    state.phaseTimeMs += dt;
    const progress = clamp01(state.phaseTimeMs / RELAY_PRESSURIZE_MS);
    const basePressure = 0.08 + state.fill * 0.78;
    state.pressure = basePressure + (1 - basePressure) * easeOutCubic(progress);

    if (state.phaseTimeMs >= RELAY_PRESSURIZE_MS) {
      state.phase = 'purging';
      state.phaseTimeMs = 0;
      state.pressure = 1;
    }
    return;
  }

  if (state.phase === 'purging') {
    state.phaseTimeMs += dt;
    const drain = dt / RELAY_PURGE_MS;
    state.fill = Math.max(0, state.fill - drain);
    const progress = clamp01(state.phaseTimeMs / RELAY_PURGE_MS);
    state.pressure = Math.max(0.1, 1 - progress * 0.9);

    if (state.phaseTimeMs >= RELAY_PURGE_MS || state.fill <= 0) {
      state.fill = 0;
      state.phase = 'cooldown';
      state.phaseTimeMs = 0;
      state.pressure = 0.14;
    }
    return;
  }

  state.phaseTimeMs += dt;
  const cooldownProgress = clamp01(state.phaseTimeMs / RELAY_COOLDOWN_MS);
  state.fill = 0;
  state.pressure = 0.14 * (1 - cooldownProgress) + 0.05 * cooldownProgress;

  if (state.phaseTimeMs >= RELAY_COOLDOWN_MS) {
    state.phase = 'filling';
    state.phaseTimeMs = 0;
    state.pressure = 0.08;
  }
}

export function getRelayPurgeBoost(state: RelayMachineCycleState): number {
  if (state.phase !== 'purging') return 0;
  const progress = clamp01(state.phaseTimeMs / RELAY_PURGE_MS);
  const attack = smoothstep(0, 0.16, progress);
  const release = 1 - smoothstep(0.78, 1, progress);
  return attack * release;
}

function easeOutCubic(value: number): number {
  return 1 - Math.pow(1 - value, 3);
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
