import { useEffect, useState, type CSSProperties } from 'react';
import { battleMobilizationTuning, castleBattleStats, rallyCommandTuning } from '../data/castle';
import { troopDefinitions, unitGradeLabels } from '../data/units';
import { getStage } from '../data/stages';
import { BattleEvent, battleEvents } from '../game/EventBus';
import { isHeroSkillKey } from '../game/controls';
import { cooldownFillRatio, formatTime, unitDeploymentCapacity, upgradedStats } from '../game/rules';
import { PhaserGame } from '../game/PhaserGame';
import { useGameStore } from '../store/useGameStore';
import { musicEngine } from '../audio/music';
import type { BattleHudState, BattleResult, UnitId } from '../types/game';
import { CharacterSprite } from './CharacterSprite';

interface BattleViewProps {
  stageId: number;
  onResult: (result: BattleResult) => void;
}

const initialHud: BattleHudState = {
  command: 70, maxCommand: 200, playerCastleHp: 1800, playerCastleMaxHp: 1800,
  enemyHp: 1, enemyMaxHp: 1, enemyName: '적 성채', heroHp: 520, heroMaxHp: 520,
  heroRespawnMs: 0, heroSkillCooldownMs: 0, spawnCooldowns: {}, elapsedMs: 0,
  unitCosts: {}, activeUnitCounts: {},
  heroSkillMaxCooldownMs: 25_000, heroName: '에드릭 · 철벽의 기사', heroSkillName: '수호의 결계', heroIcon: '♛',
  castleSkillCooldownMs: 0, castleSkillMaxCooldownMs: 32_000,
  mobilizationUses: 0, mobilizationMaxUses: battleMobilizationTuning.maxUses,
  rallyUnlocked: false, rallyHeroControl: false, rallyTranscendentControl: false,
  rallyTargeting: false, rallyTargetActive: false, rallyCooldownMs: 0, rallyCooldownMaxMs: 0,
  bossAwake: false, bossPhase: 1, bossHp: 0, bossMaxHp: 0, paused: false,
  battleSpeed: 1,
};

function PercentBar({ value, max, tone }: { value: number; max: number; tone: 'blue' | 'red' | 'gold' }) {
  const percent = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return (
    <div className={`meter meter-${tone}`}>
      <span style={{ width: `${percent}%` }} />
    </div>
  );
}

export function BattleView({ stageId, onResult }: BattleViewProps) {
  const equipmentLevels = useGameStore((state) => state.equipmentLevels);
  const equippedUnits = useGameStore((state) => state.equippedUnits);
  const unitMasteryXp = useGameStore((state) => state.unitMasteryXp);
  const selectedHero = useGameStore((state) => state.selectedHero);
  const heroEquipmentLevel = useGameStore((state) => state.heroEquipmentLevels[state.selectedHero]);
  const heroMasteryXp = useGameStore((state) => state.heroMasteryXp[state.selectedHero]);
  const castleTechLevels = useGameStore((state) => state.castleTechLevels);
  const muted = useGameStore((state) => state.muted);
  const toggleMuted = useGameStore((state) => state.toggleMuted);
  const battleSpeedUnlocked = useGameStore((state) => state.battleSpeedUnlocked);
  const battleSpeed = useGameStore((state) => state.battleSpeed);
  const toggleBattleSpeed = useGameStore((state) => state.toggleBattleSpeed);
  const toggleMusic = () => {
    const nextMuted = !muted;
    musicEngine.setMuted(nextMuted);
    toggleMuted();
    if (!nextMuted) void musicEngine.unlock();
  };
  const [hud, setHud] = useState(initialHud);
  const stage = getStage(stageId);
  const battleCastleStats = castleBattleStats(castleTechLevels);

  useEffect(() => {
    const onHud = (next: BattleHudState) => setHud(next);
    battleEvents.on(BattleEvent.HUD, onHud);
    battleEvents.on(BattleEvent.RESULT, onResult);
    return () => {
      battleEvents.off(BattleEvent.HUD, onHud);
      battleEvents.off(BattleEvent.RESULT, onResult);
    };
  }, [onResult]);

  useEffect(() => {
    if (battleSpeedUnlocked) battleEvents.emit(BattleEvent.SPEED, battleSpeed);
  }, [battleSpeed, battleSpeedUnlocked]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const index = Number(event.key) - 1;
      if (index >= 0 && index < equippedUnits.length) battleEvents.emit(BattleEvent.SPAWN, equippedUnits[index]);
      if (isHeroSkillKey(event.code)) {
        event.preventDefault();
        battleEvents.emit(BattleEvent.SKILL);
      }
      if (event.key.toLowerCase() === 'e') battleEvents.emit(BattleEvent.MOBILIZE);
      if (event.key.toLowerCase() === 'r') battleEvents.emit(BattleEvent.RALLY_MODE);
      if (event.key.toLowerCase() === 'p' || event.key === 'Escape') battleEvents.emit(BattleEvent.PAUSE);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [equippedUnits]);

  const spawn = (id: UnitId) => battleEvents.emit(BattleEvent.SPAWN, id);
  const pause = () => battleEvents.emit(BattleEvent.PAUSE);
  const canMobilize = hud.command >= hud.maxCommand && hud.mobilizationUses < hud.mobilizationMaxUses && !hud.paused;
  const rallyScope = ['1~4성 병사', hud.rallyHeroControl ? '영웅' : '', hud.rallyTranscendentControl ? '5성 초월 병종' : ''].filter(Boolean).join(' · ');

  return (
    <main className="battle-shell">
      <PhaserGame
        stageId={stageId}
        equipmentLevels={equipmentLevels}
        equippedUnits={equippedUnits}
        unitMasteryXp={unitMasteryXp}
        heroId={selectedHero}
        heroEquipmentLevel={heroEquipmentLevel}
        heroMasteryXp={heroMasteryXp}
        castleTechLevels={castleTechLevels}
        battleSpeed={battleSpeed}
      />

      <section className="battle-topbar" aria-label="전투 현황">
        <div className="fortress-status player-status">
          <div className="status-row"><span>아군 성채</span><strong>{hud.playerCastleHp}</strong></div>
          <PercentBar value={hud.playerCastleHp} max={hud.playerCastleMaxHp} tone="blue" />
        </div>
        <div className="battle-clock">
          <span className="eyebrow">STAGE {stageId}</span>
          <strong>{formatTime(hud.elapsedMs)}</strong>
          <small>{stage.terrain.name}</small>
        </div>
        <div className="fortress-status enemy-status">
          <div className="status-row"><strong>{hud.enemyHp}</strong><span>{hud.enemyName}</span></div>
          <PercentBar value={hud.enemyHp} max={hud.enemyMaxHp} tone="red" />
          {stage.boss && <small>{hud.bossHp <= 0 ? stage.challenge ? '마수 격파' : '마수 격파 · 성채를 파괴하세요' : !hud.bossAwake ? '경계 중 · 먼저 공격하면 돌진' : `${stage.bossName ?? '마수'} ${hud.bossHp}/${hud.bossMaxHp} · 흉폭 ${hud.bossPhase}단계`}</small>}
        </div>
      </section>

      <div className="battle-actions">
        <div className="hero-command">
          <button
            className="hero-portrait"
            onClick={() => battleEvents.emit(BattleEvent.SKILL)}
            disabled={hud.heroHp <= 0 || hud.heroSkillCooldownMs > 0 || hud.paused}
            aria-label={`${hud.heroName} ${hud.heroSkillName} 스킬, 단축키 Q`}
            title={`${hud.heroSkillName} (Q)`}
          >
            <kbd className="hero-hotkey">Q</kbd>
            <CharacterSprite id={selectedHero} className="battle-hero-art" />
            {hud.heroHp <= 0 ? (
              <span className="cooldown-mask">{Math.ceil(hud.heroRespawnMs / 1000)}</span>
            ) : hud.heroSkillCooldownMs > 0 ? (
              <span className="cooldown-mask">{Math.ceil(hud.heroSkillCooldownMs / 1000)}</span>
            ) : <span className="skill-ready">READY</span>}
          </button>
          <div className="hero-copy">
            <strong>{hud.heroSkillName}</strong>
            <span>{hud.heroHp > 0 ? `${hud.heroName} · 체력 ${hud.heroHp}` : `${hud.heroName} · 부활 대기`}</span>
          </div>
        </div>

        <div className="command-panel">
          <div className="command-readout">
            <span className="command-gem">✦</span>
            <strong>{hud.command}</strong><span>/ {hud.maxCommand}</span>
            <div className="command-track"><i style={{ width: `${hud.command / hud.maxCommand * 100}%` }} /></div>
            <button
              className={canMobilize ? 'mobilize-button ready' : 'mobilize-button'}
              disabled={!canMobilize}
              onClick={() => battleEvents.emit(BattleEvent.MOBILIZE)}
              aria-label={`${battleMobilizationTuning.name}, 최대 지휘력과 회복 속도 상승, 단축키 E, ${hud.mobilizationUses}/${hud.mobilizationMaxUses}회`}
              title={`지휘력 100% 소모 · 최대 +${battleCastleStats.mobilizationMaxCommandBonus} · 회복 +${battleCastleStats.mobilizationCommandRegenBonus}/초 (E)`}
            ><kbd>E</kbd><span>동원 {hud.mobilizationUses}/{hud.mobilizationMaxUses}</span></button>
          </div>
          <div className="unit-buttons" style={{ '--formation-slots': Math.max(4, equippedUnits.length) } as CSSProperties}>
            {equippedUnits.map((id, index) => {
              const unit = troopDefinitions[id];
              const deploymentSize = upgradedStats(unit, equipmentLevels[id]).squadSize;
              const cooldown = hud.spawnCooldowns[id] ?? 0;
              const cost = hud.unitCosts[id] ?? unit.cost;
              const activeCount = hud.activeUnitCounts[id] ?? 0;
              const remainingCapacity = unitDeploymentCapacity(unit, activeCount);
              const actualDeploymentSize = Math.min(deploymentSize, remainingCapacity);
              const atFieldLimit = remainingCapacity <= 0;
              const disabled = hud.command < cost || cooldown > 0 || hud.paused || atFieldLimit;
              const cooldownDuration = unit.spawnCooldownMs * battleCastleStats.summonCooldownMultiplier;
              const cooldownFill = cooldownFillRatio(cooldown, cooldownDuration) * 100;
              const cooldownLabel = cooldown > 0 ? `, 재사용 대기 ${(cooldown / 1000).toFixed(1)}초` : '';
              const fieldLimitLabel = unit.maxActivePerSide === undefined ? '' : `, 전장 ${activeCount}/${unit.maxActivePerSide}`;
              return (
                <button
                  key={id}
                  className={`unit-command unit-${id} ${cooldown > 0 ? 'summon-cooling' : !disabled ? 'summon-ready' : ''}`}
                  disabled={disabled}
                  onClick={() => spawn(id)}
                  aria-label={`${unit.name}, ${unit.grade}성 ${unitGradeLabels[unit.grade]}, ${actualDeploymentSize}명 소환, 지휘력 ${cost}${cooldownLabel}${fieldLimitLabel}`}
                >
                  <span className="hotkey">{index + 1}</span>
                  <CharacterSprite id={id} className="unit-icon battle-unit-art" />
                  <span className="unit-name">{unit.name}{deploymentSize > 1 ? ` ×${deploymentSize}` : ''} <i className={`battle-grade grade-${unit.grade}`}>{'★'.repeat(unit.grade)}</i></span>
                  <span className="unit-cost">✦ {cost}</span>
                  {unit.maxActivePerSide !== undefined && <span className={`unit-limit ${atFieldLimit ? 'at-limit' : ''}`}>전장 {activeCount}/{unit.maxActivePerSide}</span>}
                  {cooldown > 0 && (
                    <span className="summon-cooldown-wipe" style={{ height: `${cooldownFill}%` }} aria-hidden="true"><i /></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="battle-utility">
          {hud.rallyUnlocked && <div className="rally-controls">
            <button
              onClick={() => battleEvents.emit(BattleEvent.RALLY_MODE)}
              className={`rally-command-button ${hud.rallyTargeting ? 'targeting' : hud.rallyTargetActive ? 'active' : ''}`}
              disabled={(hud.rallyCooldownMs > 0 && !hud.rallyTargeting) || hud.paused}
              aria-label={`${rallyCommandTuning.name}, ${rallyScope} 지휘, 단축키 R${hud.rallyCooldownMs > 0 ? `, 재지정 대기 ${(hud.rallyCooldownMs / 1000).toFixed(1)}초` : ''}`}
              title={`${rallyScope}를 지정한 위치로 집결 (R)`}
            >
              <kbd>R</kbd><span>{hud.rallyTargeting ? '위치 선택' : hud.rallyCooldownMs > 0 ? Math.ceil(hud.rallyCooldownMs / 1000) : hud.rallyTargetActive ? '재지정' : '집결'}</span>
            </button>
            {hud.rallyTargetActive && <button className="rally-clear-button" onClick={() => battleEvents.emit(BattleEvent.RALLY_CLEAR)} disabled={hud.paused} aria-label="집결 명령 해제" title="집결 명령 해제">×</button>}
          </div>}
          <button
            onClick={() => battleEvents.emit(BattleEvent.CASTLE_SKILL)}
            className="castle-skill-button"
            disabled={hud.castleSkillCooldownMs > 0 || hud.paused}
            aria-label={`성채 포격, 최대 사거리 ${battleCastleStats.bombardRange}`}
            title={`가장 가까운 지상 적을 포격 · 최대 사거리 ${battleCastleStats.bombardRange}`}
          >
            <span>♜</span>
            <small>{hud.castleSkillCooldownMs > 0 ? Math.ceil(hud.castleSkillCooldownMs / 1000) : `포격 · ${battleCastleStats.bombardRange}`}</small>
          </button>
          {battleSpeedUnlocked && <button onClick={toggleBattleSpeed} className={`icon-button battle-speed-button ${hud.battleSpeed === 1.5 ? 'active' : ''}`} aria-label={`전투 속도 ${hud.battleSpeed}배, 눌러서 전환`} title="전투 속도 전환"><span>{hud.battleSpeed}×</span></button>}
          <button onClick={toggleMusic} className="icon-button" aria-label={muted ? '게임 사운드 켜기' : '게임 사운드 끄기'} title={muted ? '게임 사운드 켜기' : '게임 사운드 끄기'}>{muted ? '♩̸' : '♪'}</button>
          <button onClick={pause} className="icon-button" aria-label="일시정지">{hud.paused ? '▶' : 'Ⅱ'}</button>
        </div>
      </div>

      {hud.paused && (
        <div className="pause-overlay">
          <span>전투 일시정지</span>
          <button className="primary-button" onClick={pause}>계속하기</button>
        </div>
      )}
      {hud.rallyTargeting && <div className="rally-target-prompt" role="status"><b>⚑ 집결 위치 지정</b><span>전장 위 원하는 위치를 클릭하세요 · R 또는 Esc로 취소</span></div>}
      <div className="sr-only" aria-live="polite">
        영웅 스킬 재사용 대기 {Math.ceil(hud.heroSkillCooldownMs / 1000)}초
      </div>
    </main>
  );
}
