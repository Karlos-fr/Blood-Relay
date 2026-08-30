export interface GaugeNeedleState {
  position: number;
  velocity: number;
}

const NEEDLE_STIFFNESS = 32;
const NEEDLE_DAMPING = 9;

export function createGaugeNeedleState(): GaugeNeedleState {
  return { position: 0.08, velocity: 0 };
}

export function stepGaugeNeedle(
  state: GaugeNeedleState,
  target: number,
  dtSeconds: number,
): void {
  const dt = Math.max(0, Math.min(0.05, dtSeconds));
  const boundedTarget = clamp01(target);
  const acceleration =
    (boundedTarget - state.position) * NEEDLE_STIFFNESS - state.velocity * NEEDLE_DAMPING;

  state.velocity += acceleration * dt;
  state.position += state.velocity * dt;

  if (state.position < 0) {
    state.position = 0;
    if (state.velocity < 0) state.velocity *= -0.2;
  } else if (state.position > 1) {
    state.position = 1;
    if (state.velocity > 0) state.velocity *= -0.2;
  }
}

export function gaugePositionToAngle(position: number): number {
  const minAngle = Math.PI * 0.78;
  const maxAngle = Math.PI * 2.22;
  return minAngle + (maxAngle - minAngle) * clamp01(position);
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
