import { describe, expect, it } from 'vitest';
import { battleHotkeyAction, isHeroSkillKey } from './controls';

describe('battle controls', () => {
  it('accepts Q as the hero skill shortcut and keeps Space as a compatibility shortcut', () => {
    expect(isHeroSkillKey('KeyQ')).toBe(true);
    expect(isHeroSkillKey('Space')).toBe(true);
    expect(isHeroSkillKey('KeyW')).toBe(false);
  });

  it('resolves physical battle keys while the Korean IME changes event.key', () => {
    const koreanKey = (key: string, code: string) => new KeyboardEvent('keydown', { key, code });
    expect(battleHotkeyAction(koreanKey('ㅂ', 'KeyQ').code)).toEqual({ type: 'heroSkill' });
    expect(battleHotkeyAction(koreanKey('ㄷ', 'KeyE').code)).toEqual({ type: 'mobilize' });
    expect(battleHotkeyAction(koreanKey('ㄱ', 'KeyR').code)).toEqual({ type: 'rally' });
    expect(battleHotkeyAction(koreanKey('ㅔ', 'KeyP').code)).toEqual({ type: 'pause' });
  });

  it('maps top-row and numpad formation keys by physical code', () => {
    expect(battleHotkeyAction('Digit1')).toEqual({ type: 'spawn', index: 0 });
    expect(battleHotkeyAction('Numpad7')).toEqual({ type: 'spawn', index: 6 });
    expect(battleHotkeyAction('Digit8')).toBeUndefined();
  });
});
