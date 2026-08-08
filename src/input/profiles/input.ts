export type ActionName =
  | 'left'
  | 'right'
  | 'jump'
  | 'down'
  | 'shoot'
  | 'melee'
  | 'dodge'
  | 'transfusion'
  | 'interact'
  | 'join'
  | 'leave';

export interface ActionInputState {
  isDown: boolean;
  consumeJustDown(): boolean;
  refresh(): void;
}

export class DigitalActionInput implements ActionInputState {
  public isDown = false;
  private previousDown = false;
  private justDown = false;

  constructor(private readonly read: () => boolean) {}

  public refresh(): void {
    const next = !!this.read();
    this.justDown = next && !this.previousDown;
    this.isDown = next;
    this.previousDown = next;
  }

  public consumeJustDown(): boolean {
    const value = this.justDown;
    this.justDown = false;
    return value;
  }
}

export interface InputProfile {
  id: string;
  label: string;
  source: 'keyboard' | 'gamepad' | 'bot';
  actions: Record<ActionName, ActionInputState>;
  update(): void;
  vibrate?: (strength?: number, durationMs?: number) => void;
}
