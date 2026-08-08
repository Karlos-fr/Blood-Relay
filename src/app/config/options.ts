export interface GameOptions {
  masterVolume: number;
  musicVolume: number;
  effectsVolume: number;
  cameraShakeIntensity: number;
  flashIntensity: number;
  vibrationEnabled: boolean;
  daltonianMode: boolean;
  reducedBloodVisual: boolean;
}

export const DEFAULT_GAME_OPTIONS: GameOptions = {
  masterVolume: 0.85,
  musicVolume: 0.7,
  effectsVolume: 0.9,
  cameraShakeIntensity: 0.7,
  flashIntensity: 0.8,
  vibrationEnabled: true,
  daltonianMode: false,
  reducedBloodVisual: false,
};

const STORAGE_KEY = 'blood-relay-options-v1';

const clamp01 = (value: number, fallback: number): number => {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(0, Math.min(1, value));
};

const toNumber = (value: unknown, fallback: number): number => {
  if (typeof value !== 'number') {
    return fallback;
  }

  if (!Number.isFinite(value)) {
    return fallback;
  }

  return value;
};

export const normalizeGameOptions = (options: Partial<GameOptions> = {}): GameOptions => ({
  masterVolume: clamp01(toNumber(options.masterVolume, DEFAULT_GAME_OPTIONS.masterVolume), DEFAULT_GAME_OPTIONS.masterVolume),
  musicVolume: clamp01(toNumber(options.musicVolume, DEFAULT_GAME_OPTIONS.musicVolume), DEFAULT_GAME_OPTIONS.musicVolume),
  effectsVolume: clamp01(toNumber(options.effectsVolume, DEFAULT_GAME_OPTIONS.effectsVolume), DEFAULT_GAME_OPTIONS.effectsVolume),
  cameraShakeIntensity: clamp01(toNumber(options.cameraShakeIntensity, DEFAULT_GAME_OPTIONS.cameraShakeIntensity), DEFAULT_GAME_OPTIONS.cameraShakeIntensity),
  flashIntensity: clamp01(toNumber(options.flashIntensity, DEFAULT_GAME_OPTIONS.flashIntensity), DEFAULT_GAME_OPTIONS.flashIntensity),
  vibrationEnabled: options.vibrationEnabled ?? DEFAULT_GAME_OPTIONS.vibrationEnabled,
  daltonianMode: options.daltonianMode ?? DEFAULT_GAME_OPTIONS.daltonianMode,
  reducedBloodVisual: options.reducedBloodVisual ?? DEFAULT_GAME_OPTIONS.reducedBloodVisual,
});

export const loadGameOptions = (): GameOptions => {
  if (typeof localStorage === 'undefined') {
    return { ...DEFAULT_GAME_OPTIONS };
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { ...DEFAULT_GAME_OPTIONS };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<GameOptions>;
    return normalizeGameOptions(parsed);
  } catch {
    return { ...DEFAULT_GAME_OPTIONS };
  }
};

export const saveGameOptions = (options: GameOptions): void => {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
};

export const getDaltonianColor = (sourceColor: number): number => {
  const safeColor = sourceColor & 0xffffff;

  const red = (safeColor >> 16) & 0xff;
  const green = (safeColor >> 8) & 0xff;
  const blue = safeColor & 0xff;
  const luminance = Math.round(0.299 * red + 0.587 * green + 0.114 * blue);

  if (luminance > 180) {
    return 0x8ab4ff;
  }

  if (luminance > 120) {
    return 0x88e3ff;
  }

  return 0xf8a4ff;
};
