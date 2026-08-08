import Phaser from 'phaser';

export interface HealthState {
  current: number;
  max: number;
}

export interface PlayerHealthPayload {
  playerId: string;
  amount: number;
  current: number;
  max: number;
  sourceProfileId?: string;
}

export interface PlayerKilledPayload {
  playerId: string;
}

export interface PlayerRespawnPayload {
  playerId: string;
}

export interface HealthOptions {
  maxHealth?: number;
  respawnInvulnerabilityMs?: number;
  damageInvulnerabilityMs?: number;
}

export class Health extends Phaser.Events.EventEmitter {
  private readonly maxHealth: number;
  private readonly respawnInvulnerabilityMs: number;
  private readonly damageInvulnerabilityMs: number;
  private invulnerableUntil = 0;
  private currentHealth: number;
  private dead = false;

  constructor(private readonly playerId: string, options: HealthOptions = {}) {
    super();
    this.maxHealth = Math.max(1, Math.floor(options.maxHealth ?? 100));
    this.respawnInvulnerabilityMs = Math.max(0, Math.floor(options.respawnInvulnerabilityMs ?? 700));
    this.damageInvulnerabilityMs = Math.max(0, Math.floor(options.damageInvulnerabilityMs ?? 350));
    this.currentHealth = this.maxHealth;
  }

  public get state(): HealthState {
    return {
      current: this.currentHealth,
      max: this.maxHealth,
    };
  }

  public isDead(): boolean {
    return this.dead;
  }

  public isInvulnerable(now: number): boolean {
    return now < this.invulnerableUntil;
  }

  public takeDamage(amount: number, sourceProfileId?: string, now = Date.now()): boolean {
    const value = Math.max(0, Math.floor(amount));
    if (value <= 0 || this.dead) {
      return false;
    }

    if (this.isInvulnerable(now)) {
      return false;
    }

    const nextHealth = Math.max(0, this.currentHealth - value);
    this.currentHealth = nextHealth;

    this.emit('playerDamaged', {
      playerId: this.playerId,
      amount: value,
      sourceProfileId,
      current: this.currentHealth,
      max: this.maxHealth,
    } as PlayerHealthPayload);

    if (this.currentHealth <= 0) {
      this.kill();
      return true;
    }

    this.invulnerableUntil = now + this.damageInvulnerabilityMs;
    return true;
  }

  public heal(amount: number): void {
    if (this.dead || amount <= 0) {
      return;
    }

    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + Math.max(0, Math.floor(amount)));
  }

  public losePassively(amount: number): number {
    const normalized = Math.max(0, Math.floor(amount));
    if (this.dead || normalized <= 0) {
      return 0;
    }

    const previousHealth = this.currentHealth;
    this.currentHealth = Math.max(0, this.currentHealth - normalized);

    if (this.currentHealth <= 0) {
      this.kill();
      return previousHealth;
    }

    return previousHealth - this.currentHealth;
  }

  public kill(): void {
    if (this.dead) {
      return;
    }

    this.dead = true;
    this.currentHealth = 0;
    this.emit('playerKilled', {
      playerId: this.playerId,
    } as PlayerKilledPayload);
  }

  public respawn(now = Date.now()): void {
    this.dead = false;
    this.currentHealth = this.maxHealth;
    this.invulnerableUntil = now + this.respawnInvulnerabilityMs;
    this.emit('playerRespawned', {
      playerId: this.playerId,
    } as PlayerRespawnPayload);
  }
}
