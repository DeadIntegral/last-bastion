import { bossCombatTuning, bossDefinition, troopDefinitions } from '../data/units';
import { MIN_FORTRESS_DISTANCE } from '../data/stages';
import type { EquipmentLevels, StageDefinition, UnitDefinition } from '../types/game';
import { applyEnemyTerrain, upgradedStats } from './rules';

export interface DifficultyBreakdown {
  stageId: number;
  label: string;
  total: number;
  objective: number;
  battlefield: number;
  scriptedArmy: number;
  reinforcement: number;
  elite: number;
  boss: number;
}

export interface CampaignDifficultyReport {
  stages: Array<DifficultyBreakdown & { index: number; target: number; deviation: number; step: number }>;
  monotonic: boolean;
  maxDeviation: number;
  linearityR2: number;
}

export interface DifficultyPresentation {
  rank: 1 | 2 | 3 | 4 | 5;
  label: '낮음' | '보통' | '높음' | '매우 높음' | '극한';
  threatIndex: number;
}

const round = (value: number) => Math.round(value * 10) / 10;

function patternMultiplier(unit: UnitDefinition): number {
  if (unit.attackPattern.kind === 'pierce') {
    return 1 + (unit.attackPattern.maxTargets - 1) * unit.attackPattern.secondaryDamageMultiplier * 0.48;
  }
  if (unit.attackPattern.kind === 'cleave') return 1 + unit.attackPattern.secondaryDamageMultiplier * 0.7;
  return 1;
}

export function estimateUnitThreat(unit: UnitDefinition): number {
  const effectiveHealth = unit.maxHp * (1 + (unit.defense ?? 0) * 0.045);
  const damagePerSecond = unit.attackDamage / (unit.attackIntervalMs / 1_000);
  const healingPerSecond = (unit.healingPower ?? 0) / (unit.attackIntervalMs / 1_000);
  const rangeMultiplier = 1 + Math.min(unit.attackRange, 220) / 650;
  const traitMultiplier = (unit.tags.includes('flying') ? 1.18 : 1)
    * (unit.tags.includes('charge') ? 1.08 : 1)
    * (unit.tags.includes('anti-large') ? 1.04 : 1);
  return (effectiveHealth / 18 + damagePerSecond * 1.8 + healingPerSecond * 1.35 + unit.moveSpeed / 9)
    * rangeMultiplier * patternMultiplier(unit) * traitMultiplier;
}

function enemyDeploymentThreat(id: keyof typeof troopDefinitions, equipment: EquipmentLevels, stage: StageDefinition): number {
  const unit = upgradedStats(troopDefinitions[id], equipment);
  return estimateUnitThreat(applyEnemyTerrain(unit, stage.terrain)) * unit.squadSize;
}

export function analyzeStageDifficulty(stage: StageDefinition): DifficultyBreakdown {
  const equipment = stage.enemyUpgrades.equipment;
  // Fortress durability is a primary objective in every campaign battle,
  // including boss sieges, so it carries enough weight to represent the
  // sustained damage window rather than behaving like a minor bonus target.
  const objective = stage.enemyCastleHp / 5;
  const battlefield = Math.max(0, stage.fortressDistance - MIN_FORTRESS_DISTANCE) / 2;
  const scriptedArmyMass = stage.waves.reduce((total, wave) => {
    const timingPressure = Math.max(0.72, 1.08 - wave.timeMs / 120_000);
    return total + enemyDeploymentThreat(wave.unitId, equipment, stage) * wave.count * timingPressure;
  }, 0);
  // A longer script increases endurance pressure, but linearly summing every late
  // deployment badly overstates armies that the player can defeat piecemeal.
  const scriptedArmy = Math.sqrt(scriptedArmyMass) * 30;

  const reinforcement = stage.reinforcement
    ? stage.reinforcement.unitIds.reduce(
      // maxAlive is a body cap rather than a deployment cap, so squad size must
      // not be multiplied here a second time.
      (total, id) => total + estimateUnitThreat(applyEnemyTerrain(upgradedStats(troopDefinitions[id], equipment), stage.terrain)),
      0,
    ) / stage.reinforcement.unitIds.length
      * stage.reinforcement.maxAlive
      * (3_200 / stage.reinforcement.intervalMs)
      * 0.72
    : 0;

  let elite = 0;
  if (stage.eliteGuard) {
    const definition = applyEnemyTerrain(upgradedStats(troopDefinitions[stage.eliteGuard.unitId], equipment), stage.terrain);
    const eliteUnit: UnitDefinition = {
      ...definition,
      maxHp: definition.maxHp * stage.eliteGuard.hpMultiplier,
      attackDamage: definition.attackDamage * stage.eliteGuard.attackMultiplier,
      defense: (definition.defense ?? 0) + stage.eliteGuard.defenseBonus,
      squadSize: 1,
    };
    elite = estimateUnitThreat(eliteUnit) * 2.1;
  }

  let boss = 0;
  if (stage.boss) {
    const baseBoss = stage.bossUnitId ? troopDefinitions[stage.bossUnitId] : bossDefinition;
    const definition = applyEnemyTerrain(upgradedStats(baseBoss, equipment), stage.terrain);
    const modifiers = stage.bossModifiers ?? { hpMultiplier: 1, attackMultiplier: 1, stompCadenceMultiplier: 1 };
    const bossUnit: UnitDefinition = {
      ...definition,
      maxHp: definition.maxHp * modifiers.hpMultiplier,
      attackDamage: definition.attackDamage * modifiers.attackMultiplier,
    };
    const phasePressure = 1 + bossCombatTuning.phaseTwoHpRatio
      * (1 / modifiers.stompCadenceMultiplier)
      * 0.7;
    boss = estimateUnitThreat(bossUnit) * phasePressure * 2.4;
  }

  return {
    stageId: stage.id,
    label: stage.name,
    total: round(objective + battlefield + scriptedArmy + reinforcement + elite + boss),
    objective: round(objective),
    battlefield: round(battlefield),
    scriptedArmy: round(scriptedArmy),
    reinforcement: round(reinforcement),
    elite: round(elite),
    boss: round(boss),
  };
}

export function analyzeCampaignDifficulty(stages: StageDefinition[]): CampaignDifficultyReport {
  const raw = stages.map(analyzeStageDifficulty);
  const first = raw[0]?.total ?? 0;
  const last = raw.at(-1)?.total ?? first;
  const spread = Math.max(1, last - first);
  const denominator = Math.max(1, stages.length - 1);
  const indexed = raw.map((stage, position) => {
    const index = round(((stage.total - first) / spread) * 100);
    const target = round((position / denominator) * 100);
    return {
      ...stage,
      index,
      target,
      deviation: round(Math.abs(index - target)),
      step: position === 0 ? 0 : round(index - (((raw[position - 1].total - first) / spread) * 100)),
    };
  });
  const residual = indexed.reduce((sum, stage) => sum + (stage.index - stage.target) ** 2, 0);
  const mean = indexed.reduce((sum, stage) => sum + stage.index, 0) / Math.max(1, indexed.length);
  const totalVariance = indexed.reduce((sum, stage) => sum + (stage.index - mean) ** 2, 0);

  return {
    stages: indexed,
    monotonic: indexed.every((stage, index) => index === 0 || stage.step > 0),
    maxDeviation: round(Math.max(0, ...indexed.map((stage) => stage.deviation))),
    linearityR2: Math.round((totalVariance === 0 ? 0 : 1 - residual / totalVariance) * 1_000) / 1_000,
  };
}

export function stageDifficultyPresentation(stage: StageDefinition, campaign: CampaignDifficultyReport): DifficultyPresentation {
  const campaignEntry = campaign.stages.find((entry) => entry.stageId === stage.id);
  const first = campaign.stages[0]?.total ?? 0;
  const last = campaign.stages.at(-1)?.total ?? first + 1;
  const threatIndex = campaignEntry?.index ?? round(
    Math.max(0, (analyzeStageDifficulty(stage).total - first) / Math.max(1, last - first) * 100),
  );
  if (threatIndex <= 15) return { rank: 1, label: '낮음', threatIndex };
  if (threatIndex <= 35) return { rank: 2, label: '보통', threatIndex };
  if (threatIndex <= 60) return { rank: 3, label: '높음', threatIndex };
  if (threatIndex <= 82) return { rank: 4, label: '매우 높음', threatIndex };
  return { rank: 5, label: '극한', threatIndex };
}

export const DIFFICULTY_LIMITS = {
  maxDeviation: 16,
  minimumR2: 0.92,
  minimumStepRatio: 0.3,
  maximumStepRatio: 2.2,
} as const;

export function difficultyAuditFailures(report: CampaignDifficultyReport): string[] {
  const targetStep = report.stages.length > 1 ? 100 / (report.stages.length - 1) : 100;
  const failures: string[] = [];
  if (!report.monotonic) failures.push('난이도 지수가 이전 스테이지보다 낮아지는 구간이 있습니다.');
  if (report.maxDeviation > DIFFICULTY_LIMITS.maxDeviation) {
    failures.push(`선형 목표 최대 편차 ${report.maxDeviation}가 허용치 ${DIFFICULTY_LIMITS.maxDeviation}를 넘습니다.`);
  }
  if (report.linearityR2 < DIFFICULTY_LIMITS.minimumR2) {
    failures.push(`선형 적합도 R² ${report.linearityR2}가 기준 ${DIFFICULTY_LIMITS.minimumR2}보다 낮습니다.`);
  }
  for (const stage of report.stages.slice(1)) {
    if (stage.step < targetStep * DIFFICULTY_LIMITS.minimumStepRatio) {
      failures.push(`${stage.stageId} 스테이지의 상승 폭 ${stage.step}가 너무 작습니다.`);
    }
    if (stage.step > targetStep * DIFFICULTY_LIMITS.maximumStepRatio) {
      failures.push(`${stage.stageId} 스테이지의 상승 폭 ${stage.step}가 너무 큽니다.`);
    }
  }
  return failures;
}
