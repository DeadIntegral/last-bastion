export const fortressSkillTuning = {
  supply: { name: '긴급 보급', hotkey: 'Z', baseAmount: 80, amountPerRank: 20, cooldownMs: 45000 },
  trap: { name: '중앙 함정', hotkey: 'X', baseDamage: 200, damagePerRank: 100, radius: 110, armingMs: 1000, lifetimeMs: 25000, cooldownMs: 30000, positionRatio: 0.5 },
} as const;
