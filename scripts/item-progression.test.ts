import { describe, expect, it } from 'vitest';
import { itemDefinitions } from '../src/data/items';
import { stages } from '../src/data/stages';
import { analyzeStageDifficulty } from '../src/game/difficulty';

const itemMilestones = [
  { itemId: 'veteran-standard', rewardStage: 4, nextStage: 5, representativePower: 1.02 },
  { itemId: 'runed-whetstone', rewardStage: 8, nextStage: 9, representativePower: 1.02 },
  { itemId: 'clockwork-horn', rewardStage: 12, nextStage: 13, representativePower: 1.03 },
  { itemId: 'guardian-keystone', rewardStage: 18, nextStage: 19, representativePower: 1.06 },
  { itemId: 'quartermaster-seal', rewardStage: 24, nextStage: 25, representativePower: 1.07 },
] as const;

describe('item-aware campaign progression', () => {
  it('keeps the next campaign stage ahead of each newly acquired item power step', () => {
    const report = itemMilestones.map((milestone) => {
      const before = analyzeStageDifficulty(stages[milestone.rewardStage - 1]).total;
      const after = analyzeStageDifficulty(stages[milestone.nextStage - 1]).total;
      const pressureStep = after / before;
      return {
        item: itemDefinitions[milestone.itemId].name,
        transition: `${milestone.rewardStage}→${milestone.nextStage}`,
        pressureStep: Math.round(pressureStep * 1_000) / 1_000,
        minimum: Math.round(milestone.representativePower * 1.01 * 1_000) / 1_000,
      };
    });
    console.table(report);
    expect(report.every((entry) => entry.pressureStep >= entry.minimum)).toBe(true);
  });
});
