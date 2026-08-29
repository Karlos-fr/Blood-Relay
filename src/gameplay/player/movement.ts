export const PLAYER_MOVE_SPEED = 220;
export const PLAYER_ACCELERATION = 1500;
export const PLAYER_DRAG = 1800;
export const PLAYER_JUMP_SPEED = 500;

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
