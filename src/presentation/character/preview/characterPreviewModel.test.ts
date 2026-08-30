import { describe, expect, it } from 'vitest';
import { CHARACTER_ANIMATIONS } from '../anatomy/anatomicalAnimations';
import { PREVIEW_APPEARANCES } from '../deterministicCharacter';
import {
  PREVIEW_ANIMATION_NAMES,
  PREVIEW_APPEARANCE_NAMES,
  createCharacterPreviewState,
  cyclePreviewAnimation,
  cyclePreviewAppearance,
  cyclePreviewFrame,
  togglePreviewFacing,
  togglePreviewHitbox,
  togglePreviewPlayback,
} from './characterPreviewModel';

describe('character preview model', () => {
  it('starts on the first representative fighter and animation', () => {
    expect(createCharacterPreviewState()).toEqual({
      appearance: 'clone',
      animation: 'idle',
      facing: 'right',
      playing: true,
      showHitbox: false,
      frameIndex: 0,
    });
  });

  it('includes every representative appearance and animation', () => {
    expect(PREVIEW_APPEARANCE_NAMES).toEqual(Object.keys(PREVIEW_APPEARANCES));
    expect(PREVIEW_ANIMATION_NAMES).toEqual(Object.keys(CHARACTER_ANIMATIONS));
  });

  it('cycles appearances in either direction with positive wrapping', () => {
    const initial = createCharacterPreviewState();

    expect(cyclePreviewAppearance(initial, -1).appearance).toBe('mixed');
    expect(cyclePreviewAppearance(initial, 1).appearance).toBe('mercenary');
  });

  it('cycles animations and resets a stale frame index', () => {
    const initial = { ...createCharacterPreviewState(), frameIndex: 5 };

    expect(cyclePreviewAnimation(initial, -1)).toMatchObject({
      animation: 'respawn',
      frameIndex: 0,
    });
    expect(cyclePreviewAnimation(initial, 1)).toMatchObject({
      animation: 'run',
      frameIndex: 0,
    });
  });

  it('steps frames in either direction within the selected animation', () => {
    const initial = createCharacterPreviewState();

    expect(cyclePreviewFrame(initial, -1).frameIndex).toBe(5);
    expect(cyclePreviewFrame(initial, 1).frameIndex).toBe(1);
  });

  it('toggles facing, playback, and hitbox visibility without mutating the input', () => {
    const initial = createCharacterPreviewState();

    expect(togglePreviewFacing(initial)).toMatchObject({ facing: 'left' });
    expect(togglePreviewPlayback(initial)).toMatchObject({ playing: false });
    expect(togglePreviewHitbox(initial)).toMatchObject({ showHitbox: true });
    expect(initial).toEqual(createCharacterPreviewState());
  });
});
