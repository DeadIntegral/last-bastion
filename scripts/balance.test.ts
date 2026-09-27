import { describe, expect, it } from 'vitest';
import { stages, treasureStages } from '../src/data/stages';
import { analyzeCampaignDifficulty, analyzeStageDifficulty, difficultyAuditFailures } from '../src/game/difficulty';

describe('campaign difficulty audit', () => {
  it('keeps the estimated campaign curve monotonic and approximately linear', () => {
    const report = analyzeCampaignDifficulty(stages);
    console.table(report.stages.map((stage) => ({
      stage: stage.stageId,
      name: stage.label,
      index: stage.index,
      target: stage.target,
      step: stage.step,
      total: stage.total,
      fortressFire: stage.fortressFire,
      field: stage.battlefield,
      army: stage.scriptedArmy,
      repeat: stage.reinforcement,
      elite: stage.elite,
      boss: stage.boss,
    })));
    console.log(`Difficulty curve: R² ${report.linearityR2}, max deviation ${report.maxDeviation}`);

    expect(difficultyAuditFailures(report)).toEqual([]);
  });

  it('keeps treasure side-mission gimmicks bounded around their unlock milestones', () => {
    const campaign = analyzeCampaignDifficulty(stages);
    const report = treasureStages.map((stage) => {
      const pressure = analyzeStageDifficulty(stage).total;
      const milestone = campaign.stages.find((entry) => entry.stageId === stage.requiredCampaignStage)!;
      return { id: stage.id, name: stage.name, unlock: stage.requiredCampaignStage, pressure, ratio: Math.round(pressure / milestone.total * 100) / 100 };
    });
    console.table(report);
    expect(report.every((entry, index) => index === 0 || entry.pressure > report[index - 1].pressure)).toBe(true);
    expect(report.every((entry) => entry.ratio >= 0.7 && entry.ratio <= 1.45)).toBe(true);
  });
});
