import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { achievementById, unlockedAchievements } from '../data/achievements';
import { canUpgradeCastleTech, castleBattleStats, castleTechCost, castleTechDefinitions, emptyCastleTech, fortressTierDefinitions, minimumFortressTierForResearch, totalCastleResearch } from '../data/castle';
import { codexEntryCount } from '../data/codex';
import { BATTLE_SPEED_LICENSE, DAILY_REWARD } from '../data/economy';
import { heroTrainingPackageById, isGameFeatureUnlocked } from '../data/features';
import { HERO_MASTERY_MAX_LEVEL } from '../data/mastery';
import { getStage, stages } from '../data/stages';
import { allTroopOrder, heroDefinitions, heroOrder, troopDefinitions } from '../data/units';
import { GAME_VERSION, SAVE_SCHEMA_VERSION } from '../data/version';
import { emptyEquipment, equipmentCost, heroMasteryLevelFromXp, scaledProgressionReward, totalMasteryXpForLevel } from '../game/rules';
import { canClaimDailyReward, localDateKey } from '../game/daily';
import { initializeSaveSlots, writeActiveSaveSlot } from '../game/saveSlots';
import type { BattleResult, BattleSpeed, CastleTechId, CodexEnemyId, EquipmentLevels, EquipmentSlot, FirstClearReward, FortressTier, HeroId, HeroTrainingPackageId, PlayerStats, UnitId } from '../types/game';

initializeSaveSlots();

type UnitXp = Record<UnitId, number>;
type HeroXp = Record<HeroId, number>;
type UnitEquipment = Record<UnitId, EquipmentLevels>;
type HeroEquipment = Record<HeroId, EquipmentLevels>;
type LegacyUnitLevels = Record<UnitId, number>;
type LegacyHeroLevels = Record<HeroId, number>;

interface BattleRecord {
  unlocked: string[];
  gains: NonNullable<BattleResult['masteryGains']>;
}

interface GameProfile {
  gold: number;
  gems: number;
  lastDailyClaimDate: string | null;
  unlockedStage: number;
  equipmentLevels: UnitEquipment;
  unlockedUnits: UnitId[];
  equippedUnits: UnitId[];
  clearedStages: number[];
  clearedChallenges: number[];
  unitMasteryXp: UnitXp;
  selectedHero: HeroId;
  unlockedHeroes: HeroId[];
  heroEquipmentLevels: HeroEquipment;
  heroMasteryXp: HeroXp;
  fortressTier: FortressTier;
  castleTechLevels: Record<CastleTechId, number>;
  stats: PlayerStats;
  unlockedAchievementIds: string[];
  claimedAchievementIds: string[];
  discoveredEnemies: CodexEnemyId[];
  muted: boolean;
  battleSpeedUnlocked: boolean;
  battleSpeed: BattleSpeed;
  addReward: (amount: number, clearedStage: number) => number;
  completeStage: (stageId: number) => FirstClearReward | undefined;
  completeChallenge: (stageId: number) => FirstClearReward | undefined;
  recruitUnit: (id: UnitId) => boolean;
  toggleEquippedUnit: (id: UnitId) => boolean;
  upgradeUnitEquipment: (id: UnitId, slot: EquipmentSlot) => boolean;
  unlockHero: (id: HeroId, cost: number) => boolean;
  selectHero: (id: HeroId) => void;
  upgradeHeroEquipment: (id: HeroId, slot: EquipmentSlot) => boolean;
  trainHeroMastery: (id: HeroId, packageId: HeroTrainingPackageId) => boolean;
  promoteFortress: () => boolean;
  upgradeCastleTech: (id: CastleTechId) => boolean;
  recordBattle: (result: BattleResult) => BattleRecord;
  claimAchievement: (id: string) => boolean;
  claimDailyReward: () => boolean;
  purchaseBattleSpeed: () => boolean;
  toggleBattleSpeed: () => boolean;
  toggleMuted: () => void;
  exportSave: () => string;
  importSave: (serialized: string) => boolean;
  resetProgress: () => void;
}

const emptyUnitXp = (): UnitXp => Object.fromEntries(allTroopOrder.map((id) => [id, 0])) as UnitXp;
const emptyHeroXp = (): HeroXp => Object.fromEntries(heroOrder.map((id) => [id, 0])) as HeroXp;
const emptyUnitEquipment = (): UnitEquipment => Object.fromEntries(allTroopOrder.map((id) => [id, emptyEquipment()])) as UnitEquipment;
const emptyHeroEquipment = (): HeroEquipment => Object.fromEntries(heroOrder.map((id) => [id, emptyEquipment()])) as HeroEquipment;
const normalizeUnitEquipment = (saved?: Partial<UnitEquipment> | LegacyUnitLevels): UnitEquipment => {
  const normalized = emptyUnitEquipment();
  for (const id of Object.keys(normalized) as UnitId[]) {
    const value = saved?.[id];
    if (typeof value === 'number') {
      const level = Math.max(0, Math.min(5, Math.floor(value)));
      normalized[id] = { weapon: level, armor: level, boots: 0 };
    } else if (value && typeof value === 'object') {
      normalized[id] = {
        weapon: Math.max(0, Math.min(5, Math.floor(Number(value.weapon) || 0))),
        armor: Math.max(0, Math.min(5, Math.floor(Number(value.armor) || 0))),
        boots: Math.max(0, Math.min(5, Math.floor(Number(value.boots) || 0))),
      };
    }
  }
  return normalized;
};
const normalizeHeroEquipment = (saved?: Partial<HeroEquipment> | LegacyHeroLevels): HeroEquipment => {
  const normalized = emptyHeroEquipment();
  for (const id of Object.keys(normalized) as HeroId[]) {
    const value = saved?.[id];
    if (typeof value === 'number') {
      const level = Math.max(0, Math.min(5, Math.floor(value)));
      normalized[id] = { weapon: level, armor: level, boots: 0 };
    } else if (value && typeof value === 'object') {
      normalized[id] = {
        weapon: Math.max(0, Math.min(5, Math.floor(Number(value.weapon) || 0))),
        armor: Math.max(0, Math.min(5, Math.floor(Number(value.armor) || 0))),
        boots: Math.max(0, Math.min(5, Math.floor(Number(value.boots) || 0))),
      };
    }
  }
  return normalized;
};
const emptyStats = (): PlayerStats => ({
  battles: 0, victories: 0, defeats: 0, kills: 0, unitDeaths: 0, heroDeaths: 0,
  summons: 0, heroSkillUses: 0, castleSkillUses: 0, bossWins: 0,
  currentWinStreak: 0, maxWinStreak: 0, codexEntries: 2,
});

const defaults = {
  gold: 100,
  gems: 0,
  lastDailyClaimDate: null as string | null,
  unlockedStage: 1,
  equipmentLevels: emptyUnitEquipment(),
  unlockedUnits: ['militia'] as UnitId[],
  equippedUnits: ['militia'] as UnitId[],
  clearedStages: [] as number[],
  clearedChallenges: [] as number[],
  unitMasteryXp: emptyUnitXp(),
  selectedHero: 'warden' as HeroId,
  unlockedHeroes: ['warden'] as HeroId[],
  heroEquipmentLevels: emptyHeroEquipment(),
  heroMasteryXp: emptyHeroXp(),
  fortressTier: 1 as FortressTier,
  castleTechLevels: emptyCastleTech(),
  stats: emptyStats(),
  unlockedAchievementIds: [] as string[],
  claimedAchievementIds: [] as string[],
  discoveredEnemies: [] as CodexEnemyId[],
  muted: false,
  battleSpeedUnlocked: false,
  battleSpeed: 1 as BattleSpeed,
};

type SavedGameProfile = Partial<GameProfile> & { upgrades?: LegacyUnitLevels; heroLevels?: LegacyHeroLevels };

export const SAVE_EXPORT_FORMAT = 'last-bastion-save';
export const SAVE_EXPORT_VERSION = SAVE_SCHEMA_VERSION;

function hydrateSavedProfile(saved: SavedGameProfile | undefined, current: GameProfile): GameProfile {
  const validUnit = (id: unknown): id is UnitId => typeof id === 'string' && allTroopOrder.includes(id as UnitId);
  const validHero = (id: unknown): id is HeroId => typeof id === 'string' && id in heroDefinitions;
  const nonNegative = (value: unknown, fallback: number) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;
  const savedUnlockedUnits = Array.isArray(saved?.unlockedUnits) ? saved.unlockedUnits.filter(validUnit) : undefined;
  const savedUnlockedHeroes = Array.isArray(saved?.unlockedHeroes) ? saved.unlockedHeroes.filter(validHero) : undefined;
  const unlockedStage = Math.max(1, Math.min(stages.length, nonNegative(saved?.unlockedStage, current.unlockedStage)));
  const inferredUnits: UnitId[] = savedUnlockedUnits ?? (saved ? [
    'militia', 'guardian',
    ...(unlockedStage >= 2 ? ['archer' as UnitId] : []),
    ...(unlockedStage >= 3 ? ['lancer' as UnitId] : []),
  ] : defaults.unlockedUnits);
  const inferredHeroes = savedUnlockedHeroes ?? defaults.unlockedHeroes;
  const discoveredEnemies = (Array.isArray(saved?.discoveredEnemies) ? saved.discoveredEnemies : []).filter((id): id is CodexEnemyId => id === 'boss' || validUnit(id));
  const equippedUnits = (Array.isArray(saved?.equippedUnits) ? saved.equippedUnits : inferredUnits).filter((id) => validUnit(id) && inferredUnits.includes(id)).slice(0, 4);
  const normalizeXp = <T extends string>(ids: readonly T[], values: unknown): Record<T, number> => Object.fromEntries(ids.map((id) => {
    const source = values && typeof values === 'object' ? (values as Record<string, unknown>)[id] : 0;
    return [id, nonNegative(source, 0)];
  })) as Record<T, number>;
  const savedStats = saved?.stats && typeof saved.stats === 'object' ? saved.stats : undefined;
  const stats = {
    ...Object.fromEntries(Object.keys(defaults.stats).map((key) => [key, nonNegative(savedStats?.[key as keyof PlayerStats], defaults.stats[key as keyof PlayerStats])])) as unknown as PlayerStats,
    codexEntries: codexEntryCount(inferredUnits, inferredHeroes, discoveredEnemies),
  };
  const castleSource: Record<string, unknown> = saved?.castleTechLevels && typeof saved.castleTechLevels === 'object'
    ? saved.castleTechLevels
    : {};
  const castleTechLevels = Object.fromEntries((Object.keys(defaults.castleTechLevels) as CastleTechId[]).map((id) => [
    id,
    Math.min(castleTechDefinitions[id].maxLevel, nonNegative(castleSource[id], 0)),
  ])) as Record<CastleTechId, number>;
  const fortressTier = Math.max(
    Math.max(1, Math.min(3, nonNegative(saved?.fortressTier, defaults.fortressTier))),
    minimumFortressTierForResearch(castleTechLevels),
  ) as FortressTier;
  const unlockedAchievementIds = Array.isArray(saved?.unlockedAchievementIds)
    ? saved.unlockedAchievementIds.filter((id): id is string => typeof id === 'string' && Boolean(achievementById[id]))
    : [];
  const claimedAchievementIds = Array.isArray(saved?.claimedAchievementIds)
    ? saved.claimedAchievementIds.filter((id): id is string => typeof id === 'string' && unlockedAchievementIds.includes(id))
    : [];
  const clearedStages = (Array.isArray(saved?.clearedStages) ? saved.clearedStages : []).filter((id): id is number => Number.isInteger(id) && id >= 1 && id <= stages.length);
  const clearedChallenges = (Array.isArray(saved?.clearedChallenges) ? saved.clearedChallenges : []).filter((id): id is number => Number.isInteger(id) && Boolean(getStage(id).challenge));
  return {
    ...current,
    gold: nonNegative(saved?.gold, current.gold),
    gems: nonNegative(saved?.gems, current.gems),
    lastDailyClaimDate: typeof saved?.lastDailyClaimDate === 'string' || saved?.lastDailyClaimDate === null ? saved.lastDailyClaimDate : current.lastDailyClaimDate,
    unlockedStage,
    equipmentLevels: normalizeUnitEquipment(saved?.equipmentLevels ?? saved?.upgrades),
    unlockedUnits: inferredUnits.length ? inferredUnits : ['militia'],
    equippedUnits: equippedUnits.length ? equippedUnits : ['militia'],
    clearedStages,
    clearedChallenges,
    unitMasteryXp: normalizeXp(allTroopOrder, saved?.unitMasteryXp),
    selectedHero: validHero(saved?.selectedHero) && inferredHeroes.includes(saved.selectedHero) ? saved.selectedHero : inferredHeroes[0] ?? 'warden',
    heroEquipmentLevels: normalizeHeroEquipment(saved?.heroEquipmentLevels ?? saved?.heroLevels),
    heroMasteryXp: normalizeXp(Object.keys(heroDefinitions) as HeroId[], saved?.heroMasteryXp),
    unlockedHeroes: inferredHeroes.length ? inferredHeroes : ['warden'],
    fortressTier,
    castleTechLevels,
    stats,
    unlockedAchievementIds: [...new Set([...unlockedAchievementIds, ...unlockedAchievements(stats)])],
    claimedAchievementIds,
    discoveredEnemies,
    muted: typeof saved?.muted === 'boolean' ? saved.muted : current.muted,
    battleSpeedUnlocked: saved?.battleSpeedUnlocked === true,
    battleSpeed: saved?.battleSpeedUnlocked === true && saved?.battleSpeed === 1.5 ? 1.5 : 1,
  };
}

function persistedProfile({
  gold, gems, lastDailyClaimDate, unlockedStage, equipmentLevels, unlockedUnits, equippedUnits, clearedStages, clearedChallenges, unitMasteryXp, selectedHero, unlockedHeroes,
  heroEquipmentLevels, heroMasteryXp, fortressTier, castleTechLevels, stats,
  unlockedAchievementIds, claimedAchievementIds, discoveredEnemies, muted, battleSpeedUnlocked, battleSpeed,
}: GameProfile) {
  return {
    gold, gems, lastDailyClaimDate, unlockedStage, equipmentLevels, unlockedUnits, equippedUnits, clearedStages, clearedChallenges, unitMasteryXp, selectedHero, unlockedHeroes,
    heroEquipmentLevels, heroMasteryXp, fortressTier, castleTechLevels, stats,
    unlockedAchievementIds, claimedAchievementIds, discoveredEnemies, muted, battleSpeedUnlocked, battleSpeed,
  };
}

export const useGameStore = create<GameProfile>()(
  persist(
    (set, get) => ({
      ...defaults,
      addReward: (amount, clearedStage) => {
        const state = get();
        const reward = scaledProgressionReward(amount, castleBattleStats(state.castleTechLevels).battleGoldMultiplier);
        set({
          gold: state.gold + reward,
          unlockedStage: Math.max(state.unlockedStage, Math.min(stages.length, clearedStage + 1)),
        });
        return reward;
      },
      completeStage: (stageId) => {
        const state = get();
        if (getStage(stageId).challenge) return undefined;
        if (state.clearedStages.includes(stageId)) return undefined;
        const reward = getStage(stageId).firstClearReward;
        const unlockedUnits = reward.unitId && !state.unlockedUnits.includes(reward.unitId)
          ? [...state.unlockedUnits, reward.unitId]
          : state.unlockedUnits;
        const unlockedHeroes = reward.heroId && !state.unlockedHeroes.includes(reward.heroId)
          ? [...state.unlockedHeroes, reward.heroId]
          : state.unlockedHeroes;
        const equippedUnits = reward.unitId && !state.equippedUnits.includes(reward.unitId) && state.equippedUnits.length < 4
          ? [...state.equippedUnits, reward.unitId]
          : state.equippedUnits;
        const nextStats = { ...state.stats, codexEntries: codexEntryCount(unlockedUnits, unlockedHeroes, state.discoveredEnemies) };
        const gold = reward.gold === undefined
          ? undefined
          : scaledProgressionReward(reward.gold, castleBattleStats(state.castleTechLevels).battleGoldMultiplier);
        set({
          gold: state.gold + (gold ?? 0),
          clearedStages: [...state.clearedStages, stageId],
          unlockedUnits,
          equippedUnits,
          unlockedHeroes,
          stats: nextStats,
        });
        return gold === undefined ? reward : { ...reward, gold };
      },
      completeChallenge: (stageId) => {
        const state = get();
        const stage = getStage(stageId);
        if (!stage.challenge || state.clearedChallenges.includes(stageId)) return undefined;
        if (stage.requiredCampaignStage && !state.clearedStages.includes(stage.requiredCampaignStage)) return undefined;
        const reward = stage.firstClearReward;
        const unlockedUnits = reward.unitId && !state.unlockedUnits.includes(reward.unitId)
          ? [...state.unlockedUnits, reward.unitId]
          : state.unlockedUnits;
        const equippedUnits = reward.unitId && !state.equippedUnits.includes(reward.unitId) && state.equippedUnits.length < 4
          ? [...state.equippedUnits, reward.unitId]
          : state.equippedUnits;
        const nextStats = { ...state.stats, codexEntries: codexEntryCount(unlockedUnits, state.unlockedHeroes, state.discoveredEnemies) };
        const gold = reward.gold === undefined
          ? undefined
          : scaledProgressionReward(reward.gold, castleBattleStats(state.castleTechLevels).battleGoldMultiplier);
        set({ gold: state.gold + (gold ?? 0), clearedChallenges: [...state.clearedChallenges, stageId], unlockedUnits, equippedUnits, stats: nextStats });
        return gold === undefined ? reward : { ...reward, gold };
      },
      recruitUnit: (id) => {
        const state = get();
        if (state.unlockedUnits.includes(id)) return true;
        const definition = troopDefinitions[id];
        if (definition.recruitSource === 'challenge') return false;
        if (definition.requiresEncounter !== false && !state.discoveredEnemies.includes(id)) return false;
        if (state.fortressTier < (definition.requiredFortressTier ?? 1)) return false;
        const cost = definition.recruitCost ?? 0;
        if (state.gold < cost) return false;
        const unlockedUnits = [...state.unlockedUnits, id];
        const equippedUnits = state.equippedUnits.length < 4 ? [...state.equippedUnits, id] : state.equippedUnits;
        const nextStats = { ...state.stats, codexEntries: codexEntryCount(unlockedUnits, state.unlockedHeroes, state.discoveredEnemies) };
        set({
          gold: state.gold - cost,
          unlockedUnits,
          equippedUnits,
          stats: nextStats,
          unlockedAchievementIds: [...new Set([...state.unlockedAchievementIds, ...unlockedAchievements(nextStats)])],
        });
        return true;
      },
      toggleEquippedUnit: (id) => {
        const state = get();
        if (!state.unlockedUnits.includes(id)) return false;
        if (state.equippedUnits.includes(id)) {
          if (state.equippedUnits.length <= 1) return false;
          set({ equippedUnits: state.equippedUnits.filter((unitId) => unitId !== id) });
          return true;
        }
        if (state.equippedUnits.length >= 4) return false;
        set({ equippedUnits: [...state.equippedUnits, id] });
        return true;
      },
      upgradeUnitEquipment: (id, slot) => {
        const state = get();
        if (!state.unlockedUnits.includes(id)) return false;
        const level = state.equipmentLevels[id][slot];
        if (level >= 5) return false;
        const cost = equipmentCost(troopDefinitions[id], level);
        if (state.gold < cost) return false;
        set({ gold: state.gold - cost, equipmentLevels: {
          ...state.equipmentLevels, [id]: { ...state.equipmentLevels[id], [slot]: level + 1 },
        } });
        return true;
      },
      unlockHero: (id, cost) => {
        const state = get();
        if (state.unlockedHeroes.includes(id)) return true;
        if (state.gold < cost) return false;
        const unlockedHeroes = [...state.unlockedHeroes, id];
        const nextStats = { ...state.stats, codexEntries: codexEntryCount(state.unlockedUnits, unlockedHeroes, state.discoveredEnemies) };
        set({
          gold: state.gold - cost,
          unlockedHeroes,
          stats: nextStats,
          unlockedAchievementIds: [...new Set([...state.unlockedAchievementIds, ...unlockedAchievements(nextStats)])],
        });
        return true;
      },
      selectHero: (id) => {
        if (get().unlockedHeroes.includes(id)) set({ selectedHero: id });
      },
      upgradeHeroEquipment: (id, slot) => {
        const state = get();
        if (!state.unlockedHeroes.includes(id)) return false;
        const level = state.heroEquipmentLevels[id][slot];
        if (level >= 5) return false;
        const cost = equipmentCost(heroDefinitions[id], level);
        if (state.gold < cost) return false;
        set({ gold: state.gold - cost, heroEquipmentLevels: {
          ...state.heroEquipmentLevels, [id]: { ...state.heroEquipmentLevels[id], [slot]: level + 1 },
        } });
        return true;
      },
      trainHeroMastery: (id, packageId) => {
        const state = get();
        const trainingPackage = heroTrainingPackageById[packageId];
        if (!trainingPackage || !isGameFeatureUnlocked('hero-training', state.clearedStages)) return false;
        if (!state.unlockedHeroes.includes(id) || state.gold < trainingPackage.goldCost) return false;
        if (heroMasteryLevelFromXp(state.heroMasteryXp[id]).level >= HERO_MASTERY_MAX_LEVEL) return false;
        const xpCap = totalMasteryXpForLevel(HERO_MASTERY_MAX_LEVEL);
        set({
          gold: state.gold - trainingPackage.goldCost,
          heroMasteryXp: {
            ...state.heroMasteryXp,
            [id]: Math.min(xpCap, state.heroMasteryXp[id] + trainingPackage.xp),
          },
        });
        return true;
      },
      promoteFortress: () => {
        const state = get();
        if (state.fortressTier >= 3) return false;
        const nextTier = (state.fortressTier + 1) as FortressTier;
        const promotion = fortressTierDefinitions[nextTier];
        if (totalCastleResearch(state.castleTechLevels) < promotion.requiredResearch || state.gold < promotion.promotionCost) return false;
        set({ fortressTier: nextTier, gold: state.gold - promotion.promotionCost });
        return true;
      },
      upgradeCastleTech: (id) => {
        const state = get();
        if (!canUpgradeCastleTech(id, state.castleTechLevels, state.fortressTier)) return false;
        const cost = castleTechCost(castleTechDefinitions[id], state.castleTechLevels[id]);
        if (state.gold < cost) return false;
        set({
          gold: state.gold - cost,
          castleTechLevels: { ...state.castleTechLevels, [id]: state.castleTechLevels[id] + 1 },
        });
        return true;
      },
      recordBattle: (result) => {
        const state = get();
        const discoveredEnemies = [...new Set([...state.discoveredEnemies, ...result.encounteredEnemies])];
        const currentWinStreak = result.victory ? state.stats.currentWinStreak + 1 : 0;
        const nextStats: PlayerStats = {
          battles: state.stats.battles + 1,
          victories: state.stats.victories + (result.victory ? 1 : 0),
          defeats: state.stats.defeats + (result.victory ? 0 : 1),
          kills: state.stats.kills + result.kills,
          unitDeaths: state.stats.unitDeaths + result.unitsLost,
          heroDeaths: state.stats.heroDeaths + result.heroDeaths,
          summons: state.stats.summons + Object.values(result.summons).reduce((sum, count) => sum + count, 0),
          heroSkillUses: state.stats.heroSkillUses + result.heroSkillUses,
          castleSkillUses: state.stats.castleSkillUses + result.castleSkillUses,
          bossWins: state.stats.bossWins + (result.victory && getStage(result.stageId).boss ? 1 : 0),
          currentWinStreak,
          maxWinStreak: Math.max(state.stats.maxWinStreak, currentWinStreak),
          codexEntries: codexEntryCount(state.unlockedUnits, state.unlockedHeroes, discoveredEnemies),
        };

        const gains: BattleRecord['gains'] = [];
        const masteryXpMultiplier = castleBattleStats(state.castleTechLevels).masteryXpMultiplier;
        const nextUnitXp = { ...state.unitMasteryXp };
        for (const [id, count] of Object.entries(result.summons) as Array<[UnitId, number]>) {
          if (count <= 0) continue;
          const amount = scaledProgressionReward(count * 8 + (result.victory ? 12 : 4), masteryXpMultiplier);
          nextUnitXp[id] = (nextUnitXp[id] ?? 0) + amount;
          gains.push({ id, amount, kind: 'unit' });
        }
        const heroXp = scaledProgressionReward(24 + result.heroSkillUses * 5 + (result.victory ? 18 : 6), masteryXpMultiplier);
        const nextHeroXp = { ...state.heroMasteryXp, [result.usedHeroId]: state.heroMasteryXp[result.usedHeroId] + heroXp };
        gains.push({ id: result.usedHeroId, amount: heroXp, kind: 'hero' });

        const allUnlocked = unlockedAchievements(nextStats);
        const newlyUnlocked = allUnlocked.filter((id) => !state.unlockedAchievementIds.includes(id));
        set({
          stats: nextStats,
          unitMasteryXp: nextUnitXp,
          heroMasteryXp: nextHeroXp,
          discoveredEnemies,
          unlockedAchievementIds: [...new Set([...state.unlockedAchievementIds, ...allUnlocked])],
        });
        return { unlocked: newlyUnlocked, gains };
      },
      claimAchievement: (id) => {
        const state = get();
        const achievement = achievementById[id];
        if (!achievement || !state.unlockedAchievementIds.includes(id) || state.claimedAchievementIds.includes(id)) return false;
        set({
          gold: state.gold + achievement.goldReward,
          gems: state.gems + achievement.gemReward,
          claimedAchievementIds: [...state.claimedAchievementIds, id],
        });
        return true;
      },
      claimDailyReward: () => {
        const state = get();
        const today = localDateKey();
        if (!canClaimDailyReward(state.lastDailyClaimDate, today)) return false;
        set({ gems: state.gems + DAILY_REWARD.gems, lastDailyClaimDate: today });
        return true;
      },
      purchaseBattleSpeed: () => {
        const state = get();
        if (state.battleSpeedUnlocked) return true;
        if (!state.clearedStages.includes(BATTLE_SPEED_LICENSE.unlockStage) || state.gems < BATTLE_SPEED_LICENSE.cost) return false;
        set({
          gems: state.gems - BATTLE_SPEED_LICENSE.cost,
          battleSpeedUnlocked: true,
          battleSpeed: BATTLE_SPEED_LICENSE.speed,
        });
        return true;
      },
      toggleBattleSpeed: () => {
        const state = get();
        if (!state.battleSpeedUnlocked) return false;
        set({ battleSpeed: state.battleSpeed === 1 ? BATTLE_SPEED_LICENSE.speed : 1 });
        return true;
      },
      toggleMuted: () => set((state) => ({ muted: !state.muted })),
      exportSave: () => JSON.stringify({
        format: SAVE_EXPORT_FORMAT,
        version: SAVE_EXPORT_VERSION,
        gameVersion: GAME_VERSION,
        saveSchemaVersion: SAVE_SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        state: persistedProfile(get()),
      }, null, 2),
      importSave: (serialized) => {
        try {
          const parsed = JSON.parse(serialized) as unknown;
          if (!parsed || typeof parsed !== 'object') return false;
          const wrapper = parsed as { state?: unknown };
          const source = wrapper.state && typeof wrapper.state === 'object' ? wrapper.state : parsed;
          const saved = source as SavedGameProfile;
          if (!('gold' in saved) && !('unlockedStage' in saved) && !('clearedStages' in saved)) return false;
          set(hydrateSavedProfile(saved, get()));
          return true;
        } catch {
          return false;
        }
      },
      resetProgress: () => set({
        ...defaults,
        equipmentLevels: emptyUnitEquipment(), unitMasteryXp: emptyUnitXp(),
        heroEquipmentLevels: emptyHeroEquipment(), heroMasteryXp: emptyHeroXp(),
        castleTechLevels: emptyCastleTech(), stats: emptyStats(),
        unlockedUnits: ['militia'], equippedUnits: ['militia'], clearedStages: [], clearedChallenges: [],
        unlockedHeroes: ['warden'], unlockedAchievementIds: [], claimedAchievementIds: [],
        discoveredEnemies: [],
      }),
    }),
    {
      name: 'last-bastion-profile-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: persistedProfile,
      merge: (persisted, current) => {
        return hydrateSavedProfile(persisted as SavedGameProfile | undefined, current as GameProfile);
      },
    },
  ),
);

useGameStore.subscribe((state) => writeActiveSaveSlot(state.exportSave()));
