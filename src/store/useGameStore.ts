import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { achievementById, unlockedAchievements } from '../data/achievements';
import { canUpgradeCastleTech, castleBattleStats, castleTechCost, castleTechDefinitions, emptyCastleTech, fortressTierDefinitions, minimumFortressTierForResearch, totalCastleResearch } from '../data/castle';
import { codexEntryCount } from '../data/codex';
import { battleFormationCapacity, BATTLE_SPEED_LICENSE, DAILY_REWARD, FORMATION_SLOT_LICENSES, MAX_FORMATION_SLOT_PURCHASES } from '../data/economy';
import { completedMonumentDeeds, monumentBuildings, monumentConstructionCost, normalizeBuiltMonuments, normalizeMonumentDeeds, TRIUMPH_MONUMENT, type MonumentBuildingId, type MonumentDeedId } from '../data/endgame';
import { heroTrainingPackageById, isGameFeatureUnlocked } from '../data/features';
import { HERO_MASTERY_MAX_LEVEL } from '../data/mastery';
import { canCraftItem, FORTRESS_ITEM_SLOT_COUNT, itemDefinitions, itemOrder, itemRecipes, MAX_ITEM_STACK, resolveBattleItemDrop } from '../data/items';
import { MAP_TREASURE_IDS, mapTreasureById } from '../data/mapTreasures';
import { getStage, stages } from '../data/stages';
import { canEnterChapterTwoStage, chapterTwoStages, isChapterTwoUnlocked, normalizeChapterTwoClears } from '../data/chapterTwo';
import { exclusiveEnemyIds } from '../data/enemies';
import { allTroopOrder, heroDefinitions, heroOrder, troopDefinitions } from '../data/units';
import { GAME_VERSION, SAVE_SCHEMA_VERSION } from '../data/version';
import { normalizeSeenTutorials, tutorialIds, type TutorialId } from '../data/tutorials';
import { emptyEquipment, emptyMasteryContribution, equipmentCost, heroBattleMasteryXp, heroMasteryLevelFromXp, scaledProgressionReward, totalMasteryXpForLevel, unitBattleMasteryXp } from '../game/rules';
import { canClaimDailyReward, localDateKey } from '../game/daily';
import { initializeSaveSlots, writeActiveSaveSlot } from '../game/saveSlots';
import type { BattleResult, BattleSpeed, CastleTechId, CodexEnemyId, EquipmentLevels, EquipmentSlot, FirstClearReward, FortressTier, HeroId, HeroTrainingPackageId, ItemId, MapTreasureId, PlayerStats, UnitId } from '../types/game';

initializeSaveSlots();

type UnitXp = Record<UnitId, number>;
type HeroXp = Record<HeroId, number>;
type UnitEquipment = Record<UnitId, EquipmentLevels>;
type HeroEquipment = Record<HeroId, EquipmentLevels>;
type FormationSlots = Array<UnitId | null>;
type ItemSlots = Array<ItemId | null>;
type LegacyUnitLevels = Record<UnitId, number>;
type LegacyHeroLevels = Record<HeroId, number>;

interface BattleRecord {
  monumentDeeds: MonumentDeedId[];
  unlocked: string[];
  gains: NonNullable<BattleResult['masteryGains']>;
  drops: NonNullable<BattleResult['itemDrops']>;
}

interface GameProfile {
  seenTutorialIds: TutorialId[];
  markTutorialsSeen: (ids: readonly TutorialId[]) => void;
  gold: number;
  gems: number;
  lastDailyClaimDate: string | null;
  unlockedStage: number;
  equipmentLevels: UnitEquipment;
  unlockedUnits: UnitId[];
  equippedUnits: UnitId[];
  formationSlots: FormationSlots;
  itemInventory: Partial<Record<ItemId, number>>;
  formationItemSlots: ItemSlots;
  fortressItemSlots: ItemSlots;
  clearedStages: number[];
  clearedChapterTwoStages: number[];
  clearedChallenges: number[];
  clearedMapTreasureGuardianIds: MapTreasureId[];
  claimedMapTreasureIds: MapTreasureId[];
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
  formationSlotPurchases: number;
  builtMonumentIds: MonumentBuildingId[];
  monumentDeedIds: MonumentDeedId[];
  addReward: (amount: number, clearedStage: number) => number;
  completeStage: (stageId: number) => FirstClearReward | undefined;
  completeChapterTwoStage: (stageId: number) => FirstClearReward | undefined;
  completeChallenge: (stageId: number) => FirstClearReward | undefined;
  recruitUnit: (id: UnitId) => boolean;
  toggleEquippedUnit: (id: UnitId) => boolean;
  assignEquippedUnit: (id: UnitId, slotIndex: number) => boolean;
  assignFormationItem: (id: ItemId, slotIndex: number) => boolean;
  assignFortressItem: (id: ItemId, slotIndex: number) => boolean;
  unequipFormationItem: (slotIndex: number) => void;
  unequipFortressItem: (slotIndex: number) => void;
  craftItem: (recipeId: string) => boolean;
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
  completeTreasureMission: (stageId: number) => FirstClearReward | undefined;
  claimMapTreasure: (id: MapTreasureId) => boolean;
  purchaseBattleSpeed: () => boolean;
  purchaseFormationSlot: () => boolean;
  constructMonument: (id: MonumentBuildingId) => boolean;
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
  seenTutorialIds: [] as TutorialId[],
  gold: 100,
  gems: 0,
  lastDailyClaimDate: null as string | null,
  unlockedStage: 1,
  equipmentLevels: emptyUnitEquipment(),
  unlockedUnits: ['militia'] as UnitId[],
  equippedUnits: ['militia'] as UnitId[],
  formationSlots: ['militia', null, null, null] as FormationSlots,
  itemInventory: {} as Partial<Record<ItemId, number>>,
  formationItemSlots: [null, null, null, null] as ItemSlots,
  fortressItemSlots: Array.from({ length: FORTRESS_ITEM_SLOT_COUNT }, () => null) as ItemSlots,
  clearedStages: [] as number[],
  clearedChapterTwoStages: [] as number[],
  clearedChallenges: [] as number[],
  clearedMapTreasureGuardianIds: [] as MapTreasureId[],
  claimedMapTreasureIds: [] as MapTreasureId[],
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
  formationSlotPurchases: 0,
  builtMonumentIds: [] as MonumentBuildingId[],
  monumentDeedIds: [] as MonumentDeedId[],
};

function resizeFormationSlots(slots: FormationSlots, capacity: number): FormationSlots {
  return Array.from({ length: capacity }, (_, index) => slots[index] ?? null);
}

function resizeItemSlots(slots: ItemSlots, capacity: number): ItemSlots {
  return Array.from({ length: capacity }, (_, index) => slots[index] ?? null);
}

function compactFormation(slots: FormationSlots): UnitId[] {
  return slots.filter((id): id is UnitId => id !== null);
}

function autoPlaceFormationUnit(slots: FormationSlots, id: UnitId, capacity: number): FormationSlots {
  const next = resizeFormationSlots(slots, capacity);
  if (next.includes(id)) return next;
  const emptyIndex = next.indexOf(null);
  if (emptyIndex >= 0) next[emptyIndex] = id;
  return next;
}

type SavedGameProfile = Partial<GameProfile> & {
  triumphMonumentLevel?: number;
  upgrades?: LegacyUnitLevels;
  heroLevels?: LegacyHeroLevels;
  /** Legacy v0.2.0 entitlement, migrated to one purchased slot. */
  formationSlotUnlocked?: boolean;
};

export const SAVE_EXPORT_FORMAT = 'last-bastion-save';
export const SAVE_EXPORT_VERSION = SAVE_SCHEMA_VERSION;

function hydrateSavedProfile(saved: SavedGameProfile | undefined, current: GameProfile): GameProfile {
  const validUnit = (id: unknown): id is UnitId => typeof id === 'string' && allTroopOrder.includes(id as UnitId);
  const validHero = (id: unknown): id is HeroId => typeof id === 'string' && id in heroDefinitions;
  const validItem = (id: unknown): id is ItemId => typeof id === 'string' && itemOrder.includes(id as ItemId);
  const nonNegative = (value: unknown, fallback: number) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;
  const savedUnlockedUnits = Array.isArray(saved?.unlockedUnits) ? saved.unlockedUnits.filter(validUnit) : undefined;
  const savedUnlockedHeroes = Array.isArray(saved?.unlockedHeroes) ? saved.unlockedHeroes.filter(validHero) : undefined;
  const unlockedStage = Math.max(1, Math.min(stages.length, nonNegative(saved?.unlockedStage, current.unlockedStage)));
  const clearedStages = (Array.isArray(saved?.clearedStages) ? saved.clearedStages : []).filter((id): id is number => Number.isInteger(id) && id >= 1 && id <= stages.length);
  const inferredUnits: UnitId[] = savedUnlockedUnits ?? (saved ? [
    'militia', 'guardian',
    ...(unlockedStage >= 2 ? ['archer' as UnitId] : []),
    ...(unlockedStage >= 3 ? ['lancer' as UnitId] : []),
  ] : defaults.unlockedUnits);
  const milestoneHeroes = stages
    .filter((stage) => (clearedStages.includes(stage.id) || unlockedStage > stage.id) && stage.firstClearReward.heroId)
    .map((stage) => stage.firstClearReward.heroId!);
  const inferredHeroes = [...new Set([...(savedUnlockedHeroes ?? defaults.unlockedHeroes), ...milestoneHeroes])];
  const savedItemInventory = saved?.itemInventory && typeof saved.itemInventory === 'object' ? saved.itemInventory as Record<string, unknown> : {};
  const itemInventory = Object.fromEntries(itemOrder.flatMap((id) => {
    const count = Math.min(MAX_ITEM_STACK, nonNegative(savedItemInventory[id], 0));
    return count > 0 ? [[id, count]] : [];
  })) as Partial<Record<ItemId, number>>;
  const builtMonumentIds = normalizeBuiltMonuments(saved?.builtMonumentIds, saved?.triumphMonumentLevel, clearedStages);
  const discoveredEnemies = (Array.isArray(saved?.discoveredEnemies) ? saved.discoveredEnemies : []).filter((id): id is CodexEnemyId => id === 'boss' || validUnit(id) || (isChapterTwoUnlocked(builtMonumentIds) && exclusiveEnemyIds.some((enemyId) => enemyId === id)));
  const formationSlotPurchases = Math.min(
    MAX_FORMATION_SLOT_PURCHASES,
    nonNegative(saved?.formationSlotPurchases, saved?.formationSlotUnlocked === true ? 1 : 0),
  );
  const formationCapacity = battleFormationCapacity(formationSlotPurchases);
  const formationSlots: FormationSlots = Array.from({ length: formationCapacity }, () => null);
  const savedFormationSlots = Array.isArray(saved?.formationSlots) ? saved.formationSlots : undefined;
  const seenFormationUnits = new Set<UnitId>();
  if (savedFormationSlots) {
    for (let index = 0; index < formationCapacity; index += 1) {
      const id = savedFormationSlots[index];
      if (!validUnit(id) || !inferredUnits.includes(id) || seenFormationUnits.has(id)) continue;
      formationSlots[index] = id;
      seenFormationUnits.add(id);
    }
  } else {
    const legacyEquippedUnits = (Array.isArray(saved?.equippedUnits) ? saved.equippedUnits : inferredUnits)
      .filter((id): id is UnitId => validUnit(id) && inferredUnits.includes(id));
    for (let index = 0; index < Math.min(formationCapacity, legacyEquippedUnits.length); index += 1) {
      if (seenFormationUnits.has(legacyEquippedUnits[index])) continue;
      formationSlots[index] = legacyEquippedUnits[index];
      seenFormationUnits.add(legacyEquippedUnits[index]);
    }
  }
  if (!formationSlots.some(Boolean)) formationSlots[0] = inferredUnits[0] ?? 'militia';
  const equippedUnits = formationSlots.filter((id): id is UnitId => id !== null);
  const normalizeItemSlots = (value: unknown, length: number, target: 'formation' | 'fortress'): ItemSlots => {
    const slots = Array.from({ length }, () => null) as ItemSlots;
    const used: Partial<Record<ItemId, number>> = {};
    if (!Array.isArray(value)) return slots;
    for (let index = 0; index < length; index += 1) {
      const id = value[index];
      if (!validItem(id) || itemDefinitions[id].target !== target || (used[id] ?? 0) >= (itemInventory[id] ?? 0)) continue;
      slots[index] = id;
      used[id] = (used[id] ?? 0) + 1;
    }
    return slots;
  };
  const formationItemSlots = normalizeItemSlots(saved?.formationItemSlots, formationCapacity, 'formation');
  const fortressItemSlots = normalizeItemSlots(saved?.fortressItemSlots, FORTRESS_ITEM_SLOT_COUNT, 'fortress');
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
  const clearedChallenges = (Array.isArray(saved?.clearedChallenges) ? saved.clearedChallenges : []).filter((id): id is number => Number.isInteger(id) && Boolean(getStage(id).challenge));
  const validTreasureIds = (value: unknown): MapTreasureId[] => (Array.isArray(value) ? value : [])
    .filter((id): id is MapTreasureId => typeof id === 'string' && MAP_TREASURE_IDS.includes(id as MapTreasureId));
  const savedClaimedMapTreasureIds = validTreasureIds(saved?.claimedMapTreasureIds);
  const clearedMapTreasureGuardianIds = [...new Set([
    ...validTreasureIds(saved?.clearedMapTreasureGuardianIds),
    ...savedClaimedMapTreasureIds,
  ])].filter((id) => clearedStages.includes(mapTreasureById[id].revealStage) || clearedStages.includes(mapTreasureById[id].regionBossStage));
  const claimedMapTreasureIds = savedClaimedMapTreasureIds.filter((id) => clearedMapTreasureGuardianIds.includes(id));
  return {
    ...current,
    gold: nonNegative(saved?.gold, current.gold),
    gems: nonNegative(saved?.gems, current.gems),
    lastDailyClaimDate: typeof saved?.lastDailyClaimDate === 'string' || saved?.lastDailyClaimDate === null ? saved.lastDailyClaimDate : current.lastDailyClaimDate,
    unlockedStage,
    equipmentLevels: normalizeUnitEquipment(saved?.equipmentLevels ?? saved?.upgrades),
    unlockedUnits: inferredUnits.length ? inferredUnits : ['militia'],
    equippedUnits,
    formationSlots,
    itemInventory,
    formationItemSlots,
    fortressItemSlots,
    clearedStages,
    clearedChapterTwoStages: normalizeChapterTwoClears(saved?.clearedChapterTwoStages, builtMonumentIds),
    clearedChallenges,
    clearedMapTreasureGuardianIds,
    claimedMapTreasureIds,
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
    formationSlotPurchases,
    builtMonumentIds,
    seenTutorialIds: normalizeSeenTutorials(saved?.seenTutorialIds, { clearedStages, clearedChapterTwoStages: normalizeChapterTwoClears(saved?.clearedChapterTwoStages, builtMonumentIds), unlockedStage, stats, formationSlotPurchases, itemInventory, castleTechLevels }, Boolean(saved)),
    monumentDeedIds: normalizeMonumentDeeds(saved?.monumentDeedIds, clearedStages, clearedChallenges),
  };
}

function persistedProfile({
  gold, gems, lastDailyClaimDate, unlockedStage, equipmentLevels, unlockedUnits, equippedUnits, formationSlots, itemInventory, formationItemSlots, fortressItemSlots, clearedStages, clearedChallenges, clearedMapTreasureGuardianIds, claimedMapTreasureIds, unitMasteryXp, selectedHero, unlockedHeroes,
  heroEquipmentLevels, heroMasteryXp, fortressTier, castleTechLevels, stats, clearedChapterTwoStages, seenTutorialIds,
  unlockedAchievementIds, claimedAchievementIds, discoveredEnemies, muted, battleSpeedUnlocked, battleSpeed, formationSlotPurchases, builtMonumentIds, monumentDeedIds,
}: GameProfile) {
  return {
    gold, gems, lastDailyClaimDate, unlockedStage, equipmentLevels, unlockedUnits, equippedUnits, formationSlots, itemInventory, formationItemSlots, fortressItemSlots, clearedStages, clearedChallenges, clearedMapTreasureGuardianIds, claimedMapTreasureIds, unitMasteryXp, selectedHero, unlockedHeroes,
    heroEquipmentLevels, heroMasteryXp, fortressTier, castleTechLevels, stats, clearedChapterTwoStages, seenTutorialIds,
    unlockedAchievementIds, claimedAchievementIds, discoveredEnemies, muted, battleSpeedUnlocked, battleSpeed, formationSlotPurchases, builtMonumentIds, monumentDeedIds,
  };
}

export const useGameStore = create<GameProfile>()(
  persist(
    (set, get) => ({
      ...defaults,
      markTutorialsSeen: (ids) => set((state) => ({ seenTutorialIds: tutorialIds.filter((id) => state.seenTutorialIds.includes(id) || ids.includes(id)) })),
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
        if (!stages.some((stage) => stage.id === stageId)) return undefined;
        if (getStage(stageId).challenge || getStage(stageId).sideMission) return undefined;
        if (state.clearedStages.includes(stageId)) return undefined;
        const reward = getStage(stageId).firstClearReward;
        const unlockedUnits = reward.unitId && !state.unlockedUnits.includes(reward.unitId)
          ? [...state.unlockedUnits, reward.unitId]
          : state.unlockedUnits;
        const unlockedHeroes = reward.heroId && !state.unlockedHeroes.includes(reward.heroId)
          ? [...state.unlockedHeroes, reward.heroId]
          : state.unlockedHeroes;
        const formationSlots = reward.unitId
          ? autoPlaceFormationUnit(state.formationSlots, reward.unitId, battleFormationCapacity(state.formationSlotPurchases))
          : state.formationSlots;
        const equippedUnits = compactFormation(formationSlots);
        const nextStats = { ...state.stats, codexEntries: codexEntryCount(unlockedUnits, unlockedHeroes, state.discoveredEnemies) };
        const gold = reward.gold === undefined
          ? undefined
          : scaledProgressionReward(reward.gold, castleBattleStats(state.castleTechLevels).battleGoldMultiplier);
        set({
          gold: state.gold + (gold ?? 0),
          clearedStages: [...state.clearedStages, stageId],
          unlockedUnits,
          equippedUnits,
          formationSlots,
          unlockedHeroes,
          stats: nextStats,
        });
        return gold === undefined ? reward : { ...reward, gold };
      },
      completeChapterTwoStage: (stageId) => {
        const state = get();
        const stage = chapterTwoStages.find((entry) => entry.id === stageId);
        if (!stage || !canEnterChapterTwoStage(stageId, state.builtMonumentIds, state.clearedChapterTwoStages) || state.clearedChapterTwoStages.includes(stageId)) return undefined;
        const gold = scaledProgressionReward(stage.firstClearReward.gold ?? 0, castleBattleStats(state.castleTechLevels).battleGoldMultiplier);
        set({ gold: state.gold + gold, clearedChapterTwoStages: [...state.clearedChapterTwoStages, stageId] });
        return { ...stage.firstClearReward, gold };
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
        const formationSlots = reward.unitId
          ? autoPlaceFormationUnit(state.formationSlots, reward.unitId, battleFormationCapacity(state.formationSlotPurchases))
          : state.formationSlots;
        const equippedUnits = compactFormation(formationSlots);
        const nextStats = { ...state.stats, codexEntries: codexEntryCount(unlockedUnits, state.unlockedHeroes, state.discoveredEnemies) };
        const gold = reward.gold === undefined
          ? undefined
          : scaledProgressionReward(reward.gold, castleBattleStats(state.castleTechLevels).battleGoldMultiplier);
        set({ gold: state.gold + (gold ?? 0), clearedChallenges: [...state.clearedChallenges, stageId], unlockedUnits, equippedUnits, formationSlots, stats: nextStats });
        return gold === undefined ? reward : { ...reward, gold };
      },
      recruitUnit: (id) => {
        const state = get();
        if (!allTroopOrder.includes(id)) return false;
        if (state.unlockedUnits.includes(id)) return true;
        const definition = troopDefinitions[id];
        if (definition.recruitSource === 'challenge') return false;
        if (definition.requiredClearedStage && !state.clearedStages.includes(definition.requiredClearedStage)) return false;
        if (definition.requiresEncounter !== false && !state.discoveredEnemies.includes(id)) return false;
        if (state.fortressTier < (definition.requiredFortressTier ?? 1)) return false;
        const cost = definition.recruitCost ?? 0;
        if (state.gold < cost) return false;
        const unlockedUnits = [...state.unlockedUnits, id];
        const formationSlots = autoPlaceFormationUnit(state.formationSlots, id, battleFormationCapacity(state.formationSlotPurchases));
        const equippedUnits = compactFormation(formationSlots);
        const nextStats = { ...state.stats, codexEntries: codexEntryCount(unlockedUnits, state.unlockedHeroes, state.discoveredEnemies) };
        set({
          gold: state.gold - cost,
          unlockedUnits,
          equippedUnits,
          formationSlots,
          stats: nextStats,
          unlockedAchievementIds: [...new Set([...state.unlockedAchievementIds, ...unlockedAchievements(nextStats)])],
        });
        return true;
      },
      toggleEquippedUnit: (id) => {
        const state = get();
        if (!state.unlockedUnits.includes(id)) return false;
        const capacity = battleFormationCapacity(state.formationSlotPurchases);
        const formationSlots = resizeFormationSlots(state.formationSlots, capacity);
        const currentIndex = formationSlots.indexOf(id);
        if (currentIndex >= 0) {
          if (compactFormation(formationSlots).length <= 1) return false;
          formationSlots[currentIndex] = null;
          set({ formationSlots, equippedUnits: compactFormation(formationSlots) });
          return true;
        }
        const emptyIndex = formationSlots.indexOf(null);
        if (emptyIndex < 0) return false;
        formationSlots[emptyIndex] = id;
        set({ formationSlots, equippedUnits: compactFormation(formationSlots) });
        return true;
      },
      assignEquippedUnit: (id, slotIndex) => {
        const state = get();
        const capacity = battleFormationCapacity(state.formationSlotPurchases);
        if (!state.unlockedUnits.includes(id) || !Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= capacity) return false;
        const formationSlots = resizeFormationSlots(state.formationSlots, capacity);
        const currentIndex = formationSlots.indexOf(id);
        if (currentIndex === slotIndex) return true;
        if (currentIndex >= 0) {
          [formationSlots[currentIndex], formationSlots[slotIndex]] = [formationSlots[slotIndex], formationSlots[currentIndex]];
          set({ formationSlots, equippedUnits: compactFormation(formationSlots) });
          return true;
        }
        formationSlots[slotIndex] = id;
        set({ formationSlots, equippedUnits: compactFormation(formationSlots) });
        return true;
      },
      assignFormationItem: (id, slotIndex) => {
        const state = get();
        const capacity = battleFormationCapacity(state.formationSlotPurchases);
        if ((state.itemInventory[id] ?? 0) <= 0 || itemDefinitions[id].target !== 'formation' || !Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= capacity) return false;
        const formationItemSlots = resizeItemSlots(state.formationItemSlots, capacity);
        if (formationItemSlots[slotIndex] === id) return true;
        if (formationItemSlots.filter((current) => current === id).length >= (state.itemInventory[id] ?? 0)) return false;
        formationItemSlots[slotIndex] = id;
        set({ formationItemSlots });
        return true;
      },
      assignFortressItem: (id, slotIndex) => {
        const state = get();
        if ((state.itemInventory[id] ?? 0) <= 0 || itemDefinitions[id].target !== 'fortress' || !Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= FORTRESS_ITEM_SLOT_COUNT) return false;
        const fortressItemSlots = Array.from({ length: FORTRESS_ITEM_SLOT_COUNT }, (_, index) => state.fortressItemSlots[index] ?? null) as ItemSlots;
        if (fortressItemSlots[slotIndex] === id) return true;
        if (fortressItemSlots.filter((current) => current === id).length >= (state.itemInventory[id] ?? 0)) return false;
        fortressItemSlots[slotIndex] = id;
        set({ fortressItemSlots });
        return true;
      },
      unequipFormationItem: (slotIndex) => set((state) => ({ formationItemSlots: state.formationItemSlots.map((id, index) => index === slotIndex ? null : id) })),
      unequipFortressItem: (slotIndex) => set((state) => ({ fortressItemSlots: state.fortressItemSlots.map((id, index) => index === slotIndex ? null : id) })),
      craftItem: (recipeId) => {
        const state = get();
        const recipe = itemRecipes.find((entry) => entry.id === recipeId);
        if (!recipe || !canCraftItem(recipe, state)) return false;
        const itemInventory = { ...state.itemInventory };
        for (const ingredient of recipe.ingredients) itemInventory[ingredient.id] = Math.max(0, (itemInventory[ingredient.id] ?? 0) - ingredient.count);
        itemInventory[recipe.result] = Math.min(MAX_ITEM_STACK, (itemInventory[recipe.result] ?? 0) + 1);
        set({ itemInventory });
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
        if (getStage(result.stageId).chapter === 2 && !canEnterChapterTwoStage(result.stageId, state.builtMonumentIds, state.clearedChapterTwoStages)) return { unlocked: [], gains: [], drops: [], monumentDeeds: [] };
        const newMonumentDeeds = state.clearedStages.includes(TRIUMPH_MONUMENT.unlockStage)
          ? completedMonumentDeeds(result).filter((id) => !state.monumentDeedIds.includes(id)) : [];
        const progressionStats = castleBattleStats(state.castleTechLevels);
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
        const masteryXpMultiplier = progressionStats.masteryXpMultiplier
          * (getStage(result.stageId).masteryRewardMultiplier ?? 1);
        const nextUnitXp = { ...state.unitMasteryXp };
        for (const [id, count] of Object.entries(result.summons) as Array<[UnitId, number]>) {
          if (count <= 0) continue;
          const xp = unitBattleMasteryXp(count, result.victory, result.masteryContributions?.units[id] ?? emptyMasteryContribution());
          const amount = scaledProgressionReward(xp.total, masteryXpMultiplier);
          const participationAmount = scaledProgressionReward(xp.participation, masteryXpMultiplier);
          nextUnitXp[id] = (nextUnitXp[id] ?? 0) + amount;
          gains.push({ id, amount, kind: 'unit', participationAmount, contributionAmount: amount - participationAmount });
        }
        const heroXpBreakdown = heroBattleMasteryXp(result.heroSkillUses, result.victory, result.masteryContributions?.hero ?? emptyMasteryContribution());
        const heroXp = scaledProgressionReward(heroXpBreakdown.total, masteryXpMultiplier);
        const heroParticipationXp = scaledProgressionReward(heroXpBreakdown.participation, masteryXpMultiplier);
        const nextHeroXp = { ...state.heroMasteryXp, [result.usedHeroId]: state.heroMasteryXp[result.usedHeroId] + heroXp };
        gains.push({ id: result.usedHeroId, amount: heroXp, kind: 'hero', participationAmount: heroParticipationXp, contributionAmount: heroXp - heroParticipationXp });

        const allUnlocked = unlockedAchievements(nextStats);
        const newlyUnlocked = allUnlocked.filter((id) => !state.unlockedAchievementIds.includes(id));
        const rolledDropId = resolveBattleItemDrop(getStage(result.stageId), result.victory, result.lootRoll ?? 1, progressionStats.itemDropChanceBonus);
        const dropId = rolledDropId && (state.itemInventory[rolledDropId] ?? 0) < MAX_ITEM_STACK ? rolledDropId : undefined;
        const drops: BattleRecord['drops'] = dropId ? [{ id: dropId, count: 1 }] : [];
        const itemInventory = dropId
          ? { ...state.itemInventory, [dropId]: Math.min(MAX_ITEM_STACK, (state.itemInventory[dropId] ?? 0) + 1) }
          : state.itemInventory;
        set({
          stats: nextStats,
          monumentDeedIds: [...state.monumentDeedIds, ...newMonumentDeeds],
          unitMasteryXp: nextUnitXp,
          heroMasteryXp: nextHeroXp,
          discoveredEnemies,
          itemInventory,
          unlockedAchievementIds: [...new Set([...state.unlockedAchievementIds, ...allUnlocked])],
        });
        return { unlocked: newlyUnlocked, gains, drops, monumentDeeds: newMonumentDeeds };
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
      completeTreasureMission: (stageId) => {
        const state = get();
        const stage = getStage(stageId);
        const id = stage.sideMission ? stage.treasureId : undefined;
        const treasure = id ? mapTreasureById[id] : undefined;
        if (!id || !treasure || treasure.missionStageId !== stageId || !state.clearedStages.includes(treasure.revealStage) || state.clearedMapTreasureGuardianIds.includes(id)) return undefined;
        set({ clearedMapTreasureGuardianIds: [...state.clearedMapTreasureGuardianIds, id] });
        return stage.firstClearReward;
      },
      claimMapTreasure: (id) => {
        const state = get();
        const treasure = mapTreasureById[id];
        if (!treasure || !state.clearedMapTreasureGuardianIds.includes(id) || state.claimedMapTreasureIds.includes(id)) return false;
        set({ gold: state.gold + treasure.gold, claimedMapTreasureIds: [...state.claimedMapTreasureIds, id] });
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
      purchaseFormationSlot: () => {
        const state = get();
        const license = FORMATION_SLOT_LICENSES[state.formationSlotPurchases];
        if (!license) return true;
        if (!state.clearedStages.includes(license.unlockStage) || state.gems < license.cost) return false;
        set({
          gems: state.gems - license.cost,
          formationSlotPurchases: state.formationSlotPurchases + 1,
          formationSlots: resizeFormationSlots(state.formationSlots, battleFormationCapacity(state.formationSlotPurchases + 1)),
          formationItemSlots: resizeItemSlots(state.formationItemSlots, battleFormationCapacity(state.formationSlotPurchases + 1)),
        });
        return true;
      },
      constructMonument: (id) => {
        const state = get();
        if (!state.clearedStages.includes(TRIUMPH_MONUMENT.unlockStage)) return false;
        if (!monumentBuildings.some((building) => building.id === id) || state.builtMonumentIds.includes(id)) return false;
        if (state.builtMonumentIds.length >= TRIUMPH_MONUMENT.maxLevel) return false;
        const cost = monumentConstructionCost(id, state.monumentDeedIds.length);
        if (cost === null || state.gold < cost) return false;
        set({
          gold: state.gold - cost,
          builtMonumentIds: [...state.builtMonumentIds, id],
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
        unlockedUnits: ['militia'], equippedUnits: ['militia'], formationSlots: ['militia', null, null, null], itemInventory: {}, formationItemSlots: [null, null, null, null], fortressItemSlots: Array.from({ length: FORTRESS_ITEM_SLOT_COUNT }, () => null), clearedStages: [], clearedChallenges: [], clearedMapTreasureGuardianIds: [], claimedMapTreasureIds: [],
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
