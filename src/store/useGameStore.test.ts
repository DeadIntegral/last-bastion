import { beforeEach, describe, expect, it } from 'vitest';
import { UNIT_IDS, type BattleResult, type UnitId } from '../types/game';
import { emptyCastleTech } from '../data/castle';
import { FORMATION_SLOT_LICENSES } from '../data/economy';
import { HERO_MASTERY_MAX_LEVEL } from '../data/mastery';
import { mapTreasures } from '../data/mapTreasures';
import { monumentBuildings, TRIUMPH_MONUMENT, monumentConstructionCost } from '../data/endgame';
import { totalMasteryXpForLevel } from '../game/rules';
import { SAVE_EXPORT_FORMAT, SAVE_EXPORT_VERSION, useGameStore } from './useGameStore';

const emptySummons = (): Record<UnitId, number> => Object.fromEntries(UNIT_IDS.map((id) => [id, 0])) as Record<UnitId, number>;

const encounterResult = (encounteredEnemies: BattleResult['encounteredEnemies']): BattleResult => ({
  victory: false,
  stageId: 1,
  reward: 0,
  elapsedMs: 1_000,
  kills: 0,
  unitsLost: 0,
  heroDeaths: 0,
  summons: emptySummons(),
  usedHeroId: 'warden',
  heroSkillUses: 0,
  castleSkillUses: 0,
  encounteredEnemies,
});

describe('shared troop progression', () => {
  beforeEach(() => {
    localStorage.clear();
    useGameStore.getState().resetProgress();
  });

  it('starts a new profile with only the militia equipped', () => {
    expect(useGameStore.getState().unlockedUnits).toEqual(['militia']);
    expect(useGameStore.getState().equippedUnits).toEqual(['militia']);
    expect(useGameStore.getState().stats.codexEntries).toBe(2);
  });

  it('drops, validates, combines, and migrates counted items', () => {
    const earlyDrop = encounterResult([]);
    earlyDrop.victory = true;
    earlyDrop.lootRoll = 0;
    expect(useGameStore.getState().recordBattle(earlyDrop).drops).toEqual([{ id: 'veteran-standard', count: 1 }]);
    expect(useGameStore.getState().itemInventory['veteran-standard']).toBe(1);
    expect(useGameStore.getState().assignFormationItem('veteran-standard', 0)).toBe(true);
    expect(useGameStore.getState().assignFortressItem('veteran-standard', 0)).toBe(false);

    const fortressDrop = encounterResult([]);
    fortressDrop.victory = true;
    fortressDrop.stageId = 13;
    fortressDrop.lootRoll = 0.22;
    expect(useGameStore.getState().recordBattle(fortressDrop).drops).toEqual([{ id: 'guardian-keystone', count: 1 }]);
    expect(useGameStore.getState().assignFortressItem('guardian-keystone', 0)).toBe(true);
    expect(useGameStore.getState().formationItemSlots[0]).toBe('veteran-standard');
    expect(useGameStore.getState().fortressItemSlots[0]).toBe('guardian-keystone');

    expect(useGameStore.getState().importSave(JSON.stringify({
      unlockedStage: 19,
      clearedStages: [12, 18],
      itemInventory: { 'veteran-standard': 2, 'runed-whetstone': 1, unknown: 9 },
      formationItemSlots: ['veteran-standard', 'veteran-standard', 'guardian-keystone'],
    }))).toBe(true);
    expect(useGameStore.getState().itemInventory).toEqual({ 'veteran-standard': 2, 'runed-whetstone': 1 });
    expect(useGameStore.getState().formationItemSlots.slice(0, 3)).toEqual(['veteran-standard', 'veteran-standard', null]);
    expect(useGameStore.getState().craftItem('craft-war-standard')).toBe(false);
    useGameStore.getState().unequipFormationItem(0);
    expect(useGameStore.getState().craftItem('craft-war-standard')).toBe(true);
    expect(useGameStore.getState().itemInventory['war-standard']).toBe(1);
    expect(useGameStore.getState().itemInventory['veteran-standard']).toBe(1);
  });

  it('equips each owned copy independently and preserves quantity limits across save imports', () => {
    useGameStore.setState({ itemInventory: { 'veteran-standard': 2, 'guardian-keystone': 2, 'runed-whetstone': 1 } });
    const state = useGameStore.getState();
    expect(state.assignFormationItem('veteran-standard', 0)).toBe(true);
    expect(state.assignFormationItem('veteran-standard', 1)).toBe(true);
    expect(state.assignFormationItem('veteran-standard', 1)).toBe(true);
    expect(state.assignFormationItem('veteran-standard', 2)).toBe(false);
    expect(state.assignFortressItem('guardian-keystone', 0)).toBe(true);
    expect(state.assignFortressItem('guardian-keystone', 1)).toBe(true);
    const saved = state.exportSave();
    state.resetProgress();
    expect(state.importSave(saved)).toBe(true);
    expect(useGameStore.getState().formationItemSlots).toEqual(['veteran-standard', 'veteran-standard', null, null]);
    expect(useGameStore.getState().fortressItemSlots).toEqual(['guardian-keystone', 'guardian-keystone']);
    expect(state.assignFormationItem('runed-whetstone', 0)).toBe(true);
    expect(state.assignFormationItem('veteran-standard', 2)).toBe(true);
    expect(useGameStore.getState().formationItemSlots).toEqual(['runed-whetstone', 'veteran-standard', 'veteran-standard', null]);
    expect(state.importSave(JSON.stringify({ gold: 100, itemInventory: { 'veteran-standard': 2, 'guardian-keystone': 1 }, formationItemSlots: Array(4).fill('veteran-standard'), fortressItemSlots: ['guardian-keystone', 'guardian-keystone'] }))).toBe(true);
    expect(useGameStore.getState().formationItemSlots).toEqual(['veteran-standard', 'veteran-standard', null, null]);
    expect(useGameStore.getState().fortressItemSlots).toEqual(['guardian-keystone', null]);
  });

  it('does not restore experimental milestone-owned items from schema-seven saves', () => {
    expect(useGameStore.getState().importSave(JSON.stringify({
      gold: 500,
      unlockedStage: 31,
      clearedStages: [4, 8, 12, 18, 24, 30],
      ownedItems: ['veteran-standard', 'starfire-lens'],
      formationItemSlots: ['veteran-standard'],
      fortressItemSlots: ['starfire-lens'],
    }))).toBe(true);
    expect(useGameStore.getState().itemInventory).toEqual({});
    expect(useGameStore.getState().formationItemSlots.every((id) => id === null)).toBe(true);
    expect(useGameStore.getState().fortressItemSlots).toEqual([null, null]);
  });

  it('does not consume crafting materials when the result stack is full', () => {
    useGameStore.setState({
      clearedStages: [12],
      itemInventory: { 'veteran-standard': 1, 'runed-whetstone': 1, 'war-standard': 99 },
    });
    expect(useGameStore.getState().craftItem('craft-war-standard')).toBe(false);
    expect(useGameStore.getState().itemInventory).toEqual({
      'veteran-standard': 1,
      'runed-whetstone': 1,
      'war-standard': 99,
    });
  });

  it('grants the daily gem reward only once per local date key', () => {
    expect(useGameStore.getState().claimDailyReward()).toBe(true);
    expect(useGameStore.getState().gems).toBe(10);
    expect(useGameStore.getState().claimDailyReward()).toBe(false);
    expect(useGameStore.getState().gems).toBe(10);
  });

  it('claims both gold and gems from an unlocked achievement', () => {
    useGameStore.setState({ unlockedAchievementIds: ['first_blood'] });
    expect(useGameStore.getState().claimAchievement('first_blood')).toBe(true);
    expect(useGameStore.getState().gold).toBe(140);
    expect(useGameStore.getState().gems).toBe(2);
    expect(useGameStore.getState().claimAchievement('first_blood')).toBe(false);
  });

  it('requires a regional guardian victory before its treasure can be claimed once', () => {
    const westernTreasure = mapTreasures[0];
    expect(useGameStore.getState().completeTreasureMission(westernTreasure.missionStageId)).toBeUndefined();
    useGameStore.setState({ clearedStages: [westernTreasure.revealStage] });
    expect(useGameStore.getState().completeTreasureMission(westernTreasure.missionStageId)?.label).toContain('경로 해금');
    expect(useGameStore.getState().gold).toBe(100);
    expect(useGameStore.getState().clearedMapTreasureGuardianIds).toEqual([westernTreasure.id]);
    expect(useGameStore.getState().claimMapTreasure(westernTreasure.id)).toBe(true);
    expect(useGameStore.getState().gold).toBe(100 + westernTreasure.gold);
    expect(useGameStore.getState().claimedMapTreasureIds).toEqual([westernTreasure.id]);
    expect(useGameStore.getState().completeTreasureMission(westernTreasure.missionStageId)).toBeUndefined();
    expect(useGameStore.getState().claimMapTreasure(westernTreasure.id)).toBe(false);
    expect(useGameStore.getState().gold).toBe(100 + westernTreasure.gold);
  });

  it('applies fortress economy research only to battle gold and battle mastery XP', () => {
    const castleTechLevels = emptyCastleTech();
    castleTechLevels.spoils_accounting = 2;
    castleTechLevels.field_manuals = 2;
    useGameStore.setState({ castleTechLevels });

    expect(useGameStore.getState().addReward(100, 0)).toBe(110);
    expect(useGameStore.getState().gold).toBe(210);

    const result = encounterResult([]);
    result.summons.militia = 1;
    const record = useGameStore.getState().recordBattle(result);
    expect(record.gains).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'militia', amount: 11, kind: 'unit', participationAmount: 11, contributionAmount: 0 }),
      expect.objectContaining({ id: 'warden', amount: 23, kind: 'hero', participationAmount: 23, contributionAmount: 0 }),
    ]));
    expect(useGameStore.getState().unitMasteryXp.militia).toBe(11);
    expect(useGameStore.getState().heroMasteryXp.warden).toBe(23);

    useGameStore.setState({ unlockedAchievementIds: ['first_blood'] });
    useGameStore.getState().claimAchievement('first_blood');
    expect(useGameStore.getState().gold).toBe(250);
  });

  it('adds bounded role contribution XP to participation XP at battle result time', () => {
    const result = encounterResult([]);
    result.victory = true;
    result.summons.militia = 1;
    result.masteryContributions = {
      units: {
        militia: { damageDealt: 6_400, damageTaken: 2_500, healingDone: 1_225, protectionDone: 441, kills: 3, activeMs: 60_000 },
      },
      hero: { damageDealt: 0, damageTaken: 0, healingDone: 0, protectionDone: 0, kills: 0, activeMs: 0 },
    };

    const record = useGameStore.getState().recordBattle(result);
    expect(record.gains).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'militia', amount: 46, participationAmount: 14, contributionAmount: 32 }),
      expect.objectContaining({ id: 'warden', amount: 26, participationAmount: 26, contributionAmount: 0 }),
    ]));
  });

  it('applies a farming-stage mastery multiplier after contribution calculation', () => {
    const result = encounterResult([]);
    result.stageId = 302;
    result.summons.militia = 1;
    const record = useGameStore.getState().recordBattle(result);
    expect(record.gains).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'militia', amount: 20, participationAmount: 20, contributionAmount: 0 }),
      expect.objectContaining({ id: 'warden', amount: 42, participationAmount: 42, contributionAmount: 0 }),
    ]));
  });

  it('applies the battle-gold multiplier to first-clear gold', () => {
    const castleTechLevels = emptyCastleTech();
    castleTechLevels.spoils_accounting = 2;
    useGameStore.setState({ castleTechLevels });
    const reward = useGameStore.getState().completeStage(3);
    expect(reward?.gold).toBe(330);
    expect(useGameStore.getState().gold).toBe(430);
  });

  it('grants late human and non-human heroes from structured campaign milestones', () => {
    expect(useGameStore.getState().completeStage(12)?.heroId).toBe('saint');
    expect(useGameStore.getState().unlockedHeroes).toContain('saint');
    expect(useGameStore.getState().completeStage(18)?.heroId).toBe('marshal');
    expect(useGameStore.getState().unlockedHeroes).toContain('marshal');
    expect(useGameStore.getState().completeStage(15)?.heroId).toBe('orcChampion');
    expect(useGameStore.getState().unlockedHeroes).toContain('orcChampion');
    expect(useGameStore.getState().completeStage(24)?.heroId).toBe('windSpirit');
    expect(useGameStore.getState().unlockedHeroes).toContain('windSpirit');
  });

  it('sells the permanent 1.5x battle license for 200 gems after the first boss', () => {
    useGameStore.setState({ gems: 200 });
    expect(useGameStore.getState().purchaseBattleSpeed()).toBe(false);
    expect(useGameStore.getState().gems).toBe(200);

    useGameStore.setState({ clearedStages: [6] });
    expect(useGameStore.getState().purchaseBattleSpeed()).toBe(true);
    expect(useGameStore.getState().gems).toBe(0);
    expect(useGameStore.getState().battleSpeedUnlocked).toBe(true);
    expect(useGameStore.getState().battleSpeed).toBe(1.5);
    expect(useGameStore.getState().toggleBattleSpeed()).toBe(true);
    expect(useGameStore.getState().battleSpeed).toBe(1);
    expect(useGameStore.getState().toggleBattleSpeed()).toBe(true);
    expect(useGameStore.getState().battleSpeed).toBe(1.5);
    expect(useGameStore.getState().purchaseBattleSpeed()).toBe(true);
    expect(useGameStore.getState().gems).toBe(0);
  });

  it('requires the matching fortress tier before recruiting an encountered enemy troop', () => {
    useGameStore.getState().recordBattle(encounterResult(['raider']));
    expect(useGameStore.getState().stats.codexEntries).toBe(3);

    useGameStore.getState().addReward(20, 0);
    expect(useGameStore.getState().recruitUnit('raider')).toBe(false);
    const castleTechLevels = emptyCastleTech();
    castleTechLevels.war_coffers = 5;
    castleTechLevels.logistics = 3;
    useGameStore.setState({ gold: 1_300, castleTechLevels });
    expect(useGameStore.getState().promoteFortress()).toBe(true);
    expect(useGameStore.getState().fortressTier).toBe(2);
    expect(useGameStore.getState().recruitUnit('raider')).toBe(true);
    expect(useGameStore.getState().unlockedUnits).toContain('raider');
    expect(useGameStore.getState().equippedUnits).toContain('raider');
    expect(useGameStore.getState().stats.codexEntries).toBe(3);
  });

  it('opens royal troop recruitment through fortress promotion without an enemy encounter', () => {
    expect(useGameStore.getState().recruitUnit('cavalry')).toBe(false);
    const castleTechLevels = emptyCastleTech();
    castleTechLevels.war_coffers = 5;
    castleTechLevels.logistics = 3;
    useGameStore.setState({ gold: 2_000, castleTechLevels });
    expect(useGameStore.getState().promoteFortress()).toBe(true);
    expect(useGameStore.getState().recruitUnit('cavalry')).toBe(true);
    expect(useGameStore.getState().unlockedUnits).toContain('cavalry');
  });

  it('opens the expensive alliance guardian only after the campaign finale', () => {
    useGameStore.setState({ gold: 20_000, fortressTier: 3 });
    expect(useGameStore.getState().recruitUnit('allianceGuardian')).toBe(false);
    expect(useGameStore.getState().gold).toBe(20_000);

    useGameStore.setState({ clearedStages: [30] });
    expect(useGameStore.getState().recruitUnit('allianceGuardian')).toBe(true);
    expect(useGameStore.getState().gold).toBe(0);
    expect(useGameStore.getState().unlockedUnits).toContain('allianceGuardian');
  });

  it('repairs a saved fortress tier when existing research proves a higher unlock', async () => {
    const castleTechLevels = emptyCastleTech();
    castleTechLevels.siege_calculus = 1;
    localStorage.setItem('last-bastion-profile-v1', JSON.stringify({
      state: { fortressTier: 1, castleTechLevels },
      version: 0,
    }));

    await useGameStore.persist.rehydrate();

    expect(useGameStore.getState().fortressTier).toBe(3);
    expect(useGameStore.getState().castleTechLevels.siege_calculus).toBe(1);
  });

  it('expands formation slots from four to seven through three stage-gated purchases', () => {
    useGameStore.setState({
      gems: FORMATION_SLOT_LICENSES.reduce((total, license) => total + license.cost, 0),
      unlockedUnits: ['militia', 'guardian', 'archer', 'lancer', 'raider', 'swordsman', 'pikeman', 'scout'],
      equippedUnits: ['militia', 'guardian', 'archer', 'lancer'],
      formationSlots: ['militia', 'guardian', 'archer', 'lancer'],
    });
    expect(useGameStore.getState().toggleEquippedUnit('raider')).toBe(false);
    expect(useGameStore.getState().purchaseFormationSlot()).toBe(false);
    expect(useGameStore.getState().formationSlotPurchases).toBe(0);

    useGameStore.setState({ clearedStages: [12] });
    expect(useGameStore.getState().purchaseFormationSlot()).toBe(true);
    expect(useGameStore.getState().formationSlotPurchases).toBe(1);
    expect(useGameStore.getState().toggleEquippedUnit('raider')).toBe(true);
    expect(useGameStore.getState().toggleEquippedUnit('swordsman')).toBe(false);

    useGameStore.setState({ clearedStages: [12, 18] });
    expect(useGameStore.getState().purchaseFormationSlot()).toBe(true);
    expect(useGameStore.getState().toggleEquippedUnit('swordsman')).toBe(true);
    expect(useGameStore.getState().toggleEquippedUnit('pikeman')).toBe(false);

    useGameStore.setState({ clearedStages: [12, 18, 24] });
    expect(useGameStore.getState().purchaseFormationSlot()).toBe(true);
    expect(useGameStore.getState().formationSlotPurchases).toBe(3);
    expect(useGameStore.getState().toggleEquippedUnit('pikeman')).toBe(true);
    expect(useGameStore.getState().toggleEquippedUnit('scout')).toBe(false);
    expect(useGameStore.getState().purchaseFormationSlot()).toBe(true);
    expect(useGameStore.getState().gems).toBe(0);
  });

  it('assigns owned troops directly to numbered formation positions', () => {
    useGameStore.setState({
      formationSlotPurchases: 2,
      unlockedUnits: ['militia', 'guardian', 'archer', 'lancer', 'raider', 'swordsman', 'pikeman'],
      equippedUnits: ['militia', 'guardian', 'archer', 'lancer', 'raider', 'swordsman'],
      formationSlots: ['militia', 'guardian', 'archer', 'lancer', 'raider', 'swordsman'],
    });
    expect(useGameStore.getState().assignEquippedUnit('militia', 5)).toBe(true);
    expect(useGameStore.getState().equippedUnits).toEqual(['swordsman', 'guardian', 'archer', 'lancer', 'raider', 'militia']);
    expect(useGameStore.getState().assignEquippedUnit('pikeman', 2)).toBe(true);
    expect(useGameStore.getState().equippedUnits).toEqual(['swordsman', 'guardian', 'pikeman', 'lancer', 'raider', 'militia']);
    expect(useGameStore.getState().assignEquippedUnit('archer', 6)).toBe(false);
  });

  it('reveals later six-stage regions and derives the final cap from stage data', () => {
    useGameStore.getState().addReward(0, 6);
    expect(useGameStore.getState().unlockedStage).toBe(7);

    useGameStore.getState().addReward(0, 12);
    expect(useGameStore.getState().unlockedStage).toBe(13);

    useGameStore.getState().addReward(0, 30);
    expect(useGameStore.getState().unlockedStage).toBe(30);
  });

  it('counts every stage marked as a boss instead of one hardcoded encounter', () => {
    useGameStore.getState().recordBattle({
      ...encounterResult([]),
      victory: true,
      stageId: 12,
    });
    expect(useGameStore.getState().stats.bossWins).toBe(1);
  });

  it('does not record boss-only challenges as campaign first clears', () => {
    expect(useGameStore.getState().completeStage(101)).toBeUndefined();
    expect(useGameStore.getState().clearedStages).not.toContain(101);
    expect(useGameStore.getState().unlockedStage).toBe(1);
  });

  it('unlocks a base combatant once after clearing its terrain-boosted challenge', () => {
    expect(useGameStore.getState().recruitUnit('spirit')).toBe(false);
    expect(useGameStore.getState().completeChallenge(102)).toBeUndefined();
    useGameStore.setState({ clearedStages: [18] });
    const reward = useGameStore.getState().completeChallenge(102);
    expect(reward?.unitId).toBe('spirit');
    expect(useGameStore.getState().unlockedUnits).toContain('spirit');
    expect(useGameStore.getState().clearedChallenges).toContain(102);
    expect(useGameStore.getState().completeChallenge(102)).toBeUndefined();
    expect(useGameStore.getState().unlockedStage).toBe(1);
  });

  it('imports raw or Zustand-wrapped save JSON and normalizes its formation', () => {
    const imported = useGameStore.getState().importSave(JSON.stringify({
      state: {
        gold: 777,
        gems: 12,
        battleSpeedUnlocked: true,
        battleSpeed: 1.5,
        formationSlotUnlocked: true,
        triumphMonumentLevel: 999,
        claimedMapTreasureIds: ['western-reliquary', 'not-a-treasure'],
        unlockedStage: 5,
        unlockedUnits: ['militia', 'guardian', 'archer', 'lancer', 'raider', 'mage', 'not-a-unit'],
        equippedUnits: ['militia', 'guardian', 'archer', 'lancer', 'raider', 'mage', 'not-a-unit'],
        unlockedHeroes: ['warden'],
      },
      version: 0,
    }));

    expect(imported).toBe(true);
    expect(useGameStore.getState().gold).toBe(777);
    expect(useGameStore.getState().gems).toBe(12);
    expect(useGameStore.getState().battleSpeedUnlocked).toBe(true);
    expect(useGameStore.getState().battleSpeed).toBe(1.5);
    expect(useGameStore.getState().formationSlotPurchases).toBe(1);
    expect(useGameStore.getState().builtMonumentIds.length).toBe(0);
    expect(useGameStore.getState().claimedMapTreasureIds).toEqual([]);
    expect(useGameStore.getState().unlockedStage).toBe(5);
    expect(useGameStore.getState().unlockedUnits).toEqual(['militia', 'guardian', 'archer', 'lancer', 'raider', 'mage']);
    expect(useGameStore.getState().equippedUnits).toEqual(['militia', 'guardian', 'archer', 'lancer', 'raider']);
  });

  it('exports a portable versioned save without store actions and imports it again', () => {
    useGameStore.setState({ gold: 1_234, gems: 56, unlockedStage: 30, clearedStages: [1, 2, 3, 4, 5, 6, 12, 18, 24, 30], clearedMapTreasureGuardianIds: ['western-reliquary'], claimedMapTreasureIds: ['western-reliquary'], formationSlotPurchases: 3, builtMonumentIds: monumentBuildings.slice(0, 4).map((entry) => entry.id) });

    const serialized = useGameStore.getState().exportSave();
    const exported = JSON.parse(serialized) as { format: string; version: number; gameVersion: string; saveSchemaVersion: number; exportedAt: string; state: Record<string, unknown> };

    expect(exported.format).toBe(SAVE_EXPORT_FORMAT);
    expect(exported.version).toBe(SAVE_EXPORT_VERSION);
    expect(exported.gameVersion).toBe('0.2.0');
    expect(exported.saveSchemaVersion).toBe(SAVE_EXPORT_VERSION);
    expect(Number.isNaN(Date.parse(exported.exportedAt))).toBe(false);
    expect(exported.state.gold).toBe(1_234);
    expect(exported.state.gems).toBe(56);
    expect(exported.state.formationSlotPurchases).toBe(3);
    expect(exported.state.builtMonumentIds).toEqual(monumentBuildings.slice(0, 4).map((entry) => entry.id));
    expect(exported.state.claimedMapTreasureIds).toEqual(['western-reliquary']);
    expect(exported.state.clearedMapTreasureGuardianIds).toEqual(['western-reliquary']);
    expect(exported.state.exportSave).toBeUndefined();
    expect(exported.state.resetProgress).toBeUndefined();

    useGameStore.getState().resetProgress();
    expect(useGameStore.getState().importSave(serialized)).toBe(true);
    expect(useGameStore.getState().gold).toBe(1_234);
    expect(useGameStore.getState().unlockedStage).toBe(30);
    expect(useGameStore.getState().formationSlotPurchases).toBe(3);
    expect(useGameStore.getState().builtMonumentIds.length).toBe(4);
    expect(useGameStore.getState().claimedMapTreasureIds).toEqual(['western-reliquary']);
    expect(useGameStore.getState().clearedMapTreasureGuardianIds).toEqual(['western-reliquary']);
  });

  it('defaults missing monument progress to zero when importing an older save', () => {
    useGameStore.setState({ builtMonumentIds: monumentBuildings.slice(0, 4).map((entry) => entry.id), clearedStages: [30] });

    expect(useGameStore.getState().importSave(JSON.stringify({
      gold: 500,
      unlockedStage: 30,
      clearedStages: [30],
    }))).toBe(true);
    expect(useGameStore.getState().builtMonumentIds.length).toBe(0);
  });

  it('recovers milestone heroes for older saves that already cleared their stages', () => {
    expect(useGameStore.getState().importSave(JSON.stringify({
      gold: 500,
      unlockedStage: 25,
      unlockedHeroes: ['warden'],
    }))).toBe(true);
    expect(useGameStore.getState().unlockedHeroes).toEqual([
      'warden', 'pyromancer', 'huntress', 'saint', 'orcChampion', 'marshal', 'windSpirit',
    ]);
  });

  it('rejects unrelated JSON and never lets imported fields replace store actions', () => {
    expect(useGameStore.getState().importSave('{"hello":"world"}')).toBe(false);
    expect(useGameStore.getState().importSave('{broken')).toBe(false);
    expect(useGameStore.getState().importSave(JSON.stringify({ gold: 250, resetProgress: 'disabled' }))).toBe(true);
    expect(useGameStore.getState().gold).toBe(250);
    expect(typeof useGameStore.getState().resetProgress).toBe('function');
  });

  it('unlocks gold-funded hero training from stage 9 and caps mastery XP', () => {
    useGameStore.setState({ gold: 5_000 });
    expect(useGameStore.getState().trainHeroMastery('warden', 'tactical-lesson')).toBe(false);
    expect(useGameStore.getState().gold).toBe(5_000);

    useGameStore.setState({ clearedStages: [9] });
    expect(useGameStore.getState().trainHeroMastery('warden', 'tactical-lesson')).toBe(true);
    expect(useGameStore.getState().gold).toBe(4_000);
    expect(useGameStore.getState().heroMasteryXp.warden).toBe(500);

    const xpCap = totalMasteryXpForLevel(HERO_MASTERY_MAX_LEVEL);
    useGameStore.setState((state) => ({ gold: 5_000, heroMasteryXp: { ...state.heroMasteryXp, warden: xpCap - 10 } }));
    expect(useGameStore.getState().trainHeroMastery('warden', 'royal-tutoring')).toBe(true);
    expect(useGameStore.getState().heroMasteryXp.warden).toBe(xpCap);
    expect(useGameStore.getState().trainHeroMastery('warden', 'field-drill')).toBe(false);
  });

  it('constructs a unique monument only after the finale and refuses duplicates', () => {
    useGameStore.setState({ gold: 100_000 });
    expect(useGameStore.getState().constructMonument('liberation-beacon')).toBe(false);
    useGameStore.setState({ clearedStages: [30] });
    expect(useGameStore.getState().constructMonument('liberation-beacon')).toBe(true);
    expect(useGameStore.getState().builtMonumentIds).toEqual(['liberation-beacon']);
    expect(useGameStore.getState().gold).toBe(100_000 - monumentConstructionCost('liberation-beacon')!);
    expect(useGameStore.getState().constructMonument('liberation-beacon')).toBe(false);
    expect(useGameStore.getState().constructMonument('unknown' as never)).toBe(false);
  });

  it('charges individual monument prices in any construction order', () => {
    useGameStore.setState({ clearedStages: [30], gold: 25000 });
    expect(useGameStore.getState().constructMonument('victory-crown')).toBe(true);
    expect(useGameStore.getState().gold).toBe(7000);
    expect(useGameStore.getState().constructMonument('liberation-beacon')).toBe(true);
    expect(useGameStore.getState().gold).toBe(4000);
    expect(useGameStore.getState().constructMonument('heroes-statue')).toBe(false);
    expect(useGameStore.getState().gold).toBe(4000);
  });

  it.each([1, 401])('saves defeat XP for fallen troops and heroes in battle %i', (stageId) => {
    useGameStore.setState({ clearedStages: [30], builtMonumentIds: monumentBuildings.map((building) => building.id) });
    const result = { ...encounterResult([]), stageId, unitsLost: 2, heroDeaths: 1 };
    result.summons.militia = 2;
    const record = useGameStore.getState().recordBattle(result);
    const unitXp = record.gains.find((gain) => gain.id === 'militia')!.amount;
    const heroXp = record.gains.find((gain) => gain.id === 'warden')!.amount;
    expect(unitXp).toBeGreaterThan(0);
    expect(heroXp).toBeGreaterThan(0);
    expect(useGameStore.getState().unitMasteryXp.archer).toBe(0);
    expect(useGameStore.getState().stats.defeats).toBe(1);
    expect(useGameStore.getState().clearedChapterTwoStages).toEqual([]);
    expect(record.drops).toEqual([]);
    const saved = useGameStore.getState().exportSave();
    useGameStore.getState().resetProgress();
    useGameStore.getState().importSave(saved);
    expect(useGameStore.getState().unitMasteryXp.militia).toBe(unitXp);
    expect(useGameStore.getState().heroMasteryXp.warden).toBe(heroXp);
  });

  it('migrates old paid ranks upward without losing bonuses or repeating migration', () => {
    for (const [oldLevel, buildings] of [[0, 0], [1, 1], [4, 1], [5, 2], [19, 5], [20, 5]]) {
      useGameStore.getState().importSave(JSON.stringify({ clearedStages: [30], gold: 500, triumphMonumentLevel: oldLevel }));
      expect(useGameStore.getState().builtMonumentIds).toHaveLength(buildings);
      const exported = useGameStore.getState().exportSave();
      useGameStore.getState().resetProgress();
      useGameStore.getState().importSave(exported);
      expect(useGameStore.getState().builtMonumentIds).toHaveLength(buildings);
      expect(useGameStore.getState().gold).toBe(500);
    }
    useGameStore.getState().importSave(JSON.stringify({ clearedStages: [30], builtMonumentIds: ['heroes-statue', 'unknown', 'heroes-statue'], triumphMonumentLevel: 20 }));
    expect(useGameStore.getState().builtMonumentIds).toEqual(['heroes-statue']);
  });

  it('records distinct post-finale deeds only for qualifying victories and preserves them through export', () => {
    const smallCompany = { ...encounterResult([]), victory: true, stageId: 301, summons: { ...emptySummons(), militia: 1 } };
    expect(useGameStore.getState().recordBattle(smallCompany).monumentDeeds).toEqual([]);
    useGameStore.setState({ clearedStages: [30] });
    expect(useGameStore.getState().recordBattle({ ...smallCompany, victory: false }).monumentDeeds).toEqual([]);
    expect(useGameStore.getState().recordBattle({ ...smallCompany, summons: emptySummons() }).monumentDeeds).toEqual([]);
    expect(useGameStore.getState().recordBattle({ ...smallCompany, summons: { ...smallCompany.summons, archer: 1, guardian: 1, lancer: 1 } }).monumentDeeds).toEqual([]);
    expect(useGameStore.getState().recordBattle(smallCompany).monumentDeeds).toEqual(['small-company']);
    expect(useGameStore.getState().recordBattle(smallCompany).monumentDeeds).toEqual([]);
    expect(useGameStore.getState().recordBattle({ ...smallCompany, stageId: 302, heroDeaths: 1 }).monumentDeeds).toEqual([]);
    expect(useGameStore.getState().recordBattle({ ...smallCompany, stageId: 302 }).monumentDeeds).toEqual(['steadfast-hero']);
    for (const stageId of [104, 105]) useGameStore.getState().recordBattle({ ...smallCompany, stageId });
    expect(useGameStore.getState().monumentDeedIds).toHaveLength(4);
    const exported = useGameStore.getState().exportSave();
    useGameStore.getState().resetProgress();
    expect(useGameStore.getState().monumentDeedIds).toEqual([]);
    expect(useGameStore.getState().importSave(exported)).toBe(true);
    expect(useGameStore.getState().monumentDeedIds).toHaveLength(4);
  });

  it('normalizes deed imports and recognizes past transcendent victories without inventing tactical records', () => {
    useGameStore.getState().importSave(JSON.stringify({ clearedStages: [30], clearedChallenges: [104, 105] }));
    expect(useGameStore.getState().monumentDeedIds).toEqual(['sun-seal', 'sky-crown']);
    useGameStore.getState().importSave(JSON.stringify({ clearedStages: [30], monumentDeedIds: ['small-company', 'small-company', 'unknown'] }));
    expect(useGameStore.getState().monumentDeedIds).toEqual(['small-company']);
    useGameStore.getState().importSave(JSON.stringify({ clearedStages: [], monumentDeedIds: ['small-company'], clearedChallenges: [104] }));
    expect(useGameStore.getState().monumentDeedIds).toEqual([]);
  });

  it('applies deed discounts once per construction and bounds the collection at five', () => {
    useGameStore.setState({ clearedStages: [30], gold: 2_399, monumentDeedIds: ['small-company', 'steadfast-hero', 'sun-seal', 'sky-crown'] });
    expect(useGameStore.getState().constructMonument('liberation-beacon')).toBe(false);
    expect(useGameStore.getState().gold).toBe(2_399);
    useGameStore.setState({ gold: 1_000_000 });
    for (const building of monumentBuildings) expect(useGameStore.getState().constructMonument(building.id)).toBe(true);
    expect(useGameStore.getState().gold).toBe(963_200);
    expect(useGameStore.getState().builtMonumentIds).toHaveLength(TRIUMPH_MONUMENT.maxLevel);
    expect(useGameStore.getState().constructMonument('liberation-beacon')).toBe(false);
  });
});
