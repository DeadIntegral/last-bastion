import { describe, expect, it } from 'vitest';
import { screenTransitionDecision } from './screenTransitions';

describe('screen view transitions', () => {
  it('enhances React-owned navigation with its visual direction', () => {
    expect(screenTransitionDecision('stages', 'armory', false)).toEqual({ enabled: true, direction: 'forward' });
    expect(screenTransitionDecision('armory', 'stages', false)).toEqual({ enabled: true, direction: 'back' });
    expect(screenTransitionDecision('menu', 'credits', false)).toEqual({ enabled: true, direction: 'forward' });
    expect(screenTransitionDecision('credits', 'menu', false)).toEqual({ enabled: true, direction: 'back' });
  });

  it('never wraps the opening, Phaser battle lifecycle, or reduced-motion navigation', () => {
    expect(screenTransitionDecision('menu', 'opening', false).enabled).toBe(false);
    expect(screenTransitionDecision('stages', 'battle', false).enabled).toBe(false);
    expect(screenTransitionDecision('battle', 'result', false).enabled).toBe(false);
    expect(screenTransitionDecision('stages', 'heroes', true).enabled).toBe(false);
    expect(screenTransitionDecision('stages', 'stages', false).enabled).toBe(false);
  });
});
