import { beforeEach, describe, expect, it } from 'vitest';
import { UNIT_IDS, type BattleResult, type UnitId } from '../types/game';
import { emptyCastleTech } from '../data/castle';
import { HERO_MASTERY_MAX_LEVEL } from '../data/mastery';
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
      { id: 'militia', amount: 13, kind: 'unit' },
      { id: 'warden', amount: 33, kind: 'hero' },
    ]));
    expect(useGameStore.getState().unitMasteryXp.militia).toBe(13);
    expect(useGameStore.getState().heroMasteryXp.warden).toBe(33);

    useGameStore.setState({ unlockedAchievementIds: ['first_blood'] });
    useGameStore.getState().claimAchievement('first_blood');
    expect(useGameStore.getState().gold).toBe(250);
  });

  it('applies the battle-gold multiplier to first-clear gold', () => {
    const castleTechLevels = emptyCastleTech();
    castleTechLevels.spoils_accounting = 2;
    useGameStore.setState({ castleTechLevels });
    const reward = useGameStore.getState().completeStage(3);
    expect(reward?.gold).toBe(330);
    expect(useGameStore.getState().gold).toBe(430);
  });

  it('grants the two late heroes from their structured boss milestones', () => {
    expect(useGameStore.getState().completeStage(12)?.heroId).toBe('saint');
    expect(useGameStore.getState().unlockedHeroes).toContain('saint');
    expect(useGameStore.getState().completeStage(18)?.heroId).toBe('marshal');
    expect(useGameStore.getState().unlockedHeroes).toContain('marshal');
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

  it('keeps battle formations between one and four troop types', () => {
    useGameStore.setState({
      unlockedUnits: ['militia', 'guardian', 'archer', 'lancer', 'raider'],
      equippedUnits: ['militia', 'guardian', 'archer', 'lancer'],
    });
    expect(useGameStore.getState().toggleEquippedUnit('raider')).toBe(false);
    expect(useGameStore.getState().toggleEquippedUnit('lancer')).toBe(true);
    expect(useGameStore.getState().toggleEquippedUnit('raider')).toBe(true);
    expect(useGameStore.getState().equippedUnits).toEqual(['militia', 'guardian', 'archer', 'raider']);
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
        unlockedStage: 5,
        unlockedUnits: ['militia', 'mage', 'not-a-unit'],
        equippedUnits: ['mage', 'not-a-unit'],
        unlockedHeroes: ['warden'],
      },
      version: 0,
    }));

    expect(imported).toBe(true);
    expect(useGameStore.getState().gold).toBe(777);
    expect(useGameStore.getState().gems).toBe(12);
    expect(useGameStore.getState().battleSpeedUnlocked).toBe(true);
    expect(useGameStore.getState().battleSpeed).toBe(1.5);
    expect(useGameStore.getState().unlockedStage).toBe(5);
    expect(useGameStore.getState().unlockedUnits).toEqual(['militia', 'mage']);
    expect(useGameStore.getState().equippedUnits).toEqual(['mage']);
  });

  it('exports a portable versioned save without store actions and imports it again', () => {
    useGameStore.setState({ gold: 1_234, gems: 56, unlockedStage: 7, clearedStages: [1, 2, 3, 4, 5, 6] });

    const serialized = useGameStore.getState().exportSave();
    const exported = JSON.parse(serialized) as { format: string; version: number; exportedAt: string; state: Record<string, unknown> };

    expect(exported.format).toBe(SAVE_EXPORT_FORMAT);
    expect(exported.version).toBe(SAVE_EXPORT_VERSION);
    expect(Number.isNaN(Date.parse(exported.exportedAt))).toBe(false);
    expect(exported.state.gold).toBe(1_234);
    expect(exported.state.gems).toBe(56);
    expect(exported.state.exportSave).toBeUndefined();
    expect(exported.state.resetProgress).toBeUndefined();

    useGameStore.getState().resetProgress();
    expect(useGameStore.getState().importSave(serialized)).toBe(true);
    expect(useGameStore.getState().gold).toBe(1_234);
    expect(useGameStore.getState().unlockedStage).toBe(7);
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
});
