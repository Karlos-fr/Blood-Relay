export interface AbsorptionCandidate {
  health: {
    isDead: () => boolean;
  };
  bloodReserve: number;
  maxBloodReserve: number;
  isTransfusing: () => boolean;
}

export interface AbsorptionContact {
  playerX: number;
  playerY: number;
  poolX: number;
  poolY: number;
  poolRadius: number;
  absorbContactRadiusPx: number;
}

export function canBeAbsorbingCandidate(candidate: AbsorptionCandidate): boolean {
  if (candidate.health.isDead()) {
    return false;
  }

  if (candidate.bloodReserve >= candidate.maxBloodReserve) {
    return false;
  }

  if (candidate.isTransfusing()) {
    return false;
  }

  return true;
}

export function isPlayerWithinBloodPoolContact(playerX: number, playerY: number, contact: AbsorptionContact): boolean {
  const dx = playerX - contact.poolX;
  const dy = playerY - contact.poolY;
  const distanceSq = dx * dx + dy * dy;
  const maxDistance = contact.poolRadius + contact.absorbContactRadiusPx;

  return distanceSq <= maxDistance * maxDistance;
}
