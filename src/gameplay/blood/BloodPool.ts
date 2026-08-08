export interface BloodPoolConfig {
  maxUnits?: number;
  minRadiusPx?: number;
  maxRadiusPx?: number;
  radiusPerUnit?: number;
  growthSpeedMs?: number;
  minAlpha?: number;
  maxAlpha?: number;
  lifetimeMs?: number;
  fadeDurationMs?: number;
}

export interface BloodPoolState {
  id: number;
  x: number;
  y: number;
  units: number;
  ownerProfileId: string;
  color: number;
}

export class BloodPool {
  private static nextId = 1;

  private readonly id: number;
  private readonly scene: Phaser.Scene;
  private readonly maxUnits: number;
  private readonly minRadiusPx: number;
  private readonly maxRadiusPx: number;
  private readonly radiusPerUnit: number;
  private readonly growthSpeedMs: number;
  private readonly minAlpha: number;
  private readonly maxAlpha: number;
  private readonly lifetimeMs: number;
  private readonly fadeDurationMs: number;
  private readonly shape: Phaser.GameObjects.Ellipse;
  private readonly sheen: Phaser.GameObjects.Ellipse;
  private readonly ring: Phaser.GameObjects.Ellipse;

  private _units = 0;
  private _ownerProfileId: string;
  private _color: number;
  private targetRadius: number;
  private currentRadiusPx: number;
  private isAlive = true;
  private isFading = false;
  private fadeStartedAt = 0;
  private expiresAt = 0;
  private _isAbsorbing = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    units: number,
    ownerProfileId: string,
    color: number,
    config: BloodPoolConfig = {},
  ) {
    this.scene = scene;
    this.id = BloodPool.nextId;
    BloodPool.nextId += 1;
    this.maxUnits = Math.max(1, Math.floor(config.maxUnits ?? 140));
    this.minRadiusPx = Math.max(3, Math.floor(config.minRadiusPx ?? 10));
    this.maxRadiusPx = Math.max(this.minRadiusPx, Math.floor(config.maxRadiusPx ?? 58));
    this.radiusPerUnit = Math.max(0.12, config.radiusPerUnit ?? 0.95);
    this.growthSpeedMs = Math.max(40, Math.floor(config.growthSpeedMs ?? 120));
    this.minAlpha = Math.max(0.03, Math.min(1, config.minAlpha ?? 0.08));
    this.maxAlpha = Math.max(this.minAlpha, Math.min(1, config.maxAlpha ?? 0.34));
    this.lifetimeMs = Math.max(3000, Math.floor(config.lifetimeMs ?? 8000));
    this.fadeDurationMs = Math.max(150, Math.floor(config.fadeDurationMs ?? 600));

    this._ownerProfileId = ownerProfileId;
    this._color = color;
    this.currentRadiusPx = this.minRadiusPx;
    this.targetRadius = this.minRadiusPx;

    this.shape = this.scene.add.ellipse(x, y, this.currentRadiusPx * 2, this.currentRadiusPx * 2, color, this.maxAlpha);
    this.shape.setDepth(2);
    this.shape.setBlendMode(Phaser.BlendModes.SCREEN);
    this.ring = this.scene.add.ellipse(x, y, this.currentRadiusPx * 2, this.currentRadiusPx * 2, 0x161d2a, 0.2);
    this.ring.setDepth(1);
    this.sheen = this.scene.add.ellipse(
      x + this.currentRadiusPx * 0.25,
      y - this.currentRadiusPx * 0.15,
      this.currentRadiusPx * 1.35,
      this.currentRadiusPx * 0.45,
      0xffffff,
      this.maxAlpha * 0.22,
    );
    this.sheen.setDepth(3);
    this.sheen.setBlendMode(Phaser.BlendModes.ADD);

    const now = this.scene.time.now;
    this.expiresAt = now + this.lifetimeMs;
    this.mergeUnits(units, ownerProfileId, color, now);
  }

  public get x(): number {
    return this.shape.x;
  }

  public get y(): number {
    return this.shape.y;
  }

  public get units(): number {
    return Math.floor(this._units);
  }

  public get currentRadius(): number {
    return this.currentRadiusPx;
  }

  public get ownerProfileId(): string {
    return this._ownerProfileId;
  }

  public get color(): number {
    return this._color;
  }

  public get state(): BloodPoolState {
    return {
      id: this.id,
      x: this.shape.x,
      y: this.shape.y,
      units: this.units,
      ownerProfileId: this._ownerProfileId,
      color: this._color,
    };
  }

  public mergeUnits(
    additionalUnits: number,
    ownerProfileId: string,
    color: number,
    now = this.scene.time.now,
  ): number {
    if (!this.isAlive || additionalUnits <= 0) {
      return 0;
    }

    this._ownerProfileId = ownerProfileId;
    this._color = color;
    this.shape.setFillStyle(color, this.maxAlpha);
    this.ring.setStrokeStyle(1.2, 0x111827, 0.34);
    this.shape.setStrokeStyle(1, color, this.maxAlpha + 0.04);

    const rounded = Math.floor(additionalUnits);
    const before = this._units;
    this._units = Math.min(this.maxUnits, this._units + rounded);
    this.targetRadius = this.resolveRadius(this._units);
    this.expiresAt = now + this.lifetimeMs;
    this.isFading = false;
    this.shape.setAlpha(this.maxAlpha);
    this._isAbsorbing = false;
    this.sheen.setFillStyle(0xffffff, this.maxAlpha * 0.22);

    return this._units - before;
  }

  public consumeUnits(requested: number): number {
    if (!this.isAlive || requested <= 0 || this._units <= 0) {
      return 0;
    }

    const consumed = Math.min(this._units, Math.floor(requested));
    if (consumed <= 0) {
      return 0;
    }

    this._units = Math.max(0, this._units - consumed);
    this.targetRadius = this.resolveRadius(this._units);
    this._isAbsorbing = true;
    this.expiresAt = this.scene.time.now + this.lifetimeMs;

    if (this._units <= 0) {
      this.startFadeOut(this.scene.time.now);
    }

    return consumed;
  }

  public containsPoint(pointX: number, pointY: number, extraRadius = 0): boolean {
    const distanceSq = Phaser.Math.Distance.Squared(this.shape.x, this.shape.y, pointX, pointY);
    const totalRadius = this.currentRadius + extraRadius;
    return distanceSq <= totalRadius * totalRadius;
  }

  public pulseAbsorption(): void {
    if (this._isAbsorbing) {
      return;
    }

    this._isAbsorbing = true;
    const baseScaleX = this.shape.scaleX;
    const baseScaleY = this.shape.scaleY;

    this.scene.tweens.add({
      targets: this.shape,
      scaleX: baseScaleX * 1.08,
      scaleY: baseScaleY * 1.08,
      duration: 60,
      yoyo: true,
      onComplete: () => {
        this._isAbsorbing = false;
      },
    });
  }

  public update(now: number, deltaMs: number): boolean {
    if (!this.isAlive) {
      return false;
    }

    const interpolation = Math.min(1, deltaMs / this.growthSpeedMs);
    this.currentRadiusPx = Phaser.Math.Linear(this.currentRadiusPx, this.targetRadius, interpolation);
    this.applyRadiusToShape();

    if (this._units <= 0 && !this.isFading) {
      this.startFadeOut(now);
    }

    if (!this.isFading && now >= this.expiresAt) {
      this.startFadeOut(now);
    }

    if (this.isFading) {
      const fadeProgress = Math.min(1, (now - this.fadeStartedAt) / this.fadeDurationMs);
      const alpha = Phaser.Math.Linear(this.maxAlpha, this.minAlpha, fadeProgress);
      this.shape.setAlpha(alpha);
      this.ring.setAlpha(alpha * 0.9);

      if (fadeProgress >= 1) {
        this.destroy();
        return false;
      }
    }

    return true;
  }

  public destroy(): void {
    if (!this.isAlive) {
      return;
    }

    this.isAlive = false;
    this.shape.destroy();
    this.sheen.destroy();
    this.ring.destroy();
  }

  private startFadeOut(now: number): void {
    this.isFading = true;
    this.fadeStartedAt = now;
  }

  private applyRadiusToShape(): void {
    const size = this.currentRadiusPx * 2;
    const ringSize = size + 6;
    this.ring.setDisplaySize(ringSize, ringSize);
    this.shape.setDisplaySize(size, size);
    this.shape.setAlpha(this.maxAlpha);
    const sheenWidth = Math.max(1, size * 1.45);
    const sheenHeight = Math.max(1, size * 0.45);
    this.sheen.setPosition(this.shape.x + this.currentRadiusPx * 0.22, this.shape.y - this.currentRadiusPx * 0.2);
    this.sheen.setDisplaySize(sheenWidth, sheenHeight);
    this.sheen.setAlpha(this.maxAlpha * 0.28);
  }

  private resolveRadius(units: number): number {
    const clampedUnits = Math.max(0, Math.min(this.maxUnits, units));
    const radius = this.minRadiusPx + Math.sqrt(clampedUnits) * this.radiusPerUnit;
    return Math.max(this.minRadiusPx, Math.min(this.maxRadiusPx, radius));
  }
}
