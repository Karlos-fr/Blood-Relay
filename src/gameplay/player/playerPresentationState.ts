export interface PlayerPresentationState {
  x: number;
  y: number;
  facing: -1 | 1;
  grounded: boolean;
  velocityX: number;
  velocityY: number;
}
