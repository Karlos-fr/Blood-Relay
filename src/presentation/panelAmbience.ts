import type Phaser from 'phaser';

export interface PanelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PanelAmbienceTarget {
  index: number;
  panel: PanelRect;
  phaseOffsetMs: number;
}

export interface PanelAmbienceSystem {
  update(time: number): void;
}

export function selectPanelAmbienceTargets(
  panels: PanelRect[],
  maxTargets = 3,
): PanelAmbienceTarget[] {
  if (panels.length === 0 || maxTargets <= 0) return [];

  const desired = Math.min(3, maxTargets, panels.length);
  const candidateIndices = [1, Math.floor(panels.length * 0.48), Math.max(0, panels.length - 2)];
  const uniqueIndices = [...new Set(candidateIndices)].slice(0, desired);

  return uniqueIndices.map((index, targetIndex) => ({
    index,
    panel: panels[index],
    phaseOffsetMs: targetIndex * 740,
  }));
}

export function createPanelAmbienceSystem(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  panels: PanelRect[],
): PanelAmbienceSystem {
  const targets = selectPanelAmbienceTargets(panels);
  const visuals = targets.map((target, index) => {
    const { panel } = target;
    const ledColor = index % 2 === 0 ? 0x42d9e8 : 0xc63c47;
    const led = scene.add.circle(
      panel.x - panel.width * 0.3,
      panel.y - panel.height * 0.32,
      1.7,
      ledColor,
      1,
    );
    const secondary = scene.add.circle(
      panel.x - panel.width * 0.3 + 7,
      panel.y - panel.height * 0.32,
      1.2,
      0x7b8444,
      1,
    );
    const scan = scene.add.rectangle(
      panel.x + panel.width * 0.18,
      panel.y,
      Math.min(22, panel.width * 0.16),
      1,
      0x58c9d6,
      1,
    );
    container.add([led, secondary, scan]);
    return { target, led, secondary, scan };
  });

  return {
    update(time: number): void {
      visuals.forEach((visual, index) => {
        const phase = positiveModulo(time + visual.target.phaseOffsetMs, 2600) / 2600;
        const pulse = (Math.sin(phase * Math.PI * 2) + 1) / 2;
        visual.led.setAlpha(0.12 + pulse * 0.52);
        visual.secondary.setAlpha(0.08 + (1 - pulse) * 0.3);
        visual.scan
          .setY(visual.target.panel.y - 8 + phase * 16)
          .setAlpha(0.04 + pulse * (index === 1 ? 0.16 : 0.1));
      });
    },
  };
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}
