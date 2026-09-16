import { describe, expect, it } from 'vitest';
import { bossCodex, CODEX_TOTAL, codexEntryCount, heroCodex, troopCodex } from './codex';
import { heroDefinitions, troopDefinitions } from './units';

describe('war codex', () => {
  it('contains one entry for every shared troop, hero, and boss', () => {
    expect(Object.keys(troopCodex).sort()).toEqual(Object.keys(troopDefinitions).sort());
    expect(Object.keys(heroCodex).sort()).toEqual(Object.keys(heroDefinitions).sort());
    expect(Object.keys(bossCodex)).toEqual(['boss']);
  });

  it('derives the total completion target from structured entries', () => {
    expect(CODEX_TOTAL).toBe(56);
  });

  it('counts a troop only once when it is both acquired and encountered', () => {
    expect(codexEntryCount(['militia', 'raider'], ['warden'], ['raider', 'boss'])).toBe(4);
  });
});
