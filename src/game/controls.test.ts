import { describe, expect, it } from 'vitest';
import { isHeroSkillKey } from './controls';

describe('battle controls', () => {
  it('accepts Q as the hero skill shortcut and keeps Space as a compatibility shortcut', () => {
    expect(isHeroSkillKey('KeyQ')).toBe(true);
    expect(isHeroSkillKey('Space')).toBe(true);
    expect(isHeroSkillKey('KeyW')).toBe(false);
  });
});
