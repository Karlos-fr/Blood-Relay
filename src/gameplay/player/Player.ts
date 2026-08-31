import Phaser from 'phaser';
import { ARENA_CONTENT_SCALE } from '../../config/arenaScale';
import type { PlayerControls } from '../../input/playerControls';
import { PLAYER_HEIGHT, PLAYER_WIDTH } from './playerGeometry';
import type { PlayerPresentationState } from './playerPresentationState';
import {
  getFacingDirection,
  getHorizontalIntent,
  getReleasedJumpVelocity,
  PLAYER_ACCELERATION,
  PLAYER_DRAG,
  PLAYER_JUMP_SPEED,
  PLAYER_MOVE_SPEED,
  type FacingDirection,
} from './movement';

const DROP_THROUGH_MS = 220;
const PLATFORM_LANDING_TOLERANCE = 13.5 * ARENA_CONTENT_SCALE;
const MAX_FALL_SPEED = 675 * ARENA_CONTENT_SCALE;
const DROP_THROUGH_SPEED = 67.5 * ARENA_CONTENT_SCALE;
const LABEL_OFFSET = 7;
const LABEL_FONT_SIZE = 9;

export type PlayerMovementState = 'grounded' | 'airborne';

export interface PlayerConfig {
  id: 1 | 2;
  x: number;
  y: number;
  controls: PlayerControls;
}

export class Player {
  public readonly gameObject: Phaser.GameObjects.Rectangle;
  public readonly body: Phaser.Physics.Arcade.Body;

  private readonly controls: PlayerControls;
  private readonly label: Phaser.GameObjects.Text;
  private facing: FacingDirection;
  private dropThroughUntil = 0;

  public constructor(scene: Phaser.Scene, config: PlayerConfig) {
    this.controls = config.controls;
    this.facing = config.id === 1 ? 1 : -1;

    this.gameObject = scene.add
      .rectangle(config.x, config.y, PLAYER_WIDTH, PLAYER_HEIGHT, 0x000000, 0)
      .setVisible(false)
      .setDepth(10);

    scene.physics.add.existing(this.gameObject);
    this.body = this.gameObject.body as Phaser.Physics.Arcade.Body;
    this.body.setCollideWorldBounds(true);
    this.body.setMaxVelocity(PLAYER_MOVE_SPEED, MAX_FALL_SPEED);
    this.body.setDragX(PLAYER_DRAG);
    this.body.setSize(PLAYER_WIDTH, PLAYER_HEIGHT, true);

    this.label = scene.add
      .text(config.x, config.y - PLAYER_HEIGHT / 2 - LABEL_OFFSET, `P${config.id}`, {
        color: '#ffffff',
        fontFamily: 'monospace',
        fontSize: `${LABEL_FONT_SIZE}px`,
      })
      .setOrigin(0.5)
      .setDepth(11);

    this.syncDecorations();
  }

  public update(time: number): void {
    const intent = getHorizontalIntent(this.controls.isLeftDown(), this.controls.isRightDown());
    this.body.setAccelerationX(intent * PLAYER_ACCELERATION);
    this.facing = getFacingDirection(intent, this.facing);

    const jumpPressed = this.controls.consumeJumpPressed();

    if (jumpPressed && this.controls.isDownDown() && this.isGrounded) {
      this.dropThroughUntil = time + DROP_THROUGH_MS;
      this.body.setVelocityY(DROP_THROUGH_SPEED);
    } else if (jumpPressed && this.isGrounded) {
      this.body.setVelocityY(-PLAYER_JUMP_SPEED);
    }

    if (!this.controls.isJumpDown() && this.body.velocity.y < 0) {
      this.body.setVelocityY(getReleasedJumpVelocity(this.body.velocity.y));
    }

    this.syncDecorations();
  }

  public shouldCollideWithPlatform(platform: Phaser.GameObjects.Rectangle, time: number): boolean {
    if (time < this.dropThroughUntil || this.body.velocity.y < 0) {
      return false;
    }

    const platformBody = platform.body as Phaser.Physics.Arcade.StaticBody;
    return this.body.bottom <= platformBody.top + PLATFORM_LANDING_TOLERANCE;
  }

  public get isGrounded(): boolean {
    return this.body.blocked.down || this.body.touching.down;
  }

  public get movementState(): PlayerMovementState {
    return this.isGrounded ? 'grounded' : 'airborne';
  }

  public get facingDirection(): FacingDirection {
    return this.facing;
  }

  public get presentationState(): PlayerPresentationState {
    return {
      x: this.gameObject.x,
      y: this.gameObject.y,
      facing: this.facing,
      grounded: this.isGrounded,
      velocityX: this.body.velocity.x,
      velocityY: this.body.velocity.y,
    };
  }

  private syncDecorations(): void {
    this.label.setPosition(this.gameObject.x, this.gameObject.y - PLAYER_HEIGHT / 2 - LABEL_OFFSET);
  }
}
