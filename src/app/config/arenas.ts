import { ARENA_HEIGHT, ARENA_WIDTH } from './game';

export interface ArenaSpawnPoint {
  x: number;
  y: number;
}

export interface ArenaPlatform {
  x: number;
  y: number;
  width: number;
  height: number;
  passThrough?: boolean;
  label?: string;
}

export interface ArenaInteractionStation {
  x: number;
  y: number;
  label: string;
  isBloodBank?: boolean;
  cooldownMs?: number;
}

export interface ArenaPreset {
  id: string;
  label: string;
  spawnPoints: ArenaSpawnPoint[];
  platforms: ArenaPlatform[];
  interactionStations: ArenaInteractionStation[];
  preview: string[];
  allowRandomMirror?: boolean;
}

const floorHeight = 48;
const floorY = ARENA_HEIGHT - floorHeight / 2;

const clampSpawnX = (value: number): number => Math.max(40, Math.min(ARENA_WIDTH - 40, value));

const presetSpawn = (x: number, y: number): ArenaSpawnPoint => ({
  x: clampSpawnX(x),
  y: Math.max(80, Math.min(ARENA_HEIGHT - 100, y)),
});

export const ARENA_PRESETS: ArenaPreset[] = [
  {
    id: 'classic',
    label: 'Arène classique',
    spawnPoints: [
      presetSpawn(220, 620),
      presetSpawn(1000, 620),
      presetSpawn(220, 420),
      presetSpawn(1000, 420),
    ],
    platforms: [
      { x: 420, y: 510, width: 320, height: 24, label: 'Pont A' },
      { x: 900, y: 340, width: 300, height: 24, label: 'Pont B', passThrough: true },
    ],
    interactionStations: [
      { x: 760, y: 590, label: 'Relais sanguin', isBloodBank: true },
    ],
    preview: ['Flux stable', 'Zone centrale dégagée', 'Deux ponts'],
    allowRandomMirror: false,
  },
  {
    id: 'high',
    label: 'Arène haute',
    spawnPoints: [
      presetSpawn(320, 620),
      presetSpawn(960, 620),
      presetSpawn(360, 270),
      presetSpawn(920, 270),
    ],
    platforms: [
      { x: 540, y: 520, width: 260, height: 24, label: 'Étage 1' },
      { x: 740, y: 380, width: 260, height: 24, label: 'Étage 2' },
      { x: 640, y: 240, width: 220, height: 24, label: 'Tour', passThrough: true },
    ],
    interactionStations: [
      { x: 760, y: 590, label: 'Relais sanguin', isBloodBank: true },
    ],
    preview: ['Niveau vertical', 'Plateformes superposées'],
    allowRandomMirror: false,
  },
  {
    id: 'abattoir',
    label: 'Abattoir',
    spawnPoints: [
      presetSpawn(220, floorY - 18),
      presetSpawn(1060, floorY - 18),
      presetSpawn(640, 340),
      presetSpawn(640, 200),
    ],
    platforms: [
      { x: 420, y: 505, width: 180, height: 18, passThrough: true, label: 'Tapis roulant' },
      { x: 860, y: 505, width: 180, height: 18, passThrough: true, label: 'Tapis roulant' },
      { x: 640, y: 360, width: 380, height: 18, label: 'Zone broyeurs' },
      { x: 250, y: 280, width: 110, height: 18, label: 'Crochets A', passThrough: true },
      { x: 1030, y: 280, width: 110, height: 18, label: 'Crochets B', passThrough: true },
    ],
    interactionStations: [
      { x: 760, y: 590, label: 'Relais sanguin', isBloodBank: true },
      { x: 640, y: 590, label: 'Broyeur de sang' },
    ],
    preview: ['Tapis rapides', 'Crochets latéraux', 'Broyeur central'],
    allowRandomMirror: true,
  },
  {
    id: 'bloc-operation',
    label: 'Bloc opératoire',
    spawnPoints: [
      presetSpawn(190, floorY - 18),
      presetSpawn(1090, floorY - 18),
      presetSpawn(640, 360),
      presetSpawn(640, 250),
    ],
    platforms: [
      { x: 640, y: 520, width: 300, height: 18, label: 'Table mobile 1', passThrough: true },
      { x: 320, y: 430, width: 180, height: 16, label: 'Table mobile 2', passThrough: true },
      { x: 960, y: 430, width: 180, height: 16, label: 'Table mobile 3', passThrough: true },
      { x: 640, y: 300, width: 240, height: 18, label: 'Porte principale' },
    ],
    interactionStations: [
      { x: 760, y: 590, label: 'Relais sanguin', isBloodBank: true },
      { x: 380, y: 350, label: 'Autocurage' },
      { x: 900, y: 350, label: 'Autocurage' },
    ],
    preview: ['Tables mobiles', 'Couloirs lumineux', 'Porte auto'],
    allowRandomMirror: true,
  },
  {
    id: 'metro-abandonne',
    label: 'Métro abandonné',
    spawnPoints: [
      presetSpawn(190, floorY - 18),
      presetSpawn(1090, floorY - 18),
      presetSpawn(420, 260),
      presetSpawn(860, 260),
    ],
    platforms: [
      { x: 640, y: 560, width: 360, height: 16, passThrough: true, label: 'Tunnel central' },
      { x: 330, y: 420, width: 180, height: 16, label: 'Tunnel latéral 1', passThrough: true },
      { x: 950, y: 420, width: 180, height: 16, label: 'Tunnel latéral 2', passThrough: true },
      { x: 640, y: 300, width: 260, height: 18, label: 'Passage du train' },
    ],
    interactionStations: [
      { x: 760, y: 590, label: 'Relais sanguin', isBloodBank: true },
      { x: 330, y: 390, label: 'Entrée tunnel' },
      { x: 950, y: 390, label: 'Entrée tunnel' },
    ],
    preview: ['Tunnels latéraux', 'Passage périodique', 'Plaques de sol'],
    allowRandomMirror: true,
  },
  {
    id: 'chapelle-rouge',
    label: 'Chapelle rouge',
    spawnPoints: [
      presetSpawn(280, floorY - 18),
      presetSpawn(1000, floorY - 18),
      presetSpawn(640, 300),
      presetSpawn(540, 150),
    ],
    platforms: [
      { x: 360, y: 470, width: 260, height: 16, label: 'Rampe Gauche', passThrough: true },
      { x: 920, y: 470, width: 260, height: 16, label: 'Rampe Droite', passThrough: true },
      { x: 640, y: 330, width: 220, height: 16, label: 'Autel', passThrough: true },
      { x: 640, y: 220, width: 300, height: 16, label: 'Plateforme haute' },
    ],
    interactionStations: [
      { x: 760, y: 590, label: 'Relais sanguin', isBloodBank: true },
      { x: 640, y: 280, label: 'Autel central' },
    ],
    preview: ['Pentes convergentes', 'Accumulation centrale', 'Plateforme haute'],
    allowRandomMirror: true,
  },
  {
    id: 'usine-transfusion',
    label: 'Usine de transfusion',
    spawnPoints: [
      presetSpawn(190, floorY - 18),
      presetSpawn(1090, floorY - 18),
      presetSpawn(640, 340),
      presetSpawn(640, 210),
    ],
    platforms: [
      { x: 520, y: 540, width: 220, height: 16, label: 'Pompe A', passThrough: true },
      { x: 760, y: 540, width: 220, height: 16, label: 'Pompe B', passThrough: true },
      { x: 640, y: 390, width: 260, height: 16, label: 'Conduites' },
      { x: 640, y: 250, width: 180, height: 16, label: 'Rejet' },
    ],
    interactionStations: [
      { x: 760, y: 590, label: 'Relais sanguin', isBloodBank: true },
      { x: 520, y: 510, label: 'Aspiration' },
      { x: 760, y: 510, label: 'Rejet' },
    ],
    preview: ['Pompes', 'Conduites de sang', 'Aspiration et rejet'],
    allowRandomMirror: true,
  },
  {
    id: 'incinerateur',
    label: 'Incinérateur',
    spawnPoints: [
      presetSpawn(250, floorY - 18),
      presetSpawn(1030, floorY - 18),
      presetSpawn(640, 350),
      presetSpawn(640, 190),
    ],
    platforms: [
      { x: 640, y: 520, width: 340, height: 16, label: 'Bassin chauffé', passThrough: true },
      { x: 380, y: 420, width: 160, height: 16, label: 'Zone chaude' },
      { x: 900, y: 420, width: 160, height: 16, label: 'Zone chaude' },
      { x: 640, y: 260, width: 240, height: 14, label: 'Passage feu' },
    ],
    interactionStations: [
      { x: 760, y: 590, label: 'Relais sanguin', isBloodBank: true },
      { x: 640, y: 490, label: 'Feu temporaire' },
    ],
    preview: ['Zones chauffées', 'Feux temporaires', 'Évaporation rapide'],
    allowRandomMirror: true,
  },
  {
    id: 'prison-televisee',
    label: 'Prison télévisée',
    spawnPoints: [
      presetSpawn(220, floorY - 18),
      presetSpawn(1060, floorY - 18),
      presetSpawn(640, 360),
      presetSpawn(640, 220),
    ],
    platforms: [
      { x: 220, y: 470, width: 220, height: 16, passThrough: true, label: 'Cellule gauche' },
      { x: 1060, y: 470, width: 220, height: 16, passThrough: true, label: 'Cellule droite' },
      { x: 640, y: 350, width: 300, height: 16, label: 'Aire centrale' },
      { x: 640, y: 210, width: 180, height: 16, passThrough: true, label: 'Plateforme haute' },
    ],
    interactionStations: [
      { x: 760, y: 590, label: 'Relais sanguin', isBloodBank: true },
      { x: 220, y: 440, label: 'Portes contrôlées' },
      { x: 1060, y: 440, label: 'Portes contrôlées' },
    ],
    preview: ['Portes', 'Écrans géants', 'Pièges périodiques'],
    allowRandomMirror: true,
  },
  {
    id: 'cuve-zero',
    label: 'Cuve zéro',
    spawnPoints: [
      presetSpawn(255, floorY - 18),
      presetSpawn(1025, floorY - 18),
      presetSpawn(640, 330),
      presetSpawn(640, 170),
    ],
    platforms: [
      { x: 640, y: 540, width: 420, height: 16, passThrough: true, label: 'Plateforme centrale', },
      { x: 370, y: 420, width: 180, height: 14, label: 'Plateforme suspendue' },
      { x: 910, y: 420, width: 180, height: 14, label: 'Plateforme suspendue' },
      { x: 640, y: 280, width: 260, height: 12, label: 'Traverse flottante', passThrough: true },
    ],
    interactionStations: [
      { x: 760, y: 590, label: 'Relais sanguin', isBloodBank: true },
      { x: 390, y: 390, label: 'Goutte suspendue' },
      { x: 910, y: 390, label: 'Goutte suspendue' },
    ],
    preview: ['Faible gravité', 'Plateformes mobiles', 'Gouttes suspendues'],
    allowRandomMirror: true,
  },
];

export const getArenaPresetByIndex = (value: number, fallbackId = ARENA_PRESETS[0]?.id ?? 'classic'): ArenaPreset => {
  if (!ARENA_PRESETS.length) {
    return {
      id: fallbackId,
      label: 'Arène par défaut',
      spawnPoints: [{ x: ARENA_WIDTH / 2, y: floorY - 30 }],
      platforms: [],
      interactionStations: [],
      preview: ['Arène minimale'],
      allowRandomMirror: false,
    };
  }

  const count = ARENA_PRESETS.length;
  const index = ((value % count) + count) % count;
  return ARENA_PRESETS[index]!;
};
