export interface WeaponAudioStep {
  startFrequency: number;
  endFrequency: number;
  durationMs: number;
  gain: number;
  delayMs?: number;
}

export interface WeaponAudioProfile {
  shoot: WeaponAudioStep[];
  impact: WeaponAudioStep[];
  projection?: WeaponAudioStep[];
}

export interface WeaponProjectionProfile {
  spreadDegrees: number;
  particleCount: number;
  speedMin: number;
  speedMax: number;
  sprayOffset: number;
  lifetimeMin: number;
  lifetimeMax: number;
}

export interface WeaponMeleeProfile {
  damage: number;
  cooldownMs?: number;
  rangeWidth: number;
  rangeHeight: number;
  rangeOffset: number;
  knockback: number;
  windupMs?: number;
  durationMs?: number;
  comboResetMs?: number;
  comboMax?: number;
  comboDamageMultiplier?: number[];
  dashSpeed?: number;
  dashDurationMs?: number;
  parryWindowMs?: number;
  parryCooldownMs?: number;
  bloodParticleScale?: number;
}

export interface WeaponProjectile {
  speed: number;
  damage: number;
  explosionRadiusPx?: number;
  explosionDamage?: number;
  explosionKnockback?: number;
  explosionDelayMs?: number;
  explosionPoolCount?: number;
  pelletCount?: number;
  spreadDegrees?: number;
  spreadIncreaseDegrees?: number;
  spreadMaxDegrees?: number;
  spreadResetMs?: number;
  trailIntervalMs?: number;
  trailParticleScale?: number;
  maxRangePx?: number;
  maxPlayerHits?: number;
  gravityScale?: number;
}

export interface WeaponConfig {
  id: string;
  label: string;
  recoilForce: number;
  damage: number;
  cooldownMs: number;
  combatMode?: 'ranged' | 'melee';
  fireMode?: 'semi' | 'automatic';
  projectile: WeaponProjectile;
  projectileBehavior?: 'straight' | 'drop' | 'arc';
  wallInteraction?: 'destroy' | 'passThrough';
  wallStickingMs?: number;
  melee?: WeaponMeleeProfile;
  bloodProjection?: WeaponProjectionProfile;
  audio?: WeaponAudioProfile;
}

export interface Weapon {
  config: WeaponConfig;
  muzzleFlashMs?: number;
  muzzleFlashLengthPx?: number;
  muzzleFlashHeightPx?: number;
  iconTexture?: string;
  muzzleFlashAnimation?: string;
  projectileTexture?: string;
  muzzleFlashTexture?: string;
  meleeEffectTexture?: string;
}
