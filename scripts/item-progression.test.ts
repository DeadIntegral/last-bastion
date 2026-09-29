import { describe, expect, it } from 'vitest';
import { itemDefinitions } from '../src/data/items';
import { getStage } from '../src/data/stages';
import { analyzeStageDifficulty } from '../src/game/difficulty';

const itemMilestones = [
  { itemId: 'veteran-standard', previousStage: 4, nextStage: 5, representativePower: 1.02 },
  { itemId: 'runed-whetstone', previousStage: 8, nextStage: 9, representativePower: 1.02 },
  { itemId: 'war-standard', previousStage: 12, nextStage: 13, representativePower: 1.06 },
  { itemId: 'rapid-assault-kit', previousStage: 18, nextStage: 19, representativePower: 1.08 },
  { itemId: 'quartermaster-seal', previousStage: 24, nextStage: 25, representativePower: 1.07 },
  { itemId: 'royal-siege-core', previousStage: 30, nextStage: 303, representativePower: 1.35 },
] as const;

describe('item-aware encounter progression', () => {
  it('keeps the next campaign or free-expedition step ahead of representative drop and crafting power', () => {
    const report = itemMilestones.map((milestone) => {
      const before = analyzeStageDifficulty(getStage(milestone.previousStage)).total;
      const after = analyzeStageDifficulty(getStage(milestone.nextStage)).total;
      const pressureStep = after / before;
      return {
        item: itemDefinitions[milestone.itemId].name,
        transition: `${milestone.previousStage}→${milestone.nextStage}`,
        pressureStep: Math.round(pressureStep * 1_000) / 1_000,
        minimum: Math.round(milestone.representativePower * 1.01 * 1_000) / 1_000,
      };
    });
    console.table(report);
    expect(report.every((entry) => entry.pressureStep >= entry.minimum)).toBe(true);
  });
});
