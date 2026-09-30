import { describe, expect, it } from 'vitest';
import { chapterTwoStages } from '../src/data/chapterTwo';
import { stages } from '../src/data/stages';
import { exclusiveEnemyDefinitions } from '../src/data/enemies';
import { analyzeStageDifficulty } from '../src/game/difficulty';
import { upgradedStats } from '../src/game/rules';

describe('chapter two pressure and exclusive enemies', () => {
  it('keeps the new frontier above the chapter-one finale with bounded, increasing pressure', () => {
    const finale = analyzeStageDifficulty(stages.at(-1)!).total;
    const pressure = chapterTwoStages.map(analyzeStageDifficulty);
    console.table(pressure.map((row, index) => ({ stage: index + 1, pressure: row.total, versusFinale: +(row.total / finale).toFixed(2) })));
    expect(pressure[0].total).toBeGreaterThan(finale * 1.3);
    for (let index = 1; index < pressure.length; index += 1) {
      expect(pressure[index].total).toBeGreaterThan(pressure[index - 1].total);
      expect(pressure[index].total / pressure[index - 1].total).toBeLessThan(1.4);
    }
    for (const definition of Object.values(exclusiveEnemyDefinitions)) {
      expect(definition.enemyOnly).toBe(true);
      expect(definition.grade).toBeUndefined();
      const trained = upgradedStats(definition, { weapon: 5, armor: 5, boots: 5 });
      expect(trained.squadSize).toBe(1);
      expect(upgradedStats(definition, { weapon: 5, armor: 5, boots: 5 }, 50)).toEqual(trained);
    }
  });
});
