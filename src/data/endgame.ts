import type { BattleResult } from '../types/game';

export const monumentDeeds = [
  { id: 'small-company', name: '정예 원정의 인장', description: '황금 수송로 탈환전에서 병종을 1~3종만 소환하고 승리하세요.', stageId: 301, rule: 'small-company', icon: '⚑' },
  { id: 'steadfast-hero', name: '불굴의 영웅상', description: '왕립 대훈련장에서 영웅이 한 번도 쓰러지지 않고 승리하세요.', stageId: 302, rule: 'hero-survives', icon: '♛' },
  { id: 'sun-seal', name: '태양의 봉인석', description: '태양 감옥의 이프리트를 격파하세요.', stageId: 104, rule: 'victory', icon: '☀' },
  { id: 'sky-crown', name: '창공의 왕관', description: '창공의 고룡을 격파하세요.', stageId: 105, rule: 'victory', icon: '♜' },
] as const;
export type MonumentDeedId = typeof monumentDeeds[number]['id'];
export const monumentTitles = ['왕국의 초석', '원정의 증표', '승전의 기둥', '영웅의 유산', '대륙의 전설'] as const;

export const monumentBuildings = [
  { id: 'liberation-beacon', name: '해방의 봉화탑', region: '서부 변경', icon: '⚑', x: 1070, y: 1900, cost: 3000, hpPercent: 6, powerPercent: 4, fortressHp: 600 },
  { id: 'heroes-statue', name: '왕국 영웅상', region: '점령 왕도', icon: '♛', x: 890, y: 760, cost: 5000, hpPercent: 4, powerPercent: 7, fortressHp: 600 },
  { id: 'alliance-pillar', name: '동맹의 맹약비', region: '오크 고원', icon: '◇', x: 1660, y: 1720, cost: 8000, hpPercent: 5, powerPercent: 4, fortressHp: 1200 },
  { id: 'spirit-sanctuary', name: '정령의 안식탑', region: '정령 설원', icon: '✦', x: 2250, y: 510, cost: 12000, hpPercent: 8, powerPercent: 4, fortressHp: 700 },
  { id: 'victory-crown', name: '대륙 승전문', region: '마왕성 균열', icon: '♜', x: 1030, y: 740, cost: 18000, hpPercent: 4, powerPercent: 8, fortressHp: 900 },
] as const;
export type MonumentBuildingId = typeof monumentBuildings[number]['id'];

export function normalizeBuiltMonuments(value: unknown, legacyLevel: unknown, clearedStages: number[]): MonumentBuildingId[] {
  if (!clearedStages.includes(TRIUMPH_MONUMENT.unlockStage)) return [];
  if (value !== undefined) return monumentBuildings.filter((entry) => Array.isArray(value) && value.includes(entry.id)).map((entry) => entry.id);
  const oldLevel = typeof legacyLevel === 'number' && Number.isFinite(legacyLevel) ? Math.max(0, Math.min(20, Math.floor(legacyLevel))) : 0;
  return monumentBuildings.slice(0, Math.ceil(oldLevel / 4)).map((entry) => entry.id);
}

export function completedMonumentDeeds(result: BattleResult): MonumentDeedId[] {
  if (!result.victory) return [];
  return monumentDeeds.filter((deed) => {
    if (result.stageId !== deed.stageId) return false;
    if (deed.rule === 'hero-survives') return result.heroDeaths === 0;
    if (deed.rule === 'small-company') {
      const types = Object.values(result.summons).filter((count) => count > 0).length;
      return types >= 1 && types <= 3;
    }
    return true;
  }).map((deed) => deed.id);
}

export function normalizeMonumentDeeds(value: unknown, clearedStages: number[], clearedChallenges: number[]): MonumentDeedId[] {
  if (!clearedStages.includes(TRIUMPH_MONUMENT.unlockStage)) return [];
  return monumentDeeds.filter((deed) => (Array.isArray(value) && value.includes(deed.id))
    || (deed.rule === 'victory' && clearedChallenges.includes(deed.stageId))).map((deed) => deed.id);
}

export const TRIUMPH_MONUMENT = {
  name: '승전 기념비',
  unlockStage: 30,
  maxLevel: monumentBuildings.length,
  discountPerDeed: 0.05,
} as const;

export function monumentConstructionCost(id: string, deedCount = 0): number | null {
  const building = monumentBuildings.find((entry) => entry.id === id);
  if (!building) return null;
  const count = Number.isFinite(deedCount) ? Math.max(0, Math.min(monumentDeeds.length, Math.floor(deedCount))) : 0;
  return Math.round(building.cost * (1 - count * TRIUMPH_MONUMENT.discountPerDeed));
}

export function triumphMonumentBonuses(builtIds: readonly MonumentBuildingId[]) {
  let count = 0;
  let hpPercent = 0;
  let powerPercent = 0;
  let fortressHpBonus = 0;
  for (const building of monumentBuildings) {
    if (!builtIds.includes(building.id)) continue;
    count += 1;
    hpPercent += building.hpPercent;
    powerPercent += building.powerPercent;
    fortressHpBonus += building.fortressHp;
  }
  return {
    count,
    combatantHpMultiplier: 1 + hpPercent / 100,
    combatantAttackMultiplier: 1 + powerPercent / 100,
    fortressHpBonus,
  };
}
