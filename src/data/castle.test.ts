import { describe, expect, it } from 'vitest';
import { canUpgradeCastleTech, castleBattleStats, castleTechChildren, castleTechCost, castleTechDefinitions, castleTechOrder, castleTechPrerequisiteStatus, castleTechRoots, emptyCastleTech, fortressResearchTuning, fortressTierDefinitions, minimumFortressTierForResearch, soldierCommandCost, totalCastleResearch } from './castle';

describe('castle technology tree', () => {
  it('applies all five fortress branches to battle stats', () => {
    const levels = emptyCastleTech();
    levels.war_coffers = 2;
    levels.logistics = 1;
    levels.command_vault = 1;
    levels.fortified_walls = 3;
    levels.stone_plating = 2;
    levels.black_powder = 1;
    levels.drill_yard = 2;
    levels.supply_standardization = 2;
    levels.spoils_accounting = 2;
    levels.field_manuals = 3;
    levels.war_tithe = 3;
    levels.battlements = 2;
    levels.mending_stone = 4;
    levels.giantbreaker_shells = 2;
    levels.siege_calculus = 3;
    levels.rally_orders = 3;
    levels.heroic_orders = 2;
    levels.mobilization_drill = 2;
    levels.field_recovery = 1;
    levels.transcendent_orders = 1;
    const stats = castleBattleStats(levels);
    expect(stats.startingCommand).toBe(120);
    expect(stats.commandRegen).toBe(12.5);
    expect(stats.maxCommand).toBe(240);
    expect(stats.maxHp).toBe(2550);
    expect(stats.damageReduction).toBe(6);
    expect(stats.bombardDamage).toBe(220);
    expect(stats.bombardRange).toBe(1240);
    expect(stats.summonCooldownMultiplier).toBe(0.9);
    expect(stats.summonCostMultiplier).toBe(0.94);
    expect(stats.commandPerKill).toBe(9);
    expect(stats.battleGoldMultiplier).toBe(1.1);
    expect(stats.masteryXpMultiplier).toBe(1.15);
    expect(stats.towerRange).toBe(400);
    expect(stats.castleRegenPerSecond).toBe(16);
    expect(stats.bombardBossBonus).toBe(140);
    expect(stats.bombardCastleDamage).toBe(180);
    expect(stats.rallyUnlocked).toBe(true);
    expect(stats.rallyHeroControl).toBe(true);
    expect(stats.rallyTranscendentControl).toBe(true);
    expect(stats.rallyCooldownMs).toBe(14_000);
    expect(stats.rallyMoveSpeedMultiplier).toBe(1.05);
    expect(stats.heroSkillCooldownMultiplier).toBe(0.94);
    expect(stats.heroRespawnMultiplier).toBe(0.97);
    expect(stats.mobilizationMaxCommandBonus).toBe(35);
    expect(stats.mobilizationCommandRegenBonus).toBe(2.1);
  });

  it('keeps the tier-three economy and sustain capstones within their intended bounds', () => {
    const levels = emptyCastleTech();
    levels.war_tithe = 5;
    levels.mending_stone = 5;
    const stats = castleBattleStats(levels);
    expect(fortressResearchTuning.warTitheCommandPerRank).toBe(1);
    expect(stats.commandPerKill).toBe(11);
    expect(fortressResearchTuning.mendingStoneRegenPerRank).toBe(4);
    expect(stats.castleRegenPerSecond).toBe(20);
  });

  it('enforces technology prerequisites', () => {
    const levels = emptyCastleTech();
    expect(canUpgradeCastleTech('logistics', levels)).toBe(false);
    levels.war_coffers = 1;
    expect(canUpgradeCastleTech('logistics', levels)).toBe(true);
  });

  it('describes both the required and current prerequisite rank', () => {
    const levels = emptyCastleTech();
    levels.black_powder = 1;
    expect(castleTechPrerequisiteStatus('wide_blast', levels)).toEqual({
      name: '흑색 화약',
      requiredLevel: 2,
      currentLevel: 1,
      met: false,
      label: '선행: 흑색 화약 2단계 (현재 1단계)',
    });
    levels.black_powder = 2;
    expect(castleTechPrerequisiteStatus('wide_blast', levels)?.met).toBe(true);
  });

  it('keeps an already researched node unlocked after requirements change', () => {
    const levels = emptyCastleTech();
    levels.battlements = 1;
    expect(canUpgradeCastleTech('battlements', levels, 1)).toBe(true);
  });

  it('recovers the minimum fortress tier proven by saved research', () => {
    const levels = emptyCastleTech();
    expect(minimumFortressTierForResearch(levels)).toBe(1);
    levels.drill_yard = 1;
    expect(minimumFortressTierForResearch(levels)).toBe(2);
    levels.siege_calculus = 1;
    expect(minimumFortressTierForResearch(levels)).toBe(3);
  });

  it('uses readable arithmetic research prices', () => {
    expect(castleTechCost(castleTechDefinitions.watchtower, 0)).toBe(200);
    expect(castleTechCost(castleTechDefinitions.watchtower, 1)).toBe(400);
    expect(castleTechCost(castleTechDefinitions.watchtower, 4)).toBe(1_000);
    expect(fortressTierDefinitions[2].promotionCost).toBe(1_000);
    expect(fortressTierDefinitions[3].promotionCost).toBe(2_500);
  });

  it('provides twenty-three five-rank nodes gated by fortress tier', () => {
    expect(castleTechOrder).toHaveLength(23);
    expect(castleTechOrder.every((id) => castleTechDefinitions[id].maxLevel === 5)).toBe(true);
    const levels = emptyCastleTech();
    levels.command_vault = 2;
    expect(canUpgradeCastleTech('drill_yard', levels, 1)).toBe(false);
    expect(canUpgradeCastleTech('drill_yard', levels, 2)).toBe(true);
  });

  it('derives visible tree roots and branches from prerequisite data', () => {
    expect(castleTechRoots('command')).toEqual(['war_coffers']);
    expect(castleTechRoots('growth')).toEqual(['spoils_accounting', 'field_manuals']);
    expect(castleTechRoots('defense')).toEqual(['fortified_walls']);
    expect(castleTechRoots('artillery')).toEqual(['black_powder']);
    expect(castleTechRoots('expedition')).toEqual(['rally_orders']);
    expect(castleTechChildren('command_vault')).toEqual(['drill_yard', 'supply_standardization']);
    expect(castleTechChildren('supply_standardization')).toEqual([]);
    expect(castleTechChildren('spoils_accounting')).toEqual([]);
    expect(castleTechChildren('black_powder')).toEqual(['rapid_reload', 'wide_blast']);
    expect(castleTechChildren('rally_orders')).toEqual(['heroic_orders', 'mobilization_drill']);
    expect(castleTechChildren('heroic_orders')).toEqual(['field_recovery', 'transcendent_orders']);
  });

  it('reduces soldier Command costs with ceiling rounding and a minimum floor', () => {
    expect(soldierCommandCost(55, 1)).toBe(55);
    expect(soldierCommandCost(55, 0.85)).toBe(47);
    expect(soldierCommandCost(8, 0.85)).toBe(10);
  });

  it('tracks promotion requirements from accumulated research ranks', () => {
    const levels = emptyCastleTech();
    levels.war_coffers = 5;
    levels.logistics = 3;
    expect(totalCastleResearch(levels)).toBe(fortressTierDefinitions[2].requiredResearch);
    expect(fortressTierDefinitions[3].requiredResearch).toBeGreaterThan(fortressTierDefinitions[2].requiredResearch);
  });
});
