import { fortressSkillTuning } from '../data/fortressSkills';
import type { Side } from '../types/game';

export interface FortressTacticsState {
  supplyCooldownMs: number;
  trapCooldownMs: number;
  trapRemainingMs: number;
  trapArmingMs: number;
}

export function createFortressTacticsState(): FortressTacticsState {
  return { supplyCooldownMs: 0, trapCooldownMs: 0, trapRemainingMs: 0, trapArmingMs: 0 };
}

export function advanceFortressTactics(state: FortressTacticsState, scaledDelta: number): void {
  const elapsed = Math.max(0, scaledDelta);
  state.supplyCooldownMs = Math.max(0, state.supplyCooldownMs - elapsed);
  state.trapCooldownMs = Math.max(0, state.trapCooldownMs - elapsed);
  state.trapRemainingMs = Math.max(0, state.trapRemainingMs - elapsed);
  state.trapArmingMs = Math.max(0, state.trapArmingMs - elapsed);
}

export function emergencySupplyCommand(state: FortressTacticsState, command: number, maximum: number, amount: number): number {
  if (amount <= 0 || state.supplyCooldownMs > 0 || command >= maximum) return command;
  state.supplyCooldownMs = fortressSkillTuning.supply.cooldownMs;
  return Math.min(maximum, command + amount);
}

export function armCentralTrap(state: FortressTacticsState, damage: number): boolean {
  if (damage <= 0 || state.trapCooldownMs > 0 || state.trapRemainingMs > 0) return false;
  state.trapCooldownMs = fortressSkillTuning.trap.cooldownMs;
  state.trapRemainingMs = fortressSkillTuning.trap.lifetimeMs;
  state.trapArmingMs = fortressSkillTuning.trap.armingMs;
  return true;
}

export function centralTrapCanTrigger(state: FortressTacticsState): boolean {
  return state.trapRemainingMs > 0 && state.trapArmingMs <= 0;
}

export function centralTrapHits(side: Side, alive: boolean, flying: boolean, x: number, trapX: number): boolean {
  return side === 'enemy' && alive && !flying && Math.abs(x - trapX) <= fortressSkillTuning.trap.radius;
}
