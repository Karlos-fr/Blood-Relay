import Phaser from 'phaser';
import { ActionInputState, ActionName, InputProfile } from './input';

interface BotActorLike {
  profile: {
    id: string;
  };
  x: number;
  y: number;
  bloodReserve: number;
  maxBloodReserve: number;
  health: {
    isDead(): boolean;
  };
  debugState: {
    grounded: boolean;
    health: number;
    maxHealth: number;
    transfusionCooldownRemaining: number;
    transfusing: boolean;
  };
}

type LateralDirection = -1 | 1;
type BotDifficulty = 'easy' | 'normal' | 'hard';

interface BotPoolTarget {
  x: number;
  y: number;
  units: number;
}

interface BotControllerConfig {
  id: string;
  label: string;
  getSelf: () => BotActorLike | undefined;
  getOpponents: () => BotActorLike[];
  canTraverseDirection?: (self: BotActorLike, direction: LateralDirection) => boolean;
  getNearestBloodPool?: (self: BotActorLike) => BotPoolTarget | undefined;
  getTeamMembers?: () => BotActorLike[];
  difficulty?: BotDifficulty;
}

interface SimpleBotConfig extends BotControllerConfig {
  meleeRangePx?: number;
  shootRangePx?: number;
  preferredJumpHeightPx?: number;
  dodgeCooldownMs?: number;
  nowMs?: () => number;
  random?: () => number;
}

interface BotDifficultyProfile {
  shootRangeMultiplier: number;
  meleeRangeMultiplier: number;
  dodgeChance: number;
  transfuSelfHealthPercent: number;
  transfuReserveReserve: number;
  transfuTeamReserveReserve: number;
  teamHealingThresholdPercent: number;
  teamHealingMinSelfHealthPercent: number;
  transfuSafetyDistancePx: number;
}

const BOT_DIFFICULTY_PROFILES: Record<BotDifficulty, BotDifficultyProfile> = {
  easy: {
    shootRangeMultiplier: 0.88,
    meleeRangeMultiplier: 0.9,
    dodgeChance: 0.012,
    transfuSelfHealthPercent: 0.35,
    transfuReserveReserve: 4,
    transfuTeamReserveReserve: 0,
    teamHealingThresholdPercent: 0.88,
    teamHealingMinSelfHealthPercent: 0.6,
    transfuSafetyDistancePx: 170,
  },
  normal: {
    shootRangeMultiplier: 1,
    meleeRangeMultiplier: 1,
    dodgeChance: 0.025,
    transfuSelfHealthPercent: 0.46,
    transfuReserveReserve: 2,
    transfuTeamReserveReserve: 0,
    teamHealingThresholdPercent: 0.9,
    teamHealingMinSelfHealthPercent: 0.62,
    transfuSafetyDistancePx: 170,
  },
  hard: {
    shootRangeMultiplier: 1.15,
    meleeRangeMultiplier: 1.08,
    dodgeChance: 0.038,
    transfuSelfHealthPercent: 0.52,
    transfuReserveReserve: 1,
    transfuTeamReserveReserve: 1,
    teamHealingThresholdPercent: 0.92,
    teamHealingMinSelfHealthPercent: 0.65,
    transfuSafetyDistancePx: 130,
  },
};

class ScriptedActionInput implements ActionInputState {
  public isDown = false;
  private justDown = false;

  public refresh(): void {
    this.justDown = false;
  }

  public consumeJustDown(): boolean {
    const value = this.justDown;
    this.justDown = false;
    return value;
  }

  public setState(isDown: boolean, pulse = false): void {
    this.justDown = pulse ? isDown : false;
    this.isDown = isDown;
  }

  public clear(): void {
    this.isDown = false;
    this.justDown = false;
  }
}

const createActionStateMap = (): Record<ActionName, ScriptedActionInput> => ({
  left: new ScriptedActionInput(),
  right: new ScriptedActionInput(),
  jump: new ScriptedActionInput(),
  down: new ScriptedActionInput(),
  shoot: new ScriptedActionInput(),
  melee: new ScriptedActionInput(),
  dodge: new ScriptedActionInput(),
  transfusion: new ScriptedActionInput(),
  interact: new ScriptedActionInput(),
  join: new ScriptedActionInput(),
  leave: new ScriptedActionInput(),
});

const getDistanceToTarget = (origin: BotActorLike, target: BotActorLike): number => {
  const deltaX = target.x - origin.x;
  const deltaY = target.y - origin.y;
  return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
};

const getDistanceToPoint = (originX: number, originY: number, targetX: number, targetY: number): number => {
  const deltaX = targetX - originX;
  const deltaY = targetY - originY;
  return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
};

const bloodSearchContactDistancePx = 32;

export const createSimpleBotProfile = (config: SimpleBotConfig): InputProfile => {
  const actions = createActionStateMap();
  const meleeRangePx = config.meleeRangePx ?? 56;
  const shootRangePx = config.shootRangePx ?? 520;
  const jumpHeightPx = config.preferredJumpHeightPx ?? 38;
  const dodgeCooldownMs = config.dodgeCooldownMs ?? 980;
  const getNowMs = config.nowMs ?? (() => Date.now());
  const random = config.random ?? Math.random;
  const difficulty = config.difficulty ?? 'normal';
  const difficultyProfile = BOT_DIFFICULTY_PROFILES[difficulty];
  const effectiveMeleeRangePx = meleeRangePx * difficultyProfile.meleeRangeMultiplier;
  const effectiveShootRangePx = shootRangePx * difficultyProfile.shootRangeMultiplier;
  let lastDodgeAtMs = 0;
  const defaultCanTraverse = (): boolean => true;

  const clearActions = (): void => {
    (Object.values(actions) as ScriptedActionInput[]).forEach((action) => {
      action.clear();
    });
  };

  const updateActions = (): void => {
    clearActions();
    const self = config.getSelf();
    if (!self || self.health.isDead()) {
      return;
    }

    const nowMs = getNowMs();
    const aliveOpponents = config.getOpponents().filter((opponent) => !opponent.health.isDead());
    let nearestOpponent = aliveOpponents[0];
    let bestOpponentDistance = Number.POSITIVE_INFINITY;

    for (let index = 0; index < aliveOpponents.length; index += 1) {
      const opponent = aliveOpponents[index];
      if (!opponent) {
        continue;
      }

      const distance = getDistanceToTarget(self, opponent);
      if (distance < bestOpponentDistance) {
        nearestOpponent = opponent;
        bestOpponentDistance = distance;
      }
    }

    const nearestPool = config.getNearestBloodPool?.(self);
    const needsBlood = self.bloodReserve < self.maxBloodReserve;
    const nearestPoolDistance = nearestPool ? getDistanceToPoint(self.x, self.y, nearestPool.x, nearestPool.y) : Number.POSITIVE_INFINITY;
    const targetIsPool = needsBlood && nearestPool !== undefined && nearestPoolDistance <= bestOpponentDistance && nearestPool.units > 0;

    const target = targetIsPool ? nearestPool : nearestOpponent;
    if (!target) {
      return;
    }

    const getNearestTeamMemberNeedingHeal = (): BotActorLike | undefined => {
      const teamMembers = config.getTeamMembers?.() ?? [];
      if (teamMembers.length <= 0) {
        return undefined;
      }

      let nearestMember: BotActorLike | undefined;
      let nearestMemberDistanceSq = Number.POSITIVE_INFINITY;

      for (let index = 0; index < teamMembers.length; index += 1) {
        const member = teamMembers[index];
        if (!member || member.profile.id === self.profile.id) {
          continue;
        }

        if (member.health.isDead()) {
          continue;
        }

        if (member.debugState.health >= member.debugState.maxHealth * difficultyProfile.teamHealingThresholdPercent) {
          continue;
        }

        const distanceSq = Phaser.Math.Distance.Squared(self.x, self.y, member.x, member.y);
        if (distanceSq < nearestMemberDistanceSq) {
          nearestMemberDistanceSq = distanceSq;
          nearestMember = member;
        }
      }

      return nearestMember;
    };

    const nearestTeamMember = getNearestTeamMemberNeedingHeal();

    const inCombat = target !== nearestPool && bestOpponentDistance <= difficultyProfile.transfuSafetyDistancePx;
    const canTransfuseNow = self.debugState.transfusionCooldownRemaining <= 0 && !self.debugState.transfusing;
    const shouldTransfuseSelf =
      canTransfuseNow
      && nearestTeamMember === undefined
      && self.bloodReserve >= difficultyProfile.transfuReserveReserve
      && self.debugState.health < self.debugState.maxHealth * difficultyProfile.transfuSelfHealthPercent;

    const shouldTransfuseAlly =
      canTransfuseNow
      && nearestTeamMember !== undefined
      && self.bloodReserve >= difficultyProfile.transfuTeamReserveReserve
      && self.debugState.health >= self.debugState.maxHealth * difficultyProfile.teamHealingMinSelfHealthPercent;

    if (!targetIsPool && !inCombat && (shouldTransfuseSelf || shouldTransfuseAlly)) {
      actions.transfusion.setState(true, true);
      return;
    }

    const targetDeltaX = target.x - self.x;
    const targetDeltaY = target.y - self.y;
    const absDeltaX = Math.abs(targetDeltaX);
    const absDeltaY = Math.abs(targetDeltaY);
    const preferredDirection: LateralDirection = targetDeltaX < 0 ? -1 : 1;
    const canTraverse = config.canTraverseDirection ?? defaultCanTraverse;
    const alternateDirection: LateralDirection = preferredDirection === -1 ? 1 : -1;
    const canTraversePreferred = canTraverse(self, preferredDirection);
    const canTraverseOther = canTraverse(self, alternateDirection);
    const shouldMoveTowardsTarget = !self.debugState.grounded || canTraversePreferred;
    const shouldMoveToFlank = self.debugState.grounded && !canTraversePreferred && canTraverseOther;
    const direction =
      absDeltaX > 14 && shouldMoveTowardsTarget
        ? preferredDirection
        : absDeltaX > 14 && shouldMoveToFlank
          ? alternateDirection
          : 0;

    if (
      self.debugState.grounded
      && targetDeltaY < 0
      && absDeltaY > jumpHeightPx
    ) {
      actions.jump.setState(true);
      return;
    }

    if (absDeltaX > 14) {
      actions.left.setState(direction === -1);
      actions.right.setState(direction === 1);

      if (self.debugState.grounded && direction === 0) {
        actions.jump.setState(absDeltaY > jumpHeightPx);
      }
    }

    if (targetIsPool) {
      if (absDeltaX <= bloodSearchContactDistancePx) {
        actions.jump.setState(false);
        actions.shoot.setState(false);
      }
      return;
    }

    if (absDeltaX <= effectiveMeleeRangePx && absDeltaY < 52) {
      actions.shoot.setState(false);
      actions.melee.setState(true, true);
      return;
    }

    if (bestOpponentDistance <= effectiveShootRangePx) {
      actions.shoot.setState(true, true);
    }

    if (
      absDeltaX < 130
      && random() < difficultyProfile.dodgeChance
      && nowMs() - lastDodgeAtMs > dodgeCooldownMs
    ) {
      actions.dodge.setState(true, true);
      lastDodgeAtMs = nowMs();
    }
  };

  return {
    id: config.id,
    label: config.label,
    source: 'bot',
    actions: actions as Record<ActionName, ActionInputState>,
    update: () => {
      updateActions();
    },
  };
};
