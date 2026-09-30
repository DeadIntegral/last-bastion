import { fortressSkillTuning } from '../data/fortressSkills';
import { BattleEvent, battleEvents } from '../game/EventBus';
import type { BattleHudState, CastleBattleStats } from '../types/game';
import { Localized } from '../shared/i18n/Localized';
import { useTranslation } from '../shared/i18n/i18n';
import { GameButton } from './GameButton';

export function FortressAbilities({ hud, stats }: { hud: BattleHudState; stats: CastleBattleStats }) {
  const { t } = useTranslation();
  if (!stats.emergencySupplyAmount && !stats.centralTrapDamage) return null;
  const trapActive = hud.trapRemainingMs > 0;
  const trapState = trapActive ? hud.trapArmingMs > 0 ? '설치 중' : '매복 중' : hud.trapCooldownMs > 0 ? '재사용 대기' : '준비';
  return <Localized><div className="fortress-abilities" aria-label="성채 전술">
    {stats.emergencySupplyAmount > 0 && <GameButton size="small" className="fortress-ability supply-ability" data-tour="supply-skill" disabled={hud.paused || hud.supplyCooldownMs > 0 || hud.command >= hud.maxCommand}
      onClick={() => battleEvents.emit(BattleEvent.SUPPLY)}
      aria-label={t('긴급 보급 · 지휘력 +{amount} · 대기 {seconds}초 · {key}', { amount: stats.emergencySupplyAmount, seconds: Math.ceil(hud.supplyCooldownMs / 1000), key: fortressSkillTuning.supply.hotkey })}
      title={t('지휘력 +{amount} · 재사용 {seconds}초', { amount: stats.emergencySupplyAmount, seconds: fortressSkillTuning.supply.cooldownMs / 1000 })}>
      <kbd>{fortressSkillTuning.supply.hotkey}</kbd><span>보급</span><strong>{hud.supplyCooldownMs > 0 ? Math.ceil(hud.supplyCooldownMs / 1000) : `+${stats.emergencySupplyAmount}`}</strong>
    </GameButton>}
    {stats.centralTrapDamage > 0 && <GameButton size="small" data-tour="trap-skill" className={`fortress-ability trap-ability ${trapActive ? 'armed' : ''}`} disabled={hud.paused || hud.trapCooldownMs > 0 || trapActive}
      onClick={() => battleEvents.emit(BattleEvent.TRAP)}
      aria-label={t('중앙 함정 · {state} · 피해 {damage} · {seconds}초 · {key}', { state: t(trapState), damage: stats.centralTrapDamage, seconds: Math.ceil((trapActive ? hud.trapRemainingMs : hud.trapCooldownMs) / 1000), key: fortressSkillTuning.trap.hotkey })}
      title={t('중앙에 함정 설치 · 지상 피해 {damage} · 유지 {seconds}초', { damage: stats.centralTrapDamage, seconds: fortressSkillTuning.trap.lifetimeMs / 1000 })}>
      <kbd>{fortressSkillTuning.trap.hotkey}</kbd><span>{trapActive ? trapState : '함정'}</span><strong>{trapActive ? Math.ceil(hud.trapRemainingMs / 1000) : hud.trapCooldownMs > 0 ? Math.ceil(hud.trapCooldownMs / 1000) : '준비'}</strong>
    </GameButton>}
  </div></Localized>;
}
