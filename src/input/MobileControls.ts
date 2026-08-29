import Phaser from 'phaser';
import type { PlayerControls } from './playerControls';

type MobileAction = 'left' | 'right' | 'down' | 'jump';

interface TouchState {
  left: boolean;
  right: boolean;
  down: boolean;
  jumpDown: boolean;
  jumpPressed: boolean;
}

const BUTTON_COLOR = 0xe7474f;
const BUTTON_IDLE_ALPHA = 0.18;
const BUTTON_ACTIVE_ALPHA = 0.46;

export class MobileControls {
  public readonly controls: PlayerControls;
  public readonly isVisible: boolean;

  private readonly state: TouchState = {
    left: false,
    right: false,
    down: false,
    jumpDown: false,
    jumpPressed: false,
  };

  private readonly uiScale: number;

  public constructor(scene: Phaser.Scene) {
    this.uiScale = 1 / scene.cameras.main.zoom;
    this.isVisible = MobileControls.isTouchDevice();
    this.controls = {
      isLeftDown: () => this.state.left,
      isRightDown: () => this.state.right,
      isDownDown: () => this.state.down,
      consumeJumpPressed: () => {
        const pressed = this.state.jumpPressed;
        this.state.jumpPressed = false;
        return pressed;
      },
    };

    if (!this.isVisible) {
      return;
    }

    scene.input.addPointer(3);

    this.createButton(scene, 'left', 78, 446, 36, '←');
    this.createButton(scene, 'right', 158, 446, 36, '→');
    this.createButton(scene, 'down', 790, 446, 34, '↓');
    this.createButton(scene, 'jump', 878, 434, 42, '↑');
  }

  private static isTouchDevice(): boolean {
    return navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
  }

  private createButton(
    scene: Phaser.Scene,
    action: MobileAction,
    screenX: number,
    screenY: number,
    radius: number,
    label: string,
  ): void {
    const x = screenX * this.uiScale;
    const y = screenY * this.uiScale;

    const background = scene.add
      .circle(x, y, radius, BUTTON_COLOR, BUTTON_IDLE_ALPHA)
      .setStrokeStyle(2, 0xffffff, 0.28)
      .setScale(this.uiScale)
      .setScrollFactor(0)
      .setDepth(2000);

    scene.add
      .text(x, y - this.uiScale, label, {
        color: '#ffffffdd',
        fontFamily: 'monospace',
        fontSize: action === 'jump' ? '28px' : '24px',
      })
      .setOrigin(0.5)
      .setScale(this.uiScale)
      .setScrollFactor(0)
      .setDepth(2001);

    const zone = scene.add
      .zone(x, y, radius * 2.2, radius * 2.2)
      .setOrigin(0.5)
      .setScale(this.uiScale)
      .setScrollFactor(0)
      .setDepth(2002)
      .setInteractive();

    const activate = (): void => {
      background.setFillStyle(BUTTON_COLOR, BUTTON_ACTIVE_ALPHA);
      this.setAction(action, true);
    };

    const deactivate = (): void => {
      background.setFillStyle(BUTTON_COLOR, BUTTON_IDLE_ALPHA);
      this.setAction(action, false);
    };

    zone.on('pointerdown', activate);
    zone.on('pointerup', deactivate);
    zone.on('pointerout', deactivate);
  }

  private setAction(action: MobileAction, active: boolean): void {
    if (action === 'jump') {
      if (active && !this.state.jumpDown) {
        this.state.jumpPressed = true;
      }
      this.state.jumpDown = active;
      return;
    }

    this.state[action] = active;
  }
}
