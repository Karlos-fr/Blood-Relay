export const ARENA_WIDTH = 1280;
export const ARENA_HEIGHT = 720;
export const ARENA_CAMERA_ZOOM = 0.75;

export const FLOOR_HEIGHT = 56;
export const PLATFORM_HEIGHT = 18;

export const PLATFORM_LAYOUT = [
  { x: 330, y: 548, width: 300, tier: 1 },
  { x: 950, y: 548, width: 300, tier: 1 },
  { x: 640, y: 423, width: 320, tier: 2 },
  { x: 455, y: 298, width: 260, tier: 3 },
  { x: 825, y: 298, width: 260, tier: 3 },
] as const;

export const SPAWN_POINTS = [
  { x: 180, y: 610 },
  { x: 1100, y: 610 },
] as const;
