export const deadZoneRetreatTuning = {
  minimumStep: 45,
  maximumStep: 110,
  spacingBuffer: 24,
  cooldownMs: 1_600,
} as const;

export const battleDeploymentTuning = {
  baseCommandCostMultiplier: 1.1,
  maximumCommandCost: 200,
} as const;

export const fortressCombatGeometry = {
  playerHalfWidth: 58,
  enemyHalfWidth: 65,
} as const;

export const knockbackResistanceTuning = {
  ordinaryMultiplier: 1,
  largeEliteMultiplier: 0.6,
  largeLegendaryMultiplier: 0.3,
  largeTranscendentMultiplier: 0,
} as const;
