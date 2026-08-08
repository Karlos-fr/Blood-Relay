import { describe, expect, test } from 'vitest';
import { ARENA_HEIGHT, ARENA_WIDTH } from '../app/config/game';
import { ARENA_PRESETS, getArenaPresetByIndex } from '../app/config/arenas';

interface ArenaRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const getPlatformBounds = (platform: { x: number; y: number; width: number; height: number }): ArenaRect => ({
  left: platform.x - platform.width / 2,
  right: platform.x + platform.width / 2,
  top: platform.y - platform.height / 2,
  bottom: platform.y + platform.height / 2,
});

const isSpawnClear = (
  point: { x: number; y: number },
  platforms: Array<{ x: number; y: number; width: number; height: number; passThrough?: boolean }>,
): boolean => {
  for (const platform of platforms) {
    const bounds = getPlatformBounds(platform);
    const isOnPlatformTop =
      point.y >= bounds.top - 6 && point.y <= bounds.top + 16 && point.x >= bounds.left - 2 && point.x <= bounds.right + 2;
    const isInsideWall = point.x >= bounds.left && point.x <= bounds.right && point.y >= bounds.top && point.y <= bounds.bottom;

    if (isInsideWall || isOnPlatformTop) {
      return false;
    }
  }

  return true;
};

describe('Configuration des arènes', () => {
  test('le registre contient l’ensemble attendu d’arènes', () => {
    expect(ARENA_PRESETS).toHaveLength(10);
    expect(ARENA_PRESETS.map((arena) => arena.id)).toEqual(
      expect.arrayContaining(['classic', 'high', 'abattoir', 'bloc-operation', 'metro-abandonne', 'chapelle-rouge']),
    );
  });

  test('chaque arène possède une configuration exploitable', () => {
    ARENA_PRESETS.forEach((arena) => {
      expect(arena.id, `ID manquant pour une arène`).toBeTruthy();
      expect(arena.label, `Libellé manquant pour ${arena.id}`).toBeTruthy();
      expect(Array.isArray(arena.spawnPoints), `spawnPoints absent pour ${arena.id}`).toBeTruthy();
      expect(Array.isArray(arena.platforms), `platforms absent pour ${arena.id}`).toBeTruthy();
      expect(Array.isArray(arena.interactionStations), `interactionStations absent pour ${arena.id}`).toBeTruthy();
      expect(Array.isArray(arena.preview), `preview absent pour ${arena.id}`).toBeTruthy();

      expect(arena.spawnPoints.length, `spawnPoints vide pour ${arena.id}`).toBeGreaterThan(0);
      expect(arena.spawnPoints.length, `spawnPoints insuffisant pour 4 joueurs ${arena.id}`).toBeGreaterThanOrEqual(4);
      expect(arena.interactionStations.length, `interactionStations vide pour ${arena.id}`).toBeGreaterThan(0);

      arena.spawnPoints.forEach((spawn) => {
        expect(Number.isFinite(spawn.x), `x invalide pour le point de spawn ${arena.id}`).toBeTruthy();
        expect(Number.isFinite(spawn.y), `y invalide pour le point de spawn ${arena.id}`).toBeTruthy();
        expect(spawn.x, `spawn hors arène en x ${arena.id}`).toBeGreaterThanOrEqual(0);
        expect(spawn.x, `spawn hors arène en x ${arena.id}`).toBeLessThanOrEqual(ARENA_WIDTH);
        expect(spawn.y, `spawn hors arène en y ${arena.id}`).toBeGreaterThanOrEqual(0);
        expect(spawn.y, `spawn hors arène en y ${arena.id}`).toBeLessThanOrEqual(ARENA_HEIGHT);
      });

      arena.platforms.forEach((platform) => {
        expect(Number.isFinite(platform.x), `plateforme x invalide ${arena.id}`).toBeTruthy();
        expect(Number.isFinite(platform.y), `plateforme y invalide ${arena.id}`).toBeTruthy();
        expect(platform.width, `largeur plateau invalide ${arena.id}`).toBeGreaterThan(0);
        expect(platform.height, `hauteur plateau invalide ${arena.id}`).toBeGreaterThan(0);
      });

      arena.interactionStations.forEach((station) => {
        expect(Number.isFinite(station.x), `station x invalide ${arena.id}`).toBeTruthy();
        expect(Number.isFinite(station.y), `station y invalide ${arena.id}`).toBeTruthy();
        expect(station.label, `label station manquant ${arena.id}`).toBeTruthy();
      });

      const clearSpawnPoints = arena.spawnPoints.filter((spawn) => isSpawnClear(spawn, arena.platforms));
      expect(
        clearSpawnPoints.length,
        `apparitions potentiellement bloquées par du décor dans ${arena.id}`,
      ).toBe(arena.spawnPoints.length);

      const firstTwoSpawnPoints = arena.spawnPoints.slice(0, 2);
      expect(firstTwoSpawnPoints.length, `2 points minimum requis pour le mode 2 joueurs (${arena.id})`).toBeGreaterThanOrEqual(2);
      const uniqueFirstTwoSpawns = new Set(firstTwoSpawnPoints.map((spawn) => `${spawn.x.toFixed(1)}:${spawn.y.toFixed(1)}`));
      expect(
        uniqueFirstTwoSpawns.size,
        `points de spawn en doublon pour le mode 2 joueurs (${arena.id})`,
      ).toBe(firstTwoSpawnPoints.length);

      const firstFourSpawnPoints = arena.spawnPoints.slice(0, 4);
      expect(firstFourSpawnPoints.length, `4 points minimum requis pour le mode 4 joueurs (${arena.id})`).toBeGreaterThanOrEqual(4);
      const uniqueFirstFourSpawns = new Set(firstFourSpawnPoints.map((spawn) => `${spawn.x.toFixed(1)}:${spawn.y.toFixed(1)}`));
      expect(
        uniqueFirstFourSpawns.size,
        `points de spawn en doublon pour le mode 4 joueurs (${arena.id})`,
      ).toBe(firstFourSpawnPoints.length);

      for (let index = 0; index < firstFourSpawnPoints.length; index += 1) {
        const spawn = firstFourSpawnPoints[index];
        if (!spawn) {
          continue;
        }
        expect(
          spawn.x,
          `spawn trop proche du bord droit (${arena.id})`,
        ).toBeLessThanOrEqual(ARENA_WIDTH - 30);
        expect(spawn.x, `spawn trop proche du bord gauche (${arena.id})`).toBeGreaterThanOrEqual(30);
        expect(spawn.y, `spawn trop proche du bord bas (${arena.id})`).toBeLessThanOrEqual(ARENA_HEIGHT - 30);
        expect(spawn.y, `spawn trop proche du bord haut (${arena.id})`).toBeGreaterThanOrEqual(50);
      }
    });
  });

  test('les identifiants des arènes sont uniques', () => {
    const ids = ARENA_PRESETS.map((arena) => arena.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test('la sélection d’indice d’arène retourne un preset valide', () => {
    expect(getArenaPresetByIndex(0).id).toBe(ARENA_PRESETS[0].id);
    expect(getArenaPresetByIndex(ARENA_PRESETS.length).id).toBe(ARENA_PRESETS[0].id);
    expect(getArenaPresetByIndex(ARENA_PRESETS.length + 1).id).toBe(ARENA_PRESETS[1].id);
    expect(getArenaPresetByIndex(-1).id).toBe(ARENA_PRESETS[ARENA_PRESETS.length - 1].id);
  });
});
