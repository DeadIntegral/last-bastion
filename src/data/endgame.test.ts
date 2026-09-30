import { describe, expect, it } from 'vitest';
import { monumentBuildings, monumentConstructionCost, triumphMonumentBonuses } from './endgame';
import { getStage } from './stages';

describe('distinct monument construction', () => {
  it.each([
    ['liberation-beacon', 3000, 2400], ['heroes-statue', 5000, 4000],
    ['alliance-pillar', 8000, 6400], ['spirit-sanctuary', 12000, 9600], ['victory-crown', 18000, 14400],
  ])('prices %s independently of construction order', (id, base, discounted) => {
    expect(monumentConstructionCost(id)).toBe(base);
    expect(monumentConstructionCost(id, 4)).toBe(discounted);
    expect(monumentConstructionCost(id, 999)).toBe(discounted);
  });

  it('aggregates identities once and preserves previous per-building minimums', () => {
    const ids = monumentBuildings.map((building) => building.id);
    expect(triumphMonumentBonuses(ids)).toEqual({ count: 5, combatantHpMultiplier: 1.27, combatantAttackMultiplier: 1.27, fortressHpBonus: 4000 });
    expect(triumphMonumentBonuses([...ids, ...ids])).toEqual(triumphMonumentBonuses(ids));
    expect(triumphMonumentBonuses([]).combatantAttackMultiplier).toBe(1);
    expect(triumphMonumentBonuses(['liberation-beacon'])).not.toEqual(triumphMonumentBonuses(['heroes-statue']));
    expect(monumentConstructionCost('unknown')).toBeNull();
    expect(monumentBuildings.every((building) => building.hpPercent >= 4 && building.powerPercent >= 4 && building.fortressHp >= 600)).toBe(true);
    expect(monumentBuildings.reduce((sum, building) => sum + building.cost, 0)).toBe(46000);
  });

  it('keeps construction within a short post-finale reward budget', () => {
    const total = monumentBuildings.reduce((sum, building) => sum + building.cost, 0);
    const discounted = monumentBuildings.reduce((sum, building) => sum + monumentConstructionCost(building.id, 4)!, 0);
    expect(monumentBuildings[0].cost).toBeLessThanOrEqual(getStage(30).reward);
    expect(total).toBeLessThanOrEqual(getStage(303).reward * 10);
    expect(discounted).toBe(36800);
    expect(discounted).toBeLessThanOrEqual(getStage(303).reward * 8);
  });
});
