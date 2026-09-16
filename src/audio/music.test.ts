import { describe, expect, it } from 'vitest';
import { musicPatterns } from './music';

describe('procedural music patterns', () => {
  it('defines distinct playable patterns for every game scene', () => {
    expect(Object.keys(musicPatterns)).toEqual(['menu', 'battle', 'victory', 'defeat']);
    for (const pattern of Object.values(musicPatterns)) {
      expect(pattern.beatMs).toBeGreaterThan(0);
      expect(pattern.melody.length).toBeGreaterThanOrEqual(8);
      expect(pattern.bass.length).toBeGreaterThanOrEqual(4);
      expect(pattern.volume).toBeGreaterThan(0);
      expect(pattern.volume).toBeLessThan(0.1);
    }
    expect(musicPatterns.battle.beatMs).toBeLessThan(musicPatterns.menu.beatMs);
  });
});
