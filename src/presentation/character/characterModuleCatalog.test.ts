import { describe, expect, it } from 'vitest';
import {
  ACCESSORY_IDS,
  ARMOR_IDS,
  ARMS_IDS,
  BODY_IDS,
  HEAD_IDS,
  LEGS_IDS,
  MUTATION_IDS,
  TORSO_IDS,
  WEAPON_IDS,
  type CharacterAppearance,
} from './CharacterAppearance';
import { CHARACTER_ANIMATIONS } from './anatomy/anatomicalAnimations';
import {
  getAllCharacterRenderModules,
  resolveAppearanceRenderModules,
} from './characterModuleCatalog';
import { PREVIEW_APPEARANCES } from './deterministicCharacter';
import { PixelCanvas } from './frame/PixelCanvas';
import { ACCESSORY_MODULES } from './modules/accessories';
import { ARMOR_MODULES } from './modules/armor';
import { BODY_MODULES } from './modules/bodies';
import { MUTATION_MODULES } from './modules/mutations';
import { WEAPON_MODULES } from './modules/weapons';
import { CHARACTER_RENDER_LAYERS } from './rendering/CharacterRenderModule';

const poseFrame = CHARACTER_ANIMATIONS.idle.frames[0];

function renderSignature(
  appearance: (typeof PREVIEW_APPEARANCES)[keyof typeof PREVIEW_APPEARANCES],
) {
  const canvas = new PixelCanvas(48, 56);
  const context = {
    canvas,
    pose: poseFrame.pose,
    appearance,
    seed: appearance.seed,
    accessoryPhase: poseFrame.accessoryPhase,
  } as const;
  for (const module of resolveAppearanceRenderModules(appearance)) module.renderRight(context);
  return canvas.snapshot().pixels.join(',');
}

describe('complete character module catalog', () => {
  it('exposes render modules without detached piece data', () => {
    for (const module of getAllCharacterRenderModules()) {
      expect('pieces' in module).toBe(false);
      expect('renderRight' in module).toBe(true);
    }
  });

  it('implements every body, armor, mutation, accessory, and weapon id', () => {
    expect(Object.keys(BODY_MODULES).sort()).toEqual([...BODY_IDS].sort());
    expect(Object.keys(ARMOR_MODULES).sort()).toEqual([...ARMOR_IDS].sort());
    expect(Object.keys(MUTATION_MODULES).sort()).toEqual([...MUTATION_IDS].sort());
    expect(Object.keys(ACCESSORY_MODULES).sort()).toEqual([...ACCESSORY_IDS].sort());
    expect(Object.keys(WEAPON_MODULES).sort()).toEqual([...WEAPON_IDS].sort());
  });

  it('resolves appearance modules in semantic layer order', () => {
    const modules = resolveAppearanceRenderModules(PREVIEW_APPEARANCES.mixed);
    const indexes = modules.map((module) => CHARACTER_RENDER_LAYERS.indexOf(module.layer));
    expect(indexes).toEqual([...indexes].sort((a, b) => a - b));
  });

  it('preserves appearance order for accessories sharing a layer', () => {
    const appearance: CharacterAppearance = {
      ...PREVIEW_APPEARANCES.clone,
      accessories: ['blood-bag', 'dorsal-tube', 'medical-pack'],
    };
    const rearAccessories = resolveAppearanceRenderModules(appearance).filter(
      (module) => module.layer === 'rearAccessory',
    );
    expect(rearAccessories.map((module) => module.id)).toEqual([
      'blood-bag',
      'dorsal-tube',
      'medical-pack',
    ]);
  });

  it('keeps every preview family materially distinct', () => {
    const signatures = Object.values(PREVIEW_APPEARANCES).map(renderSignature);
    expect(new Set(signatures).size).toBe(signatures.length);
  });

  it('keeps body-build shading visible after complete module composition in every pose', () => {
    const erasedCases: string[] = [];

    for (const body of BODY_IDS) {
      const appearance: CharacterAppearance = {
        ...PREVIEW_APPEARANCES.clone,
        body,
        armor: 'none',
        mutation: 'none',
        accessories: [],
      };

      for (const [animationName, animation] of Object.entries(CHARACTER_ANIMATIONS)) {
        animation.frames.forEach((frame, frameIndex) => {
          const withBody = new PixelCanvas(48, 56);
          const withoutBody = new PixelCanvas(48, 56);
          const modules = resolveAppearanceRenderModules(appearance);

          for (const module of modules) {
            const context = {
              pose: frame.pose,
              appearance,
              seed: appearance.seed,
              accessoryPhase: frame.accessoryPhase,
            } as const;
            module.renderRight({ ...context, canvas: withBody });
            if (module !== BODY_MODULES[body]) {
              module.renderRight({ ...context, canvas: withoutBody });
            }
          }

          if (withBody.snapshot().pixels.join(',') === withoutBody.snapshot().pixels.join(',')) {
            erasedCases.push(`${body}:${animationName}:${frameIndex}`);
          }
        });
      }
    }

    expect(erasedCases).toEqual([]);
  });

  it('uses four deterministic dorsal-tube paths', () => {
    const snapshots = ([0, 1, 2, 3] as const).map((accessoryPhase) => {
      const canvas = new PixelCanvas(48, 56);
      const appearance = PREVIEW_APPEARANCES.clone;
      ACCESSORY_MODULES['dorsal-tube'].renderRight({
        canvas,
        pose: poseFrame.pose,
        appearance,
        seed: appearance.seed,
        accessoryPhase,
      });
      return canvas.snapshot().pixels.join(',');
    });
    expect(new Set(snapshots).size).toBe(4);
  });

  it('overlaps every accessory with its anatomical attachment landmark', () => {
    const attachments = [
      ['blood-bag', poseFrame.pose.hipRear],
      ['dorsal-tube', poseFrame.pose.shoulderRear],
      ['medical-pack', poseFrame.pose.shoulderRear],
      ['shoulder-plate', poseFrame.pose.shoulderFront],
      ['external-implant', poseFrame.pose.shoulderFront],
      ['holster', poseFrame.pose.hipFront],
    ] as const;

    for (const [id, attachment] of attachments) {
      const canvas = new PixelCanvas(48, 56);
      const appearance = PREVIEW_APPEARANCES.clone;
      ACCESSORY_MODULES[id].renderRight({
        canvas,
        pose: poseFrame.pose,
        appearance,
        seed: appearance.seed,
        accessoryPhase: poseFrame.accessoryPhase,
      });
      expect(canvas.getPixel(attachment.x, attachment.y)).not.toBeNull();
    }
  });

  it('attaches the relay pistol to both weapon and hand landmarks', () => {
    const canvas = new PixelCanvas(48, 56);
    const appearance = PREVIEW_APPEARANCES.mixed;
    WEAPON_MODULES['relay-pistol'].renderRight({
      canvas,
      pose: poseFrame.pose,
      appearance,
      seed: appearance.seed,
      accessoryPhase: poseFrame.accessoryPhase,
    });
    expect(
      canvas.getPixel(poseFrame.pose.weaponMount.x, poseFrame.pose.weaponMount.y),
    ).not.toBeNull();
    expect(canvas.getPixel(poseFrame.pose.handFront.x, poseFrame.pose.handFront.y)).not.toBeNull();
  });

  it('returns every renderer once', () => {
    const renderModules = getAllCharacterRenderModules();
    expect(renderModules).toHaveLength(
      BODY_IDS.length +
        ARMOR_IDS.length +
        MUTATION_IDS.length +
        ACCESSORY_IDS.length +
        WEAPON_IDS.length +
        HEAD_IDS.length +
        TORSO_IDS.length +
        LEGS_IDS.length +
        ARMS_IDS.length,
    );

  });
});
