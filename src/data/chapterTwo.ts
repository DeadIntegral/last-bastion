import type { EnemyId, StageDefinition } from '../types/game';
import { monumentBuildings } from './endgame';

export function isChapterTwoUnlocked(builtIds: readonly string[]): boolean {
  return monumentBuildings.every((building) => builtIds.includes(building.id));
}

const mission = (id: number, name: string, subtitle: string, hp: number, roster: EnemyId[], interval: number, cap: number): StageDefinition => ({
  id, chapter: 2, name, subtitle, reward: 3500 + (id - 401) * 500, requiredCampaignStage: 30,
  enemyCastleHp: hp, fortressDistance: 1390, enemyFaction: 'mixed',
  enemyUpgrades: { equipment: { weapon: 5, armor: 5, boots: 5 } },
  enemyFortressAttack: { damage: 155 + (id - 401) * 10, range: 340, intervalMs: 2500 },
  terrain: { id: 'veil-frontier', name: '장막 너머의 전선', description: '빛조차 가라앉는 회색 장막 너머에서 낯선 군세가 움직입니다.', enemyHpMultiplier: 1, enemyAttackMultiplier: 1, enemyMoveSpeedMultiplier: 1 },
  waves: roster.map((unitId, index) => ({ timeMs: 1000 + index * 6500, unitId, count: 2, intervalMs: 4200 })),
  reinforcement: { startMs: 36000, intervalMs: interval, unitIds: roster, maxAlive: cap },
  firstClearReward: { label: '장막 원정 보급금', description: '장막 너머로 보급대가 도착했습니다.', icon: '⚑', gold: 6000 + (id - 401) * 1000 },
});

export const chapterTwoStages: StageDefinition[] = [
  mission(401, '장막의 문턱', '안개를 가르는 빛 끝에, 오래 닫혀 있던 성문이 모습을 드러냅니다.', 150000, ['voidSentinel', 'archer', 'mage'], 5200, 8),
  mission(402, '침묵하는 포대', '아무 소리도 들리지 않습니다. 절벽 사이로 창백한 섬광만이 지나갑니다.', 165000, ['voidSentinel', 'riftArbalest', 'archer'], 5300, 9),
  mission(403, '이름 없는 성가', '어디선가 노랫소리가 들립니다. 부르는 이의 모습은 안개에 가려져 있습니다.', 185000, ['voidSentinel', 'riftArbalest', 'nullCantor'], 5600, 9),
  mission(404, '집행의 회랑', '깨진 돌바닥 위로 무거운 발소리가 다가옵니다.', 205000, ['voidSentinel', 'duskExecutioner', 'riftArbalest'], 5800, 10),
  mission(405, '장막의 심장부', '차가운 맥동이 울립니다. 이 땅의 모든 길이 한곳을 향하고 있습니다.', 225000, ['voidSentinel', 'riftArbalest', 'nullCantor', 'duskExecutioner'], 6000, 11),
  { ...mission(406, '섭정의 검은 왕좌', '비어 있는 줄 알았던 왕좌에서, 누군가 눈을 뜹니다.', 230000, ['voidSentinel', 'riftArbalest'], 7500, 5),
    boss: true, bossName: '장막의 섭정', bossUnitId: 'veilRegent', waves: [],
    reinforcement: { startMs: 8000, intervalMs: 7500, unitIds: ['voidSentinel', 'riftArbalest'], maxAlive: 5 },
    bossModifiers: { hpMultiplier: 1, attackMultiplier: 1, stompCadenceMultiplier: 1 },
  },
];

export function canEnterChapterTwoStage(id: number, builtIds: readonly string[], cleared: readonly number[]): boolean {
  const index = chapterTwoStages.findIndex((stage) => stage.id === id);
  return index >= 0 && isChapterTwoUnlocked(builtIds) && (index === 0 || cleared.includes(chapterTwoStages[index - 1].id));
}

export function normalizeChapterTwoClears(value: unknown, builtIds: readonly string[]): number[] {
  if (!isChapterTwoUnlocked(builtIds) || !Array.isArray(value)) return [];
  const cleared: number[] = [];
  for (const stage of chapterTwoStages) {
    if (!value.includes(stage.id)) break;
    cleared.push(stage.id);
  }
  return cleared;
}
