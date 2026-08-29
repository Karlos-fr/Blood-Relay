import { ARENA_CONTENT_SCALE } from './arenaScale';

export const ARENA_WIDTH = 960;
export const ARENA_HEIGHT = 540;
export const ARENA_CAMERA_ZOOM = 1;

const BASE_FLOOR_HEIGHT = 42;
const BASE_PLATFORM_HEIGHT = 13.5;
const BASE_FLOOR_TOP = ARENA_HEIGHT - BASE_FLOOR_HEIGHT;
const ARENA_CENTER_X = ARENA_WIDTH / 2;

export const FLOOR_HEIGHT = BASE_FLOOR_HEIGHT * ARENA_CONTENT_SCALE;
export const PLATFORM_HEIGHT = BASE_PLATFORM_HEIGHT * ARENA_CONTENT_SCALE;

const scaledFloorTop = ARENA_HEIGHT - FLOOR_HEIGHT;
const scaleX = (x: number): number =>
  ARENA_CENTER_X + (x - ARENA_CENTER_X) * ARENA_CONTENT_SCALE;
const scaleYFromFloor = (y: number): number =>
  scaledFloorTop - (BASE_FLOOR_TOP - y) * ARENA_CONTENT_SCALE;

export const PLATFORM_LAYOUT = [
  { x: scaleX(247.5), y: scaleYFromFloor(411), width: 240 * ARENA_CONTENT_SCALE, tier: 1 },
  { x: scaleX(712.5), y: scaleYFromFloor(411), width: 240 * ARENA_CONTENT_SCALE, tier: 1 },
  { x: scaleX(480), y: scaleYFromFloor(317.25), width: 240 * ARENA_CONTENT_SCALE, tier: 2 },
  { x: scaleX(341.25), y: scaleYFromFloor(223.5), width: 160 * ARENA_CONTENT_SCALE, tier: 3 },
  { x: scaleX(618.75), y: scaleYFromFloor(223.5), width: 160 * ARENA_CONTENT_SCALE, tier: 3 },
  { x: scaleX(480), y: scaleYFromFloor(129.75), width: 240 * ARENA_CONTENT_SCALE, tier: 4 },
] as const;

export const SPAWN_POINTS = [
  { x: scaleX(135), y: scaleYFromFloor(457.5) },
  { x: scaleX(825), y: scaleYFromFloor(457.5) },
] as const;
