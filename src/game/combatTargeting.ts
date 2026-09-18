import type { GuardProtection, MovementDomain, Side } from '../types/game';

export interface LaneTargetAccess<T> {
  x: (target: T) => number;
  size: (target: T) => number;
  domain: (target: T) => MovementDomain;
  guardProtection: (target: T) => GuardProtection | undefined;
  eligible: (target: T) => boolean;
}

function forwardDistance(side: Side, originX: number, targetX: number): number {
  return (targetX - originX) * (side === 'player' ? 1 : -1);
}

function guardStopsDomain<T>(target: T, domain: MovementDomain, access: LaneTargetAccess<T>): boolean {
  const protection = access.guardProtection(target);
  return Boolean(protection?.stopsPierce && protection.protectedDomains.includes(domain));
}

function insertByDistance<T>(targets: T[], target: T, distance: number, distanceOf: (candidate: T) => number, startIndex = 0): void {
  let insertAt = startIndex;
  while (insertAt < targets.length && distanceOf(targets[insertAt]) <= distance) insertAt += 1;
  targets.splice(insertAt, 0, target);
}

export function resolvePierceTargets<T>(
  side: Side,
  primary: T,
  candidates: readonly T[],
  maxTargets: number,
  followThroughRange: number,
  access: LaneTargetAccess<T>,
  result: T[] = [],
): T[] {
  result.length = 0;
  result.push(primary);
  const traversalDomain = access.domain(primary);
  if (guardStopsDomain(primary, traversalDomain, access)) return result;

  const primaryX = access.x(primary);
  const distanceOf = (target: T) => forwardDistance(side, primaryX, access.x(target));
  for (const candidate of candidates) {
    if (candidate === primary || !access.eligible(candidate)) continue;
    const distance = distanceOf(candidate);
    if (distance < -8 || distance > followThroughRange) continue;
    insertByDistance(result, candidate, distance, distanceOf, 1);
    if (result.length > maxTargets) result.pop();
  }
  for (let index = 1; index < result.length; index += 1) {
    if (!guardStopsDomain(result[index], traversalDomain, access)) continue;
    result.length = index + 1;
    break;
  }
  return result;
}

export function resolveDirectionalTargets<T>(
  side: Side,
  attackerX: number,
  candidates: readonly T[],
  length: number,
  targetDomain: 'ground' | 'all',
  access: LaneTargetAccess<T>,
  result: T[] = [],
): T[] {
  result.length = 0;
  const distanceOf = (target: T) => forwardDistance(side, attackerX, access.x(target));
  for (const candidate of candidates) {
    if (!access.eligible(candidate)) continue;
    const domain = access.domain(candidate);
    const distance = distanceOf(candidate);
    if (distance < 0 || distance > length || (targetDomain === 'ground' && domain === 'flying')) continue;
    insertByDistance(result, candidate, distance, distanceOf);
  }

  let groundLimit = length;
  let flyingLimit = length;
  let writeIndex = 0;
  for (const candidate of result) {
    const domain = access.domain(candidate);
    const distance = distanceOf(candidate);
    const currentLimit = domain === 'ground' ? groundLimit : flyingLimit;
    if (distance > currentLimit) continue;
    result[writeIndex] = candidate;
    writeIndex += 1;
    const protection = access.guardProtection(candidate);
    if (!protection?.protectedDomains.includes(domain)) continue;
    const reducedLimit = distance + Math.max(0, currentLimit - distance) * protection.rearRangeMultiplier;
    if (domain === 'ground') groundLimit = Math.min(groundLimit, reducedLimit);
    else flyingLimit = Math.min(flyingLimit, reducedLimit);
  }
  result.length = writeIndex;
  return result;
}

export function resolveGroundBurstTargets<T>(
  centerX: number,
  candidates: readonly T[],
  radius: number,
  targetDomain: 'ground' | 'all',
  access: LaneTargetAccess<T>,
  result: T[] = [],
): T[] {
  result.length = 0;
  const distanceOf = (target: T) => Math.abs(access.x(target) - centerX);
  for (const candidate of candidates) {
    if (!access.eligible(candidate)) continue;
    if (targetDomain === 'ground' && access.domain(candidate) === 'flying') continue;
    const distance = distanceOf(candidate);
    if (distance - access.size(candidate) > radius) continue;
    insertByDistance(result, candidate, distance, distanceOf);
  }
  return result;
}
