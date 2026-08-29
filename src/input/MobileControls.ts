import type Phaser from 'phaser';
import { isMobileDevice } from '../platform/device';
import type { PlayerControls } from './playerControls';
import './mobileControls.css';

type MobileAction = 'left' | 'right' | 'down' | 'jump';

interface TouchState {
  left: boolean;
  right: boolean;
  down: boolean;
  jumpDown: boolean;
  jumpPressed: boolean;
}

const BUTTON_LABELS: Record<MobileAction, string> = {
  left: '←',
  right: '→',
  down: '↓',
  jump: '↑',
};

const BUTTON_ARIA_LABELS: Record<MobileAction, string> = {
  left: 'Aller à gauche',
  right: 'Aller à droite',
  down: 'Descendre',
  jump: 'Sauter',
};

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

  private overlay?: HTMLDivElement;

  public constructor(scene: Phaser.Scene) {
    this.isVisible = isMobileDevice();
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

    const gameRoot = document.getElementById('game');
    if (!gameRoot) {
      throw new Error('Mobile controls require the #game root element.');
    }

    this.overlay = document.createElement('div');
    this.overlay.className = 'mobile-controls';

    const leftCluster = this.createCluster('left');
    leftCluster.append(this.createButton('left'), this.createButton('right'));

    const rightCluster = this.createCluster('right');
    rightCluster.append(this.createButton('down'), this.createButton('jump'));

    this.overlay.append(leftCluster, rightCluster);
    gameRoot.append(this.overlay);

    window.addEventListener('blur', this.releaseAll);
    scene.events.once('shutdown', this.destroy, this);
    scene.events.once('destroy', this.destroy, this);
  }

  private createCluster(side: 'left' | 'right'): HTMLDivElement {
    const cluster = document.createElement('div');
    cluster.className = `mobile-controls__cluster mobile-controls__cluster--${side}`;
    return cluster;
  }

  private createButton(action: MobileAction): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mobile-controls__button';
    button.textContent = BUTTON_LABELS[action];
    button.setAttribute('aria-label', BUTTON_ARIA_LABELS[action]);
    button.tabIndex = -1;

    if (action === 'jump') {
      button.classList.add('mobile-controls__button--jump');
    }

    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      button.dataset.active = 'true';
      this.setAction(action, true);
    });

    const release = (event: PointerEvent): void => {
      event.preventDefault();
      button.dataset.active = 'false';
      this.setAction(action, false);
    };

    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release);
    button.addEventListener('contextmenu', (event) => event.preventDefault());

    return button;
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

  private readonly releaseAll = (): void => {
    this.state.left = false;
    this.state.right = false;
    this.state.down = false;
    this.state.jumpDown = false;
    this.overlay
      ?.querySelectorAll<HTMLButtonElement>('.mobile-controls__button')
      .forEach((button) => {
        button.dataset.active = 'false';
      });
  };

  private destroy(): void {
    window.removeEventListener('blur', this.releaseAll);
    this.releaseAll();
    this.overlay?.remove();
    this.overlay = undefined;
  }
}
