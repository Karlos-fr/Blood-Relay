import { ARENA_CONTENT_SCALE } from '../../config/arenaScale';

export const PLAYER_MOVE_SPEED = 165 * ARENA_CONTENT_SCALE;
export const PLAYER_ACCELERATION = 1125 * ARENA_CONTENT_SCALE;
export const PLAYER_DRAG = 1350 * ARENA_CONTENT_SCALE;
export const PLAYER_JUMP_SPEED = 450 * ARENA_CONTENT_SCALE;
export const PLAYER_JUMP_RELEASE_SPEED = 250 * ARENA_CONTENT_SCALE;

export type HorizontalIntent = -1 | 0 | 1;
export type FacingDirection = -1 | 1;

export function getHorizontalIntent(leftPressed: boolean, rightPressed: boolean): HorizontalIntent {
  if (leftPressed === rightPressed) {
    return 0;
  }

  return leftPressed ? -1 : 1;
}

export function getFacingDirection(
  intent: HorizontalIntent,
  currentFacing: FacingDirection,
): FacingDirection {
  return intent === 0 ? currentFacing : intent;
}

export function getReleasedJumpVelocity(currentVelocityY: number): number {
  return currentVelocityY < -PLAYER_JUMP_RELEASE_SPEED
    ? -PLAYER_JUMP_RELEASE_SPEED
    : currentVelocityY;
}
