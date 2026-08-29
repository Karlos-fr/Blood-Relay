import Phaser from 'phaser';
import type { PlayerControls } from '../../input/keyboardProfiles';
import {
  getFacingDirection,
  getHorizontalIntent,
  PLAYER_ACCELERATION,
  PLAYER_DRAG,
  PLAYER_JUMP_SPEED,
  PLAYER_MOVE_SPEED,
  type FacingDirection,
} from './movement';

const PLAYER_WIDTH = 30;
const PLAYER_HEIGHT = 46;
const DROP_THROUGH_MS = 220;
const PLATFORM_LANDING_TOLERANCE = 18;

export type PlayerMovementState = 'grounded' | 'airborne';

export interface PlayerConfig {
  id: 1 | 2;
  x: number;
  y: number;
  color: number;
  controls: PlayerControls;
}

export class Player {
  public readonly gameObject: Phaser.GameObjects.Rectangle;
  public readonly body: Phaser.Physics.Arcade.Body;

  private readonly controls: PlayerControls;
  private readonly facingMarker: Phaser.GameObjects.Rectangle;
  private readonly label: Phaser.GameObjects.Text;
  private facing: FacingDirection;
  private dropThroughUntil = 0;

  public constructor(scene: Phaser.Scene, config: PlayerConfig) {
    this.controls = config.controls;
    this.facing = config.id === 1 ? 1 : -1;

    this.gameObject = scene.add
      .rectangle(config.x, config.y, PLAYER_WIDTH, PLAYER_HEIGHT, config.color)
      .setStrokeStyle(2, 0xffffff, 0.35)
      .setDepth(10);

    scene.physics.add.existing(this.gameObject);
    this.body = this.gameObject.body as Phaser.Physics.Arcade.Body;
    this.body.setCollideWorldBounds(true);
    this.body.setMaxVelocity(PLAYER_MOVE_SPEED, 900);
    this.body.setDragX(PLAYER_DRAG);
    this.body.setSize(PLAYER_WIDTH, PLAYER_HEIGHT, true);

    this.facingMarker = scene.add
      .rectangle(config.x, config.y, 10, 4, 0xffffff)
      .setDepth(11);

    this.label = scene.add
      .text(config.x, config.y - PLAYER_HEIGHT / 2 - 12, `P${config.id}`, {
        color: '#ffffff',
        fontFamily: 'monospace',
        fontSize: '11px',
      })
      .setOrigin(0.5)
      .setDepth(11);

    this.syncDecorations();
  }

  public update(time: number): void {
    const intent = getHorizontalIntent(this.controls.left.isDown, this.controls.right.isDown);
    this.body.setAccelerationX(intent * PLAYER_ACCELERATION);
    this.facing = getFacingDirection(intent, this.facing);

    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.controls.jump);

    if (jumpPressed && this.controls.down.isDown && this.isGrounded) {
      this.dropThroughUntil = time + DROP_THROUGH_MS;
      this.body.setVelocityY(90);
    } else if (jumpPressed && this.isGrounded) {
      this.body.setVelocityY(-PLAYER_JUMP_SPEED);
    }

    this.syncDecorations();
  }

  public shouldCollideWithPlatform(
    platform: Phaser.GameObjects.Rectangle,
    time: number,
  ): boolean {
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

  private syncDecorations(): void {
    this.facingMarker.setPosition(
      this.gameObject.x + this.facing * (PLAYER_WIDTH / 2 + 4),
      this.gameObject.y - 4,
    );
    this.label.setPosition(this.gameObject.x, this.gameObject.y - PLAYER_HEIGHT / 2 - 12);
  }
}
