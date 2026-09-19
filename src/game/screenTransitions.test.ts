import { describe, expect, it } from 'vitest';
import { shouldUseScreenTransition } from './screenTransitions';

describe('screen view transitions', () => {
  it('enhances navigation between React-owned screens', () => {
    expect(shouldUseScreenTransition('stages', 'armory', false)).toBe(true);
    expect(shouldUseScreenTransition('armory', 'stages', false)).toBe(true);
    expect(shouldUseScreenTransition('menu', 'credits', false)).toBe(true);
    expect(shouldUseScreenTransition('credits', 'menu', false)).toBe(true);
  });

  it('never wraps the opening, Phaser battle lifecycle, or reduced-motion navigation', () => {
    expect(shouldUseScreenTransition('menu', 'opening', false)).toBe(false);
    expect(shouldUseScreenTransition('stages', 'battle', false)).toBe(false);
    expect(shouldUseScreenTransition('battle', 'result', false)).toBe(false);
    expect(shouldUseScreenTransition('stages', 'heroes', true)).toBe(false);
    expect(shouldUseScreenTransition('stages', 'stages', false)).toBe(false);
  });
});
