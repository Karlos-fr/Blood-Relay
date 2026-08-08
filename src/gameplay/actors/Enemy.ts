import Phaser from 'phaser';
import { Health } from '../health/Health';
import { Player } from './Player';

interface EnemyConfig {
  maxHealth: number;
  speed: number;
  contactDamage: number;
  attackRangePx?: number;
  contactKnockback: number;
  attackCooldownMs: number;
  scoreValue: number;
}

export interface EnemyAttackContext {
  sourceProfileId: string;
  attackAt: number;
  damage: number;
  knockback: number;
}

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  public readonly health: Health;
  public readonly id: string;
  public readonly scoreValue: number;
  private readonly speed: number;
  private readonly contactDamage: number;
  private readonly attackRangePx: number;
  private readonly contactKnockback: number;
  private readonly attackCooldownMs: number;
  private lastAttackAt = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    id: string,
    config: EnemyConfig,
  ) {
    super(scene, x, y, texture);

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.id = id;
    this.health = new Health(id, {
      maxHealth: Math.max(1, Math.floor(config.maxHealth)),
      respawnInvulnerabilityMs: 0,
      damageInvulnerabilityMs: 0,
    });
    this.scoreValue = Math.max(0, Math.floor(config.scoreValue));
    this.speed = Math.max(20, Math.floor(config.speed));
    this.contactDamage = Math.max(1, Math.floor(config.contactDamage));
    this.attackRangePx = Math.max(12, Math.floor(config.attackRangePx ?? 26));
    this.contactKnockback = Math.max(0, Math.floor(config.contactKnockback));
    this.attackCooldownMs = Math.max(1, Math.floor(config.attackCooldownMs));

    this.setCollideWorldBounds(true);
    this.setDepth(5);
    this.setTint(0xe06d00);
    const body = this.body as Phaser.Physics.Arcade.Body | undefined;
    if (body) {
      body.setSize(34, 42);
      body.setOffset(4, 12);
      body.setAllowGravity(false);
      body.setBounce(0);
      body.setMaxVelocity(this.speed, 0);
      body.setDragX(500);
    }
  }

  public isDead(): boolean {
    return this.health.isDead();
  }

  public get sourceProfileId(): string {
    return this.id;
  }

  public updateMovement(target?: Player): void {
    if (this.health.isDead()) {
      const body = this.body as Phaser.Physics.Arcade.Body | undefined;
      if (body) {
        body.setVelocity(0, 0);
      }

      return;
    }

    if (!target || target.health.isDead()) {
      const body = this.body as Phaser.Physics.Arcade.Body | undefined;
      if (body) {
        body.setVelocityX(0);
      }
      return;
    }

    const direction = Math.sign(target.x - this.x);
    const body = this.body as Phaser.Physics.Arcade.Body | undefined;
    if (!body) {
      return;
    }

    const horizontalDelta = Math.abs(target.x - this.x);
    if (horizontalDelta <= 16) {
      body.setVelocityX(0);
      return;
    }

    body.setVelocityX(direction * this.speed);
    this.setFlipX(direction < 0);
  }

  public applyContactDamage(
    target: Player,
    now: number,
    context: EnemyAttackContext,
  ): boolean {
    if (this.health.isDead()) {
      return false;
    }

    if (target.health.isDead()) {
      return false;
    }

    if (now < this.lastAttackAt + this.attackCooldownMs) {
      return false;
    }

    const knockbackDirection = Math.sign(target.x - this.x) || 1;
    const damageApplied = target.takeDamage(
      context.damage,
      context.sourceProfileId,
      now,
      context.knockback,
      knockbackDirection === 0 ? 1 : knockbackDirection,
    );

    if (damageApplied) {
      this.lastAttackAt = now;
    }

    return damageApplied;
  }

  public attackContactDamage(now: number): number {
    if (now < this.lastAttackAt + this.attackCooldownMs) {
      return 0;
    }

    return this.contactDamage;
  }

  public get attackRange(): number {
    return this.attackRangePx;
  }

  public get knockback(): number {
    return this.contactKnockback;
  }

  public takeDamage(
    amount: number,
    sourceProfileId?: string,
    now = this.scene.time.now,
    knockbackForce = 0,
    knockbackDirection = 0,
  ): boolean {
    const normalizedDirection = knockbackDirection === 0 ? 1 : knockbackDirection;
    const damageApplied = this.health.takeDamage(amount, sourceProfileId, now);
    if (!damageApplied) {
      return false;
    }

    const body = this.body as Phaser.Physics.Arcade.Body | undefined;
    if (body && knockbackForce > 0) {
      body.setVelocityX(normalizedDirection * knockbackForce);
      body.setVelocityY(-Math.min(140, knockbackForce * 0.45));
    }

    if (this.health.isDead()) {
      const corpseTint = 0x603030;
      this.setTint(corpseTint);
      this.setVelocity(0, 0);
      this.setAlpha(0.65);
      body?.setEnable(false);
      this.disableBody(true, true);
    }

    return true;
  }
}
