import type { HeroId, UnitId } from '../types/game';
import { allTroopOrder, troopDefinitions } from './units';

export interface MasteryStatGrowth {
  hp: number;
  attack: number;
}

export const SOLDIER_MASTERY_MAX_LEVEL = 50;
export const HERO_MASTERY_MAX_LEVEL = 30;
export const HERO_AWAKENING_LEVELS = [10, 20, 30] as const;
export const HERO_AWAKENING_COOLDOWN_REDUCTION_MS = 1_500;

export interface HeroAwakeningAura {
  name: string;
  description: string;
  radius: number;
  attackBonusPerRank?: number;
  defenseBonusPerRank?: number;
  rangeBonusPerRank?: number;
  moveSpeedBonusPerRank?: number;
  healingPerSecondPerRank?: number;
}

export interface HeroAwakeningSelfBonus {
  name: string;
  description: string;
  hpPerRank: number;
  attackPerRank: number;
  defensePerRank?: number;
  rangePerRank?: number;
  moveSpeedPerRank?: number;
  healingPerRank?: number;
}

const soldierMasteryOverrides: Partial<Record<UnitId, MasteryStatGrowth>> = {
  militia: { hp: 5, attack: 1 },
  guardian: { hp: 12, attack: 1 },
  archer: { hp: 4, attack: 1 },
  lancer: { hp: 7, attack: 2 },
  raider: { hp: 4, attack: 1 },
  bulwark: { hp: 16, attack: 2 },
  cavalry: { hp: 10, attack: 2 },
  crossbow: { hp: 5, attack: 2 },
  brute: { hp: 35, attack: 4 },
  griffin: { hp: 110, attack: 6 },
  spirit: { hp: 24, attack: 3 },
  hellhound: { hp: 32, attack: 4 },
};

export const soldierMasteryGrowth = Object.fromEntries(allTroopOrder.map((id) => {
  const unit = troopDefinitions[id];
  return [id, soldierMasteryOverrides[id] ?? {
    hp: Math.max(4, Math.round(unit.maxHp * 0.035)),
    attack: Math.max(1, Math.round(unit.attackDamage * 0.05)),
  }];
})) as Record<UnitId, MasteryStatGrowth>;

export const heroMasteryGrowth: Record<HeroId, MasteryStatGrowth & {
  respawnReductionMs: number;
  maxRespawnReductionMs: number;
}> = {
  warden: { hp: 45, attack: 2, respawnReductionMs: 300, maxRespawnReductionMs: 7_000 },
  pyromancer: { hp: 35, attack: 4, respawnReductionMs: 250, maxRespawnReductionMs: 6_300 },
  huntress: { hp: 36, attack: 3, respawnReductionMs: 220, maxRespawnReductionMs: 5_600 },
  saint: { hp: 34, attack: 2, respawnReductionMs: 240, maxRespawnReductionMs: 6_000 },
  marshal: { hp: 42, attack: 3, respawnReductionMs: 280, maxRespawnReductionMs: 6_500 },
  orcChampion: { hp: 55, attack: 4, respawnReductionMs: 320, maxRespawnReductionMs: 7_500 },
  windSpirit: { hp: 38, attack: 4, respawnReductionMs: 240, maxRespawnReductionMs: 5_800 },
};

export const heroAwakeningAuras: Record<HeroId, HeroAwakeningAura> = {
  warden: { name: '불굴의 성벽', description: '주변 아군 방어 +2', radius: 170, defenseBonusPerRank: 2 },
  pyromancer: { name: '타오르는 혈기', description: '주변 아군 공격 +3', radius: 180, attackBonusPerRank: 3 },
  huntress: { name: '매의 시야', description: '주변 아군 사거리 +15', radius: 210, rangeBonusPerRank: 15 },
  saint: { name: '새벽의 숨결', description: '주변 아군 초당 체력 +4', radius: 195, healingPerSecondPerRank: 4 },
  marshal: { name: '진군의 깃발', description: '주변 아군 이동 속도 +4', radius: 185, moveSpeedBonusPerRank: 4 },
  orcChampion: { name: '부족의 맹세', description: '주변 아군 공격 +2 · 방어 +1', radius: 185, attackBonusPerRank: 2, defenseBonusPerRank: 1 },
  windSpirit: { name: '순풍의 길', description: '주변 아군 사거리 +12 · 이동 속도 +3', radius: 215, rangeBonusPerRank: 12, moveSpeedBonusPerRank: 3 },
};

export const heroAwakeningSelfBonuses: Record<HeroId, HeroAwakeningSelfBonus> = {
  warden: { name: '불굴의 육신', description: '자신의 생존력과 근접 전투력을 함께 강화합니다.', hpPerRank: 450, attackPerRank: 5, defensePerRank: 3 },
  pyromancer: { name: '내면의 화로', description: '자신의 화력과 생존력을 크게 강화합니다.', hpPerRank: 200, attackPerRank: 12 },
  huntress: { name: '포식자의 집중', description: '자신의 화력과 저격 사거리를 강화합니다.', hpPerRank: 200, attackPerRank: 12, rangePerRank: 8 },
  saint: { name: '성녀의 가호', description: '자신의 생존력과 치유 능력을 강화합니다.', hpPerRank: 200, attackPerRank: 0, defensePerRank: 2, healingPerRank: 12 },
  marshal: { name: '선봉장의 기백', description: '자신의 생존력과 전열 돌파력을 강화합니다.', hpPerRank: 250, attackPerRank: 8, defensePerRank: 2 },
  orcChampion: { name: '족장의 투지', description: '자신의 생존력과 근접 화력을 강화합니다.', hpPerRank: 300, attackPerRank: 8, defensePerRank: 2 },
  windSpirit: { name: '자유의 핵', description: '자신의 공중 전투력과 기동성을 강화합니다.', hpPerRank: 250, attackPerRank: 10, defensePerRank: 1, moveSpeedPerRank: 3 },
};

export const heroSkillPower = {
  warden: { shield: 100, shieldPerRank: 20, shieldPerAwakening: 150 },
  pyromancer: {
    unitDamage: 240, unitDamagePerRank: 40, unitDamagePerAwakening: 300,
    castleDamage: 160, castleDamagePerRank: 10, castleDamagePerAwakening: 60,
  },
  huntress: {
    unitDamage: 105, unitDamagePerRank: 18, unitDamagePerAwakening: 120,
    bossDamage: 155, bossDamagePerRank: 28, bossDamagePerAwakening: 180,
  },
  saint: {
    heal: 150, healPerRank: 10, healPerAwakening: 60,
    castleHeal: 100, castleHealPerRank: 6, castleHealPerAwakening: 40,
  },
  marshal: { shield: 85, shieldPerRank: 8, shieldPerAwakening: 40 },
  orcChampion: {
    damage: 180, damagePerRank: 12, damagePerAwakening: 70,
    shield: 80, shieldPerRank: 6, shieldPerAwakening: 30,
  },
  windSpirit: {
    unitDamage: 200, unitDamagePerRank: 14, unitDamagePerAwakening: 80,
    castleDamage: 130, castleDamagePerRank: 9, castleDamagePerAwakening: 50,
  },
} as const;
