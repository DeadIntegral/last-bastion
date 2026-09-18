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
  griffin: { hp: 55, attack: 6 },
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
  warden: { hp: 24, attack: 2, respawnReductionMs: 300, maxRespawnReductionMs: 7_000 },
  pyromancer: { hp: 14, attack: 3, respawnReductionMs: 250, maxRespawnReductionMs: 6_300 },
  huntress: { hp: 17, attack: 3, respawnReductionMs: 220, maxRespawnReductionMs: 5_600 },
  saint: { hp: 16, attack: 2, respawnReductionMs: 240, maxRespawnReductionMs: 6_000 },
  marshal: { hp: 21, attack: 3, respawnReductionMs: 280, maxRespawnReductionMs: 6_500 },
};

export const heroAwakeningAuras: Record<HeroId, HeroAwakeningAura> = {
  warden: { name: '불굴의 성벽', description: '주변 아군 방어 +2', radius: 170, defenseBonusPerRank: 2 },
  pyromancer: { name: '타오르는 혈기', description: '주변 아군 공격 +3', radius: 180, attackBonusPerRank: 3 },
  huntress: { name: '매의 시야', description: '주변 아군 사거리 +15', radius: 210, rangeBonusPerRank: 15 },
  saint: { name: '새벽의 숨결', description: '주변 아군 초당 체력 +4', radius: 195, healingPerSecondPerRank: 4 },
  marshal: { name: '진군의 깃발', description: '주변 아군 이동 속도 +4', radius: 185, moveSpeedBonusPerRank: 4 },
};

export const heroSkillPower = {
  warden: { shield: 100, shieldPerRank: 10, shieldPerAwakening: 50 },
  pyromancer: {
    unitDamage: 240, unitDamagePerRank: 16, unitDamagePerAwakening: 100,
    castleDamage: 160, castleDamagePerRank: 10, castleDamagePerAwakening: 60,
  },
  huntress: {
    unitDamage: 105, unitDamagePerRank: 8, unitDamagePerAwakening: 45,
    bossDamage: 155, bossDamagePerRank: 12, bossDamagePerAwakening: 65,
  },
  saint: {
    heal: 150, healPerRank: 10, healPerAwakening: 60,
    castleHeal: 100, castleHealPerRank: 6, castleHealPerAwakening: 40,
  },
  marshal: { shield: 85, shieldPerRank: 8, shieldPerAwakening: 40 },
} as const;
