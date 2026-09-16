import { describe, expect, it } from 'vitest';
import { stages } from '../src/data/stages';
import { troopDefinitions } from '../src/data/units';
import { analyzeCampaignDifficulty, estimateUnitThreat } from '../src/game/difficulty';
import { equipmentCost, upgradedStats } from '../src/game/rules';
import type { EquipmentLevels, EquipmentSlot, UnitId } from '../src/types/game';

const STARTING_GOLD = 100;
const EARLY_UNIT_UNLOCK_STAGE: Partial<Record<UnitId, number>> = {
  militia: 0,
  guardian: 1,
  archer: 2,
  lancer: 3,
};
const slots: EquipmentSlot[] = ['weapon', 'armor', 'boots'];

function goldBeforeStage(stageId: number): number {
  return STARTING_GOLD + stages
    .filter((stage) => stage.id < stageId)
    .reduce((gold, stage) => gold + stage.reward + (stage.firstClearReward.gold ?? 0), 0);
}

function affordableBranchLevel(id: UnitId, budget: number): number {
  let spent = 0;
  let level = 0;
  while (level < 5) {
    const nextCost = equipmentCost(troopDefinitions[id], level);
    if (spent + nextCost > budget) break;
    spent += nextCost;
    level += 1;
  }
  return level;
}

function branchEquipment(slot: EquipmentSlot, level: number): EquipmentLevels {
  return {
    weapon: slot === 'weapon' ? level : 0,
    armor: slot === 'armor' ? level : 0,
    boots: slot === 'boots' ? level : 0,
  };
}

describe('early focused-upgrade stress test', () => {
  it('reports the strongest single-branch rush against stage pressure', () => {
    const campaign = analyzeCampaignDifficulty(stages);
    const report = stages.slice(0, 8).map((stage) => {
      const budget = goldBeforeStage(stage.id);
      const candidates = Object.entries(EARLY_UNIT_UNLOCK_STAGE)
        .filter(([, unlockStage]) => unlockStage !== undefined && unlockStage < stage.id)
        .flatMap(([rawId]) => {
          const id = rawId as UnitId;
          const level = affordableBranchLevel(id, budget);
          return slots.map((slot) => {
            const definition = upgradedStats(troopDefinitions[id], branchEquipment(slot, level));
            const deploymentThreat = estimateUnitThreat(definition) * definition.squadSize;
            const statOnlyThreat = estimateUnitThreat(definition) * troopDefinitions[id].squadSize;
            return {
              id,
              name: definition.name,
              slot,
              level,
              squad: definition.squadSize,
              deploymentThreat,
              statOnlyThreat,
              efficiency: deploymentThreat / definition.cost,
            };
          });
        });
      const best = candidates.sort((left, right) => right.efficiency - left.efficiency)[0];
      const base = troopDefinitions[best.id];
      const baseThreat = estimateUnitThreat(base) * base.squadSize;
      const stagePressure = campaign.stages.find((entry) => entry.stageId === stage.id)?.total ?? 0;
      return {
        stage: stage.id,
        budget,
        rush: `${best.name} ${best.slot} +${best.level}`,
        squad: `${base.squadSize}→${best.squad}`,
        statGain: Math.round(best.statOnlyThreat / baseThreat * 100) / 100,
        powerGain: Math.round(best.deploymentThreat / baseThreat * 100) / 100,
        value: Math.round(best.efficiency * 100) / 100,
        pressure: stagePressure,
        pressurePerPower: Math.round(stagePressure / best.efficiency * 10) / 10,
      };
    }).map((entry, index, entries) => ({
      ...entry,
      relativePressureStep: index === 0
        ? 1
        : Math.round(entry.pressurePerPower / entries[index - 1].pressurePerPower * 100) / 100,
    }));

    console.table(report);
    console.warn('Focused-upgrade finding: stage 4 reaches Militia weapon +5; the free fourth body flattens relative pressure growth after stage 3.');
    expect(report).toHaveLength(8);
    expect(report[3].rush).toContain('+5');
    expect(report[3].powerGain).toBeGreaterThan(1.9);
    expect(report[3].relativePressureStep).toBeLessThan(1.05);
  });
});
