export function isHeroSkillKey(code: KeyboardEvent['code']): boolean {
  return code === 'KeyQ' || code === 'Space';
}
