import Phaser from 'phaser';
import { InputProfile } from '../../input/profiles/input';
import { PLAYER_SPRITE_SIZE } from '../../app/config/artDirection';
import { Weapon, revolverWeapon } from '../combat/weapons';
import { Health } from '../health/Health';
import type { CharacterProfile } from '../../app/config/characters';

export interface PlayerState {
  grounded: boolean;
  airborne: boolean;
  dead: boolean;
  health: number;
  maxHealth: number;
  bleeding: boolean;
  exsangue: boolean;
  facing: 'left' | 'right';
  dodging: boolean;
  invulnerable: boolean;
  shooting: boolean;
  meleeing: boolean;
  transfusing: boolean;
  interacting: boolean;
  dodgeCooldownRemaining: number;
  dodgeCooldownTotal: number;
  shootCooldownRemaining: number;
  meleeCooldownRemaining: number;
  transfusionCooldownRemaining: number;
  interactionCooldownRemaining: number;
  velocity: { x: number; y: number };
}

export type TransfusionActionOutcome = 'none' | 'started' | 'cooldown';

export class Player extends Phaser.Physics.Arcade.Sprite {
  public readonly profile: InputProfile;
  public readonly health: Health;
  private readonly moveSpeed: number;
  private readonly acceleration: number;
  private readonly jumpStrength: number;
  private readonly dodgeSpeed: number;
  private readonly dodgeDurationMs: number;
  private readonly dodgeCooldownMs: number;
  private readonly meleeCooldownMs: number;
  private readonly meleeDurationMs: number;
  private readonly meleeWindupMs: number;
  private readonly _maxBloodReserve: number;
  private readonly transfusionCooldownMs: number;
  private readonly transfusionDurationMs: number;
  private readonly transfusionUnitsPerSecond: number;
  private readonly transfusionVisualTint = 0x57d9f3;
  private readonly hemorrhageCriticalHealthThreshold: number;
  private readonly hemorrhageLossUnitsPerSecond: number;
  private readonly hemorrhageDurationMs: number;
  private readonly transfusionHealingMultiplier: number;
  private readonly hemorrhageVisualTint = 0xff6d6d;
  private readonly exsangueVisualTint = 0xe27b52;
  private readonly exsangueDurationMs = 8000;
  private readonly exsangueMovementSpeedMultiplier = 0.56;
  private readonly exsangueMovementAccelerationMultiplier = 0.52;
  private readonly exsangueWeaponDamageMultiplier = 0.48;
  private readonly exsangueMinimumHealth = 1;
  private readonly exsangueFinalWeaponUses = 1;
  private readonly interactionCooldownMs: number;
  private readonly interactionDurationMs = 180;
  private readonly platformDropWindowMs = 140;
  private readonly drag: number;
  private readonly maxFallSpeed: number;
  private readonly maxHealth: number;
  private readonly runFrameDurationMs = 85;
  private readonly spawnInvulnerabilityMs = 700;
  private readonly damageInvulnerabilityMs = 350;
  private readonly baseTextures: {
    idle: [string, string];
    run: [string, string];
    jump: [string, string];
    dodge: [string, string];
    shoot: [string, string];
    melee: [string, string];
    hurt: [string, string];
    transfusion: [string, string];
    respawn: [string, string];
    death: [string, string];
  };
  private readonly idleFrameDurationMs = 450;
  private readonly jumpFrameDurationMs = 90;
  private readonly dodgeFrameDurationMs = 65;
  private readonly shootFrameDurationMs = 55;
  private readonly meleeFrameDurationMs = 45;
  private readonly hurtFrameDurationMs = 60;
  private readonly transfusionFrameDurationMs = 65;
  private readonly respawnFrameDurationMs = 70;
  private readonly deathFrameDurationMs = 90;
  private _airborne = false;
  private _grounded = true;
  private _dead = false;
  private _facing: 'left' | 'right' = 'right';
  private _dodging = false;
  private _invulnerable = false;
  private _dodgeEndAt = 0;
  private _nextDodgeAt = 0;
  private _dropThroughUntil = 0;
  private _nextShootAt = 0;
  private _nextMeleeAt = 0;
  private _nextTransfusionAt = 0;
  private _nextInteractionAt = 0;
  private _shotSpreadBonusDegrees = 0;
  private _lastAutoShotAt = 0;
  private _lastAutoShotWeaponId = '';
  private _isTransfusing = false;
  private _isBleeding = false;
  private _isInteracting = false;
  private _isParrying = false;
  private _meleeUntil = 0;
  private _meleeComboStep = 0;
  private _lastMeleeInputAt = 0;
  private _meleeParryUntil = 0;
  private _nextMeleeParryAt = 0;
  private _shootUntil = 0;
  private _transfusionUntil = 0;
  private _interactionUntil = 0;
  private _lastHemorrhageAt = 0;
  private _hemorrhageEndsAt = 0;
  private _hemorrhageAccumulator = 0;
  private _isMeleeing = false;
  private _isShooting = false;
  private _isHurting = false;
  private _isRespawning = false;
  private _isMeleeAttackPending = false;
  private _transfusionPulse?: Phaser.Tweens.Tween;
  private _transfusionRemainder = 0;
  private _visualMode: 'idle' | 'run' | 'jump' | 'dodge' | 'shoot' | 'melee' | 'hurt' | 'transfusion' | 'respawn' | 'death' = 'idle';
  private _idleFrame = 0;
  private _runFrame = 0;
  private _jumpFrame = 0;
  private _dodgeFrame = 0;
  private _shootFrame = 0;
  private _meleeFrame = 0;
  private _hurtFrame = 0;
  private _transfusionFrame = 0;
  private _respawnFrame = 0;
  private _deathFrame = 0;
  private _nextIdleFrameAt = 0;
  private _nextRunFrameAt = 0;
  private _nextJumpFrameAt = 0;
  private _nextDodgeFrameAt = 0;
  private _nextShootFrameAt = 0;
  private _nextMeleeFrameAt = 0;
  private _nextHurtFrameAt = 0;
  private _nextTransfusionFrameAt = 0;
  private _nextRespawnFrameAt = 0;
  private _nextDeathFrameAt = 0;
  private _hurtUntil = 0;
  private _respawnUntil = 0;
  private readonly baseTint: number;
  private _bloodReserve = 0;
  private readonly _bloodColor: number;
  private readonly _equippedWeapon: Weapon;
  private _isExsangueEnabled = false;
  private _isExsangue = false;
  private _exsangueEndsAt = 0;
  private _exsangueRemainingWeaponUses = 0;
  private _isCrawlingHitboxAdjusted = false;
  private _hemorrhagePulse?: Phaser.Tweens.Tween;
  private _exsangueVisualPulse?: Phaser.Tweens.Tween;
  private readonly _spriteHitbox = {
    width: Math.round(PLAYER_SPRITE_SIZE.width * 0.54),
    height: Math.round(PLAYER_SPRITE_SIZE.height * 0.75),
    offsetX: Math.round(PLAYER_SPRITE_SIZE.width * 0.23),
    offsetY: Math.round(PLAYER_SPRITE_SIZE.height * 0.25),
  };

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    profile: InputProfile,
    tint: number,
    weapon: Weapon = revolverWeapon,
    characterProfile?: CharacterProfile,
  ) {
    const resolvedProfile =
      characterProfile ??
      ({
        moveSpeed: 240,
        acceleration: 900,
        jumpStrength: 560,
        dodgeSpeed: 420,
        dodgeDurationMs: 140,
        dodgeCooldownMs: 520,
        meleeCooldownMs: 420,
        meleeDurationMs: 150,
        meleeWindupMs: 85,
        name: 'Fallback',
        description: 'Profil joueur par défaut si la résolution personnage est indisponible.',
        drag: 1400,
        maxFallSpeed: 1100,
        maxHealth: 100,
        maxBloodReserve: 140,
        transfusionCooldownMs: 780,
        transfusionDurationMs: 520,
        transfusionUnitsPerSecond: 30,
        transfusionHealingMultiplier: 1.15,
        hemorrhageCriticalHealthThreshold: 34,
        hemorrhageLossUnitsPerSecond: 2,
        hemorrhageDurationMs: 5000,
        interactionCooldownMs: 420,
        spritePrefix: 'player',
        paletteVariants: [
          {
            id: 'base',
            label: 'Standard',
            bodyFill: 0x6bbcff,
            eyeFill: 0x101a28,
            chestFill: 0x1f3350,
            accentFill: 0x88d0ff,
          },
          {
            id: 'nuit',
            label: 'Nuit',
            bodyFill: 0x4a83ea,
            eyeFill: 0x0f1d33,
            chestFill: 0x294166,
            accentFill: 0x6cb0ff,
          },
          {
            id: 'soufre',
            label: 'Soufre',
            bodyFill: 0xa97f5f,
            eyeFill: 0x2c1c13,
            chestFill: 0x653f25,
            accentFill: 0xffc57e,
          },
          {
            id: 'glace',
            label: 'Glace',
            bodyFill: 0x6dd4ff,
            eyeFill: 0x16344a,
            chestFill: 0x2f4f6d,
            accentFill: 0xd9f6ff,
          },
        ],
      } as CharacterProfile);

    this.moveSpeed = resolvedProfile.moveSpeed;
    this.acceleration = resolvedProfile.acceleration;
    this.jumpStrength = resolvedProfile.jumpStrength;
    this.dodgeSpeed = resolvedProfile.dodgeSpeed;
    this.dodgeDurationMs = resolvedProfile.dodgeDurationMs;
    this.dodgeCooldownMs = resolvedProfile.dodgeCooldownMs;
    this.meleeCooldownMs = resolvedProfile.meleeCooldownMs;
    this.meleeDurationMs = resolvedProfile.meleeDurationMs;
    this.meleeWindupMs = resolvedProfile.meleeWindupMs;
    this.maxFallSpeed = resolvedProfile.maxFallSpeed;
    this.maxHealth = resolvedProfile.maxHealth;
    this._maxBloodReserve = resolvedProfile.maxBloodReserve;
    this.transfusionCooldownMs = resolvedProfile.transfusionCooldownMs;
    this.transfusionDurationMs = resolvedProfile.transfusionDurationMs;
    this.transfusionUnitsPerSecond = resolvedProfile.transfusionUnitsPerSecond;
    this.transfusionHealingMultiplier = resolvedProfile.transfusionHealingMultiplier;
    this.hemorrhageCriticalHealthThreshold = resolvedProfile.hemorrhageCriticalHealthThreshold;
    this.hemorrhageLossUnitsPerSecond = resolvedProfile.hemorrhageLossUnitsPerSecond;
    this.hemorrhageDurationMs = resolvedProfile.hemorrhageDurationMs ?? 5000;
    this.interactionCooldownMs = resolvedProfile.interactionCooldownMs;
    this.drag = resolvedProfile.drag;

    super(scene, x, y, `${texture}-idle-1`);
    this.baseTextures = {
      idle: [`${texture}-idle-1`, `${texture}-idle-2`],
      run: [`${texture}-run-1`, `${texture}-run-2`],
      jump: [`${texture}-jump-1`, `${texture}-jump-2`],
      dodge: [`${texture}-dodge-1`, `${texture}-dodge-2`],
      shoot: [`${texture}-shoot-1`, `${texture}-shoot-2`],
      melee: [`${texture}-melee-1`, `${texture}-melee-2`],
      hurt: [`${texture}-hurt-1`, `${texture}-hurt-2`],
      transfusion: [`${texture}-transfusion-1`, `${texture}-transfusion-2`],
      respawn: [`${texture}-respawn-1`, `${texture}-respawn-2`],
      death: [`${texture}-death-1`, `${texture}-death-2`],
    };

    this.profile = profile;
    this.health = new Health(profile.id, {
      maxHealth: this.maxHealth,
      respawnInvulnerabilityMs: this.spawnInvulnerabilityMs,
      damageInvulnerabilityMs: this.damageInvulnerabilityMs,
    });

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setGravityY(0);
    body.setDragX(this.drag);
    body.setMaxVelocity(this.moveSpeed * 2.4, this.maxFallSpeed);
    body.setSize(this._spriteHitbox.width, this._spriteHitbox.height);
    body.setOffset(this._spriteHitbox.offsetX, this._spriteHitbox.offsetY);
    body.setBounce(0);

    this.baseTint = tint;
    this._bloodColor = tint;
    this.setTint(this.baseTint);
    this.setOrigin(0.5, 0.5);

    this.health.on('playerKilled', () => {
      this.kill();
    });

    this.health.on('playerRespawned', () => {
      this.setVisible(true);
      this.setScale(1);
      this.setAngle(0);
      this.setAlpha(1);
      this.body?.setVelocity(0, 0);
      this.body?.setAcceleration(0, 0);
      if (this.body) {
        this.body.checkCollision.none = false;
      }
      this._dead = false;
      this._grounded = false;
      this._airborne = true;
      this._isRespawning = true;
      this._respawnUntil = this.scene.time.now + this.meleeDurationMs + 120;
      this.applyVisualState(true);
      this.setTint(0xa8fffa);
      this._invulnerable = true;
      this.scene.tweens.add({
        targets: this,
        alpha: 0.6,
        duration: 90,
        yoyo: true,
        repeat: 3,
      });
      this.scene.time.delayedCall(this.spawnInvulnerabilityMs, () => {
        if (!this._dead && !this.health.isInvulnerable(this.scene.time.now)) {
          this._invulnerable = false;
          this.setTint(this.baseTint);
          this.setAlpha(1);
        }
      });
      this.stopBleeding(this.scene.time.now);
    });

    this._equippedWeapon = weapon;

    this.health.respawn(this.scene.time.now);
    this.applyVisualState(true);
  }

  public get debugState(): PlayerState {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const now = this.scene.time.now;

    return {
      grounded: this._grounded,
      airborne: this._airborne,
      dead: this._dead,
      health: this.health.state.current,
      maxHealth: this.health.state.max,
      exsangue: this._isExsangue,
      facing: this._facing,
      dodging: this._dodging,
      invulnerable: this._invulnerable || this.health.isInvulnerable(now),
      shooting: this._isShooting,
      meleeing: this._isMeleeing,
      transfusing: this._isTransfusing,
      bleeding: this._isBleeding,
      interacting: this._isInteracting,
      dodgeCooldownRemaining: Math.max(0, Math.ceil(this._nextDodgeAt - now)),
      dodgeCooldownTotal: this.dodgeCooldownMs,
      shootCooldownRemaining: Math.max(0, Math.ceil(this._nextShootAt - now)),
      meleeCooldownRemaining: Math.max(0, Math.ceil(this._nextMeleeAt - now)),
      transfusionCooldownRemaining: Math.max(0, Math.ceil(this._nextTransfusionAt - now)),
      interactionCooldownRemaining: Math.max(0, Math.ceil(this._nextInteractionAt - now)),
      velocity: {
        x: Math.trunc(body.velocity.x),
        y: Math.trunc(body.velocity.y),
      },
    };
  }

  public update(): void {
    const now = this.scene.time.now;
    const body = this.body as Phaser.Physics.Arcade.Body;
    this.profile.update();
    this.refreshAutomaticShootSpread(now);
    this.refreshMeleeParry(now);

    if (this._isShooting && now >= this._shootUntil) {
      this._isShooting = false;
      this.applyVisualState(true);
    }

    if (this._isMeleeing && now >= this._meleeUntil) {
      this._isMeleeing = false;
      this._isMeleeAttackPending = false;
      this.applyVisualState(true);
    }

    if (this._isHurting && now >= this._hurtUntil) {
      this._isHurting = false;
      this.applyVisualState(true);
    }

    if (this._isRespawning && now >= this._respawnUntil) {
      this._isRespawning = false;
      this.applyVisualState(true);
    }

    if (this._isExsangue && now >= this._exsangueEndsAt) {
      this.kill();
      return;
    }

    if (this._isTransfusing && now >= this._transfusionUntil) {
      this.stopTransfusion(now);
    }

    if (this._isInteracting && now >= this._interactionUntil) {
      this._isInteracting = false;
      this.applyVisualState(true);
    }

    const movementSpeedMultiplier = this.getMovementMultiplier();
    const movementAccelerationMultiplier = this.getMovementAccelerationMultiplier();

    if (now >= this._dodgeEndAt && this._dodging) {
      this._dodging = false;
      if (!this.health.isInvulnerable(now)) {
        this._invulnerable = false;
      }
      this.setTint(this.baseTint);
    }

    if (this._dead) {
      this.setVelocity(0, 0);
      this.applyVisualState();
      return;
    }

    if (this._dodging) {
      const dodgeDirection = this._facing === 'left' ? -1 : 1;
      body.setVelocityX(this.dodgeSpeed * dodgeDirection);
      if (body.velocity.y > 180) {
        body.setVelocityY(180);
      }
      this.applyVisualState();
      return;
    }

    if (this._isTransfusing) {
      body.setAccelerationX(0);
      body.setVelocityX(0);
      this._grounded = body.blocked.down;
      this._airborne = !body.blocked.down;
      this.applyVisualState(true);
      return;
    }

    if (this._isInteracting) {
      body.setAccelerationX(0);
      body.setVelocityX(0);
      this._grounded = body.blocked.down;
      this._airborne = !body.blocked.down;
      this.applyVisualState(true);
      return;
    }

    const moveLeft = this.profile.actions.left.isDown;
    const moveRight = this.profile.actions.right.isDown;

    if (moveLeft === moveRight) {
      body.setAccelerationX(0);
    } else if (moveLeft) {
      body.setAccelerationX(-this.acceleration * movementAccelerationMultiplier);
      this._facing = 'left';
      this.setFlipX(true);
    } else {
      body.setAccelerationX(this.acceleration * movementAccelerationMultiplier);
      this._facing = 'right';
      this.setFlipX(false);
    }

    const maxGroundSpeed = this.moveSpeed * movementSpeedMultiplier;
    if (Math.abs(body.velocity.x) > maxGroundSpeed) {
      body.setVelocityX(maxGroundSpeed * Math.sign(body.velocity.x));
    }

    this._grounded = body.blocked.down;
    this._airborne = !body.blocked.down;

    if (
      this.profile.actions.dodge.isDown
      && body.blocked.down
      && now >= this._nextDodgeAt
      && !this._isExsangue
    ) {
      this.startDodge(now);
      return;
    }

    if (this.profile.actions.jump.isDown && body.blocked.down && !this._isExsangue) {
      body.setVelocityY(-this.jumpStrength);
      this._grounded = false;
      this._airborne = true;
    }

    this.applyVisualState();
  }

  public consumeShootAction(now = this.scene.time.now): boolean {
    if (this._dead) {
      return false;
    }

    if (this._equippedWeapon.config.combatMode === 'melee') {
      return false;
    }

    if (this._isTransfusing) {
      return false;
    }

    if (this._isInteracting) {
      return false;
    }

    if (this._isExsangue && !this.consumeExsangueWeaponUse()) {
      return false;
    }

    const isAutomatic = this._equippedWeapon.config.fireMode === 'automatic';
    const shouldShoot = isAutomatic ? this.profile.actions.shoot.isDown : this.profile.actions.shoot.consumeJustDown();
    if (!shouldShoot) {
      return false;
    }

    if (now < this._nextShootAt) {
      return false;
    }

    this._nextShootAt = now + this._equippedWeapon.config.cooldownMs;
    this.updateAutomaticShootSpread(now);
    this._isShooting = true;
    this._shootUntil = now + 90;
    this.applyVisualState(true);
    return true;
  }

  public getCurrentShootSpreadBonusDegrees(now = this.scene.time.now): number {
    this.refreshAutomaticShootSpread(now);
    return this._shotSpreadBonusDegrees;
  }

  private updateAutomaticShootSpread(now: number): void {
    const weapon = this._equippedWeapon;
    const isAutomatic = weapon.config.fireMode === 'automatic';
    if (!isAutomatic) {
      this._shotSpreadBonusDegrees = 0;
      this._lastAutoShotWeaponId = weapon.config.id;
      this._lastAutoShotAt = now;
      return;
    }

    const projectileConfig = weapon.config.projectile;
    const spreadIncrease = projectileConfig.spreadIncreaseDegrees ?? 0;
    const spreadMaximum = projectileConfig.spreadMaxDegrees ?? (projectileConfig.spreadDegrees ?? 0) + 12;
    const spreadResetMs = projectileConfig.spreadResetMs ?? 220;
    if (this._lastAutoShotWeaponId !== weapon.config.id || this._lastAutoShotAt === 0 || now - this._lastAutoShotAt > spreadResetMs) {
      this._shotSpreadBonusDegrees = 0;
    }

    this._shotSpreadBonusDegrees = Math.min(spreadMaximum, this._shotSpreadBonusDegrees + spreadIncrease);
    this._lastAutoShotWeaponId = weapon.config.id;
    this._lastAutoShotAt = now;
  }

  private refreshAutomaticShootSpread(now: number): void {
    const weapon = this._equippedWeapon;
    const isAutomatic = weapon.config.fireMode === 'automatic';
    if (!isAutomatic) {
      this._shotSpreadBonusDegrees = 0;
      this._lastAutoShotWeaponId = '';
      this._lastAutoShotAt = 0;
      return;
    }

    const projectileConfig = weapon.config.projectile;
    const spreadResetMs = projectileConfig.spreadResetMs ?? 220;
    if (
      this._lastAutoShotWeaponId !== weapon.config.id
      || this._lastAutoShotAt === 0
      || now - this._lastAutoShotAt >= spreadResetMs
    ) {
      this._shotSpreadBonusDegrees = 0;
    }
  }

  public consumeMeleeAction(now = this.scene.time.now): boolean {
    const meleeConfig = this._equippedWeapon.config.melee;
    const meleeComboMax = meleeConfig?.comboMax ?? 1;
    const comboResetMs = meleeConfig?.comboResetMs ?? 420;
    const meleeCooldownMs = meleeConfig?.cooldownMs ?? this.meleeCooldownMs;
    const meleeWindupMs = meleeConfig?.windupMs ?? this.meleeWindupMs;
    const meleeDurationMs = meleeConfig?.durationMs ?? this.meleeDurationMs;

    if (this._dead) {
      return false;
    }

    if (this._isTransfusing) {
      return false;
    }

    if (this._isInteracting) {
      return false;
    }

    if (this._isExsangue && !this.consumeExsangueWeaponUse()) {
      return false;
    }

    if (!this.profile.actions.melee.consumeJustDown()) {
      return false;
    }

    if (now < this._nextMeleeAt) {
      return false;
    }

    if (now - this._lastMeleeInputAt > comboResetMs) {
      this._meleeComboStep = 0;
    }

    this._meleeComboStep = Math.min(meleeComboMax, this._meleeComboStep + 1);
    this._lastMeleeInputAt = now;
    this._nextMeleeAt = now + meleeCooldownMs;
    this._isMeleeing = true;
    this._isMeleeAttackPending = true;
    this._meleeUntil = now + meleeWindupMs + meleeDurationMs;
    this.applyVisualState(true);
    return true;
  }

  public getMeleeComboStep(): number {
    return Math.max(1, this._meleeComboStep);
  }

  public refreshMeleeParry(now = this.scene.time.now): boolean {
    const meleeConfig = this._equippedWeapon.config.melee;
    const parryWindowMs = meleeConfig?.parryWindowMs ?? 0;
    const parryCooldownMs = meleeConfig?.parryCooldownMs ?? parryWindowMs;

    if (!parryWindowMs || this._dead || this._isTransfusing) {
      this._isParrying = false;
      return false;
    }

    if (this._isParrying && now < this._meleeParryUntil) {
      return true;
    }

    if (this.profile.actions.melee.isDown && now >= this._nextMeleeParryAt) {
      this._isParrying = true;
      this._meleeParryUntil = now + parryWindowMs;
      this._nextMeleeParryAt = now + parryCooldownMs;
      return true;
    }

    if (now >= this._meleeParryUntil) {
      this._isParrying = false;
    }

    return false;
  }

  public isParrying(now = this.scene.time.now): boolean {
    return this.refreshMeleeParry(now);
  }

  public consumeMeleeAttack(now = this.scene.time.now): boolean {
    if (!this._isMeleeAttackPending || this._dead) {
      return false;
    }

    if (this._isInteracting) {
      return false;
    }

    if (now < this._meleeUntil - this.meleeDurationMs) {
      return false;
    }

    this._isMeleeAttackPending = false;
    return true;
  }

  public consumeTransfusionAction(now = this.scene.time.now): boolean {
    return this.consumeTransfusionActionWithOutcome(now) === 'started';
  }

  public consumeTransfusionActionWithOutcome(now = this.scene.time.now): TransfusionActionOutcome {
    if (this._dead) {
      return 'none';
    }

    if (this._isExsangue) {
      return 'none';
    }

    if (this._isInteracting) {
      return 'none';
    }

    if (!this.profile.actions.transfusion.consumeJustDown()) {
      return 'none';
    }

    if (now < this._nextTransfusionAt) {
      return 'cooldown';
    }

    this._nextTransfusionAt = now + this.transfusionCooldownMs;
    this._isTransfusing = true;
    this._transfusionUntil = now + this.transfusionDurationMs;
    this._transfusionRemainder = 0;
    this.startTransfusionPulse();
    this.applyVisualState(true);
    return 'started';
  }

  public consumeInteractionAction(now = this.scene.time.now): boolean {
    if (this._dead) {
      return false;
    }

    if (this._isInteracting) {
      return false;
    }

    if (!this.profile.actions.interact.consumeJustDown()) {
      return false;
    }

    if (now < this._nextInteractionAt) {
      return false;
    }

    this._nextInteractionAt = now + this.interactionCooldownMs;
    this._isInteracting = true;
    this._interactionUntil = now + this.interactionDurationMs;
    return true;
  }

  public takeDamage(
    amount: number,
    sourceProfileId?: string,
    now = this.scene.time.now,
    knockbackForce = 0,
    knockbackDirection = 0,
  ): boolean {
    const normalizedAmount = Math.max(0, Math.floor(amount));
    const currentHealth = this.health.state.current;
    const shouldEnterExsangue = this._isExsangueEnabled
      && !this._dead
      && !this._isExsangue
      && currentHealth > this.exsangueMinimumHealth
      && normalizedAmount >= currentHealth;

    const safeAmount = shouldEnterExsangue
      ? Math.max(0, currentHealth - this.exsangueMinimumHealth)
      : normalizedAmount;
    const canFlash = !this.health.isDead() && !this.health.isInvulnerable(now);
    const damaged = this.health.takeDamage(safeAmount, sourceProfileId, now);
    if (!damaged) {
      return false;
    }

    if (shouldEnterExsangue && this.health.state.current <= this.exsangueMinimumHealth) {
      this.enterExsangueState(now);
    }

    if (this._isTransfusing) {
      this.stopTransfusion(now);
    }

    if (knockbackForce > 0 && knockbackDirection !== 0) {
      this.applyKnockback(knockbackForce, knockbackDirection);
    }

    if (canFlash && !this.health.isDead()) {
      this.flashHit();
      this.startHurtVisual(now);
    }

    this.updateBleedingState();

    return true;
  }

  public processHemorrhage(now: number, deltaMs: number): number {
    if (this._dead || this._isExsangue || !this._isBleeding) {
      return 0;
    }

    if (this._hemorrhageEndsAt > 0 && now >= this._hemorrhageEndsAt) {
      this.stopBleeding(now);
      return 0;
    }

    if (this.health.state.current > this.hemorrhageCriticalHealthThreshold) {
      this.stopBleeding(now);
      return 0;
    }

    if (this._lastHemorrhageAt === 0) {
      this._lastHemorrhageAt = now;
    }

    const elapsedMs = Math.max(0, now - this._lastHemorrhageAt);
    const requestedLoss = (elapsedMs * this.hemorrhageLossUnitsPerSecond) / 1000 + this._hemorrhageAccumulator;
    const roundedLoss = Math.floor(requestedLoss);

    if (roundedLoss <= 0) {
      this._hemorrhageAccumulator = requestedLoss;
      this._lastHemorrhageAt = now;
      return 0;
    }

    const appliedLoss = this.health.losePassively(roundedLoss);
    this._hemorrhageAccumulator = Math.max(0, requestedLoss - appliedLoss);
    this._lastHemorrhageAt = now;

    if (appliedLoss > 0) {
      this.triggerHemorrhageVisual();
      if (this.health.state.current > this.hemorrhageCriticalHealthThreshold) {
        this.stopBleeding(now);
      }
    }

    return appliedLoss;
  }

  public flashHit(): void {
    if (this._invulnerable) {
      return;
    }

    this.setTint(0xff8a8a);
    this.scene.time.delayedCall(70, () => {
      if (!this._invulnerable) {
        this.setTint(this.baseTint);
      }
    });
    this._invulnerable = true;
  }

  public kill(): void {
    if (this._dead) {
      return;
    }

    this._dead = true;
    this.health.kill();
    this._isShooting = false;
    this._isMeleeing = false;
    this._isMeleeAttackPending = false;
    this._isParrying = false;
    this._meleeComboStep = 0;
    this._meleeParryUntil = 0;
    this._nextMeleeParryAt = 0;
    this.exitExsangueState(this.scene.time.now);
    this._isHurting = false;
    this._isRespawning = false;
    this.stopTransfusion(this.scene.time.now);
    this.stopBleeding(this.scene.time.now);
    this._isInteracting = false;
    this._dodging = false;
    this._invulnerable = false;
    this.body?.setAcceleration(0, 0);
    if (this.body) {
      this.body.checkCollision.none = true;
    }
    this.body?.setVelocity(0, 0);
    this._visualMode = 'death';
    this._deathFrame = 0;
    this._nextDeathFrameAt = this.scene.time.now;
    this.setTexture(this.baseTextures.death[this._deathFrame]);
    this.setTint(0x0f1014);
    this.scene.tweens.add({
      targets: this,
      alpha: 0.2,
      scaleX: 0.82,
      scaleY: 0.82,
      angle: this._facing === 'left' ? -12 : 12,
      duration: 170,
      ease: 'Quad.easeIn',
      onComplete: () => {
        if (this._dead) {
          this.setVisible(false);
          this.setAlpha(1);
          this.setScale(1);
          this.setAngle(0);
        }
      },
    });
  }

  public respawnAt(x: number, y: number): void {
    this.setPosition(x, y);
    this.exitExsangueState(this.scene.time.now);
    this.health.respawn(this.scene.time.now);
    this.stopBleeding(this.scene.time.now);
    this._dead = false;
    this._grounded = false;
    this._airborne = true;
  }

  public requestDropThroughPlatforms(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (this._dead || !body.blocked.down) {
      return;
    }

    this._dropThroughUntil = this.scene.time.now + this.platformDropWindowMs;
  }

  public canPassThroughPlatforms(now = this.scene.time.now): boolean {
    return now < this._dropThroughUntil;
  }

  public isTransfusing(): boolean {
    return this._isTransfusing;
  }

  public isExsangue(): boolean {
    return this._isExsangue;
  }

  public setExsangueEnabled(enabled: boolean): void {
    this._isExsangueEnabled = enabled;
    if (!enabled && this._isExsangue) {
      this.exitExsangueState(this.scene.time.now);
    }
  }

  public getExsangueRemainingMs(now = this.scene.time.now): number {
    if (!this._isExsangue) {
      return 0;
    }

    return Math.max(0, this._exsangueEndsAt - now);
  }

  public getCombatDamageMultiplier(): number {
    if (!this._isExsangueEnabled || !this._isExsangue) {
      return 1;
    }

    return this.exsangueWeaponDamageMultiplier;
  }

  public isBleeding(): boolean {
    return this._isBleeding;
  }

  public stopTransfusion(now = this.scene.time.now): void {
    if (!this._isTransfusing) {
      return;
    }

    this._isTransfusing = false;
    this._transfusionUntil = now;
    this._transfusionRemainder = 0;
    this.stopTransfusionPulse();
    this.setTint(this.baseTint);
    this.setAlpha(1);
    this.applyVisualState(true);
  }

  private getMovementMultiplier(): number {
    return this._isExsangue ? this.exsangueMovementSpeedMultiplier : 1;
  }

  private getMovementAccelerationMultiplier(): number {
    return this._isExsangue ? this.exsangueMovementAccelerationMultiplier : 1;
  }

  private consumeExsangueWeaponUse(): boolean {
    if (!this._isExsangue) {
      return true;
    }

    if (this._exsangueRemainingWeaponUses <= 0) {
      return false;
    }

    this._exsangueRemainingWeaponUses -= 1;
    return true;
  }

  private enterExsangueState(now: number): void {
    if (this._isExsangue || !this._isExsangueEnabled) {
      return;
    }

    this._isExsangue = true;
    this._exsangueEndsAt = now + this.exsangueDurationMs;
    this._exsangueRemainingWeaponUses = this.exsangueFinalWeaponUses;
    this.stopBleeding(now);
    this.stopTransfusion(now);
    this.adjustExsangueHitbox(true);
    this.startExsanguePulse();
    this.setTint(this.exsangueVisualTint);
    this.setAlpha(0.86);
    this._nextDodgeAt = now + this.dodgeCooldownMs;
    this.applyVisualState(true);
    this.emit('exsangueStarted');
  }

  private exitExsangueState(_now: number): void {
    if (!this._isExsangue) {
      this.adjustExsangueHitbox(false);
      return;
    }

    this._isExsangue = false;
    this._exsangueEndsAt = 0;
    this._exsangueRemainingWeaponUses = 0;
    this.stopExsanguePulse();
    this.adjustExsangueHitbox(false);
    if (!this._dead) {
      this.setTint(this.baseTint);
      this.setAlpha(1);
      this.applyVisualState(true);
    }

    this.emit('exsangueEnded');
  }

  private adjustExsangueHitbox(isCrawling: boolean): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body) {
      return;
    }

    if (isCrawling) {
      this._isCrawlingHitboxAdjusted = true;
      body.setSize(this._spriteHitbox.width, Math.max(18, Math.round(this._spriteHitbox.height * 0.67)));
      body.setOffset(this._spriteHitbox.offsetX, this._spriteHitbox.offsetY + Math.round(this._spriteHitbox.height * 0.33));
      return;
    }

    if (this._isCrawlingHitboxAdjusted) {
      this._isCrawlingHitboxAdjusted = false;
      body.setSize(this._spriteHitbox.width, this._spriteHitbox.height);
      body.setOffset(this._spriteHitbox.offsetX, this._spriteHitbox.offsetY);
    }
  }

  private startExsanguePulse(): void {
    this.stopExsanguePulse();
    this._exsangueVisualPulse = this.scene.tweens.add({
      targets: this,
      alpha: 0.74,
      duration: 280,
      yoyo: true,
      repeat: -1,
    });
  }

  private stopExsanguePulse(): void {
    this._exsangueVisualPulse?.remove();
    this._exsangueVisualPulse = undefined;
  }

  public startBleeding(now = this.scene.time.now): void {
    if (this._dead) {
      return;
    }

    if (this._isBleeding) {
      return;
    }

    this._isBleeding = true;
    this._hemorrhageAccumulator = 0;
    this._lastHemorrhageAt = now;
    this._hemorrhageEndsAt = now + this.hemorrhageDurationMs;
  }

  public stopBleeding(_now = this.scene.time.now): void {
    this._isBleeding = false;
    this._hemorrhageAccumulator = 0;
    this._lastHemorrhageAt = 0;
    this._hemorrhageEndsAt = 0;
    this.stopHemorrhageVisual(_now);
  }

  public transfuse(units: number): number {
    if (!this._isTransfusing || this._dead || units <= 0) {
      return 0;
    }

    const healthState = this.health.state;
    const missingHealth = Math.max(0, healthState.max - healthState.current);
    if (missingHealth <= 0) {
      this.stopTransfusion(this.scene.time.now);
      return 0;
    }

    const totalUnitsToConsume = this._transfusionRemainder + units;
    const requestedUnits = Math.floor(totalUnitsToConsume);

    if (requestedUnits <= 0) {
      this._transfusionRemainder = totalUnitsToConsume;
      return 0;
    }

    const wantedUnits = Math.min(requestedUnits, Math.ceil(missingHealth / this.transfusionHealingMultiplier));
    const consumedFromReserve = this.consumeBloodReserve(wantedUnits);

    if (consumedFromReserve <= 0) {
      if (this._bloodReserve <= 0) {
        this.stopTransfusion(this.scene.time.now);
      }
      return 0;
    }

    const healedUnits = Math.floor(consumedFromReserve * this.transfusionHealingMultiplier);
    this.health.heal(healedUnits);
    this.updateBleedingState();
    this._transfusionRemainder = Math.max(0, totalUnitsToConsume - consumedFromReserve);

    if (this.health.state.current >= this.health.state.max || this._bloodReserve <= 0) {
      this.stopTransfusion(this.scene.time.now);
    }

    return consumedFromReserve;
  }

  public getTransfusionUnitsPerSecond(): number {
    return this.transfusionUnitsPerSecond;
  }

  public getTransfusionProgress(now = this.scene.time.now): number {
    if (!this._isTransfusing) {
      return 0;
    }

    return Math.max(0, this._transfusionUntil - now);
  }

  private updateBleedingState(): void {
    if (this._dead) {
      return;
    }

    if (this._isExsangue) {
      this.stopBleeding(this.scene.time.now);
      return;
    }

    if (this.health.state.current <= this.hemorrhageCriticalHealthThreshold) {
      this.startBleeding(this.scene.time.now);
      return;
    }

    this.stopBleeding(this.scene.time.now);
  }

  private triggerHemorrhageVisual(): void {
    if (this._dead) {
      return;
    }

    this.stopHemorrhageVisual();
    this.setTint(this.hemorrhageVisualTint);

    this._hemorrhagePulse = this.scene.tweens.add({
      targets: this,
      alpha: 0.8,
      duration: 80,
      yoyo: true,
      onComplete: () => {
        this.stopHemorrhageVisual();
      },
    });
  }

  private stopHemorrhageVisual(): void {
    this._hemorrhagePulse?.remove();
    this._hemorrhagePulse = undefined;
    if (!this._dead && !this._isTransfusing) {
      this.setTint(this.baseTint);
      this.setAlpha(1);
    } else if (!this._dead && this._isTransfusing) {
      this.setTint(this.transfusionVisualTint);
      this.setAlpha(0.92);
    }
  }

  public getFacingDirection(): number {
    return this._facing === 'left' ? -1 : 1;
  }

  public getMeleeOriginOffset(): number {
    return this._facing === 'left' ? -36 : 36;
  }

  public getMuzzleOffset(): number {
    return this._facing === 'left' ? -34 : 34;
  }

  public get equippedWeapon(): Weapon {
    return this._equippedWeapon;
  }

  public get bloodReserve(): number {
    return this._bloodReserve;
  }

  public get maxBloodReserve(): number {
    return this._maxBloodReserve;
  }

  public get bloodColor(): number {
    return this._bloodColor;
  }

  public addBloodReserve(units: number): number {
    const normalizedUnits = Math.max(0, Math.floor(units));
    this._bloodReserve = Math.min(this.maxBloodReserve, this._bloodReserve + normalizedUnits);
    return this._bloodReserve;
  }

  public setBloodReserve(units: number): void {
    const normalizedUnits = Math.max(0, Math.floor(units));
    this._bloodReserve = Math.min(this.maxBloodReserve, normalizedUnits);
  }

  public consumeBloodReserve(units: number): number {
    const normalizedUnits = Math.max(0, Math.floor(units));
    const consumed = Math.min(normalizedUnits, this._bloodReserve);
    this._bloodReserve -= consumed;
    return consumed;
  }

  public getTransfusionConsumption(units: number): number {
    if (this._dead || units <= 0) {
      return 0;
    }

    const healthState = this.health.state;
    const missingHealth = Math.max(0, healthState.max - healthState.current);
    if (missingHealth <= 0) {
      return 0;
    }

    const requestedUnits = Math.max(0, Math.floor(units));
    if (requestedUnits <= 0) {
      return 0;
    }

    return Math.min(requestedUnits, Math.ceil(missingHealth / this.transfusionHealingMultiplier));
  }

  public applyTransfusionHealing(units: number): number {
    const wantedUnits = this.getTransfusionConsumption(units);
    if (wantedUnits <= 0) {
      return 0;
    }

    const healedUnits = Math.floor(wantedUnits * this.transfusionHealingMultiplier);
    this.health.heal(healedUnits);
    this.updateBleedingState();

    return wantedUnits;
  }

  public applyShootRecoil(): void {
    if (this._dead) {
      return;
    }

    const direction = this.getFacingDirection();
    this.applyKnockback(this._equippedWeapon.config.recoilForce, -direction);
  }

  private startTransfusionPulse(): void {
    this.stopTransfusionPulse();
    this.setTint(this.transfusionVisualTint);
    this.setAlpha(0.92);
    this._transfusionPulse = this.scene.tweens.add({
      targets: this,
      alpha: 0.76,
      duration: 150,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private startHurtVisual(now = this.scene.time.now): void {
    this._isHurting = true;
    this._hurtUntil = now + this.meleeWindupMs + this.hurtFrameDurationMs;
    this._hurtFrame = 0;
    this._nextHurtFrameAt = now;
    this.applyVisualState(true);
  }

  private stopTransfusionPulse(): void {
    this._transfusionPulse?.remove();
    this._transfusionPulse = undefined;
  }

  private startDodge(now: number): void {
    const direction = this._facing === 'left' ? -1 : 1;
    const body = this.body as Phaser.Physics.Arcade.Body;

    this._dodging = true;
    this._invulnerable = true;
    this._dodgeEndAt = now + this.dodgeDurationMs;
    this._nextDodgeAt = now + this.dodgeCooldownMs;
    body.setVelocityX(direction * this.dodgeSpeed);
    body.setVelocityY(-10);
    this.setTint(0x8cffb0);
  }

  private applyKnockback(force: number, direction: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (!body || this._dead || direction === 0) {
      return;
    }

    body.setVelocityX(direction * force);
    if (body.velocity.y >= 0) {
      body.setVelocityY(-Math.min(140, force * 0.4));
    }
  }

  private applyVisualState(force = false): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const nextMode = this._dodging
      ? 'dodge'
      : this._isMeleeing
      ? 'melee'
      : this._isShooting
      ? 'shoot'
      : this._isHurting
      ? 'hurt'
      : this._isExsangue
      ? 'hurt'
      : this._isTransfusing
      ? 'transfusion'
      : this._isRespawning
      ? 'respawn'
      : this._dead
      ? 'death'
      : this._grounded
      ? Math.abs(body.velocity.x) > 35
        ? 'run'
        : 'idle'
      : 'jump';

    if (force || nextMode !== this._visualMode) {
      this._visualMode = nextMode;
      if (nextMode === 'idle') {
        this._idleFrame = 0;
        this._nextIdleFrameAt = this.scene.time.now;
        this.setTexture(this.baseTextures.idle[this._idleFrame]);
      }

      if (nextMode === 'jump') {
        this._jumpFrame = 0;
        this._nextJumpFrameAt = this.scene.time.now;
        this.setTexture(this.baseTextures.jump[this._jumpFrame]);
      }

      if (nextMode === 'dodge') {
        this._dodgeFrame = 0;
        this._nextDodgeFrameAt = this.scene.time.now;
        this.setTexture(this.baseTextures.dodge[this._dodgeFrame]);
      }

      if (nextMode === 'shoot') {
        this._shootFrame = 0;
        this._nextShootFrameAt = this.scene.time.now;
        this.setTexture(this.baseTextures.shoot[this._shootFrame]);
      }

      if (nextMode === 'melee') {
        this._meleeFrame = 0;
        this._nextMeleeFrameAt = this.scene.time.now;
        this.setTexture(this.baseTextures.melee[this._meleeFrame]);
      }

      if (nextMode === 'hurt') {
        this._hurtFrame = 0;
        this._nextHurtFrameAt = this.scene.time.now;
        this.setTexture(this.baseTextures.hurt[this._hurtFrame]);
      }

      if (nextMode === 'transfusion') {
        this._transfusionFrame = 0;
        this._nextTransfusionFrameAt = this.scene.time.now;
        this.setTexture(this.baseTextures.transfusion[this._transfusionFrame]);
      }

      if (nextMode === 'respawn') {
        this._respawnFrame = 0;
        this._nextRespawnFrameAt = this.scene.time.now;
        this.setTexture(this.baseTextures.respawn[this._respawnFrame]);
      }

      if (nextMode === 'death') {
        this._deathFrame = 0;
        this._nextDeathFrameAt = this.scene.time.now;
        this.setTexture(this.baseTextures.death[this._deathFrame]);
      }

      if (nextMode === 'run') {
        this._runFrame = 0;
        this._nextRunFrameAt = this.scene.time.now;
        this.setTexture(this.baseTextures.run[this._runFrame]);
      }
      return;
    }

    if (this._visualMode === 'run' && this.scene.time.now >= this._nextRunFrameAt) {
      this._runFrame = 1 - this._runFrame;
      this.setTexture(this.baseTextures.run[this._runFrame]);
      this._nextRunFrameAt = this.scene.time.now + this.runFrameDurationMs;
    }

    if (this._visualMode === 'idle' && this.scene.time.now >= this._nextIdleFrameAt) {
      this._idleFrame = 1 - this._idleFrame;
      this.setTexture(this.baseTextures.idle[this._idleFrame]);
      this._nextIdleFrameAt = this.scene.time.now + this.idleFrameDurationMs;
    }

    if (this._visualMode === 'jump' && this.scene.time.now >= this._nextJumpFrameAt) {
      this._jumpFrame = 1 - this._jumpFrame;
      this.setTexture(this.baseTextures.jump[this._jumpFrame]);
      this._nextJumpFrameAt = this.scene.time.now + this.jumpFrameDurationMs;
    }

    if (this._visualMode === 'dodge' && this.scene.time.now >= this._nextDodgeFrameAt) {
      this._dodgeFrame = 1 - this._dodgeFrame;
      this.setTexture(this.baseTextures.dodge[this._dodgeFrame]);
      this._nextDodgeFrameAt = this.scene.time.now + this.dodgeFrameDurationMs;
    }

    if (this._visualMode === 'shoot' && this.scene.time.now >= this._nextShootFrameAt) {
      this._shootFrame = 1 - this._shootFrame;
      this.setTexture(this.baseTextures.shoot[this._shootFrame]);
      this._nextShootFrameAt = this.scene.time.now + this.shootFrameDurationMs;
    }

    if (this._visualMode === 'melee' && this.scene.time.now >= this._nextMeleeFrameAt) {
      this._meleeFrame = 1 - this._meleeFrame;
      this.setTexture(this.baseTextures.melee[this._meleeFrame]);
      this._nextMeleeFrameAt = this.scene.time.now + this.meleeFrameDurationMs;
    }

    if (this._visualMode === 'hurt' && this.scene.time.now >= this._nextHurtFrameAt) {
      this._hurtFrame = 1 - this._hurtFrame;
      this.setTexture(this.baseTextures.hurt[this._hurtFrame]);
      this._nextHurtFrameAt = this.scene.time.now + this.hurtFrameDurationMs;
    }

    if (this._visualMode === 'transfusion' && this.scene.time.now >= this._nextTransfusionFrameAt) {
      this._transfusionFrame = 1 - this._transfusionFrame;
      this.setTexture(this.baseTextures.transfusion[this._transfusionFrame]);
      this._nextTransfusionFrameAt = this.scene.time.now + this.transfusionFrameDurationMs;
    }

    if (this._visualMode === 'respawn' && this.scene.time.now >= this._nextRespawnFrameAt) {
      this._respawnFrame = 1 - this._respawnFrame;
      this.setTexture(this.baseTextures.respawn[this._respawnFrame]);
      this._nextRespawnFrameAt = this.scene.time.now + this.respawnFrameDurationMs;
    }

    if (this._visualMode === 'death' && this.scene.time.now >= this._nextDeathFrameAt) {
      this._deathFrame = 1 - this._deathFrame;
      this.setTexture(this.baseTextures.death[this._deathFrame]);
      this._nextDeathFrameAt = this.scene.time.now + this.deathFrameDurationMs;
    }
  }
}
