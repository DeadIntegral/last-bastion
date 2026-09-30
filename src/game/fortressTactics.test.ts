import { describe, expect, it } from 'vitest';
import { fortressSkillTuning } from '../data/fortressSkills';
import { castleBattleStats, emptyCastleTech } from '../data/castle';
import { advanceFortressTactics, armCentralTrap, centralTrapCanTrigger, centralTrapHits, createFortressTacticsState, emergencySupplyCommand } from './fortressTactics';

describe('fortress tactical abilities', () => {
  it('caps supply without spending cooldown while locked or full', () => {
    const state = createFortressTacticsState();
    expect(emergencySupplyCommand(state, 200, 200, 100)).toBe(200);
    expect(state.supplyCooldownMs).toBe(0);
    expect(emergencySupplyCommand(state, 70, 200, 0)).toBe(70);
    expect(emergencySupplyCommand(state, 170, 200, 100)).toBe(200);
    expect(emergencySupplyCommand(state, 50, 200, 100)).toBe(50);
    advanceFortressTactics(state, fortressSkillTuning.supply.cooldownMs);
    expect(emergencySupplyCommand(state, 50, 200, 100)).toBe(150);
  });
  it('arms one temporary trap and advances only with supplied simulation time', () => {
    const state = createFortressTacticsState();
    expect(armCentralTrap(state, 0)).toBe(false);
    expect(armCentralTrap(state, 300)).toBe(true);
    expect(armCentralTrap(state, 300)).toBe(false);
    expect(centralTrapCanTrigger(state)).toBe(false);
    advanceFortressTactics(state, 0);
    expect(state.trapArmingMs).toBe(fortressSkillTuning.trap.armingMs);
    advanceFortressTactics(state, fortressSkillTuning.trap.armingMs);
    expect(centralTrapCanTrigger(state)).toBe(true);
    advanceFortressTactics(state, fortressSkillTuning.trap.lifetimeMs);
    expect(centralTrapCanTrigger(state)).toBe(false);
    expect(armCentralTrap(state, 300)).toBe(false);
    advanceFortressTactics(state, fortressSkillTuning.trap.cooldownMs);
    expect(armCentralTrap(state, 300)).toBe(true);
  });
  it('targets living ground enemies only and derives research strength', () => {
    const radius = fortressSkillTuning.trap.radius;
    expect(centralTrapHits('enemy', true, false, 800 + radius, 800)).toBe(true);
    expect(centralTrapHits('enemy', true, false, 801 + radius, 800)).toBe(false);
    expect(centralTrapHits('enemy', true, true, 800, 800)).toBe(false);
    expect(centralTrapHits('enemy', false, false, 800, 800)).toBe(false);
    expect(centralTrapHits('player', true, false, 800, 800)).toBe(false);
    const tech = emptyCastleTech();
    expect(castleBattleStats(tech).emergencySupplyAmount).toBe(0);
    expect(castleBattleStats(tech).centralTrapDamage).toBe(0);
    expect(castleBattleStats({ ...tech, emergency_supply: 1, central_trap: 1 })).toMatchObject({ emergencySupplyAmount: 100, centralTrapDamage: 300 });
    expect(castleBattleStats({ ...tech, emergency_supply: 5, central_trap: 5 })).toMatchObject({ emergencySupplyAmount: 180, centralTrapDamage: 700 });
  });
});
