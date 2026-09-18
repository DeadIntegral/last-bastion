import type { CastleBattleStats, CastleTechDefinition, CastleTechId, FortressTier, FortressTierDefinition } from '../types/game';

export const battleMobilizationTuning = {
  name: '전시 동원령',
  maxUses: 3,
  maxCommandBonus: 25,
  commandRegenBonus: 1.5,
} as const;

export const rallyCommandTuning = {
  name: '원정 집결령',
  hotkey: 'R',
  baseCooldownMs: 20_000,
  cooldownReductionPerRankMs: 2_000,
  minimumCooldownMs: 10_000,
  moveSpeedBonusPerTranscendentRank: 0.05,
  arrivalRadius: 18,
  formationSpacing: 9,
} as const;

export const fortressDeploymentTuning = {
  rearOffset: 50,
  squadSpacing: 16,
} as const;

export const fortressArtilleryTuning = {
  baseRange: 1000,
  siegeRangePerRank: 80,
} as const;

export const fortressResearchTuning = {
  baseCommandPerKill: 6,
  warTitheCommandPerRank: 1,
  mendingStoneRegenPerRank: 4,
} as const;

export const castleTechOrder: CastleTechId[] = [
  'war_coffers', 'logistics', 'command_vault', 'drill_yard', 'supply_standardization', 'spoils_accounting', 'field_manuals', 'war_tithe',
  'fortified_walls', 'stone_plating', 'watchtower', 'battlements', 'mending_stone',
  'black_powder', 'rapid_reload', 'wide_blast', 'giantbreaker_shells', 'siege_calculus',
  'rally_orders', 'heroic_orders', 'mobilization_drill', 'field_recovery', 'transcendent_orders',
];

export const castleTechDefinitions: Record<CastleTechId, CastleTechDefinition> = {
  war_coffers: { id: 'war_coffers', branch: 'command', name: '전쟁 금고', description: '전투 시작 지휘력 +25', icon: '✦', maxLevel: 5, baseCost: 100, requiredTier: 1 },
  logistics: { id: 'logistics', branch: 'command', name: '보급로', description: '초당 지휘력 회복 +2.5', icon: '↟', maxLevel: 5, baseCost: 150, requiredTier: 1, prerequisite: { id: 'war_coffers', level: 1 } },
  command_vault: { id: 'command_vault', branch: 'command', name: '지휘 저장고', description: '최대 지휘력 +40', icon: '◇', maxLevel: 5, baseCost: 200, requiredTier: 1, prerequisite: { id: 'logistics', level: 1 } },
  drill_yard: { id: 'drill_yard', branch: 'command', name: '상비군 훈련소', description: '병사 소환 대기시간 -5%', icon: '⚑', maxLevel: 5, baseCost: 250, requiredTier: 2, prerequisite: { id: 'command_vault', level: 2 } },
  supply_standardization: { id: 'supply_standardization', branch: 'command', name: '군수 표준화', description: '병사 소환 지휘 비용 -3%', icon: '▦', maxLevel: 5, baseCost: 300, requiredTier: 2, prerequisite: { id: 'command_vault', level: 3 } },
  spoils_accounting: { id: 'spoils_accounting', branch: 'growth', name: '전리품 회계', description: '전투 골드 획득량 +5%', icon: '●', maxLevel: 5, baseCost: 350, requiredTier: 2 },
  field_manuals: { id: 'field_manuals', branch: 'growth', name: '왕립 야전 교범', description: '전투 숙련 경험치 획득량 +5%', icon: '▤', maxLevel: 5, baseCost: 400, requiredTier: 2 },
  war_tithe: { id: 'war_tithe', branch: 'command', name: '승전 공납제', description: `적 처치 지휘력 +${fortressResearchTuning.warTitheCommandPerRank}`, icon: '♢', maxLevel: 5, baseCost: 400, requiredTier: 3, prerequisite: { id: 'drill_yard', level: 3 } },
  fortified_walls: { id: 'fortified_walls', branch: 'defense', name: '강화 성벽', description: '성채 최대 체력 +250', icon: '▰', maxLevel: 5, baseCost: 100, requiredTier: 1 },
  stone_plating: { id: 'stone_plating', branch: 'defense', name: '석재 장갑', description: '받는 공격 피해 -3', icon: '◆', maxLevel: 5, baseCost: 150, requiredTier: 1, prerequisite: { id: 'fortified_walls', level: 1 } },
  watchtower: { id: 'watchtower', branch: 'defense', name: '수호 망루', description: '근접한 적을 자동 사격', icon: '♜', maxLevel: 5, baseCost: 200, requiredTier: 1, prerequisite: { id: 'fortified_walls', level: 1 } },
  battlements: { id: 'battlements', branch: 'defense', name: '고층 흉벽', description: '수호 망루 사거리 +45', icon: '⌂', maxLevel: 5, baseCost: 250, requiredTier: 2, prerequisite: { id: 'watchtower', level: 2 } },
  mending_stone: { id: 'mending_stone', branch: 'defense', name: '재생 석재', description: `성채 체력 초당 회복 +${fortressResearchTuning.mendingStoneRegenPerRank}`, icon: '✚', maxLevel: 5, baseCost: 400, requiredTier: 3, prerequisite: { id: 'battlements', level: 3 } },
  black_powder: { id: 'black_powder', branch: 'artillery', name: '흑색 화약', description: '성채 포격 피해 +45', icon: '✹', maxLevel: 5, baseCost: 100, requiredTier: 1 },
  rapid_reload: { id: 'rapid_reload', branch: 'artillery', name: '신속 장전', description: '포격 재사용 시간 -3초', icon: '↻', maxLevel: 5, baseCost: 150, requiredTier: 1, prerequisite: { id: 'black_powder', level: 1 } },
  wide_blast: { id: 'wide_blast', branch: 'artillery', name: '광역 탄두', description: '포격 반경 +20', icon: '◉', maxLevel: 5, baseCost: 200, requiredTier: 1, prerequisite: { id: 'black_powder', level: 2 } },
  giantbreaker_shells: { id: 'giantbreaker_shells', branch: 'artillery', name: '마수 관통탄', description: '보스 대상 포격 피해 +70', icon: '◎', maxLevel: 5, baseCost: 300, requiredTier: 2, prerequisite: { id: 'wide_blast', level: 2 } },
  siege_calculus: { id: 'siege_calculus', branch: 'artillery', name: '공성 계산학', description: '적 성채 직접 포격 피해 +60 · 포격 사거리 +80', icon: '⌖', maxLevel: 5, baseCost: 450, requiredTier: 3, prerequisite: { id: 'giantbreaker_shells', level: 3 } },
  rally_orders: { id: 'rally_orders', branch: 'expedition', name: '집결 신호', description: '일반 병사 깃발 지휘 · 재지정 대기 -2초', icon: '⚑', maxLevel: 5, baseCost: 150, requiredTier: 1 },
  heroic_orders: { id: 'heroic_orders', branch: 'expedition', name: '영웅 기치', description: '영웅 깃발 지휘 · 영웅 스킬 대기 -3%', icon: '♛', maxLevel: 5, baseCost: 300, requiredTier: 2, prerequisite: { id: 'rally_orders', level: 3 } },
  mobilization_drill: { id: 'mobilization_drill', branch: 'expedition', name: '동원 전술 훈련', description: '동원령 최대 지휘력 +5 · 회복 +0.3/초', icon: '↟', maxLevel: 5, baseCost: 300, requiredTier: 2, prerequisite: { id: 'rally_orders', level: 2 } },
  field_recovery: { id: 'field_recovery', branch: 'expedition', name: '야전 구난대', description: '영웅 부활 대기시간 -3%', icon: '✚', maxLevel: 5, baseCost: 400, requiredTier: 3, prerequisite: { id: 'heroic_orders', level: 3 } },
  transcendent_orders: { id: 'transcendent_orders', branch: 'expedition', name: '초월의 군기', description: '5성 초월 병종 깃발 지휘 · 집결 이동속도 +5%', icon: '✦', maxLevel: 5, baseCost: 450, requiredTier: 3, prerequisite: { id: 'heroic_orders', level: 5 } },
};

export const fortressTierDefinitions: Record<FortressTier, FortressTierDefinition> = {
  1: { tier: 1, name: '변경 요새', requiredResearch: 0, promotionCost: 0, description: '왕국 원정의 전초기지입니다.', unlocks: '기초 연구와 왕국 정규병' },
  2: { tier: 2, name: '왕립 성채', requiredResearch: 8, promotionCost: 1000, description: '전문 시설과 적 출신 용병을 받아들입니다.', unlocks: '2티어 연구 · 약탈병 · 철갑병 · 왕립 기마병 영입' },
  3: { tier: 3, name: '최후의 보루', requiredResearch: 24, promotionCost: 2500, description: '왕국 최고 수준의 전쟁 시설을 운용합니다.', unlocks: '3티어 연구 · 석궁병 · 그리폰 기수 영입' },
};

export const emptyCastleTech = (): Record<CastleTechId, number> => Object.fromEntries(
  castleTechOrder.map((id) => [id, 0]),
) as Record<CastleTechId, number>;

export function castleTechRoots(branch: CastleTechDefinition['branch']): CastleTechId[] {
  return castleTechOrder.filter((id) => castleTechDefinitions[id].branch === branch && !castleTechDefinitions[id].prerequisite);
}

export function castleTechChildren(parentId: CastleTechId): CastleTechId[] {
  return castleTechOrder.filter((id) => castleTechDefinitions[id].prerequisite?.id === parentId);
}

export function castleTechCost(definition: CastleTechDefinition, currentLevel: number): number {
  return definition.baseCost * (currentLevel + 1);
}

export function totalCastleResearch(levels: Record<CastleTechId, number>): number {
  return castleTechOrder.reduce((total, id) => total + (levels[id] ?? 0), 0);
}

export function minimumFortressTierForResearch(levels: Record<CastleTechId, number>): FortressTier {
  return castleTechOrder.reduce<FortressTier>((minimumTier, id) => (
    (levels[id] ?? 0) > 0
      ? Math.max(minimumTier, castleTechDefinitions[id].requiredTier) as FortressTier
      : minimumTier
  ), 1);
}

export function canUpgradeCastleTech(id: CastleTechId, levels: Record<CastleTechId, number>, fortressTier: FortressTier = 1): boolean {
  const definition = castleTechDefinitions[id];
  const currentLevel = levels[id] ?? 0;
  if (currentLevel >= definition.maxLevel) return false;
  if (currentLevel > 0) return true;
  if (fortressTier < definition.requiredTier) return false;
  if (!definition.prerequisite) return true;
  return (levels[definition.prerequisite.id] ?? 0) >= definition.prerequisite.level;
}

export function castleTechPrerequisiteStatus(id: CastleTechId, levels: Record<CastleTechId, number>) {
  const prerequisite = castleTechDefinitions[id].prerequisite;
  if (!prerequisite) return undefined;
  const currentLevel = levels[prerequisite.id] ?? 0;
  const name = castleTechDefinitions[prerequisite.id].name;
  return {
    name,
    requiredLevel: prerequisite.level,
    currentLevel,
    met: currentLevel >= prerequisite.level,
    label: `선행: ${name} ${prerequisite.level}단계 (현재 ${currentLevel}단계)`,
  };
}

export function castleBattleStats(levels: Record<CastleTechId, number>): CastleBattleStats {
  return {
    startingCommand: 70 + levels.war_coffers * 25,
    commandRegen: 10 + levels.logistics * 2.5,
    maxCommand: 200 + levels.command_vault * 40,
    summonCooldownMultiplier: Math.max(0.75, 1 - levels.drill_yard * 0.05),
    summonCostMultiplier: Math.max(0.85, 1 - levels.supply_standardization * 0.03),
    commandPerKill: fortressResearchTuning.baseCommandPerKill + levels.war_tithe * fortressResearchTuning.warTitheCommandPerRank,
    battleGoldMultiplier: 1 + levels.spoils_accounting * 0.05,
    masteryXpMultiplier: 1 + levels.field_manuals * 0.05,
    maxHp: 1800 + levels.fortified_walls * 250,
    damageReduction: levels.stone_plating * 3,
    castleRegenPerSecond: levels.mending_stone * fortressResearchTuning.mendingStoneRegenPerRank,
    towerDamage: levels.watchtower * 22,
    towerRange: 310 + levels.battlements * 45,
    towerIntervalMs: Math.max(900, 2100 - levels.watchtower * 250),
    bombardDamage: 175 + levels.black_powder * 45,
    bombardRadius: 125 + levels.wide_blast * 20,
    bombardRange: fortressArtilleryTuning.baseRange + levels.siege_calculus * fortressArtilleryTuning.siegeRangePerRank,
    bombardCooldownMs: Math.max(16_000, 32_000 - levels.rapid_reload * 3000),
    bombardBossBonus: levels.giantbreaker_shells * 70,
    bombardCastleDamage: levels.siege_calculus * 60,
    heroSkillCooldownMultiplier: Math.max(0.85, 1 - levels.heroic_orders * 0.03),
    heroRespawnMultiplier: Math.max(0.85, 1 - levels.field_recovery * 0.03),
    mobilizationMaxCommandBonus: battleMobilizationTuning.maxCommandBonus + levels.mobilization_drill * 5,
    mobilizationCommandRegenBonus: battleMobilizationTuning.commandRegenBonus + levels.mobilization_drill * 0.3,
    rallyUnlocked: levels.rally_orders > 0,
    rallyHeroControl: levels.heroic_orders > 0,
    rallyTranscendentControl: levels.transcendent_orders > 0,
    rallyCooldownMs: Math.max(
      rallyCommandTuning.minimumCooldownMs,
      rallyCommandTuning.baseCooldownMs - levels.rally_orders * rallyCommandTuning.cooldownReductionPerRankMs,
    ),
    rallyMoveSpeedMultiplier: 1 + levels.transcendent_orders * rallyCommandTuning.moveSpeedBonusPerTranscendentRank,
  };
}

export function soldierCommandCost(baseCost: number, multiplier: number): number {
  return Math.max(10, Math.ceil(baseCost * multiplier));
}
