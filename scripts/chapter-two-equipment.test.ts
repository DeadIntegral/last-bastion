import { describe, expect, it } from 'vitest';
import { allTroopOrder, heroOrder, heroDefinitions, troopDefinitions } from '../src/data/units';
import { chapterTwoStages } from '../src/data/chapterTwo';
import { equipmentCost, upgradedStats } from '../src/game/rules';
import { estimateUnitThreat } from '../src/game/difficulty';

describe('Chapter 2 equipment investment', () => {
  it('adds bounded personal growth without repeating the rank-five deployment capstone', () => {
    for (const definition of [...allTroopOrder.map((id) => troopDefinitions[id]), ...heroOrder.map((id) => heroDefinitions[id])]) {
      const before = upgradedStats(definition, { weapon: 5, armor: 5, boots: 5 }, 20);
      const after = upgradedStats(definition, { weapon: 10, armor: 10, boots: 10 }, 20);
      expect(after.squadSize).toBe(before.squadSize);
      expect(after.maxActivePerSide).toBe(before.maxActivePerSide);
      expect(after.maxHp).toBeGreaterThan(before.maxHp);
      expect(after.attackDamage).toBeGreaterThan(before.attackDamage);
      expect(estimateUnitThreat(after) / estimateUnitThreat(before)).toBeLessThan(1.65);
    }
    expect(chapterTwoStages.every((stage) => Object.values(stage.enemyUpgrades.equipment).every((rank) => rank <= 5))).toBe(true);
  });

  it('prices optional advanced gear against Chapter 2 rewards', () => {
    const fullBranch = (id: 'militia' | 'archmage' | 'dragon') => [5, 6, 7, 8, 9].reduce((sum, rank) => sum + equipmentCost(troopDefinitions[id], rank), 0);
    expect(fullBranch('militia')).toBe(4000);
    expect(fullBranch('archmage')).toBe(16000);
    expect(fullBranch('dragon')).toBe(32000);
    const firstVictory = chapterTwoStages[0].reward + (chapterTwoStages[0].firstClearReward.gold ?? 0);
    expect(equipmentCost(troopDefinitions.dragon, 5)).toBeLessThan(firstVictory);
    expect(fullBranch('dragon') * 3).toBeLessThanOrEqual(chapterTwoStages.reduce((sum, stage) => sum + stage.reward + (stage.firstClearReward.gold ?? 0), 0) * 1.25);
  });
});
