export const ARENA_WIDTH = 960;
export const ARENA_HEIGHT = 540;
export const ARENA_CAMERA_ZOOM = 1;

export const FLOOR_HEIGHT = 42;
export const PLATFORM_HEIGHT = 13.5;

export const PLATFORM_LAYOUT = [
  { x: 247.5, y: 411, width: 225, tier: 1 },
  { x: 712.5, y: 411, width: 225, tier: 1 },
  { x: 480, y: 317.25, width: 240, tier: 2 },
  { x: 341.25, y: 223.5, width: 195, tier: 3 },
  { x: 618.75, y: 223.5, width: 195, tier: 3 },
] as const;

export const SPAWN_POINTS = [
  { x: 135, y: 457.5 },
  { x: 825, y: 457.5 },
] as const;
