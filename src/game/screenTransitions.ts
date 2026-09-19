import type { Screen } from '../types/game';

export type ScreenTransitionDirection = 'forward' | 'back';

const transitionExcludedScreens = new Set<Screen>(['opening', 'battle']);
const mapFacilities = new Set<Screen>(['merchant', 'monument', 'armory', 'heroes', 'fortress', 'achievements', 'codex']);

export interface ScreenTransitionDecision {
  enabled: boolean;
  direction: ScreenTransitionDirection;
}

export function screenTransitionDecision(from: Screen, to: Screen, prefersReducedMotion: boolean): ScreenTransitionDecision {
  if (from === to || prefersReducedMotion || transitionExcludedScreens.has(from) || transitionExcludedScreens.has(to)) {
    return { enabled: false, direction: 'forward' };
  }

  const direction: ScreenTransitionDirection = (
    to === 'menu'
    || to === 'stages' && (mapFacilities.has(from) || from === 'result')
  ) ? 'back' : 'forward';

  return { enabled: true, direction };
}
