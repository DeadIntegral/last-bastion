import { describe, expect, it } from 'vitest';
import { UNIT_IDS } from '../types/game';
import { advancedEnemyIntroductionStages, challengeStages, ENEMY_EQUIPMENT_MAX_LEVEL, MAX_FORTRESS_DISTANCE, MIN_FORTRESS_DISTANCE, stages } from './stages';
import { allTroopOrder, troopDefinitions, unitFamilyById } from './units';

describe('campaign rewards', () => {
  it('defines one first-clear reward for every map stage', () => {
    expect(stages).toHaveLength(30);
    expect(stages.map((stage) => stage.id)).toEqual(Array.from({ length: 30 }, (_, index) => index + 1));
    for (const stage of stages) {
      expect(stage.firstClearReward.label.length).toBeGreaterThan(0);
      expect(stage.firstClearReward.description.length).toBeGreaterThan(0);
    }
  });

  it('unlocks the core roster in campaign order', () => {
    expect(stages[0].firstClearReward.unitId).toBe('guardian');
    expect(stages[1].firstClearReward.unitId).toBe('archer');
    expect(stages[2].firstClearReward.unitId).toBe('lancer');
  });

  it('uses a stage reward to unlock the first persistent gold-sink facility', () => {
    expect(stages[8].id).toBe(9);
    expect(stages[8].firstClearReward.featureId).toBe('hero-training');
    expect(stages[8].firstClearReward.gold).toBe(900);
  });

  it('uses fortress-backed boss milestones every six campaign stages', () => {
    expect(stages[5].boss).toBe(true);
    expect(stages[5].firstClearReward.heroId).toBe('huntress');
    expect(stages[11].boss).toBe(true);
    expect(stages[11].firstClearReward.heroId).toBe('saint');
    expect(stages[17].firstClearReward.heroId).toBe('marshal');
    expect(stages.filter((stage) => stage.boss).map((stage) => stage.id)).toEqual([6, 12, 18, 24, 30]);
    for (const stage of stages.filter((item) => item.boss)) {
      expect(stage.challenge).not.toBe(true);
      expect(stage.enemyCastleHp).toBeGreaterThan(0);
      expect(stage.reinforcement).toBeDefined();
      expect(stage.reinforcement!.startMs).toBeLessThanOrEqual(5_000);
      expect(stage.reinforcement!.intervalMs).toBeGreaterThanOrEqual(7_400);
      expect(stage.reinforcement!.maxAlive).toBeLessThanOrEqual(5);
      expect(Math.max(...stage.reinforcement!.unitIds.map((id) => troopDefinitions[id].cost))).toBeLessThanOrEqual(105);
    }
  });

  it('keeps boss-only encounters in a separate challenge roster', () => {
    expect(challengeStages).toHaveLength(4);
    expect(challengeStages.map((challenge) => challenge.terrain.enemyHpMultiplier * (challenge.bossModifiers?.hpMultiplier ?? 1))).toEqual([15, 80, 120, 15]);
    for (const challenge of challengeStages) {
      expect(challenge.challenge).toBe(true);
      expect(challenge.boss).toBe(true);
      expect(challenge.enemyCastleHp).toBe(0);
      expect(challenge.waves).toHaveLength(0);
      expect(challenge.reinforcement).toBeUndefined();
      expect(challenge.bossUnitId).toBeDefined();
      expect(challenge.firstClearReward.unitId).toBe(challenge.bossUnitId);
      expect(challenge.terrain.enemyHpMultiplier).toBe(10);
      expect(challenge.terrain.enemyAttackMultiplier).toBe(2.5);
    }
  });

  it('structures the occupation armies and terrain instead of hiding them in scene code', () => {
    expect(new Set(stages.map((stage) => stage.enemyFaction))).toEqual(
      new Set(['betrayers', 'goblins', 'orcs', 'monsters', 'demons', 'spirits', 'mixed']),
    );
    for (const stage of [...stages, ...challengeStages]) {
      expect(stage.terrain.name.length).toBeGreaterThan(0);
      expect(stage.terrain.enemyHpMultiplier).toBeGreaterThan(0);
      expect(stage.terrain.enemyAttackMultiplier).toBeGreaterThan(0);
      expect(stage.terrain.enemyMoveSpeedMultiplier).toBeGreaterThan(0);
    }
  });

  it('increases fortress distance until the shared maximum', () => {
    expect(stages[0].fortressDistance).toBe(1_050);
    expect(stages[0].fortressDistance).toBe(MIN_FORTRESS_DISTANCE);
    expect(stages[1].fortressDistance).toBe(1_075);
    expect(stages[13].fortressDistance).toBe(1_375);
    expect(stages[14].fortressDistance).toBe(MAX_FORTRESS_DISTANCE);
    expect(stages[28].fortressDistance).toBe(MAX_FORTRESS_DISTANCE);
    expect(stages.at(-1)?.fortressDistance).toBe(MAX_FORTRESS_DISTANCE);
    for (let index = 1; index < stages.length; index += 1) {
      expect(stages[index].fortressDistance).toBeGreaterThanOrEqual(stages[index - 1].fortressDistance);
      expect(stages[index].fortressDistance).toBeLessThanOrEqual(MAX_FORTRESS_DISTANCE);
    }
  });

  it('uses clean hundred-step battle rewards and selected elite defenders', () => {
    expect(stages.map((stage) => stage.reward)).toEqual(
      stages.map((stage) => stage.id * 100),
    );
    expect(stages.filter((stage) => stage.eliteGuard).map((stage) => stage.id)).toEqual(
      stages.filter((stage) => !stage.boss && stage.id !== 1).map((stage) => stage.id),
    );
  });

  it('introduces bounded enemy-fortress fire from the third region onward', () => {
    expect(stages.slice(0, 12).every((stage) => stage.enemyFortressAttack === undefined)).toBe(true);
    expect(stages[12].enemyFortressAttack).toEqual({ damage: 36, range: 260, intervalMs: 2_800 });
    expect(stages[18].enemyFortressAttack).toEqual({ damage: 52, range: 290, intervalMs: 2_400 });
    expect(stages[24].enemyFortressAttack).toEqual({ damage: 72, range: 320, intervalMs: 2_100 });
    expect(challengeStages.every((stage) => stage.enemyFortressAttack === undefined)).toBe(true);
  });

  it('builds every army from the shared troop definitions', () => {
    for (const wave of stages.flatMap((stage) => stage.waves)) {
      expect(troopDefinitions[wave.unitId]).toBeDefined();
    }
  });

  it('provides more than forty real troops including fantasy and magic roles', () => {
    expect(allTroopOrder.length).toBe(50);
    expect(new Set(allTroopOrder)).toEqual(new Set(UNIT_IDS));
    expect(troopDefinitions.griffin.name).toContain('그리폰');
    expect(troopDefinitions.ifrit.name).toBe('이프리트');
    expect(troopDefinitions.mage.name).toContain('마법사');
    expect(troopDefinitions.archmage.name).toBe('대마법사');
    expect(troopDefinitions.griffin.maxHp).toBeGreaterThan(troopDefinitions.wyvern.maxHp);
    expect(troopDefinitions.griffin.attackDamage).toBeGreaterThan(troopDefinitions.ifrit.attackDamage);
    expect(troopDefinitions.griffin.defense).toBeGreaterThanOrEqual(troopDefinitions.ifrit.defense ?? 0);
    expect(troopDefinitions.griffin.cost).toBeLessThanOrEqual(200);
    expect(new Set(Object.keys(unitFamilyById))).toEqual(new Set(allTroopOrder));
  });

  it('caps the strongest beasts per side instead of weakening their individual impact', () => {
    expect(troopDefinitions.griffin.maxActivePerSide).toBe(2);
    expect(troopDefinitions.minotaur.maxActivePerSide).toBe(2);
    expect(troopDefinitions.hydra.maxActivePerSide).toBe(2);
    expect(troopDefinitions.golem.maxActivePerSide).toBe(2);
    expect(troopDefinitions.ifrit.maxActivePerSide).toBe(2);
    for (const unit of allTroopOrder.map((id) => troopDefinitions[id]).filter((unit) => unit.maxActivePerSide !== undefined)) {
      expect(Number.isInteger(unit.maxActivePerSide)).toBe(true);
      expect(unit.maxActivePerSide).toBeGreaterThanOrEqual(2);
    }
  });

  it('gives every legendary and transcendent troop a four-digit base-health identity', () => {
    const upperTier = allTroopOrder.map((id) => troopDefinitions[id]).filter((unit) => unit.grade >= 4);
    expect(upperTier.length).toBeGreaterThan(0);
    expect(upperTier.every((unit) => unit.maxHp >= 1_000)).toBe(true);
    expect(troopDefinitions.ifrit.maxHp).toBe(11_000);
  });

  it('reserves Ifrit for the post-finale challenge instead of revealing it in campaign waves', () => {
    expect(stages.some((stage) => stage.waves.some((wave) => wave.unitId === 'ifrit') || stage.reinforcement?.unitIds.includes('ifrit'))).toBe(false);
    const ifritChallenge = challengeStages.find((stage) => stage.bossUnitId === 'ifrit');
    expect(ifritChallenge?.requiredCampaignStage).toBe(30);
    expect(ifritChallenge?.bossModifiers?.hpMultiplier).toBe(1.5);
  });

  it('gives every shared troop an acquisition or encounter path', () => {
    const encountered = new Set([
      ...stages.flatMap((stage) => stage.waves.map((wave) => wave.unitId)),
      ...stages.flatMap((stage) => stage.reinforcement?.unitIds ?? []),
      ...challengeStages.flatMap((stage) => stage.bossUnitId ? [stage.bossUnitId] : []),
    ]);
    const directlyGranted = new Set(stages.flatMap((stage) => stage.firstClearReward.unitId ? [stage.firstClearReward.unitId] : []));
    for (const id of allTroopOrder) {
      expect(
        id === 'militia'
        || encountered.has(id)
        || directlyGranted.has(id)
        || troopDefinitions[id].requiresEncounter === false,
        `${id} needs a progression path`,
      ).toBe(true);
    }
  });

  it('paces advanced enemy introductions across the eastern campaign', () => {
    for (const [unitId, expectedStage] of Object.entries(advancedEnemyIntroductionStages)) {
      const firstAppearance = stages.find((stage) => (
        stage.waves.some((wave) => wave.unitId === unitId)
        || stage.reinforcement?.unitIds.includes(unitId as keyof typeof troopDefinitions)
      ));
      expect(firstAppearance?.id).toBe(expectedStage);
    }
    expect(stages[6].waves.some((wave) => wave.unitId === 'cavalry' || wave.unitId === 'griffin')).toBe(false);
    expect(stages[7].waves.find((wave) => wave.unitId === 'cavalry')?.timeMs).toBe(15_500);
    expect(stages[10].waves.map((wave) => wave.unitId)).toEqual(expect.arrayContaining(['cavalry', 'griffin']));
    expect(stages[9].reinforcement?.unitIds).not.toContain('griffin');
    expect(stages[10].reinforcement?.unitIds).not.toContain('griffin');
  });

  it('uses monotonic, finite equipment upgrades without enemy mastery', () => {
    for (let index = 1; index < stages.length; index += 1) {
      const previous = stages[index - 1].enemyUpgrades;
      const current = stages[index].enemyUpgrades;
      expect(current.equipment.weapon).toBeGreaterThanOrEqual(previous.equipment.weapon);
      expect(current.equipment.armor).toBeGreaterThanOrEqual(previous.equipment.armor);
      expect(current.equipment.boots).toBeGreaterThanOrEqual(previous.equipment.boots);
    }
    for (const stage of stages) {
      expect('masteryLevel' in stage.enemyUpgrades).toBe(false);
      expect(Object.values(stage.enemyUpgrades.equipment).every((level) => level >= 0 && level <= ENEMY_EQUIPMENT_MAX_LEVEL)).toBe(true);
    }
    expect(stages[11].enemyUpgrades.equipment).toEqual({ weapon: 5, armor: 5, boots: 5 });
  });

  it('keeps producing capped reinforcements, including light fortress garrisons in boss sieges', () => {
    for (const stage of stages) {
      expect(stage.reinforcement).toBeDefined();
      const reinforcement = stage.reinforcement!;
      const finalScriptedSpawn = Math.max(0, ...stage.waves.map((wave) => wave.timeMs + (wave.count - 1) * wave.intervalMs));
      expect(reinforcement.startMs).toBeGreaterThanOrEqual(finalScriptedSpawn);
      expect(reinforcement.intervalMs).toBeGreaterThan(0);
      expect(reinforcement.maxAlive).toBeGreaterThan(0);
      expect(reinforcement.unitIds.length).toBeGreaterThan(0);
    }
    const lateReinforcements = stages.filter((stage) => stage.id >= 5 && !stage.boss).map((stage) => stage.reinforcement!);
    expect(Math.max(...lateReinforcements.map((reinforcement) => reinforcement.maxAlive))).toBeLessThanOrEqual(15);
    expect(Math.min(...lateReinforcements.map((reinforcement) => reinforcement.intervalMs))).toBeGreaterThanOrEqual(2_100);
  });
});
