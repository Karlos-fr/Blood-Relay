import Phaser from 'phaser';
import {
  ARENA_CAMERA_ZOOM,
  ARENA_HEIGHT,
  ARENA_WIDTH,
  FLOOR_HEIGHT,
  PLATFORM_HEIGHT,
  PLATFORM_LAYOUT,
  SPAWN_POINTS,
} from '../config/arena';
import { GAME_VERSION } from '../config/game';
import { Player } from '../gameplay/player/Player';
import { createKeyboardProfile } from '../input/keyboardProfiles';
import { MobileControls } from '../input/MobileControls';
import { combinePlayerControls } from '../input/playerControls';

export class ArenaScene extends Phaser.Scene {
  private players: Player[] = [];
  private platforms: Phaser.GameObjects.Rectangle[] = [];
  private floor?: Phaser.GameObjects.Rectangle;
  private debugGraphics?: Phaser.GameObjects.Graphics;
  private debugText?: Phaser.GameObjects.Text;
  private debugKey?: Phaser.Input.Keyboard.Key;
  private debugEnabled = false;

  public constructor() {
    super('ArenaScene');
  }

  public create(): void {
    this.configureWorld();
    this.drawArenaBackdrop();

    this.floor = this.createStaticSurface(
      ARENA_WIDTH / 2,
      ARENA_HEIGHT - FLOOR_HEIGHT / 2,
      ARENA_WIDTH,
      FLOOR_HEIGHT,
      0x252530,
    );

    this.platforms = PLATFORM_LAYOUT.map((platform) =>
      this.createStaticSurface(
        platform.x,
        platform.y,
        platform.width,
        PLATFORM_HEIGHT,
        0x343442,
      ),
    );

    const playerOneProfile = createKeyboardProfile(this, 0);
    const playerTwoProfile = createKeyboardProfile(this, 1);
    const mobileControls = new MobileControls(this);

    const playerOne = new Player(this, {
      id: 1,
      ...SPAWN_POINTS[0],
      color: 0xe7474f,
      controls: mobileControls.isVisible
        ? combinePlayerControls(playerOneProfile.controls, mobileControls.controls)
        : playerOneProfile.controls,
    });

    const playerTwo = new Player(this, {
      id: 2,
      ...SPAWN_POINTS[1],
      color: 0x36a9e1,
      controls: playerTwoProfile.controls,
    });

    this.players = [playerOne, playerTwo];

    for (const player of this.players) {
      this.physics.add.collider(player.gameObject, this.floor);

      for (const platform of this.platforms) {
        this.physics.add.collider(
          player.gameObject,
          platform,
          undefined,
          () => player.shouldCollideWithPlatform(platform, this.time.now),
        );
      }
    }

    this.physics.add.collider(playerOne.gameObject, playerTwo.gameObject);

    this.debugGraphics = this.add.graphics().setDepth(1000).setVisible(false);
    this.debugText = this.add
      .text(16, 16, '', {
        color: '#c9ff7a',
        fontFamily: 'monospace',
        fontSize: '12px',
        backgroundColor: '#09090fcc',
        padding: { x: 6, y: 4 },
      })
      .setDepth(1001)
      .setVisible(false);

    this.debugKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.F1);
  }

  public update(time: number): void {
    if (this.debugKey && Phaser.Input.Keyboard.JustDown(this.debugKey)) {
      this.debugEnabled = !this.debugEnabled;
      this.debugGraphics?.setVisible(this.debugEnabled);
      this.debugText?.setVisible(this.debugEnabled);
    }

    for (const player of this.players) {
      player.update(time);
    }

    if (this.debugEnabled) {
      this.drawCollisionDebug();
    }
  }

  private configureWorld(): void {
    const camera = this.cameras.main;
    camera.setBackgroundColor(0x09090f);
    camera.setBounds(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
    camera.setZoom(ARENA_CAMERA_ZOOM);
    camera.centerOn(ARENA_WIDTH / 2, ARENA_HEIGHT / 2);

    this.physics.world.setBounds(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
  }

  private createStaticSurface(
    x: number,
    y: number,
    width: number,
    height: number,
    color: number,
  ): Phaser.GameObjects.Rectangle {
    const surface = this.add.rectangle(x, y, width, height, color).setDepth(5);
    this.physics.add.existing(surface, true);
    return surface;
  }

  private drawArenaBackdrop(): void {
    this.add.rectangle(ARENA_WIDTH / 2, ARENA_HEIGHT / 2, ARENA_WIDTH, ARENA_HEIGHT, 0x0d0d15);

    const grid = this.add.graphics().setDepth(1);
    grid.lineStyle(1, 0x20202c, 0.35);

    for (let x = 0; x <= ARENA_WIDTH; x += 60) {
      grid.lineBetween(x, 0, x, ARENA_HEIGHT - FLOOR_HEIGHT);
    }

    for (let y = 0; y < ARENA_HEIGHT - FLOOR_HEIGHT; y += 60) {
      grid.lineBetween(0, y, ARENA_WIDTH, y);
    }
  }

  private drawCollisionDebug(): void {
    const graphics = this.debugGraphics;
    const text = this.debugText;

    if (!graphics || !text || !this.floor) {
      return;
    }

    graphics.clear();
    graphics.lineStyle(2, 0x8cff66, 0.9);

    for (const surface of [this.floor, ...this.platforms]) {
      const bounds = surface.getBounds();
      graphics.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
    }

    graphics.lineStyle(2, 0xffd166, 0.95);
    for (const player of this.players) {
      const bounds = player.gameObject.getBounds();
      graphics.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
    }

    const playerLines = this.players.map(
      (player, index) =>
        `P${index + 1} ${player.movementState}  vx=${Math.round(player.body.velocity.x)}  vy=${Math.round(player.body.velocity.y)}  face=${player.facingDirection > 0 ? '→' : '←'}`,
    );

    text.setText([
      `v${GAME_VERSION} · arena ${ARENA_WIDTH}×${ARENA_HEIGHT} · zoom ${ARENA_CAMERA_ZOOM}`,
      ...playerLines,
    ]);
  }
}
