import { describe, expect, it } from 'vitest';
import { stages } from '../src/data/stages';
import { analyzeCampaignDifficulty, difficultyAuditFailures } from '../src/game/difficulty';

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
});
