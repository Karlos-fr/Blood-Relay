export interface BloodLedgerOptions {
  unitsPerDamagePoint?: number;
  maxUnitsPerImpact?: number;
  spillLifetimeMs?: number;
  spillDryingRatePerSecond?: number;
}

export interface BloodUnits {
  units: number;
}

export interface BloodSpill {
  ownerProfileId: string;
  totalUnits: number;
  color: number;
  lastGeneratedAt: number;
  lastDryAt: number;
}

export class BloodLedger {
  private readonly unitsPerDamagePoint: number;
  private readonly maxUnitsPerImpact: number;
  private readonly spillLifetimeMs: number;
  private readonly spillDryingRatePerSecond: number;
  private readonly spillByVictim = new Map<string, BloodSpill>();

  public constructor(options: BloodLedgerOptions = {}) {
    this.unitsPerDamagePoint = Math.max(0.001, options.unitsPerDamagePoint ?? 1);
    this.maxUnitsPerImpact = Math.max(1, Math.floor(options.maxUnitsPerImpact ?? 120));
    this.spillLifetimeMs = Math.max(2000, Math.floor(options.spillLifetimeMs ?? 7000));
    this.spillDryingRatePerSecond = Math.max(0.1, options.spillDryingRatePerSecond ?? 8);
  }

  public addSpill(
    victimProfileId: string,
    damageAmount: number,
    ownerProfileId: string,
    color: number,
    now = Date.now(),
  ): BloodUnits {
    const units = Math.max(0, Math.floor(damageAmount * this.unitsPerDamagePoint));
    const clampedUnits = Math.min(units, this.maxUnitsPerImpact);
    const existing = this.spillByVictim.get(victimProfileId);
    const total = (existing?.totalUnits ?? 0) + clampedUnits;

    this.spillByVictim.set(victimProfileId, {
      ownerProfileId,
      color,
      totalUnits: total,
      lastGeneratedAt: now,
      lastDryAt: now,
    });
    return { units: clampedUnits };
  }

  public getSpill(victimProfileId: string): number {
    if (!this.spillByVictim.has(victimProfileId)) {
      return 0;
    }

    return this.spillByVictim.get(victimProfileId)?.totalUnits ?? 0;
  }

  public clearSpill(victimProfileId: string): void {
    this.spillByVictim.delete(victimProfileId);
  }

  public getSpillOwner(victimProfileId: string): string | null {
    return this.spillByVictim.get(victimProfileId)?.ownerProfileId ?? null;
  }

  public getSpillColor(victimProfileId: string): number | null {
    return this.spillByVictim.get(victimProfileId)?.color ?? null;
  }

  public purgeExpired(now = Date.now()): void {
    this.spillByVictim.forEach((spill, victimProfileId) => {
      if (now - spill.lastGeneratedAt >= this.spillLifetimeMs) {
        this.spillByVictim.delete(victimProfileId);
      }
    });
  }

  public drySpills(now = Date.now()): void {
    this.spillByVictim.forEach((spill, victimProfileId) => {
      const elapsedMs = now - spill.lastDryAt;
      const drainedUnits = Math.floor(elapsedMs * this.spillDryingRatePerSecond / 1000);
      if (drainedUnits <= 0) {
        return;
      }

      spill.totalUnits = Math.max(0, spill.totalUnits - drainedUnits);
      spill.lastDryAt = now;
      if (spill.totalUnits <= 0) {
        this.spillByVictim.delete(victimProfileId);
      }
    });
  }

  public get config(): BloodLedgerOptions {
    return {
      unitsPerDamagePoint: this.unitsPerDamagePoint,
      maxUnitsPerImpact: this.maxUnitsPerImpact,
      spillLifetimeMs: this.spillLifetimeMs,
      spillDryingRatePerSecond: this.spillDryingRatePerSecond,
    };
  }
}
