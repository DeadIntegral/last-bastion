import { describe, expect, it } from 'vitest';
import { allTroopOrder, troopDefinitions } from '../src/data/units';
import { estimateUnitThreat } from '../src/game/difficulty';

describe('unit Command efficiency audit', () => {
  it('reports deployment value per Command across the shared roster', () => {
    const report = allTroopOrder.map((id) => {
      const unit = troopDefinitions[id];
      const deploymentThreat = estimateUnitThreat(unit) * unit.squadSize;
      return {
        id,
        name: unit.name,
        command: unit.cost,
        bodies: unit.squadSize,
        threat: Math.round(deploymentThreat * 10) / 10,
        value: Math.round(deploymentThreat / unit.cost * 100) / 100,
      };
    }).sort((left, right) => left.value - right.value);

    console.table(report);
    expect(report).toHaveLength(allTroopOrder.length);
    const upperTier = report.filter((unit) => unit.command >= 150);
    expect(upperTier.every((unit) => unit.value >= 1)).toBe(true);
    expect(Math.max(...report.map((unit) => unit.command))).toBeLessThanOrEqual(200);
  });
});
