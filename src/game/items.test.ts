import { describe, expect, it } from 'vitest';
import { castleBattleStats, emptyCastleTech } from '../data/castle';
import { troopDefinitions } from '../data/units';
import { applyFormationItem, applyFortressItems } from './items';

describe('item effects', () => {
  it('applies formation bonuses once to the troop occupying that slot', () => {
    const militia = troopDefinitions.militia;
    expect(applyFormationItem(militia, 'veteran-standard').maxHp).toBe(Math.round(militia.maxHp * 1.12));
    expect(applyFormationItem(militia, 'runed-whetstone').attackDamage).toBe(Math.round(militia.attackDamage * 1.1));
    expect(applyFormationItem(militia, 'clockwork-horn').spawnCooldownMs).toBe(Math.round(militia.spawnCooldownMs * 0.88));
    expect(applyFormationItem(militia, 'guardian-keystone')).toBe(militia);
  });

  it('combines only the two equipped fortress slots', () => {
    const base = castleBattleStats(emptyCastleTech());
    const resolved = applyFortressItems(base, ['guardian-keystone', 'quartermaster-seal']);
    expect(resolved.maxHp).toBe(Math.round(base.maxHp * 1.2));
    expect(resolved.startingCommand).toBe(base.startingCommand + 50);
    expect(resolved.maxCommand).toBe(base.maxCommand + 100);
    expect(applyFortressItems(base, ['starfire-lens']).bombardDamage).toBe(Math.round(base.bombardDamage * 1.25));
    expect(applyFortressItems(base, ['starfire-lens']).bombardRange).toBe(base.bombardRange + 150);
  });
});
