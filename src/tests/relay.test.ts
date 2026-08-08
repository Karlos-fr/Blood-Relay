import { describe, expect, test } from 'vitest';
import { isRelayAlly } from '../gameplay/match/relay';

describe('Relay team utilities', () => {
  test('détermine correctement les alliés relay', () => {
    const relayByProfileId = new Map<string, number>([
      ['p1', 0],
      ['p2', 0],
      ['p3', 1],
    ]);

    expect(isRelayAlly(relayByProfileId, 'p1', 'p2')).toBe(true);
    expect(isRelayAlly(relayByProfileId, 'p1', 'p3')).toBe(false);
    expect(isRelayAlly(relayByProfileId, 'p1', 'p1')).toBe(true);
  });

  test('bloque les transferts en dehors de l’équipe', () => {
    const relayByProfileId = new Map<string, number>([
      ['p1', 0],
      ['p2', 1],
    ]);

    expect(isRelayAlly(relayByProfileId, 'p1', 'p2')).toBe(false);
    expect(isRelayAlly(relayByProfileId, 'p2', 'p1')).toBe(false);
  });

  test('autorise le self-targeting', () => {
    const relayByProfileId = new Map<string, number>([
      ['p1', 0],
      ['p2', 1],
    ]);

    expect(isRelayAlly(relayByProfileId, 'p1', 'p1')).toBe(true);
    expect(isRelayAlly(relayByProfileId, 'p2', 'p2')).toBe(true);
  });
});
