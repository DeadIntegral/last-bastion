import { describe, expect, it } from 'vitest';
import { battleBackgroundDefinitions, battleBackgroundForTerrain } from './backgroundArt';

describe('battle background art', () => {
  it('maps the western-frontier terrain to its optimized runtime art and leaves unfinished regions on fallback', () => {
    expect(battleBackgroundForTerrain('ruined-border')).toBe(battleBackgroundDefinitions['ruined-border']);
    expect(battleBackgroundForTerrain('fallen-capital')).toBeUndefined();
    expect(battleBackgroundDefinitions['ruined-border'].url).toMatch(/\.webp$/);
  });
});
