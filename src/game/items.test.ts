import { describe, expect, it } from 'vitest';
import { castleBattleStats, emptyCastleTech } from '../data/castle';
import { troopDefinitions } from '../data/units';
import { itemDropRuleForStage, resolveBattleItemDrop } from '../data/items';
import { getStage } from '../data/stages';
import { applyFormationItem, applyFortressItems } from './items';

describe('item effects', () => {
  it('applies formation bonuses once to the troop occupying that slot', () => {
    const militia = troopDefinitions.militia;
    expect(applyFormationItem(militia, 'veteran-standard').maxHp).toBe(Math.round(militia.maxHp * 1.12));
    expect(applyFormationItem(militia, 'runed-whetstone').attackDamage).toBe(Math.round(militia.attackDamage * 1.1));
    expect(applyFormationItem(militia, 'clockwork-horn').spawnCooldownMs).toBe(Math.round(militia.spawnCooldownMs * 0.88));
    expect(applyFormationItem(militia, 'war-standard').maxHp).toBe(Math.round(militia.maxHp * 1.18));
    expect(applyFormationItem(militia, 'war-standard').attackDamage).toBe(Math.round(militia.attackDamage * 1.14));
    expect(applyFormationItem(militia, 'rapid-assault-kit').spawnCooldownMs).toBe(Math.round(militia.spawnCooldownMs * 0.82));
    expect(applyFormationItem(militia, 'guardian-keystone')).toBe(militia);
  });

  it('combines only the two equipped fortress slots', () => {
    const base = castleBattleStats(emptyCastleTech());
    const resolved = applyFortressItems(base, ['guardian-keystone', 'quartermaster-seal']);
    expect(resolved.maxHp).toBe(Math.round(base.maxHp * 1.2));
    expect(resolved.startingCommand).toBe(base.startingCommand + 50);
    expect(resolved.maxCommand).toBe(base.maxCommand + 100);
    expect(applyFortressItems(base, ['guardian-keystone', 'guardian-keystone']).maxHp).toBe(Math.round(base.maxHp * 1.2 * 1.2));
    const doubledSeal = applyFortressItems(base, ['quartermaster-seal', 'quartermaster-seal']);
    expect(doubledSeal.startingCommand).toBe(base.startingCommand + 100);
    expect(doubledSeal.maxCommand).toBe(base.maxCommand + 200);
    expect(applyFortressItems(base, ['starfire-lens']).bombardDamage).toBe(Math.round(base.bombardDamage * 1.25));
    expect(applyFortressItems(base, ['starfire-lens']).bombardRange).toBe(base.bombardRange + 150);
    expect(applyFortressItems(base, ['bastion-heart']).maxHp).toBe(Math.round(base.maxHp * 1.3));
    const siegeCore = applyFortressItems(base, ['royal-siege-core']);
    expect(siegeCore.startingCommand).toBe(base.startingCommand + 70);
    expect(siegeCore.maxCommand).toBe(base.maxCommand + 150);
    expect(siegeCore.bombardDamage).toBe(Math.round(base.bombardDamage * 1.35));
  });

  it('makes every crafted item strictly stronger than each matching ingredient effect', () => {
    const benchmarkTroop = troopDefinitions.ifrit;
    const standard = applyFormationItem(benchmarkTroop, 'war-standard');
    expect(standard.maxHp).toBeGreaterThan(applyFormationItem(benchmarkTroop, 'veteran-standard').maxHp);
    expect(standard.attackDamage).toBeGreaterThan(applyFormationItem(benchmarkTroop, 'runed-whetstone').attackDamage);

    const assault = applyFormationItem(benchmarkTroop, 'rapid-assault-kit');
    expect(assault.attackDamage).toBeGreaterThan(applyFormationItem(benchmarkTroop, 'runed-whetstone').attackDamage);
    expect(assault.spawnCooldownMs).toBeLessThan(applyFormationItem(benchmarkTroop, 'clockwork-horn').spawnCooldownMs);

    const base = castleBattleStats(emptyCastleTech());
    const bastion = applyFortressItems(base, ['bastion-heart']);
    const keystone = applyFortressItems(base, ['guardian-keystone']);
    const seal = applyFortressItems(base, ['quartermaster-seal']);
    expect(bastion.maxHp).toBeGreaterThan(keystone.maxHp);
    expect(bastion.startingCommand).toBeGreaterThan(seal.startingCommand);
    expect(bastion.maxCommand).toBeGreaterThan(seal.maxCommand);

    const siegeCore = applyFortressItems(base, ['royal-siege-core']);
    const lens = applyFortressItems(base, ['starfire-lens']);
    expect(siegeCore.startingCommand).toBeGreaterThan(seal.startingCommand);
    expect(siegeCore.maxCommand).toBeGreaterThan(seal.maxCommand);
    expect(siegeCore.bombardDamage).toBeGreaterThan(lens.bombardDamage);
    expect(siegeCore.bombardRange).toBeGreaterThan(lens.bombardRange);
  });

  it('uses stage pools and the fortress drop-rate bonus for victory loot', () => {
    expect(itemDropRuleForStage(getStage(1)).chance).toBe(0.3);
    expect(resolveBattleItemDrop(getStage(1), true, 0.31)).toBeUndefined();
    expect(resolveBattleItemDrop(getStage(1), true, 0.31, 0.2)).toBeDefined();
    expect(resolveBattleItemDrop(getStage(1), false, 0)).toBeUndefined();
    expect(itemDropRuleForStage(getStage(303)).chance).toBe(0.8);
  });
});
