import { describe, expect, it } from 'vitest';
import type { GuardProtection, MovementDomain } from '../types/game';
import { resolveBacklineTarget, resolveDirectionalTargets, resolveGroundBurstTargets, resolvePierceTargets, type LaneTargetAccess } from './combatTargeting';

interface TestTarget {
  id: string;
  x: number;
  size: number;
  domain: MovementDomain;
  guardProtection?: GuardProtection;
}

const groundGuard: GuardProtection = { stopsPierce: true, rearRangeMultiplier: 0.25, protectedDomains: ['ground'] };
const target = (id: string, x: number, domain: MovementDomain = 'ground', guardProtection?: GuardProtection): TestTarget => ({
  id, x, size: 0, domain, guardProtection,
});
const access: LaneTargetAccess<TestTarget> = {
  x: (entry) => entry.x,
  size: (entry) => entry.size,
  domain: (entry) => entry.domain,
  guardProtection: (entry) => entry.guardProtection,
  eligible: () => true,
};
const ids = (targets: TestTarget[]) => targets.map((entry) => entry.id);

describe('lane attack target resolution', () => {
  it('lets authored lobbed attacks skip a melee screen for the nearest valid backliner', () => {
    const candidates = [target('melee', 45), target('ranged', 90), target('support', 130), target('too-far', 240)];
    const selected = resolveBacklineTarget(candidates, {
      forwardDistance: (entry) => entry.x,
      eligible: (entry) => entry.x <= 180,
      preferred: (entry) => entry.id === 'ranged' || entry.id === 'support',
    });
    expect(selected?.id).toBe('ranged');
    expect(resolveBacklineTarget(candidates, {
      forwardDistance: (entry) => entry.x,
      eligible: (entry) => entry.x <= 70,
      preferred: (entry) => entry.id === 'ranged' || entry.id === 'support',
    })).toBeUndefined();
  });

  it('stops straight pierce at the first guard while preserving ordinary continuation', () => {
    const primary = target('front', 100);
    expect(ids(resolvePierceTargets('player', primary, [primary, target('guard', 140, 'ground', groundGuard), target('rear', 170)], 3, 100, access)))
      .toEqual(['front', 'guard']);
    expect(ids(resolvePierceTargets('player', primary, [primary, target('middle', 140), target('rear', 170)], 3, 100, access)))
      .toEqual(['front', 'middle', 'rear']);
    const enemyPrimary = target('enemy-front', 200);
    expect(ids(resolvePierceTargets('enemy', enemyPrimary, [enemyPrimary, target('enemy-guard', 160, 'ground', groundGuard), target('enemy-rear', 130)], 3, 100, access)))
      .toEqual(['enemy-front', 'enemy-guard']);
    const trainingGuard: GuardProtection = { stopsPierce: false, rearRangeMultiplier: 0.65, protectedDomains: ['ground'] };
    expect(ids(resolvePierceTargets('player', primary, [primary, target('training-guard', 140, 'ground', trainingGuard), target('rear', 170)], 3, 100, access)))
      .toEqual(['front', 'training-guard', 'rear']);
  });

  it('attenuates only the protected domain behind a guard in a directional wave', () => {
    const result = resolveDirectionalTargets('player', 0, [
      target('front', 40),
      target('guard', 80, 'ground', groundGuard),
      target('ground-behind', 150),
      target('flying-behind', 150, 'flying'),
    ], 200, 'all', access);
    expect(ids(result)).toEqual(['front', 'guard', 'flying-behind']);
  });

  it('lets target-point ground magic bypass the line guard but not hit flying units', () => {
    const result = resolveGroundBurstTargets(150, [
      target('guard', 100, 'ground', groundGuard),
      target('rear', 155),
      target('nearest', 151),
      target('flying', 155, 'flying'),
    ], 60, 'ground', 2, access);
    expect(ids(result)).toEqual(['nearest', 'rear']);
  });
});
