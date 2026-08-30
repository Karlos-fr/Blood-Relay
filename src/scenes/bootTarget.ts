export type BootTarget = 'ArenaScene' | 'CharacterPreviewScene';

export function selectBootTarget(search: string): BootTarget {
  return new URLSearchParams(search).get('character-preview') === '1'
    ? 'CharacterPreviewScene'
    : 'ArenaScene';
}
