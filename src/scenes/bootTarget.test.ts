import { describe, expect, it } from 'vitest';
import { selectBootTarget } from './bootTarget';

describe('boot target selection', () => {
  it('routes only the explicit preview query to the preview scene', () => {
    expect(selectBootTarget('?character-preview=1')).toBe('CharacterPreviewScene');
    expect(selectBootTarget('?other=value&character-preview=1')).toBe('CharacterPreviewScene');
    expect(selectBootTarget('?character-preview=0')).toBe('ArenaScene');
    expect(selectBootTarget('?character-preview=true')).toBe('ArenaScene');
    expect(selectBootTarget('?Character-preview=1')).toBe('ArenaScene');
    expect(selectBootTarget('')).toBe('ArenaScene');
  });
});
