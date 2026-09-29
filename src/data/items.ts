import type { ItemId, ItemTarget } from '../types/game';

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
  sourceStage: 4 | 8 | 12 | 18 | 24 | 30;
  effects: ItemEffects;
}

export const itemDefinitions: Record<ItemId, ItemDefinition> = {
  'veteran-standard': {
    id: 'veteran-standard', name: '고참병의 군기', description: '장착 편성 슬롯 병종의 최대 체력 +12%', target: 'formation', rarity: 2, icon: '⚑', sourceStage: 4,
    effects: { troopHpMultiplier: 1.12 },
  },
  'runed-whetstone': {
    id: 'runed-whetstone', name: '각인 숫돌', description: '장착 편성 슬롯 병종의 공격력과 치유량 +10%', target: 'formation', rarity: 3, icon: '◇', sourceStage: 8,
    effects: { troopAttackMultiplier: 1.1 },
  },
  'clockwork-horn': {
    id: 'clockwork-horn', name: '태엽 출전 나팔', description: '장착 편성 슬롯 병종의 소환 대기시간 -12%', target: 'formation', rarity: 3, icon: '♬', sourceStage: 12,
    effects: { summonCooldownMultiplier: 0.88 },
  },
  'guardian-keystone': {
    id: 'guardian-keystone', name: '수호자의 주춧돌', description: '아군 성채 최대 체력 +20%', target: 'fortress', rarity: 4, icon: '⬢', sourceStage: 18,
    effects: { fortressHpMultiplier: 1.2 },
  },
  'quartermaster-seal': {
    id: 'quartermaster-seal', name: '총병참관의 인장', description: '전투 시작 지휘력 +50 · 최대 지휘력 +100', target: 'fortress', rarity: 4, icon: '✦', sourceStage: 24,
    effects: { startingCommandBonus: 50, maxCommandBonus: 100 },
  },
  'starfire-lens': {
    id: 'starfire-lens', name: '성화 조준 렌즈', description: '성채 포격 피해 +25% · 포격 사거리 +150', target: 'fortress', rarity: 5, icon: '◎', sourceStage: 30,
    effects: { bombardDamageMultiplier: 1.25, bombardRangeBonus: 150 },
  },
};

export const itemOrder = Object.keys(itemDefinitions) as ItemId[];
export const formationItemOrder = itemOrder.filter((id) => itemDefinitions[id].target === 'formation');
export const fortressItemOrder = itemOrder.filter((id) => itemDefinitions[id].target === 'fortress');
export const FORTRESS_ITEM_SLOT_COUNT = 2;

export const itemRewardForStage = (stageId: number): ItemId | undefined => itemOrder.find((id) => itemDefinitions[id].sourceStage === stageId);
