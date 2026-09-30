import { ADVANCED_EQUIPMENT_COST_MULTIPLIER, BASE_EQUIPMENT_MAX_RANK } from '../data/equipment';
import { battleMobilizationTuning, fortressDeploymentTuning, mobilizationCommandCost } from '../data/castle';
import { deadZoneRetreatTuning, knockbackResistanceTuning } from '../data/combat';
import { triumphMonumentBonuses, type MonumentBuildingId } from '../data/endgame';
import { HERO_AWAKENING_COOLDOWN_REDUCTION_MS, HERO_AWAKENING_LEVELS, HERO_MASTERY_MAX_LEVEL, SOLDIER_MASTERY_MAX_LEVEL, battleMasteryTuning, heroAwakeningAuras, heroAwakeningSelfBonuses, heroMasteryGrowth, soldierMasteryGrowth, type MasteryStatGrowth } from '../data/mastery';
import type { BattleSpeed, EquipmentLevels, HeroDefinition, HeroId, MasteryContribution, Side, StageDefinition, TerrainEffect, UnitDefinition, UnitId } from '../types/game';

export const COMMAND_MAX = 200;
export const COMMAND_REGEN_PER_SECOND = 10;
export const HERO_RESPAWN_MS = 20_000;
export const HERO_SKILL_COOLDOWN_MS = 25_000;
export const EQUIPMENT_CAPSTONE_LEVEL = 5;
export const STAT_EQUIPMENT_CAPSTONE_BONUS_RANKS = 3;
export const ATTACK_RHYTHM_REVEAL_MASTERY_LEVEL = 5;

export function scaledBattleDelta(deltaMs: number, speed: BattleSpeed): number {
  return Math.min(Math.max(0, deltaMs), 50) * speed;
}

export function scaledProgressionReward(amount: number, multiplier: number): number {
  return Math.max(0, Math.round(amount * multiplier));
}

export const emptyMasteryContribution = (): MasteryContribution => ({
  damageDealt: 0,
  damageTaken: 0,
  healingDone: 0,
  protectionDone: 0,
  kills: 0,
  activeMs: 0,
});

function squareRootContributionXp(value: number, divisor: number, cap: number): number {
  return Math.min(cap, Math.floor(Math.sqrt(Math.max(0, value)) / divisor));
}

export function masteryContributionXp(contribution: MasteryContribution): number {
  return squareRootContributionXp(contribution.damageDealt, battleMasteryTuning.damageDealtDivisor, battleMasteryTuning.damageDealtCap)
    + squareRootContributionXp(contribution.damageTaken, battleMasteryTuning.damageTakenDivisor, battleMasteryTuning.damageTakenCap)
    + squareRootContributionXp(contribution.healingDone, battleMasteryTuning.healingDivisor, battleMasteryTuning.healingCap)
    + squareRootContributionXp(contribution.protectionDone, battleMasteryTuning.protectionDivisor, battleMasteryTuning.protectionCap)
    + Math.min(battleMasteryTuning.killXpCap, Math.max(0, contribution.kills) * battleMasteryTuning.killXp)
    + Math.min(battleMasteryTuning.activeXpCap, Math.floor(Math.max(0, contribution.activeMs) / battleMasteryTuning.activeMsPerXp));
}

export function unitBattleMasteryXp(deployments: number, victory: boolean, contribution: MasteryContribution): { participation: number; contribution: number; total: number } {
  const participation = battleMasteryTuning.unitParticipationBase
    + Math.min(battleMasteryTuning.unitDeploymentXpCap, Math.max(0, deployments) * battleMasteryTuning.unitDeploymentXp)
    + (victory ? battleMasteryTuning.victoryXp : battleMasteryTuning.defeatXp);
  const contributionXp = masteryContributionXp(contribution);
  return { participation, contribution: contributionXp, total: participation + contributionXp };
}

export function heroBattleMasteryXp(skillUses: number, victory: boolean, contribution: MasteryContribution): { participation: number; contribution: number; total: number } {
  const participation = battleMasteryTuning.heroParticipationBase
    + Math.max(0, skillUses) * battleMasteryTuning.heroSkillUseXp
    + (victory ? battleMasteryTuning.heroVictoryXp : battleMasteryTuning.heroDefeatXp);
  const contributionXp = masteryContributionXp(contribution);
  return { participation, contribution: contributionXp, total: participation + contributionXp };
}

export function fortressRearSpawnX(side: Side, fortressX: number, squadIndex = 0): number {
  const direction = side === 'player' ? -1 : 1;
  return fortressX + direction * (fortressDeploymentTuning.rearOffset + squadIndex * fortressDeploymentTuning.squadSpacing);
}

export function isBehindLivingFortress(side: Side, unitX: number, fortressX: number, fortressHp: number): boolean {
  if (fortressHp <= 0) return false;
  return side === 'player' ? unitX < fortressX : unitX > fortressX;
}

export function masteryXpRequiredAtLevel(level: number): number {
  return Math.round(45 * Math.pow(level, 1.32));
}

export function totalMasteryXpForLevel(level: number): number {
  let total = 0;
  for (let current = 1; current < Math.max(1, level); current += 1) total += masteryXpRequiredAtLevel(current);
  return total;
}

export function calculateDamage(attacker: UnitDefinition, target: UnitDefinition, upgradeLevel = 0): number {
  const upgradedDamage = attacker.attackDamage * (1 + upgradeLevel * 0.1);
  const largeBonus = attacker.tags.includes('anti-large') && target.tags.includes('large') ? 1.75 : 1;
  return Math.max(1, Math.round(upgradedDamage * largeBonus - (target.defense ?? 0)));
}

export function canAttackTarget(attacker: UnitDefinition, target: UnitDefinition): boolean {
  if (target.tags.includes('flying') && !attacker.tags.includes('ranged')) return false;
  if (target.tags.includes('flying')
    && (attacker.attackPattern.kind === 'splash' || attacker.attackPattern.kind === 'directional' || attacker.attackPattern.kind === 'groundBurst')
    && attacker.attackPattern.targetDomain === 'ground') return false;
  return true;
}

export function fortressEdgeDistance(attackerX: number, attackerSize: number, fortressX: number, fortressHalfWidth: number): number {
  return Math.max(0, Math.abs(fortressX - attackerX) - fortressHalfWidth - attackerSize);
}

export function fortressCollateralMultiplierForAttack(
  definition: UnitDefinition,
  side: Side,
  attackerX: number,
  primaryX: number,
  fortressX: number,
  fortressHalfWidth: number,
  hitTargetCount: number,
  pierceStopped: boolean,
  rangeBonus = 0,
): number {
  const multiplier = definition.fortressCollateralMultiplier ?? 0;
  if (multiplier <= 0) return 0;
  const direction = side === 'player' ? 1 : -1;
  const fortressNearEdgeX = fortressX - direction * fortressHalfWidth;
  const forwardEdgeDistance = (fortressNearEdgeX - attackerX) * direction - definition.size;
  if (forwardEdgeDistance < 0) return 0;
  const pattern = definition.attackPattern;
  if (pattern.kind === 'cleave') {
    return forwardEdgeDistance <= definition.attackRange + rangeBonus ? multiplier : 0;
  }
  if (pattern.kind !== 'pierce' || !pattern.piercesFortress || pierceStopped || hitTargetCount >= pattern.maxTargets) return 0;
  const followThroughDistance = (fortressNearEdgeX - primaryX) * direction;
  return followThroughDistance >= -8 && followThroughDistance <= pattern.followThroughRange ? multiplier : 0;
}

export function knockbackMultiplier(definition: Pick<UnitDefinition, 'grade' | 'tags'>): number {
  if (definition.tags.includes('flying')) return 0;
  if (!definition.tags.includes('large')) return knockbackResistanceTuning.ordinaryMultiplier;
  if (definition.grade === 5) return knockbackResistanceTuning.largeTranscendentMultiplier;
  if (definition.grade === 4) return knockbackResistanceTuning.largeLegendaryMultiplier;
  return knockbackResistanceTuning.largeEliteMultiplier;
}

export function attackPatternLabel(definition: UnitDefinition): string {
  if (definition.attackName) return definition.attackName;
  const pattern = definition.attackPattern;
  if (pattern.kind === 'pierce') return `${pattern.maxTargets}명 관통${pattern.piercesFortress ? ' · 성채 관통' : ''}`;
  if (pattern.kind === 'cleave') return `근접 범위 전체 공격${definition.fortressCollateralMultiplier ? ' · 성채 동시 타격' : ''}`;
  if (pattern.kind === 'splash') return `착탄 범위 공격 · 반경 ${pattern.radius}`;
  if (pattern.kind === 'directional') return `전방 파동 · 길이 ${pattern.length}`;
  if (pattern.kind === 'groundBurst') return `지면 발현 · 최대 ${pattern.maxTargets}명 · 반경 ${pattern.radius}`;
  return '단일 공격';
}

export function guardProtectionLabel(definition: UnitDefinition): string | undefined {
  const protection = definition.guardProtection;
  if (!protection) return undefined;
  const reduction = Math.round((1 - protection.rearRangeMultiplier) * 100);
  const domain = protection.protectedDomains.includes('flying') ? '전 영역' : '지상';
  return `${protection.stopsPierce ? '관통 차단' : '관통 통과'} · ${domain} 후방 파동 ${reduction}% 감쇠`;
}

export function attackRecoveryMs(definition: UnitDefinition): number {
  return Math.max(0, definition.attackIntervalMs - definition.attackWindupMs);
}

export function attackRangeLabel(definition: UnitDefinition): string {
  return definition.minimumAttackRange > 0
    ? `${definition.minimumAttackRange}–${definition.attackRange}`
    : `${definition.attackRange}`;
}

export function retreatsFromDeadZone(definition: Pick<UnitDefinition, 'minimumAttackRange' | 'retreatsInsideMinimumRange'>): boolean {
  return definition.minimumAttackRange > 0 && definition.retreatsInsideMinimumRange === true;
}

export function spacingTraitLabel(definition: Pick<UnitDefinition, 'minimumAttackRange' | 'retreatsInsideMinimumRange' | 'rangedTargeting'>): string | undefined {
  const traits: string[] = [];
  if (definition.rangedTargeting === 'backline') traits.push('곡사 · 전열 너머 후방 원거리·지원 우선');
  if (retreatsFromDeadZone(definition)) traits.push('후퇴 사격 · 사각 진입 시 거리 확보');
  return traits.length > 0 ? traits.join(' / ') : undefined;
}

export function deadZoneRetreatDestination(currentX: number, threatX: number, minimumRange: number, currentDistance: number, minimumX: number, maximumX: number): number {
  const direction = Math.sign(currentX - threatX) || -1;
  const requiredStep = minimumRange - currentDistance + deadZoneRetreatTuning.spacingBuffer;
  const step = Math.max(deadZoneRetreatTuning.minimumStep, Math.min(deadZoneRetreatTuning.maximumStep, requiredStep));
  return Math.max(minimumX, Math.min(maximumX, currentX + direction * step));
}

export function attackTimingLabel(definition: UnitDefinition): string {
  return `선딜 ${(definition.attackWindupMs / 1_000).toFixed(2)}초 · 후딜 ${(attackRecoveryMs(definition) / 1_000).toFixed(2)}초`;
}

export function isWithinAttackBand(definition: UnitDefinition, edgeDistance: number, rangeBonus = 0): boolean {
  const resolvedEdgeDistance = Math.max(0, edgeDistance);
  return resolvedEdgeDistance >= definition.minimumAttackRange
    && resolvedEdgeDistance <= definition.attackRange + rangeBonus;
}

export function masteryLevelFromXp(totalXp: number, maxLevel = SOLDIER_MASTERY_MAX_LEVEL): { level: number; currentXp: number; requiredXp: number } {
  let level = 1;
  let remaining = Math.max(0, totalXp);
  while (level < maxLevel) {
    const required = masteryXpRequiredAtLevel(level);
    if (remaining < required) return { level, currentXp: remaining, requiredXp: required };
    remaining -= required;
    level += 1;
  }
  return { level: maxLevel, currentXp: 0, requiredXp: 0 };
}

export function heroMasteryLevelFromXp(totalXp: number): { level: number; currentXp: number; requiredXp: number } {
  return masteryLevelFromXp(totalXp, HERO_MASTERY_MAX_LEVEL);
}

export const emptyEquipment = (): EquipmentLevels => ({ weapon: 0, armor: 0, boots: 0 });

export function equipmentCost(definition: UnitDefinition, currentLevel: number): number {
  return upgradeCost(currentLevel, definition.equipmentCostBase)
    * (currentLevel >= BASE_EQUIPMENT_MAX_RANK ? ADVANCED_EQUIPMENT_COST_MULTIPLIER : 1);
}

export function cooldownFillRatio(remainingMs: number, durationMs: number): number {
  if (durationMs <= 0) return 0;
  return Math.min(1, Math.max(0, remainingMs / durationMs));
}

export function hasEquipmentCapstone(levels: EquipmentLevels): boolean {
  return Object.values(levels).some((level) => level >= EQUIPMENT_CAPSTONE_LEVEL);
}

export function usesStatEquipmentCapstone(definition: Pick<UnitDefinition, 'grade' | 'tags'>): boolean {
  return definition.grade === 5 || definition.grade === 4 && definition.tags.includes('large');
}

export function canActivateMobilization(command: number, uses: number, maxUses: number): boolean {
  return uses < maxUses && command >= mobilizationCommandCost(uses);
}

export function enemyObjectiveDefeated(stage: Pick<StageDefinition, 'boss' | 'challenge'>, enemyCastleHp: number, bossAlive: boolean): boolean {
  if (stage.challenge) return !bossAlive;
  return enemyCastleHp <= 0 && (!stage.boss || !bossAlive);
}

export function enemyFortressCanReinforce(stage: Pick<StageDefinition, 'challenge'>, enemyCastleHp: number): boolean {
  return !stage.challenge && enemyCastleHp > 0;
}

export function unitDeploymentCapacity(definition: Pick<UnitDefinition, 'maxActivePerSide'>, activeCount: number): number {
  if (definition.maxActivePerSide === undefined) return Number.POSITIVE_INFINITY;
  return Math.max(0, definition.maxActivePerSide - activeCount);
}

export function applyEnemyTerrain(definition: UnitDefinition, terrain: TerrainEffect): UnitDefinition {
  return {
    ...definition,
    maxHp: Math.round(definition.maxHp * terrain.enemyHpMultiplier),
    attackDamage: Math.round(definition.attackDamage * terrain.enemyAttackMultiplier),
    moveSpeed: Math.round(definition.moveSpeed * terrain.enemyMoveSpeedMultiplier * 10) / 10,
  };
}

export function mobilizedCommandStats(
  maxCommand: number,
  commandRegen: number,
  maxCommandBonus: number = battleMobilizationTuning.maxCommandBonus,
  commandRegenBonus: number = battleMobilizationTuning.commandRegenBonus,
): { maxCommand: number; commandRegen: number } {
  return {
    maxCommand: maxCommand + maxCommandBonus,
    commandRegen: commandRegen + commandRegenBonus,
  };
}

export function canReceiveRallyOrder(
  definition: Pick<UnitDefinition, 'tags' | 'grade'>,
  isHero: boolean,
  permissions: { soldiers: boolean; heroes: boolean; transcendent: boolean },
): boolean {
  if (isHero) return permissions.heroes;
  if (definition.tags.includes('boss')) return false;
  if (definition.grade === 5) return permissions.transcendent;
  return permissions.soldiers;
}

export function masteryStatGrowth(definition: UnitDefinition): MasteryStatGrowth {
  if (definition.tags.includes('hero')) return heroMasteryGrowth[definition.id as HeroId];
  if (definition.enemyOnly || definition.tags.includes('boss')) return { hp: 0, attack: 0 };
  return soldierMasteryGrowth[definition.id as UnitId];
}

export function heroAwakeningRank(masteryLevel: number): number {
  return HERO_AWAKENING_LEVELS.filter((level) => masteryLevel >= level).length;
}

export function heroAuraBonuses(heroId: HeroId, masteryLevel: number) {
  const aura = heroAwakeningAuras[heroId];
  const rank = heroAwakeningRank(masteryLevel);
  return {
    radius: aura.radius,
    attackBonus: (aura.attackBonusPerRank ?? 0) * rank,
    defenseBonus: (aura.defenseBonusPerRank ?? 0) * rank,
    rangeBonus: (aura.rangeBonusPerRank ?? 0) * rank,
    moveSpeedBonus: (aura.moveSpeedBonusPerRank ?? 0) * rank,
    healingPerSecond: (aura.healingPerSecondPerRank ?? 0) * rank,
  };
}

export function heroSelfAwakeningBonuses(heroId: HeroId, masteryLevel: number) {
  const bonus = heroAwakeningSelfBonuses[heroId];
  const rank = heroAwakeningRank(masteryLevel);
  return {
    hp: bonus.hpPerRank * rank,
    attack: bonus.attackPerRank * rank,
    defense: (bonus.defensePerRank ?? 0) * rank,
    range: (bonus.rangePerRank ?? 0) * rank,
    moveSpeed: (bonus.moveSpeedPerRank ?? 0) * rank,
    healing: (bonus.healingPerRank ?? 0) * rank,
  };
}

export function healedHp(currentHp: number, maxHp: number, amount: number): number {
  return Math.min(Math.max(0, maxHp), Math.max(0, currentHp) + Math.max(0, amount));
}

export function scaledHeroSkillPower(basePower: number, powerPerRank: number, powerPerAwakening: number, masteryLevel: number): number {
  const cappedLevel = Math.min(HERO_MASTERY_MAX_LEVEL, masteryLevel);
  return basePower
    + Math.max(0, cappedLevel - 1) * powerPerRank
    + heroAwakeningRank(cappedLevel) * powerPerAwakening;
}

export function scaledHeroSkillCooldownMs(definition: HeroDefinition, masteryLevel: number): number {
  return definition.skillCooldownMs - heroAwakeningRank(masteryLevel) * HERO_AWAKENING_COOLDOWN_REDUCTION_MS;
}

export function heroRespawnReductionMs(definition: HeroDefinition, masteryLevel: number): number {
  const growth = heroMasteryGrowth[definition.id];
  const cappedLevel = Math.min(HERO_MASTERY_MAX_LEVEL, masteryLevel);
  return Math.min(growth.maxRespawnReductionMs, Math.max(0, cappedLevel - 1) * growth.respawnReductionMs);
}

export function scaledHeroRespawnMs(definition: HeroDefinition, masteryLevel: number): number {
  return definition.respawnMs - heroRespawnReductionMs(definition, masteryLevel);
}

export function upgradedStats(definition: UnitDefinition, equipment: number | EquipmentLevels, masteryLevel = 1): UnitDefinition {
  const levels = typeof equipment === 'number'
    ? { weapon: equipment, armor: equipment, boots: 0 }
    : equipment;
  const growth = definition.equipmentGrowth;
  const isHero = definition.tags.includes('hero');
  const isSoldier = !definition.enemyOnly && !definition.tags.includes('hero') && !definition.tags.includes('boss');
  const masteryCap = isHero ? HERO_MASTERY_MAX_LEVEL : SOLDIER_MASTERY_MAX_LEVEL;
  const masteryRanks = Math.max(0, Math.min(masteryCap, masteryLevel) - 1);
  const masteryGrowth = masteryStatGrowth(definition);
  const selfAwakening = isHero ? heroSelfAwakeningBonuses(definition.id as HeroId, masteryLevel) : undefined;
  const equipmentCapstone = isSoldier && hasEquipmentCapstone(levels);
  const eliteCapstoneRanks = equipmentCapstone && usesStatEquipmentCapstone(definition)
    ? STAT_EQUIPMENT_CAPSTONE_BONUS_RANKS
    : 0;
  return {
    ...definition,
    maxHp: Math.round(definition.maxHp + masteryRanks * masteryGrowth.hp + (levels.armor + eliteCapstoneRanks) * growth.hp + (selfAwakening?.hp ?? 0)),
    attackDamage: Math.round(definition.attackDamage + masteryRanks * masteryGrowth.attack + (levels.weapon + eliteCapstoneRanks) * growth.attack + (selfAwakening?.attack ?? 0)),
    healingPower: definition.healingPower === undefined
      ? undefined
      : Math.round(definition.healingPower + masteryRanks * masteryGrowth.attack + (levels.weapon + eliteCapstoneRanks) * growth.attack + (selfAwakening?.healing ?? 0)),
    defense: Math.round(((definition.defense ?? 0) + (levels.armor + eliteCapstoneRanks) * growth.defense + (selfAwakening?.defense ?? 0)) * 10) / 10,
    attackRange: definition.attackRange + (selfAwakening?.range ?? 0),
    moveSpeed: Math.round((definition.moveSpeed + (levels.boots + eliteCapstoneRanks) * growth.moveSpeed + (selfAwakening?.moveSpeed ?? 0)) * 10) / 10,
    squadSize: definition.squadSize + (equipmentCapstone && !usesStatEquipmentCapstone(definition) ? 1 : 0),
  };
}

export function applyTriumphMonumentStats(definition: UnitDefinition, builtIds: readonly MonumentBuildingId[]): UnitDefinition {
  const bonuses = triumphMonumentBonuses(builtIds);
  return {
    ...definition,
    maxHp: Math.round(definition.maxHp * bonuses.combatantHpMultiplier),
    attackDamage: Math.round(definition.attackDamage * bonuses.combatantAttackMultiplier),
    healingPower: definition.healingPower === undefined
      ? undefined
      : Math.round(definition.healingPower * bonuses.combatantAttackMultiplier),
  };
}

export function upgradeCost(level: number, baseCost = 50): number {
  return baseCost * (level + 1);
}

export function regenerateCommand(current: number, deltaMs: number, maximum = COMMAND_MAX, perSecond = COMMAND_REGEN_PER_SECOND): number {
  return Math.min(maximum, current + perSecond * (deltaMs / 1000));
}

export function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  const minutes = Math.floor(total / 60);
  return `${minutes}:${String(total % 60).padStart(2, '0')}`;
}
