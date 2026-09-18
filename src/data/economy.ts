export const DAILY_REWARD = {
  gems: 10,
  label: '일일 왕실 지원품',
  description: '현지 날짜 기준 하루에 한 번 왕실 보석 10개를 받습니다.',
} as const;

export const BATTLE_SPEED_LICENSE = {
  cost: 200,
  unlockStage: 6,
  speed: 1.5,
  label: '전투 가속 허가',
  description: '첫 마수 수비 성채를 함락한 뒤 수수께끼 상인에게 왕실 보석 200개를 지불해 1.5배속 전투를 영구 해금합니다.',
} as const;

export const BASE_FORMATION_CAPACITY = 4;
export const MAX_FORMATION_SLOT_PURCHASES = 3;

export const FORMATION_SLOT_LICENSES = [
  { purchase: 1, capacity: 5, cost: 150, unlockStage: 12, label: '편성 확장 허가 I' },
  { purchase: 2, capacity: 6, cost: 250, unlockStage: 18, label: '편성 확장 허가 II' },
  { purchase: 3, capacity: 7, cost: 350, unlockStage: 24, label: '편성 확장 허가 III' },
] as const;

export function battleFormationCapacity(purchases: number): number {
  return BASE_FORMATION_CAPACITY + Math.max(0, Math.min(MAX_FORMATION_SLOT_PURCHASES, Math.floor(purchases)));
}
