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

export const FORMATION_SLOT_LICENSE = {
  cost: 150,
  unlockStage: 12,
  extraSlots: 1,
  label: '편성 확장 허가',
  description: '두 번째 마수 수비 성채를 함락한 뒤 수수께끼 상인에게 왕실 보석 150개를 지불해 전투 편성을 4종에서 5종으로 영구 확장합니다.',
} as const;

export const BASE_FORMATION_CAPACITY = 4;

export function battleFormationCapacity(expansionUnlocked: boolean): number {
  return BASE_FORMATION_CAPACITY + (expansionUnlocked ? FORMATION_SLOT_LICENSE.extraSlots : 0);
}
