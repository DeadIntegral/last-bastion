export function isHeroSkillKey(code: KeyboardEvent['code']): boolean {
  return code === 'KeyQ' || code === 'Space';
}

export type BattleHotkeyAction =
  | { type: 'spawn'; index: number }
  | { type: 'heroSkill' | 'mobilize' | 'rally' | 'pause' };

export function battleHotkeyAction(code: KeyboardEvent['code']): BattleHotkeyAction | undefined {
  const formationKey = /^(?:Digit|Numpad)([1-7])$/.exec(code);
  if (formationKey) return { type: 'spawn', index: Number(formationKey[1]) - 1 };
  if (isHeroSkillKey(code)) return { type: 'heroSkill' };
  if (code === 'KeyE') return { type: 'mobilize' };
  if (code === 'KeyR') return { type: 'rally' };
  if (code === 'KeyP' || code === 'Escape') return { type: 'pause' };
  return undefined;
}
