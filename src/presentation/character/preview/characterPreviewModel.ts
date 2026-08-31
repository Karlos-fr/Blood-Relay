import { CHARACTER_ANIMATIONS } from '../anatomy/anatomicalAnimations';
import type { CharacterAnimationName } from '../anatomy/AnatomicalPose';
import { PREVIEW_APPEARANCES } from '../deterministicCharacter';

export type PreviewAppearanceName = keyof typeof PREVIEW_APPEARANCES;

export const PREVIEW_APPEARANCE_NAMES = Object.freeze(
  Object.keys(PREVIEW_APPEARANCES) as PreviewAppearanceName[],
);
export const PREVIEW_ANIMATION_NAMES = Object.freeze(
  Object.keys(CHARACTER_ANIMATIONS) as CharacterAnimationName[],
);

export interface CharacterPreviewState {
  appearance: PreviewAppearanceName;
  animation: CharacterAnimationName;
  facing: 'left' | 'right';
  playing: boolean;
  showHitbox: boolean;
  frameIndex: number;
}

export function createCharacterPreviewState(): CharacterPreviewState {
  return {
    appearance: PREVIEW_APPEARANCE_NAMES[0],
    animation: PREVIEW_ANIMATION_NAMES[0],
    facing: 'right',
    playing: true,
    showHitbox: false,
    frameIndex: 0,
  };
}

export function cyclePreviewAppearance(
  state: CharacterPreviewState,
  direction: number,
): CharacterPreviewState {
  const currentIndex = PREVIEW_APPEARANCE_NAMES.indexOf(state.appearance);
  return {
    ...state,
    appearance:
      PREVIEW_APPEARANCE_NAMES[
        positiveModulo(currentIndex + direction, PREVIEW_APPEARANCE_NAMES.length)
      ],
  };
}

export function cyclePreviewAnimation(
  state: CharacterPreviewState,
  direction: number,
): CharacterPreviewState {
  const currentIndex = PREVIEW_ANIMATION_NAMES.indexOf(state.animation);
  return {
    ...state,
    animation:
      PREVIEW_ANIMATION_NAMES[
        positiveModulo(currentIndex + direction, PREVIEW_ANIMATION_NAMES.length)
      ],
    frameIndex: 0,
  };
}

export function cyclePreviewFrame(
  state: CharacterPreviewState,
  direction: number,
): CharacterPreviewState {
  const frameCount = CHARACTER_ANIMATIONS[state.animation].frames.length;
  return {
    ...state,
    frameIndex: positiveModulo(state.frameIndex + direction, frameCount),
  };
}

export function togglePreviewFacing(state: CharacterPreviewState): CharacterPreviewState {
  return { ...state, facing: state.facing === 'right' ? 'left' : 'right' };
}

export function togglePreviewPlayback(state: CharacterPreviewState): CharacterPreviewState {
  return { ...state, playing: !state.playing };
}

export function togglePreviewHitbox(state: CharacterPreviewState): CharacterPreviewState {
  return { ...state, showHitbox: !state.showHitbox };
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}
