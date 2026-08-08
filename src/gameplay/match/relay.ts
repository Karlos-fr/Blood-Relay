export type RelayTeamId = number;

export function getRelayTeamId(index: number, teamCount = 2): RelayTeamId {
  const normalizedTeamCount = Math.max(1, teamCount);
  return index % normalizedTeamCount;
}

export function isRelayAlly(teamByProfileId: ReadonlyMap<string, RelayTeamId>, profileId: string, targetProfileId: string): boolean {
  if (profileId === targetProfileId) {
    return true;
  }

  const sourceTeamId = teamByProfileId.get(profileId);
  const targetTeamId = teamByProfileId.get(targetProfileId);

  if (sourceTeamId === undefined || targetTeamId === undefined) {
    return false;
  }

  return sourceTeamId === targetTeamId;
}

