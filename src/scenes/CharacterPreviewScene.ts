import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/game';
import { CHARACTER_ANIMATIONS } from '../presentation/character/anatomy/anatomicalAnimations';
import {
  CHARACTER_BODY_HEIGHT,
  CHARACTER_BODY_WIDTH,
} from '../presentation/character/characterDimensions';
import { PREVIEW_APPEARANCES } from '../presentation/character/deterministicCharacter';
import {
  PREVIEW_APPEARANCE_NAMES,
  createCharacterPreviewState,
  cyclePreviewAnimation,
  cyclePreviewAppearance,
  cyclePreviewFrame,
  togglePreviewFacing,
  togglePreviewHitbox,
  togglePreviewPlayback,
  type CharacterPreviewState,
  type PreviewAppearanceName,
} from '../presentation/character/preview/characterPreviewModel';
import { installCharacterPreviewViewport } from '../presentation/character/preview/characterPreviewViewport';
import { bakeCharacterFrame } from '../presentation/character/rendering/characterFrameBaker';

const PREVIEW_SCALE = 5;
const ROW_BASELINE_Y = 198;
const ROW_X = [82, 192, 302, 412] as const;
const LARGE_PREVIEW_X = 870;
const LARGE_PREVIEW_BASELINE_Y = 422;

interface FighterThumbnail {
  name: PreviewAppearanceName;
  image: Phaser.GameObjects.Image;
  outline: Phaser.GameObjects.Rectangle;
}

export class CharacterPreviewScene extends Phaser.Scene {
  private state = createCharacterPreviewState();
  private thumbnails: FighterThumbnail[] = [];
  private largePreview?: Phaser.GameObjects.Image;
  private hitbox?: Phaser.GameObjects.Rectangle;
  private metadata?: Phaser.GameObjects.Text;
  private playButton?: Phaser.GameObjects.Text;
  private frameButtons: Phaser.GameObjects.Text[] = [];
  private nextFrameAt = 0;

  public constructor() {
    super('CharacterPreviewScene');
  }

  public init(): void {
    this.state = createCharacterPreviewState();
    this.thumbnails = [];
    this.largePreview = undefined;
    this.hitbox = undefined;
    this.metadata = undefined;
    this.playButton = undefined;
    this.frameButtons = [];
    this.nextFrameAt = 0;
  }

  public create(): void {
    installCharacterPreviewViewport(this.cameras.main, this.scale, this.events);
    this.cameras.main.setBackgroundColor(0x101218);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x101218);
    this.add.rectangle(255, 292, 470, 456, 0x171b24).setStrokeStyle(2, 0x303949);
    this.add.rectangle(807, 292, 550, 456, 0x0b0d12).setStrokeStyle(2, 0x303949);

    this.add.text(34, 26, 'PROCEDURAL FIGHTER PREVIEW', {
      color: '#f2d36b',
      fontFamily: 'monospace',
      fontSize: '22px',
      fontStyle: 'bold',
    });
    this.add.text(34, 58, 'Touch or click the controls to inspect every baked frame.', {
      color: '#9aa5b5',
      fontFamily: 'monospace',
      fontSize: '12px',
    });
    this.add.text(34, 95, 'ALL REPRESENTATIVE FAMILIES · NORMAL SCALE', {
      color: '#d1d8e5',
      fontFamily: 'monospace',
      fontSize: '12px',
    });
    this.add.text(536, 95, `SELECTED · ${PREVIEW_SCALE}× NEAREST-NEIGHBOR`, {
      color: '#d1d8e5',
      fontFamily: 'monospace',
      fontSize: '12px',
    });

    this.createThumbnails();
    this.largePreview = this.add.image(LARGE_PREVIEW_X, LARGE_PREVIEW_BASELINE_Y, '__MISSING');
    this.hitbox = this.add
      .rectangle(
        LARGE_PREVIEW_X,
        LARGE_PREVIEW_BASELINE_Y - (CHARACTER_BODY_HEIGHT * PREVIEW_SCALE) / 2,
        CHARACTER_BODY_WIDTH * PREVIEW_SCALE,
        CHARACTER_BODY_HEIGHT * PREVIEW_SCALE,
      )
      .setStrokeStyle(2, 0xffd166)
      .setVisible(false);
    this.metadata = this.add.text(536, 122, '', {
      color: '#b9c4d5',
      fontFamily: 'monospace',
      fontSize: '13px',
      lineSpacing: 5,
    });

    this.createControls();
    this.nextFrameAt = this.time.now + this.currentFrameDuration();
    this.renderState();
  }

  public update(time: number): void {
    if (!this.state.playing || time < this.nextFrameAt) return;

    do {
      this.state = cyclePreviewFrame(this.state, 1);
      this.nextFrameAt += this.currentFrameDuration();
    } while (time >= this.nextFrameAt);
    this.renderState();
  }

  private createThumbnails(): void {
    PREVIEW_APPEARANCE_NAMES.forEach((name, index) => {
      const x = ROW_X[index];
      const outline = this.add.rectangle(x, 171, 82, 112, 0x000000, 0).setStrokeStyle(1, 0x465164);
      const image = this.add.image(x, ROW_BASELINE_Y, '__MISSING');
      this.add
        .text(x, 222, name.toUpperCase(), {
          color: '#9aa5b5',
          fontFamily: 'monospace',
          fontSize: '10px',
        })
        .setOrigin(0.5, 0);
      this.thumbnails.push({ name, image, outline });
    });
  }

  private createControls(): void {
    this.createButton(34, 270, '◀ APPEARANCE', () => {
      this.applyState(cyclePreviewAppearance(this.state, -1));
    });
    this.createButton(250, 270, 'APPEARANCE ▶', () => {
      this.applyState(cyclePreviewAppearance(this.state, 1));
    });
    this.createButton(34, 316, '◀ ANIMATION', () => {
      this.applyState(cyclePreviewAnimation(this.state, -1));
    });
    this.createButton(250, 316, 'ANIMATION ▶', () => {
      this.applyState(cyclePreviewAnimation(this.state, 1));
    });
    this.createButton(34, 362, 'FLIP FACING', () => {
      this.applyState(togglePreviewFacing(this.state));
    });
    this.playButton = this.createButton(250, 362, 'PAUSE', () => {
      this.applyState(togglePreviewPlayback(this.state));
    });
    this.frameButtons = [
      this.createButton(34, 408, '◀ FRAME', () => {
        if (!this.state.playing) this.applyState(cyclePreviewFrame(this.state, -1));
      }),
      this.createButton(250, 408, 'FRAME ▶', () => {
        if (!this.state.playing) this.applyState(cyclePreviewFrame(this.state, 1));
      }),
    ];
    this.createButton(34, 454, 'TOGGLE HITBOX', () => {
      this.applyState(togglePreviewHitbox(this.state));
    });
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    onPress: () => void,
  ): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, label, {
        color: '#f4f7fb',
        backgroundColor: '#303949',
        fontFamily: 'monospace',
        fontSize: '14px',
        padding: { x: 12, y: 9 },
      })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', onPress);
  }

  private applyState(state: CharacterPreviewState): void {
    this.state = state;
    this.nextFrameAt = this.time.now + this.currentFrameDuration();
    this.renderState();
  }

  private renderState(): void {
    for (const thumbnail of this.thumbnails) {
      this.applyFrame(thumbnail.image, thumbnail.name, 1);
      const selected = thumbnail.name === this.state.appearance;
      thumbnail.outline.setStrokeStyle(selected ? 3 : 1, selected ? 0xf2d36b : 0x465164);
    }

    if (this.largePreview) this.applyFrame(this.largePreview, this.state.appearance, PREVIEW_SCALE);
    this.hitbox?.setVisible(this.state.showHitbox);
    this.playButton?.setText(this.state.playing ? 'PAUSE' : 'PLAY');
    for (const button of this.frameButtons) button.setAlpha(this.state.playing ? 0.4 : 1);

    const appearance = PREVIEW_APPEARANCES[this.state.appearance];
    const frameCount = CHARACTER_ANIMATIONS[this.state.animation].frames.length;
    this.metadata?.setText([
      `family       ${this.state.appearance.toUpperCase()}`,
      `seed         0x${(appearance.seed >>> 0).toString(16).padStart(8, '0').toUpperCase()}`,
      `animation    ${this.state.animation.toUpperCase()}`,
      `frame index  ${this.state.frameIndex} / ${frameCount - 1}`,
      `facing       ${this.state.facing.toUpperCase()}`,
      `hitbox       ${CHARACTER_BODY_WIDTH} × ${CHARACTER_BODY_HEIGHT}`,
    ]);
  }

  private applyFrame(
    image: Phaser.GameObjects.Image,
    appearanceName: PreviewAppearanceName,
    scale: number,
  ): void {
    const baked = bakeCharacterFrame(
      this,
      PREVIEW_APPEARANCES[appearanceName],
      this.state.animation,
      this.state.frameIndex,
      this.state.facing,
    );
    this.textures.get(baked.textureKey).setFilter(Phaser.Textures.FilterMode.NEAREST);
    image.setTexture(baked.textureKey).setOrigin(baked.originX, baked.originY).setScale(scale);
  }

  private currentFrameDuration(): number {
    return CHARACTER_ANIMATIONS[this.state.animation].frames[this.state.frameIndex].durationMs;
  }
}
