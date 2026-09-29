import { itemDefinitions } from '../data/items';
import type { CastleBattleStats, ItemId, UnitDefinition } from '../types/game';

export function applyFormationItem(definition: UnitDefinition, itemId?: ItemId | null): UnitDefinition {
  if (!itemId) return definition;
  const item = itemDefinitions[itemId];
  if (!item || item.target !== 'formation') return definition;
  return {
    ...definition,
    maxHp: Math.round(definition.maxHp * (item.effects.troopHpMultiplier ?? 1)),
    attackDamage: Math.round(definition.attackDamage * (item.effects.troopAttackMultiplier ?? 1)),
    healingPower: definition.healingPower === undefined
      ? undefined
      : Math.round(definition.healingPower * (item.effects.troopAttackMultiplier ?? 1)),
    spawnCooldownMs: Math.round(definition.spawnCooldownMs * (item.effects.summonCooldownMultiplier ?? 1)),
  };
}

export function applyFortressItems(stats: CastleBattleStats, itemIds: Array<ItemId | null>): CastleBattleStats {
  let hpMultiplier = 1;
  let bombardDamageMultiplier = 1;
  let startingCommandBonus = 0;
  let maxCommandBonus = 0;
  let bombardRangeBonus = 0;
  for (const id of itemIds) {
    if (!id) continue;
    const item = itemDefinitions[id];
    if (!item || item.target !== 'fortress') continue;
    hpMultiplier *= item.effects.fortressHpMultiplier ?? 1;
    bombardDamageMultiplier *= item.effects.bombardDamageMultiplier ?? 1;
    startingCommandBonus += item.effects.startingCommandBonus ?? 0;
    maxCommandBonus += item.effects.maxCommandBonus ?? 0;
    bombardRangeBonus += item.effects.bombardRangeBonus ?? 0;
  }
  return {
    ...stats,
    startingCommand: stats.startingCommand + startingCommandBonus,
    maxCommand: stats.maxCommand + maxCommandBonus,
    maxHp: Math.round(stats.maxHp * hpMultiplier),
    bombardDamage: Math.round(stats.bombardDamage * bombardDamageMultiplier),
    bombardRange: stats.bombardRange + bombardRangeBonus,
  };
}
