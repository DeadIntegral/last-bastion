import { describe, expect, it } from 'vitest';
import { heroMasteryGrowth, heroSkillPower, soldierMasteryGrowth } from '../data/mastery';
import { allTroopOrder, bossCombatTuning, bossDefinition, heroDefinitions, troopDefinitions } from '../data/units';
import { challengeStages, stages } from '../data/stages';
import { ATTACK_RHYTHM_REVEAL_MASTERY_LEVEL, STAT_EQUIPMENT_CAPSTONE_BONUS_RANKS, applyEnemyTerrain, applyTriumphMonumentStats, attackPatternLabel, attackRangeLabel, attackRecoveryMs, attackTimingLabel, calculateDamage, canActivateMobilization, canAttackTarget, canReceiveRallyOrder, cooldownFillRatio, enemyFortressCanReinforce, enemyObjectiveDefeated, equipmentCost, fortressRearSpawnX, guardProtectionLabel, hasEquipmentCapstone, healedHp, heroAuraBonuses, heroAwakeningRank, heroMasteryLevelFromXp, isBehindLivingFortress, isWithinAttackBand, masteryLevelFromXp, mobilizedCommandStats, regenerateCommand, scaledBattleDelta, scaledHeroRespawnMs, scaledHeroSkillCooldownMs, scaledHeroSkillPower, scaledProgressionReward, unitDeploymentCapacity, upgradedStats, upgradeCost, usesStatEquipmentCapstone } from './rules';

describe('combat rules', () => {
  it('applies anti-large damage bonus', () => {
    expect(calculateDamage(troopDefinitions.lancer, bossDefinition)).toBe(Math.round(troopDefinitions.lancer.attackDamage * 1.75));
  });

  it('does not apply anti-large bonus to normal targets', () => {
    expect(calculateDamage(troopDefinitions.lancer, troopDefinitions.militia)).toBe(troopDefinitions.lancer.attackDamage);
  });

  it('applies visible challenge terrain only to the enemy encounter copy', () => {
    const base = troopDefinitions.spirit;
    const spiritChallenge = challengeStages.find((stage) => stage.bossUnitId === 'spirit');
    if (!spiritChallenge) throw new Error('Storm Spirit challenge must exist.');
    const terrainCopy = applyEnemyTerrain(base, spiritChallenge.terrain);
    expect(terrainCopy.maxHp).toBe(base.maxHp * 10);
    expect(terrainCopy.attackDamage).toBe(Math.round(base.attackDamage * 2.5));
    expect(terrainCopy.moveSpeed).toBeCloseTo(base.moveSpeed * 1.15);
    expect(troopDefinitions.spirit.maxHp).toBe(600);
  });

  it('keeps every optional beast challenge on the visible tenfold-health terrain rule', () => {
    expect(challengeStages.every((stage) => stage.terrain.enemyHpMultiplier === 10)).toBe(true);
    expect(challengeStages.every((stage) => stage.terrain.enemyAttackMultiplier >= 2.5)).toBe(true);
  });

  it('prices the two-target lancer above basic squad deployments', () => {
    expect(troopDefinitions.lancer.cost).toBe(80);
    expect(troopDefinitions.lancer.spawnCooldownMs).toBe(2_800);
    expect(troopDefinitions.lancer.cost).toBeGreaterThan(troopDefinitions.militia.cost);
  });

  it('allows only ranged units to target flying troops', () => {
    expect(canAttackTarget(troopDefinitions.militia, troopDefinitions.griffin)).toBe(false);
    expect(canAttackTarget(troopDefinitions.archer, troopDefinitions.griffin)).toBe(true);
    expect(canAttackTarget(troopDefinitions.griffin, troopDefinitions.militia)).toBe(true);
    expect(canAttackTarget(troopDefinitions.goblinBomber, troopDefinitions.griffin)).toBe(false);
    expect(canAttackTarget(troopDefinitions.fireSpirit, troopDefinitions.griffin)).toBe(true);
    expect(canAttackTarget(troopDefinitions.mage, troopDefinitions.griffin)).toBe(false);
    expect(canAttackTarget(troopDefinitions.archmage, troopDefinitions.griffin)).toBe(true);
  });

  it('describes squad deployments and bounded multi-target attacks from unit data', () => {
    expect(troopDefinitions.militia.squadSize).toBe(3);
    expect(troopDefinitions.guardian.squadSize).toBe(2);
    expect(attackPatternLabel(troopDefinitions.lancer)).toBe('2명 관통');
    expect(attackPatternLabel(troopDefinitions.crossbow)).toBe('2명 관통');
    expect(attackPatternLabel(troopDefinitions.brute)).toBe('근접 범위 전체 공격');
    expect(attackPatternLabel(troopDefinitions.goblinBomber)).toBe('착탄 범위 공격 · 반경 82');
    expect(attackPatternLabel(troopDefinitions.mage)).toBe('지면 발현 · 반경 72');
    expect(attackPatternLabel(troopDefinitions.archmage)).toBe('전방 파동 · 길이 245');
    expect(guardProtectionLabel(troopDefinitions.guardian)).toBe('관통 차단 · 지상 후방 파동 65% 감쇠');
  });

  it('defines a valid windup, recovery, and optional close-range dead zone for every combatant', () => {
    for (const definition of [...allTroopOrder.map((id) => troopDefinitions[id]), ...Object.values(heroDefinitions), bossDefinition]) {
      expect(definition.attackWindupMs).toBeGreaterThanOrEqual(0);
      expect(definition.attackWindupMs).toBeLessThanOrEqual(definition.attackIntervalMs);
      expect(attackRecoveryMs(definition)).toBe(definition.attackIntervalMs - definition.attackWindupMs);
      expect(definition.minimumAttackRange).toBeGreaterThanOrEqual(0);
      expect(definition.minimumAttackRange).toBeLessThan(definition.attackRange);
    }
  });

  it('treats minimum range as a real attack dead zone and exposes the full rhythm', () => {
    expect(ATTACK_RHYTHM_REVEAL_MASTERY_LEVEL).toBe(5);
    const crossbow = troopDefinitions.crossbow;
    expect(isWithinAttackBand(crossbow, 74)).toBe(false);
    expect(isWithinAttackBand(crossbow, 75)).toBe(true);
    expect(isWithinAttackBand(crossbow, 160)).toBe(true);
    expect(isWithinAttackBand(crossbow, 161)).toBe(false);
    expect(isWithinAttackBand(crossbow, -5)).toBe(false);
    expect(isWithinAttackBand(troopDefinitions.militia, -5)).toBe(true);
    expect(attackRangeLabel(crossbow)).toBe('75–160');
    expect(attackTimingLabel(crossbow)).toBe('선딜 0.65초 · 후딜 0.80초');
  });

  it('keeps archers superior at range and single-target deployment damage', () => {
    const archer = troopDefinitions.archer;
    const crossbow = troopDefinitions.crossbow;
    expect(archer.attackRange - crossbow.attackRange).toBeGreaterThanOrEqual(50);
    expect(archer.attackIntervalMs).toBeLessThan(crossbow.attackIntervalMs);
    expect(archer.attackWindupMs).toBeLessThan(crossbow.attackWindupMs);
    expect(archer.minimumAttackRange).toBeLessThan(crossbow.minimumAttackRange);
    expect(archer.attackDamage * archer.squadSize).toBeGreaterThan(crossbow.attackDamage * crossbow.squadSize);
  });

  it('reserves crossbow superiority for a lined-up two-target shot', () => {
    const archer = troopDefinitions.archer;
    const crossbow = troopDefinitions.crossbow;
    if (crossbow.attackPattern.kind !== 'pierce') throw new Error('Crossbow must retain its pierce identity.');
    expect(crossbow.attackPattern.maxTargets).toBe(2);
    const crossbowVolley = crossbow.attackDamage * (
      1 + (crossbow.attackPattern.maxTargets - 1) * crossbow.attackPattern.secondaryDamageMultiplier
    );
    expect(crossbowVolley).toBeGreaterThan(archer.attackDamage * archer.squadSize);
  });

  it('keeps boss growth bounded to the same five-rank equipment system', () => {
    const regionalBoss = upgradedStats(bossDefinition, stages[5].enemyUpgrades.equipment);
    const finalBoss = upgradedStats(bossDefinition, stages[11].enemyUpgrades.equipment);
    expect(regionalBoss.maxHp).toBe(5_550);
    expect(regionalBoss.attackDamage).toBe(112);
    expect(finalBoss.maxHp).toBe(5_550);
    expect(finalBoss.attackDamage).toBe(112);
    expect(bossCombatTuning.phaseTwoStompDamageMultiplier).toBeGreaterThan(bossCombatTuning.phaseOneStompDamageMultiplier);
  });

  it('regenerates command with a maximum cap', () => {
    expect(regenerateCommand(50, 1000)).toBe(60);
    expect(regenerateCommand(198, 1000)).toBe(200);
  });

  it('scales bounded simulation time at the purchased 1.5x rate', () => {
    expect(scaledBattleDelta(20, 1)).toBe(20);
    expect(scaledBattleDelta(20, 1.5)).toBe(30);
    expect(scaledBattleDelta(1000, 1.5)).toBe(75);
  });

  it('rounds percentage progression rewards to a whole value', () => {
    expect(scaledProgressionReward(100, 1.05)).toBe(105);
    expect(scaledProgressionReward(30, 1.15)).toBe(35);
    expect(scaledProgressionReward(-10, 1.25)).toBe(0);
  });

  it('deploys both factions behind their fortress with symmetric squad spacing', () => {
    expect(fortressRearSpawnX('player', 105)).toBe(55);
    expect(fortressRearSpawnX('player', 105, 2)).toBe(23);
    expect(fortressRearSpawnX('enemy', 1155)).toBe(1205);
    expect(fortressRearSpawnX('enemy', 1155, 2)).toBe(1237);
  });

  it('lets a living fortress shield rear units but not forward units or troops behind a destroyed fortress', () => {
    expect(isBehindLivingFortress('player', 55, 105, 1800)).toBe(true);
    expect(isBehindLivingFortress('player', 155, 105, 1800)).toBe(false);
    expect(isBehindLivingFortress('enemy', 1205, 1155, 800)).toBe(true);
    expect(isBehindLivingFortress('enemy', 1205, 1155, 0)).toBe(false);
  });

  it('normalizes the visual summon cooldown fill', () => {
    expect(cooldownFillRatio(3000, 3000)).toBe(1);
    expect(cooldownFillRatio(1500, 3000)).toBe(0.5);
    expect(cooldownFillRatio(-10, 3000)).toBe(0);
    expect(cooldownFillRatio(1000, 0)).toBe(0);
  });

  it('increases health and damage through upgrades', () => {
    const upgraded = upgradedStats(troopDefinitions.militia, 2);
    expect(upgraded.maxHp).toBe(troopDefinitions.militia.maxHp + troopDefinitions.militia.equipmentGrowth.hp * 2);
    expect(upgraded.attackDamage).toBe(troopDefinitions.militia.attackDamage + troopDefinitions.militia.equipmentGrowth.attack * 2);
  });

  it('increases upgrade costs by level', () => {
    expect(upgradeCost(0)).toBe(50);
    expect(upgradeCost(1)).toBe(100);
    expect(upgradeCost(4)).toBe(250);
    expect(equipmentCost(troopDefinitions.brute, 0)).toBeGreaterThan(equipmentCost(troopDefinitions.militia, 0));
    expect(equipmentCost(troopDefinitions.brute, 0)).toBe(200);
    expect(equipmentCost(troopDefinitions.griffin, 0)).toBe(300);
    expect(equipmentCost(troopDefinitions.ifrit, 0)).toBe(400);
  });

  it('grows mastery from accumulated experience without currency', () => {
    expect(masteryLevelFromXp(0).level).toBe(1);
    expect(masteryLevelFromXp(45).level).toBe(2);
    expect(upgradedStats(troopDefinitions.militia, 0, 4).maxHp).toBeGreaterThan(troopDefinitions.militia.maxHp);
  });

  it('caps hero mastery at 30 while soldier mastery retains level 50', () => {
    expect(heroMasteryLevelFromXp(Number.MAX_SAFE_INTEGER).level).toBe(30);
    expect(masteryLevelFromXp(Number.MAX_SAFE_INTEGER).level).toBe(50);
    expect(upgradedStats(heroDefinitions.warden, 0, 50)).toEqual(upgradedStats(heroDefinitions.warden, 0, 30));
  });

  it('uses role-specific flat soldier mastery gains per level', () => {
    const militia = upgradedStats(troopDefinitions.militia, 0, 4);
    const brute = upgradedStats(troopDefinitions.brute, 0, 4);
    expect(militia.maxHp).toBe(troopDefinitions.militia.maxHp + soldierMasteryGrowth.militia.hp * 3);
    expect(militia.attackDamage).toBe(troopDefinitions.militia.attackDamage + soldierMasteryGrowth.militia.attack * 3);
    expect(brute.maxHp).toBe(troopDefinitions.brute.maxHp + soldierMasteryGrowth.brute.hp * 3);
    expect(brute.attackDamage).toBe(troopDefinitions.brute.attackDamage + soldierMasteryGrowth.brute.attack * 3);
  });

  it('gives hero mastery stronger stats, active power, and bounded respawn reduction', () => {
    const level = 10;
    const warden = upgradedStats(heroDefinitions.warden, 0, level);
    expect(warden.maxHp).toBe(heroDefinitions.warden.maxHp + heroMasteryGrowth.warden.hp * 9);
    expect(warden.attackDamage).toBe(heroDefinitions.warden.attackDamage + heroMasteryGrowth.warden.attack * 9);
    expect(heroAwakeningRank(9)).toBe(0);
    expect(heroAwakeningRank(10)).toBe(1);
    expect(heroAwakeningRank(20)).toBe(2);
    expect(heroAwakeningRank(30)).toBe(3);
    expect(scaledHeroSkillPower(heroSkillPower.warden.shield, heroSkillPower.warden.shieldPerRank, heroSkillPower.warden.shieldPerAwakening, level)).toBe(240);
    expect(scaledHeroSkillCooldownMs(heroDefinitions.warden, level)).toBe(23_500);
    expect(scaledHeroRespawnMs(heroDefinitions.warden, level)).toBe(17_300);
    expect(scaledHeroRespawnMs(heroDefinitions.warden, 30)).toBe(13_000);
    expect(scaledHeroSkillPower(heroSkillPower.pyromancer.unitDamage, heroSkillPower.pyromancer.unitDamagePerRank, heroSkillPower.pyromancer.unitDamagePerAwakening, 30)).toBe(1_004);
    expect(scaledHeroSkillPower(heroSkillPower.pyromancer.castleDamage, heroSkillPower.pyromancer.castleDamagePerRank, heroSkillPower.pyromancer.castleDamagePerAwakening, 30)).toBe(630);
    expect(scaledHeroSkillPower(heroSkillPower.huntress.unitDamage, heroSkillPower.huntress.unitDamagePerRank, heroSkillPower.huntress.unitDamagePerAwakening, 30)).toBe(472);
    expect(scaledHeroSkillPower(heroSkillPower.huntress.bossDamage, heroSkillPower.huntress.bossDamagePerRank, heroSkillPower.huntress.bossDamagePerAwakening, 30)).toBe(698);
  });

  it('unlocks and scales distinct hero auras only at awakening milestones', () => {
    expect(heroAuraBonuses('warden', 9).defenseBonus).toBe(0);
    expect(heroAuraBonuses('warden', 10).defenseBonus).toBe(2);
    expect(heroAuraBonuses('pyromancer', 20).attackBonus).toBe(6);
    expect(heroAuraBonuses('huntress', 30).rangeBonus).toBe(45);
    expect(heroAuraBonuses('saint', 30).healingPerSecond).toBe(12);
    expect(heroAuraBonuses('marshal', 30).moveSpeedBonus).toBe(12);
  });

  it('defines a bounded shared healer whose weapon and mastery also improve healing', () => {
    const priest = troopDefinitions.priest;
    expect(priest.tags).toContain('support');
    expect(priest.healingPower).toBe(34);
    expect(priest.healingRange).toBeGreaterThan(priest.attackRange);
    expect(upgradedStats(priest, { weapon: 2, armor: 0, boots: 0 }, 3).healingPower).toBe(40);
    expect(healedHp(50, 100, 35)).toBe(85);
    expect(healedHp(90, 100, 35)).toBe(100);
  });

  it('uses escalating fixed mobilization costs and a bounded +100 maximum bonus', () => {
    expect(canActivateMobilization(299.9, 0, 3)).toBe(false);
    expect(canActivateMobilization(300, 0, 3)).toBe(true);
    expect(canActivateMobilization(399.9, 1, 3)).toBe(false);
    expect(canActivateMobilization(400, 1, 3)).toBe(true);
    expect(canActivateMobilization(500, 3, 3)).toBe(false);
    expect(mobilizedCommandStats(200, 10)).toEqual({ maxCommand: 300, commandRegen: 10 });
    expect(mobilizedCommandStats(300, 10, 100, 0.6)).toEqual({ maxCommand: 400, commandRegen: 10.6 });
  });

  it('expands rally control from 1–4 star soldiers to heroes and 5-star transcendent troops', () => {
    const soldiersOnly = { soldiers: true, heroes: false, transcendent: false };
    const withHeroes = { ...soldiersOnly, heroes: true };
    const fullCommand = { soldiers: true, heroes: true, transcendent: true };
    expect(canReceiveRallyOrder(troopDefinitions.militia, false, soldiersOnly)).toBe(true);
    expect(canReceiveRallyOrder(heroDefinitions.warden, true, soldiersOnly)).toBe(false);
    expect(canReceiveRallyOrder(heroDefinitions.warden, true, withHeroes)).toBe(true);
    expect(troopDefinitions.griffin.grade).toBe(4);
    expect(troopDefinitions.minotaur.grade).toBe(3);
    expect(canReceiveRallyOrder(troopDefinitions.griffin, false, soldiersOnly)).toBe(true);
    expect(canReceiveRallyOrder(troopDefinitions.ifrit, false, withHeroes)).toBe(false);
    expect(canReceiveRallyOrder(troopDefinitions.griffin, false, fullCommand)).toBe(true);
    expect(canReceiveRallyOrder(troopDefinitions.ifrit, false, fullCommand)).toBe(true);
    expect(allTroopOrder.every((id) => troopDefinitions[id].grade >= 1 && troopDefinitions[id].grade <= 5)).toBe(true);
    expect(allTroopOrder.filter((id) => troopDefinitions[id].grade === 5)).toEqual(['ifrit', 'dragon']);
  });

  it('requires both the boss and fortress in campaign sieges but only the boss in challenges', () => {
    expect(enemyObjectiveDefeated(stages[5], 0, true)).toBe(false);
    expect(enemyObjectiveDefeated(stages[5], 100, false)).toBe(false);
    expect(enemyObjectiveDefeated(stages[5], 0, false)).toBe(true);
    expect(enemyObjectiveDefeated(challengeStages[0], 999, true)).toBe(false);
    expect(enemyObjectiveDefeated(challengeStages[0], 999, false)).toBe(true);
  });

  it('stops campaign boss garrisons when their producing fortress falls', () => {
    expect(enemyFortressCanReinforce(stages[5], stages[5].enemyCastleHp)).toBe(true);
    expect(enemyFortressCanReinforce(stages[5], 0)).toBe(false);
    expect(enemyFortressCanReinforce(challengeStages[0], 999)).toBe(false);
  });

  it('enforces per-side battlefield caps for legendary combatants', () => {
    expect(unitDeploymentCapacity(troopDefinitions.griffin, 0)).toBe(2);
    expect(unitDeploymentCapacity(troopDefinitions.griffin, 1)).toBe(1);
    expect(unitDeploymentCapacity(troopDefinitions.griffin, 2)).toBe(0);
    expect(unitDeploymentCapacity(troopDefinitions.militia, 999)).toBe(Number.POSITIVE_INFINITY);
  });

  it('applies weapon, armor, and boots independently', () => {
    const weapon = upgradedStats(troopDefinitions.militia, { weapon: 2, armor: 0, boots: 0 });
    const armor = upgradedStats(troopDefinitions.militia, { weapon: 0, armor: 2, boots: 0 });
    const boots = upgradedStats(troopDefinitions.militia, { weapon: 0, armor: 0, boots: 2 });
    expect(weapon.attackDamage).toBeGreaterThan(troopDefinitions.militia.attackDamage);
    expect(weapon.attackDamage).toBe(troopDefinitions.militia.attackDamage + troopDefinitions.militia.equipmentGrowth.attack * 2);
    expect(armor.maxHp).toBeGreaterThan(troopDefinitions.militia.maxHp);
    expect(armor.maxHp).toBe(troopDefinitions.militia.maxHp + troopDefinitions.militia.equipmentGrowth.hp * 2);
    expect(armor.defense).toBe(troopDefinitions.militia.equipmentGrowth.defense * 2);
    expect(boots.moveSpeed).toBeGreaterThan(troopDefinitions.militia.moveSpeed);
    expect(boots.moveSpeed).toBe(troopDefinitions.militia.moveSpeed + troopDefinitions.militia.equipmentGrowth.moveSpeed * 2);
    expect(equipmentCost(troopDefinitions.militia, 0)).toBe(50);
  });

  it('adds one soldier to ordinary and three-star deployments when a branch reaches rank five', () => {
    const almostComplete = { weapon: 4, armor: 4, boots: 4 };
    const completed = { weapon: 5, armor: 0, boots: 0 };
    expect(hasEquipmentCapstone(almostComplete)).toBe(false);
    expect(upgradedStats(troopDefinitions.militia, almostComplete).squadSize).toBe(3);
    expect(hasEquipmentCapstone(completed)).toBe(true);
    expect(upgradedStats(troopDefinitions.militia, completed).squadSize).toBe(4);
    expect(upgradedStats(troopDefinitions.brute, completed).squadSize).toBe(2);
    expect(upgradedStats(troopDefinitions.reaper, completed).squadSize).toBe(2);
  });

  it('keeps apex large deployments single-bodied and grants three fixed all-equipment ranks', () => {
    const completed = { weapon: 5, armor: 0, boots: 0 };
    const base = troopDefinitions.griffin;
    const trained = upgradedStats(base, completed);
    expect(usesStatEquipmentCapstone(base)).toBe(true);
    expect(usesStatEquipmentCapstone(troopDefinitions.brute)).toBe(false);
    expect(usesStatEquipmentCapstone(troopDefinitions.reaper)).toBe(false);
    expect(usesStatEquipmentCapstone(troopDefinitions.ifrit)).toBe(true);
    expect(trained.squadSize).toBe(1);
    expect(trained.maxHp).toBe(base.maxHp + base.equipmentGrowth.hp * STAT_EQUIPMENT_CAPSTONE_BONUS_RANKS);
    expect(trained.attackDamage).toBe(base.attackDamage + base.equipmentGrowth.attack * (5 + STAT_EQUIPMENT_CAPSTONE_BONUS_RANKS));
    expect(trained.defense).toBe((base.defense ?? 0) + base.equipmentGrowth.defense * STAT_EQUIPMENT_CAPSTONE_BONUS_RANKS);
    expect(trained.moveSpeed).toBe(base.moveSpeed + base.equipmentGrowth.moveSpeed * STAT_EQUIPMENT_CAPSTONE_BONUS_RANKS);

    const hydra = troopDefinitions.hydra;
    const trainedHydra = upgradedStats(hydra, completed);
    expect(trainedHydra.maxHp - hydra.maxHp).toBe(630);
    expect(trainedHydra.attackDamage - hydra.attackDamage).toBe(96);
  });

  it('does not apply the soldier deployment capstone to heroes or bosses', () => {
    const completed = { weapon: 5, armor: 5, boots: 5 };
    expect(upgradedStats(heroDefinitions.warden, completed).squadSize).toBe(1);
    expect(upgradedStats(bossDefinition, completed).squadSize).toBe(1);
  });

  it('uses role-specific absolute equipment growth instead of a shared percentage', () => {
    const militia = upgradedStats(troopDefinitions.militia, { weapon: 1, armor: 1, boots: 1 });
    const brute = upgradedStats(troopDefinitions.brute, { weapon: 1, armor: 1, boots: 1 });
    expect(militia.attackDamage - troopDefinitions.militia.attackDamage).toBe(2);
    expect(brute.attackDamage - troopDefinitions.brute.attackDamage).toBe(7);
    expect(militia.maxHp - troopDefinitions.militia.maxHp).toBe(18);
    expect(brute.maxHp - troopDefinitions.brute.maxHp).toBe(90);
  });

  it('applies bounded victory-monument bonuses only when explicitly requested for player stats', () => {
    const priest = applyTriumphMonumentStats(troopDefinitions.priest, 20);
    expect(priest.maxHp).toBe(Math.round(troopDefinitions.priest.maxHp * 1.2));
    expect(priest.attackDamage).toBe(Math.round(troopDefinitions.priest.attackDamage * 1.2));
    expect(priest.healingPower).toBe(Math.round((troopDefinitions.priest.healingPower ?? 0) * 1.2));
    expect(applyTriumphMonumentStats(troopDefinitions.militia, 999)).toEqual(
      applyTriumphMonumentStats(troopDefinitions.militia, 20),
    );
  });
});
