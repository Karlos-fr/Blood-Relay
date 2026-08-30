import type Phaser from 'phaser';
import { PLAYER_HEIGHT } from '../../gameplay/player/playerGeometry';
import type { PlayerPresentationState } from '../../gameplay/player/playerPresentationState';
import type { CharacterAppearance } from './CharacterAppearance';
import { PixelPoseAnimator } from './PixelPoseAnimator';
import { bakeCharacterFrame } from './rendering/characterFrameBaker';

export class ProceduralCharacterView {
  private readonly image: Phaser.GameObjects.Image;
  private readonly animator = new PixelPoseAnimator();
  private readonly scene: Phaser.Scene;
  private readonly appearance: CharacterAppearance;

  public constructor(scene: Phaser.Scene, appearance: CharacterAppearance) {
    this.scene = scene;
    this.appearance = appearance;
    this.image = scene.add.image(0, 0, '__MISSING').setDepth(10);
  }

  public update(timeMs: number, state: PlayerPresentationState): void {
    const facing = state.facing < 0 ? ('left' as const) : ('right' as const);
    const selection = this.animator.update(timeMs, state);
    this.image.setPosition(Math.round(state.x), Math.round(state.y + PLAYER_HEIGHT / 2));

    const baked = bakeCharacterFrame(
      this.scene,
      this.appearance,
      selection.animationName,
      selection.frameIndex,
      facing,
    );
    this.image.setTexture(baked.textureKey).setOrigin(baked.originX, baked.originY);
  }

  public destroy(): void {
    this.image.destroy();
  }
}
