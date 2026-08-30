import type Phaser from 'phaser';

export interface MachineLightingMachine {
  x: number;
  y: number;
  radius: number;
}

export interface MachineLightPlacement {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  baseAlpha: number;
}

export interface MachineLightingSystem {
  update(heartbeat: number): void;
}

const MACHINE_LIGHT_TEXTURE = 'relay-local-red-light';

export function buildMachineLightPlacements(
  machine: MachineLightingMachine,
): MachineLightPlacement[] {
  const { x, y, radius } = machine;
  return [
    { x, y: y + radius * 0.02, scaleX: 1.28, scaleY: 0.72, baseAlpha: 0.08 },
    {
      x: x - radius * 0.8,
      y: y + radius * 0.06,
      scaleX: 0.72,
      scaleY: 0.32,
      baseAlpha: 0.065,
    },
    {
      x: x + radius * 0.8,
      y: y + radius * 0.06,
      scaleX: 0.72,
      scaleY: 0.32,
      baseAlpha: 0.065,
    },
    {
      x,
      y: y - radius * 0.46,
      scaleX: 1.05,
      scaleY: 0.3,
      baseAlpha: 0.045,
    },
  ];
}

export function getMachineLightAlpha(baseAlpha: number, heartbeat: number): number {
  const intensity = Math.min(1, Math.max(0, heartbeat));
  return baseAlpha * (0.35 + intensity * 1.3);
}

export function createMachineLightingSystem(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  machine: MachineLightingMachine,
): MachineLightingSystem {
  ensureMachineLightTexture(scene);
  const placements = buildMachineLightPlacements(machine);
  const lights = placements.map((placement) =>
    scene.add
      .image(placement.x, placement.y, MACHINE_LIGHT_TEXTURE)
      .setScale(placement.scaleX, placement.scaleY)
      .setAlpha(0),
  );
  container.add(lights);

  return {
    update(heartbeat: number): void {
      const pulseScale = 0.96 + heartbeat * 0.09;
      lights.forEach((light, index) => {
        const placement = placements[index];
        light
          .setScale(placement.scaleX * pulseScale, placement.scaleY * pulseScale)
          .setAlpha(getMachineLightAlpha(placement.baseAlpha, heartbeat));
      });
    },
  };
}

function ensureMachineLightTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(MACHINE_LIGHT_TEXTURE)) return;

  const graphics = scene.add.graphics().setVisible(false);
  graphics.fillStyle(0x8e1724, 0.08);
  graphics.fillEllipse(36, 26, 70, 48);
  graphics.fillStyle(0xb52230, 0.12);
  graphics.fillEllipse(36, 26, 52, 34);
  graphics.fillStyle(0xd42f40, 0.12);
  graphics.fillEllipse(36, 26, 34, 20);
  graphics.generateTexture(MACHINE_LIGHT_TEXTURE, 72, 52);
  graphics.destroy();
}
