import { describe, expect, it } from 'vitest';
import { heroDefinitions, heroOrder, troopDefinitions, unitGradeById } from '../src/data/units';
import { heroSkillPower } from '../src/data/mastery';
import { estimateUnitThreat } from '../src/game/difficulty';
import { calculateDamage, scaledHeroSkillPower, upgradedStats } from '../src/game/rules';

const noEquipment = { weapon: 0, armor: 0, boots: 0 } as const;
const maximumEnemyEquipment = { weapon: 5, armor: 5, boots: 5 } as const;

describe('hero growth balance audit', () => {
  it('reports awakening growth and keeps trained early heroes competitive with an equipped 4-star body', () => {
    const heroReport = heroOrder.flatMap((id) => [1, 10, 20, 30].map((level) => {
      const definition = upgradedStats(heroDefinitions[id], noEquipment, level);
      return {
        id,
        name: definition.name,
        level,
        hp: definition.maxHp,
        attack: definition.attackDamage,
        defense: definition.defense ?? 0,
        range: definition.attackRange,
        threat: Math.round(estimateUnitThreat(definition) * 10) / 10,
      };
    }));
    console.table(heroReport);

    const fourStarThreats = Object.values(troopDefinitions)
      .filter((unit) => unitGradeById[unit.id] === 4)
      .map((unit) => estimateUnitThreat(upgradedStats(unit, maximumEnemyEquipment)));
    const accessibleFourStarFloor = Math.min(...fourStarThreats);

    for (const id of ['warden', 'pyromancer', 'huntress'] as const) {
      const levelOneThreat = estimateUnitThreat(upgradedStats(heroDefinitions[id], noEquipment, 1));
      const levelThirtyThreat = estimateUnitThreat(upgradedStats(heroDefinitions[id], noEquipment, 30));
      expect(levelThirtyThreat).toBeGreaterThan(levelOneThreat * 2);
      // This estimator excludes active skills and ally auras, so normal field presence
      // only needs to reach a substantial share of the weakest rank-5-equipped 4-star body.
      expect(levelThirtyThreat).toBeGreaterThanOrEqual(accessibleFourStarFloor * 0.4);
    }

    const equippedEdric = upgradedStats(heroDefinitions.warden, maximumEnemyEquipment, 30);
    const equippedReaper = upgradedStats(troopDefinitions.reaper, maximumEnemyEquipment);
    const edricEffectiveHp = equippedEdric.maxHp * (1 + (equippedEdric.defense ?? 0) * 0.045);
    const reaperEffectiveHp = equippedReaper.maxHp * (1 + (equippedReaper.defense ?? 0) * 0.045);
    const edricShield = scaledHeroSkillPower(
      heroSkillPower.warden.shield,
      heroSkillPower.warden.shieldPerRank,
      heroSkillPower.warden.shieldPerAwakening,
      30,
    );
    expect(edricEffectiveHp + edricShield).toBeGreaterThan(reaperEffectiveHp);

    const seleneMeteor = scaledHeroSkillPower(
      heroSkillPower.pyromancer.unitDamage,
      heroSkillPower.pyromancer.unitDamagePerRank,
      heroSkillPower.pyromancer.unitDamagePerAwakening,
      30,
    );
    expect(seleneMeteor).toBeGreaterThan(equippedReaper.maxHp * 0.5);

    const trainedRia = upgradedStats(heroDefinitions.huntress, noEquipment, 30);
    const equippedGriffin = upgradedStats(troopDefinitions.griffin, maximumEnemyEquipment);
    expect(calculateDamage(trainedRia, equippedGriffin)).toBeGreaterThan(250);
  });
});
