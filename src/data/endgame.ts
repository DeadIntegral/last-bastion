export const TRIUMPH_MONUMENT = {
  name: '승전 기념비',
  unlockStage: 30,
  maxLevel: 20,
  baseCost: 5_000,
  costStep: 2_500,
  combatantHpPerLevel: 0.01,
  combatantAttackPerLevel: 0.01,
  fortressHpPerLevel: 150,
} as const;

export function triumphMonumentCost(currentLevel: number): number {
  const level = Math.max(0, Math.min(TRIUMPH_MONUMENT.maxLevel, Math.floor(currentLevel)));
  return TRIUMPH_MONUMENT.baseCost + level * TRIUMPH_MONUMENT.costStep;
}

export function triumphMonumentBonuses(level: number) {
  const safeLevel = Math.max(0, Math.min(TRIUMPH_MONUMENT.maxLevel, Math.floor(level)));
  return {
    level: safeLevel,
    combatantHpMultiplier: 1 + safeLevel * TRIUMPH_MONUMENT.combatantHpPerLevel,
    combatantAttackMultiplier: 1 + safeLevel * TRIUMPH_MONUMENT.combatantAttackPerLevel,
    fortressHpBonus: safeLevel * TRIUMPH_MONUMENT.fortressHpPerLevel,
  };
}
