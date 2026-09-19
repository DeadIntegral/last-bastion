import type { Screen } from '../types/game';

const transitionExcludedScreens = new Set<Screen>(['opening', 'battle']);

export function shouldUseScreenTransition(from: Screen, to: Screen, prefersReducedMotion: boolean): boolean {
  return from !== to
    && !prefersReducedMotion
    && !transitionExcludedScreens.has(from)
    && !transitionExcludedScreens.has(to);
}
