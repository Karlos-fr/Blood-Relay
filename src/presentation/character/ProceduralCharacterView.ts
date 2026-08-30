import type Phaser from 'phaser';
import type { PlayerPresentationState } from '../../gameplay/player/playerPresentationState';
import type { CharacterAppearance } from './CharacterAppearance';
import { CHARACTER_RENDER_ORDER, getRigAnchor } from './CharacterRig';
import { resolveAppearanceModules } from './characterModuleCatalog';
import { bakeModulePiece, type BakedModulePiece } from './characterModuleBaker';
import type { CharacterModulePieceDefinition } from './moduleGeometry';
import { PixelPoseAnimator } from './PixelPoseAnimator';

interface RenderPiece {
  definition: CharacterModulePieceDefinition;
  sprite: Phaser.GameObjects.Image;
  baked: Record<'left' | 'right', BakedModulePiece>;
}

export class ProceduralCharacterView {
  private readonly container: Phaser.GameObjects.Container;
  private readonly animator = new PixelPoseAnimator();
  private readonly pieces: RenderPiece[];

  public constructor(scene: Phaser.Scene, appearance: CharacterAppearance) {
    this.container = scene.add.container(0, 0).setDepth(10);

    const definitions = resolveAppearanceModules(appearance).flatMap((module) => module.pieces);
    definitions.sort(
      (a, b) => CHARACTER_RENDER_ORDER.indexOf(a.slot) - CHARACTER_RENDER_ORDER.indexOf(b.slot),
    );

    this.pieces = definitions.map((definition) => {
      const baked = {
        right: bakeModulePiece(scene, definition, appearance.palette, 'right'),
        left: bakeModulePiece(scene, definition, appearance.palette, 'left'),
      };
      const sprite = scene.add
        .image(0, 0, baked.right.textureKey)
        .setOrigin(baked.right.originX, baked.right.originY);
      this.container.add(sprite);
      return { definition, sprite, baked };
    });
  }

  public update(timeMs: number, state: PlayerPresentationState): void {
    const facing = state.facing < 0 ? ('left' as const) : ('right' as const);
    const frame = this.animator.update(timeMs, state);

    this.container.setPosition(Math.round(state.x), Math.round(state.y));

    for (const piece of this.pieces) {
      const baked = piece.baked[facing];
      const anchor = getRigAnchor(piece.definition.anchor, facing);
      const offset = frame.offsets[piece.definition.slot] ?? { x: 0, y: 0 };
      const sign = facing === 'left' ? -1 : 1;

      piece.sprite
        .setTexture(baked.textureKey)
        .setOrigin(baked.originX, baked.originY)
        .setPosition(anchor.x + offset.x * sign, anchor.y + offset.y);
    }
  }

  public destroy(): void {
    this.container.destroy(true);
  }
}
