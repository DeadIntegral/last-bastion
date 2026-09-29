import type { ItemId, ItemTarget, StageDefinition } from '../types/game';

export interface ItemEffects {
  troopHpMultiplier?: number;
  troopAttackMultiplier?: number;
  summonCooldownMultiplier?: number;
  fortressHpMultiplier?: number;
  startingCommandBonus?: number;
  maxCommandBonus?: number;
  bombardDamageMultiplier?: number;
  bombardRangeBonus?: number;
}

export interface ItemDefinition {
  id: ItemId;
  name: string;
  description: string;
  target: ItemTarget;
  rarity: 2 | 3 | 4 | 5;
  icon: string;
  dropRegion?: 1 | 2 | 3;
  effects: ItemEffects;
}

export interface ItemRecipe {
  id: string;
  result: ItemId;
  requiredStage: 12 | 18 | 30;
  ingredients: Array<{ id: ItemId; count: number }>;
}

export const itemDefinitions: Record<ItemId, ItemDefinition> = {
  'veteran-standard': { id: 'veteran-standard', name: '고참병의 군기', description: '장착 편성 슬롯 병종의 최대 체력 +12%', target: 'formation', rarity: 2, icon: '⚑', dropRegion: 1, effects: { troopHpMultiplier: 1.12 } },
  'runed-whetstone': { id: 'runed-whetstone', name: '각인 숫돌', description: '장착 편성 슬롯 병종의 공격력과 치유량 +10%', target: 'formation', rarity: 3, icon: '◇', dropRegion: 1, effects: { troopAttackMultiplier: 1.1 } },
  'clockwork-horn': { id: 'clockwork-horn', name: '태엽 출전 나팔', description: '장착 편성 슬롯 병종의 소환 대기시간 -12%', target: 'formation', rarity: 3, icon: '♬', dropRegion: 1, effects: { summonCooldownMultiplier: 0.88 } },
  'guardian-keystone': { id: 'guardian-keystone', name: '수호자의 주춧돌', description: '아군 성채 최대 체력 +20%', target: 'fortress', rarity: 4, icon: '⬢', dropRegion: 2, effects: { fortressHpMultiplier: 1.2 } },
  'quartermaster-seal': { id: 'quartermaster-seal', name: '총병참관의 인장', description: '전투 시작 지휘력 +50 · 최대 지휘력 +100', target: 'fortress', rarity: 4, icon: '✦', dropRegion: 2, effects: { startingCommandBonus: 50, maxCommandBonus: 100 } },
  'starfire-lens': { id: 'starfire-lens', name: '성화 조준 렌즈', description: '성채 포격 피해 +25% · 포격 사거리 +150', target: 'fortress', rarity: 5, icon: '◎', dropRegion: 3, effects: { bombardDamageMultiplier: 1.25, bombardRangeBonus: 150 } },
  'war-standard': { id: 'war-standard', name: '전쟁 영웅의 군기', description: '장착 편성 슬롯 병종의 최대 체력 +18% · 공격력과 치유량 +14%', target: 'formation', rarity: 4, icon: '⚜', effects: { troopHpMultiplier: 1.18, troopAttackMultiplier: 1.14 } },
  'rapid-assault-kit': { id: 'rapid-assault-kit', name: '신속 강습 장비', description: '장착 편성 슬롯 병종의 공격력과 치유량 +12% · 소환 대기시간 -18%', target: 'formation', rarity: 4, icon: 'ϟ', effects: { troopAttackMultiplier: 1.12, summonCooldownMultiplier: 0.82 } },
  'bastion-heart': { id: 'bastion-heart', name: '왕국 보루의 심장', description: '아군 성채 최대 체력 +30% · 시작 지휘력 +70 · 최대 지휘력 +150', target: 'fortress', rarity: 5, icon: '◆', effects: { fortressHpMultiplier: 1.3, startingCommandBonus: 70, maxCommandBonus: 150 } },
  'royal-siege-core': { id: 'royal-siege-core', name: '왕립 공성 핵', description: '전투 시작 지휘력 +70 · 최대 지휘력 +150 · 성채 포격 피해 +35% · 포격 사거리 +220', target: 'fortress', rarity: 5, icon: '✺', effects: { startingCommandBonus: 70, maxCommandBonus: 150, bombardDamageMultiplier: 1.35, bombardRangeBonus: 220 } },
};

export const itemOrder = Object.keys(itemDefinitions) as ItemId[];
export const droppedItemOrder = itemOrder.filter((id) => itemDefinitions[id].dropRegion !== undefined);
export const FORTRESS_ITEM_SLOT_COUNT = 2;
export const MAX_ITEM_STACK = 99;

export const itemRecipes: readonly ItemRecipe[] = [
  { id: 'craft-war-standard', result: 'war-standard', requiredStage: 12, ingredients: [{ id: 'veteran-standard', count: 1 }, { id: 'runed-whetstone', count: 1 }] },
  { id: 'craft-rapid-assault-kit', result: 'rapid-assault-kit', requiredStage: 18, ingredients: [{ id: 'runed-whetstone', count: 1 }, { id: 'clockwork-horn', count: 1 }] },
  { id: 'craft-bastion-heart', result: 'bastion-heart', requiredStage: 30, ingredients: [{ id: 'guardian-keystone', count: 1 }, { id: 'quartermaster-seal', count: 1 }] },
  { id: 'craft-royal-siege-core', result: 'royal-siege-core', requiredStage: 30, ingredients: [{ id: 'quartermaster-seal', count: 1 }, { id: 'starfire-lens', count: 1 }] },
];

export interface ItemDropRule {
  chance: number;
  pool: ItemId[];
}

export function itemDropRuleForStage(stage: StageDefinition): ItemDropRule {
  const progressStage = stage.requiredCampaignStage ?? Math.min(30, stage.id);
  const unlockedRegion = progressStage >= 25 ? 3 : progressStage >= 13 ? 2 : 1;
  const pool = droppedItemOrder.filter((id) => (itemDefinitions[id].dropRegion ?? 99) <= unlockedRegion);
  const chance = stage.id === 303 ? 0.8 : stage.challenge ? 0.65 : stage.boss ? 0.6 : stage.farmingKind ? 0.5 : stage.sideMission ? 0.45 : 0.3;
  return { chance, pool };
}

export function resolveBattleItemDrop(stage: StageDefinition, victory: boolean, roll: number, chanceBonus = 0): ItemId | undefined {
  if (!victory) return undefined;
  const { chance, pool } = itemDropRuleForStage(stage);
  const resolvedChance = Math.min(1, chance + Math.max(0, chanceBonus));
  const safeRoll = Math.max(0, Math.min(0.999999, roll));
  if (safeRoll >= resolvedChance || pool.length === 0) return undefined;
  return pool[Math.min(pool.length - 1, Math.floor(safeRoll / resolvedChance * pool.length))];
}
