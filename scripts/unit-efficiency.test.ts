import { describe, expect, it } from 'vitest';
import { allTroopOrder, troopDefinitions } from '../src/data/units';
import { soldierCommandCost } from '../src/data/castle';
import { estimateUnitThreat } from '../src/game/difficulty';

describe('unit Command efficiency audit', () => {
  it('reports deployment value per Command across the shared roster', () => {
    const report = allTroopOrder.map((id) => {
      const unit = troopDefinitions[id];
      const deploymentThreat = estimateUnitThreat(unit) * unit.squadSize;
      const command = soldierCommandCost(unit.cost, 1, unit.commandCostCap);
      return {
        id,
        name: unit.name,
        command,
        bodies: unit.squadSize,
        threat: Math.round(deploymentThreat * 10) / 10,
        value: Math.round(deploymentThreat / command * 100) / 100,
      };
    }).sort((left, right) => left.value - right.value);

    console.table(report);
    expect(report).toHaveLength(allTroopOrder.length);
    const upperTier = report.filter((unit) => unit.command >= 150);
    expect(upperTier.every((unit) => unit.value >= 1)).toBe(true);
    expect(report.find((unit) => unit.id === 'allianceGuardian')?.command).toBe(300);
    expect(Math.max(...report.filter((unit) => unit.id !== 'allianceGuardian').map((unit) => unit.command))).toBeLessThanOrEqual(200);
  });
});
