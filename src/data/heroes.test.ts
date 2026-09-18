import { describe, expect, it } from 'vitest';
import { heroDefinitions, heroOrder } from './units';
import { calculateDamage, heroAuraBonuses } from '../game/rules';
import { bossDefinition } from './units';

describe('hero roster', () => {
  it('contains seven human and non-human heroes with complete skill and respawn data', () => {
    expect(heroOrder).toHaveLength(7);
    for (const id of heroOrder) {
      const hero = heroDefinitions[id];
      expect(hero.skillName.length).toBeGreaterThan(0);
      expect(hero.passiveName.length).toBeGreaterThan(0);
      expect(hero.skillCooldownMs).toBeGreaterThan(0);
      expect(hero.respawnMs).toBeGreaterThan(0);
    }
  });

  it('gives every hero a three-step awakening aura', () => {
    for (const id of heroOrder) {
      expect(Object.values(heroAuraBonuses(id, 9)).slice(1).every((value) => value === 0)).toBe(true);
      expect(Object.values(heroAuraBonuses(id, 30)).slice(1).some((value) => value > 0)).toBe(true);
    }
  });

  it('gives the huntress anti-large damage against the boss', () => {
    expect(calculateDamage(heroDefinitions.huntress, bossDefinition)).toBe(
      Math.round(heroDefinitions.huntress.attackDamage * 1.75),
    );
  });

  it('keeps the starting hero free and later heroes unlockable', () => {
    expect(heroDefinitions.warden.unlockCost).toBe(0);
    expect(heroDefinitions.pyromancer.unlockCost).toBeGreaterThan(0);
    expect(heroDefinitions.huntress.unlockCost).toBeGreaterThan(heroDefinitions.pyromancer.unlockCost);
    expect(heroDefinitions.saint.unlockCost).toBeGreaterThan(heroDefinitions.huntress.unlockCost);
    expect(heroDefinitions.marshal.unlockCost).toBeGreaterThan(heroDefinitions.saint.unlockCost);
    expect(heroDefinitions.orcChampion.unlockCost).toBeGreaterThan(heroDefinitions.marshal.unlockCost);
    expect(heroDefinitions.windSpirit.unlockCost).toBeGreaterThan(heroDefinitions.orcChampion.unlockCost);
  });
});
