import { describe, expect, it } from 'vitest';
import {
  ARMOR_IDS,
  ARMS_IDS,
  BODY_IDS,
  HEAD_IDS,
  LEGS_IDS,
  MUTATION_IDS,
  TORSO_IDS,
} from './CharacterAppearance';
import { CHARACTER_ANIMATIONS } from './anatomy/anatomicalAnimations';
import { PREVIEW_APPEARANCES } from './deterministicCharacter';
import { PixelCanvas } from './frame/PixelCanvas';
import { ARMOR_MODULES } from './modules/armor';
import { ARMS_MODULES } from './modules/arms';
import { BODY_MODULES } from './modules/bodies';
import { HEAD_MODULES } from './modules/heads';
import { LEGS_MODULES } from './modules/legs';
import { MUTATION_MODULES } from './modules/mutations';
import { TORSO_MODULES } from './modules/torsos';

const poseFrame = CHARACTER_ANIMATIONS.idle.frames[0];

describe('landmark-aware fighter body library', () => {
  it('implements every body-overlay id as a landmark-aware renderer', () => {
    expect(Object.keys(HEAD_MODULES).sort()).toEqual([...HEAD_IDS].sort());
    expect(Object.keys(TORSO_MODULES).sort()).toEqual([...TORSO_IDS].sort());
    expect(Object.keys(LEGS_MODULES).sort()).toEqual([...LEGS_IDS].sort());
    expect(Object.keys(ARMS_MODULES).sort()).toEqual([...ARMS_IDS].sort());

    for (const module of [
      ...Object.values(HEAD_MODULES),
      ...Object.values(TORSO_MODULES),
      ...Object.values(LEGS_MODULES),
      ...Object.values(ARMS_MODULES),
    ]) {
      expect(typeof module.renderRight).toBe('function');
      expect(['rearBody', 'body', 'frontBody']).toContain(module.layer);
    }
  });

  it('implements every body, armor, and mutation id as a renderer', () => {
    expect(Object.keys(BODY_MODULES).sort()).toEqual([...BODY_IDS].sort());
    expect(Object.keys(ARMOR_MODULES).sort()).toEqual([...ARMOR_IDS].sort());
    expect(Object.keys(MUTATION_MODULES).sort()).toEqual([...MUTATION_IDS].sort());

    for (const module of [
      ...Object.values(BODY_MODULES),
      ...Object.values(ARMOR_MODULES),
      ...Object.values(MUTATION_MODULES),
    ]) {
      expect(typeof module.renderRight).toBe('function');
    }
  });

  it('keeps body variants as body-layer shading without changing the anatomical mask', () => {
    for (const module of Object.values(BODY_MODULES)) {
      const canvas = new PixelCanvas(48, 56);
      const appearance = PREVIEW_APPEARANCES.clone;
      module.renderRight({
        canvas,
        pose: poseFrame.pose,
        appearance,
        seed: appearance.seed,
        accessoryPhase: poseFrame.accessoryPhase,
      });

      expect(module.layer).toBe('body');
      expect(canvas.snapshot().bodyMask.some(Boolean)).toBe(false);
      expect(canvas.snapshot().pixels.some((pixel) => pixel !== null)).toBe(true);
    }
  });

  it('paints overlays through the current anatomical landmarks', () => {
    const appearance = PREVIEW_APPEARANCES.mixed;
    const context = {
      canvas: new PixelCanvas(48, 56),
      pose: poseFrame.pose,
      appearance,
      seed: appearance.seed,
      accessoryPhase: poseFrame.accessoryPhase,
    } as const;

    HEAD_MODULES[appearance.head].renderRight(context);
    TORSO_MODULES[appearance.torso].renderRight(context);
    LEGS_MODULES[appearance.legs].renderRight(context);
    ARMS_MODULES[appearance.arms].renderRight(context);

    for (const point of [
      context.pose.headCenter,
      context.pose.neck,
      context.pose.shoulderRear,
      context.pose.shoulderFront,
      context.pose.handRear,
      context.pose.handFront,
      context.pose.hipRear,
      context.pose.hipFront,
      context.pose.kneeRear,
      context.pose.kneeFront,
      context.pose.footRear,
      context.pose.footFront,
    ]) {
      expect(context.canvas.getPixel(point.x, point.y)).not.toBeNull();
    }

    expect([49, 50, 51].every((y) => context.canvas.getPixel(context.pose.footFront.x, y))).toBe(
      true,
    );
  });
});
