import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ChangeEvent, type CSSProperties, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { allTroopOrder, bossDefinition, heroDefinitions, heroOrder, troopDefinitions, unitFamilyById, unitFamilyLabels } from './data/units';
import { bossCodex, CODEX_TOTAL, codexEntryCount, heroCodex, troopCodex } from './data/codex';
import { achievementById, achievementGroups, achievementProgress, achievements, featuredAchievement } from './data/achievements';
import { canUpgradeCastleTech, castleBattleStats, castleTechChildren, castleTechCost, castleTechDefinitions, castleTechPrerequisiteStatus, castleTechRoots, fortressTierDefinitions, totalCastleResearch } from './data/castle';
import { BATTLE_SPEED_LICENSE, DAILY_REWARD } from './data/economy';
import { gameFeatures, heroTrainingPackages, isGameFeatureUnlocked } from './data/features';
import { OPENING_SCENE_DURATION_MS, openingScenes } from './data/opening';
import { HERO_AWAKENING_LEVELS, HERO_MASTERY_MAX_LEVEL, heroAwakeningAuras, heroMasteryGrowth, heroSkillPower, soldierMasteryGrowth } from './data/mastery';
import { challengeStages, enemyFactionLabels, getStage, stages } from './data/stages';
import { localDateKey } from './game/daily';
import { analyzeCampaignDifficulty, stageDifficultyPresentation } from './game/difficulty';
import { musicEngine, type MusicScene } from './audio/music';
import { attackPatternLabel, equipmentCost, formatTime, hasEquipmentCapstone, heroAwakeningRank, heroMasteryLevelFromXp, heroRespawnReductionMs, masteryLevelFromXp, scaledHeroRespawnMs, scaledHeroSkillCooldownMs, scaledHeroSkillPower, scaledProgressionReward, upgradedStats } from './game/rules';
import { useGameStore } from './store/useGameStore';
import { CharacterSprite } from './components/CharacterSprite';
import type { BattleResult, CastleTechId, EquipmentSlot, FortressTier, HeroId, Screen, UnitDefinition, UnitFamily, UnitId } from './types/game';

const equipmentSlots: Array<{ id: EquipmentSlot; name: string; icon: string }> = [
  { id: 'weapon', name: '무기', icon: '⚔' },
  { id: 'armor', name: '갑옷', icon: '◆' },
  { id: 'boots', name: '군화', icon: '↟' },
];

function equipmentEffect(unit: UnitDefinition, slot: EquipmentSlot): string {
  if (slot === 'weapon') return `공격력 +${unit.equipmentGrowth.attack}`;
  if (slot === 'armor') return `체력 +${unit.equipmentGrowth.hp} · 방어 +${unit.equipmentGrowth.defense}`;
  return `이동 속도 +${unit.equipmentGrowth.moveSpeed}`;
}

function heroSkillPowerSummary(id: HeroId, masteryLevel: number): string {
  if (id === 'warden') {
    return `보호막 ${scaledHeroSkillPower(heroSkillPower.warden.shield, heroSkillPower.warden.shieldPerRank, heroSkillPower.warden.shieldPerAwakening, masteryLevel)}`;
  }
  if (id === 'pyromancer') {
    const unitDamage = scaledHeroSkillPower(heroSkillPower.pyromancer.unitDamage, heroSkillPower.pyromancer.unitDamagePerRank, heroSkillPower.pyromancer.unitDamagePerAwakening, masteryLevel);
    const castleDamage = scaledHeroSkillPower(heroSkillPower.pyromancer.castleDamage, heroSkillPower.pyromancer.castleDamagePerRank, heroSkillPower.pyromancer.castleDamagePerAwakening, masteryLevel);
    return `범위 피해 ${unitDamage} · 성채 ${castleDamage}`;
  }
  if (id === 'huntress') {
    const unitDamage = scaledHeroSkillPower(heroSkillPower.huntress.unitDamage, heroSkillPower.huntress.unitDamagePerRank, heroSkillPower.huntress.unitDamagePerAwakening, masteryLevel);
    const bossDamage = scaledHeroSkillPower(heroSkillPower.huntress.bossDamage, heroSkillPower.huntress.bossDamagePerRank, heroSkillPower.huntress.bossDamagePerAwakening, masteryLevel);
    return `전체 피해 ${unitDamage} · 보스 ${bossDamage}`;
  }
  if (id === 'saint') {
    const heal = scaledHeroSkillPower(heroSkillPower.saint.heal, heroSkillPower.saint.healPerRank, heroSkillPower.saint.healPerAwakening, masteryLevel);
    const castleHeal = scaledHeroSkillPower(heroSkillPower.saint.castleHeal, heroSkillPower.saint.castleHealPerRank, heroSkillPower.saint.castleHealPerAwakening, masteryLevel);
    return `아군 회복 ${heal} · 성채 ${castleHeal}`;
  }
  return `보호막 ${scaledHeroSkillPower(heroSkillPower.marshal.shield, heroSkillPower.marshal.shieldPerRank, heroSkillPower.marshal.shieldPerAwakening, masteryLevel)}`;
}

const BattleView = lazy(() => import('./components/BattleView').then((module) => ({ default: module.BattleView })));

function Wallet({ gold, gems }: { gold: number; gems: number }) {
  return <div className="wallet"><div className="gold-pill"><span>●</span><strong>{gold.toLocaleString()}</strong></div><div className="gem-pill"><span>◆</span><strong>{gems.toLocaleString()}</strong></div></div>;
}

function GrowthStat({ current, base }: { current: number; base: number }) {
  const delta = Math.round((current - base) * 10) / 10;
  const deltaLabel = delta > 0 ? `+${delta}` : delta < 0 ? String(delta) : '+0';
  return <span className="growth-stat" title={`기본 ${base}`} aria-label={`현재 ${current}, 기본 대비 ${deltaLabel}`}><span>{current}</span><small>{deltaLabel}</small></span>;
}

function ShellHeader({ title, onBack }: { title: string; onBack: () => void }) {
  const gold = useGameStore((state) => state.gold);
  const gems = useGameStore((state) => state.gems);
  return (
    <header className="shell-header">
      <button className="back-button" onClick={onBack} aria-label="뒤로 가기">‹</button>
      <div><span className="eyebrow">LAST BASTION</span><h1>{title}</h1></div>
      <Wallet gold={gold} gems={gems} />
    </header>
  );
}

function MainMenu({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const resetProgress = useGameStore((state) => state.resetProgress);
  const importSave = useGameStore((state) => state.importSave);
  const unlockedStage = useGameStore((state) => state.unlockedStage);
  const battles = useGameStore((state) => state.stats.battles);
  const clearedStages = useGameStore((state) => state.clearedStages);
  const gold = useGameStore((state) => state.gold);
  const [notice, setNotice] = useState('');
  const importRef = useRef<HTMLInputElement>(null);
  const hasStoredSave = typeof localStorage !== 'undefined' && localStorage.getItem('last-bastion-profile-v1') !== null;
  const hasSave = hasStoredSave || unlockedStage > 1 || battles > 0 || clearedStages.length > 0 || gold !== 100;

  const startNewGame = () => {
    if (hasSave && !window.confirm('현재 자동 저장 기록을 지우고 새 게임을 시작할까요?')) return;
    resetProgress();
    onNavigate('opening');
  };

  const loadFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const success = importSave(await file.text());
    if (success) onNavigate('stages');
    else {
      setNotice('올바른 Last Bastion 저장 JSON이 아닙니다.');
      window.setTimeout(() => setNotice(''), 2_200);
    }
  };

  return (
    <main className="menu-screen">
      <div className="menu-clouds" />
      <div className="menu-castle" aria-hidden="true">
        <span className="tower left" /><span className="keep" /><span className="tower right" />
      </div>
      <nav className="menu-top">
        <span className="version">PRE-ALPHA 0.1</span>
      </nav>
      <section className="title-lockup">
        <span className="title-crest">♜</span>
        <p>THE LAST LINE STANDS</p>
        <h1>LAST<br /><em>BASTION</em></h1>
        <div className="title-rule"><span>✦</span></div>
        <p className="korean-title">최후의 성채</p>
      </section>
      <section className="title-menu-actions">
        {hasSave ? <>
          <button className="title-menu-primary" onClick={() => onNavigate('stages')}><span>계속하기</span><small>CONTINUE · {Math.min(unlockedStage, stages.length)}장</small></button>
          <button onClick={startNewGame}><span>새 게임</span><small>NEW GAME</small></button>
        </> : <>
          <button className="title-menu-primary" onClick={startNewGame}><span>새 게임</span><small>NEW GAME</small></button>
          <button disabled><span>불러오기</span><small>저장 기록 없음</small></button>
        </>}
        <button onClick={() => importRef.current?.click()}><span>임포트</span><small>IMPORT SAVE</small></button>
        <button onClick={() => onNavigate('credits')}><span>크레딧</span><small>CREDITS</small></button>
        <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={loadFile} />
      </section>
      <p className="menu-tip">“대륙이 마왕군에 완전히 무너지기 전, 최후의 성채에서 반격하라.”</p>
      {notice && <div className="toast" role="status">{notice}</div>}
    </main>
  );
}

function Opening({ onComplete }: { onComplete: () => void }) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const scene = openingScenes[sceneIndex];
  const isLast = sceneIndex === openingScenes.length - 1;
  const advance = useCallback(() => {
    if (isLast) onComplete();
    else setSceneIndex((current) => current + 1);
  }, [isLast, onComplete]);

  useEffect(() => {
    const timer = window.setTimeout(advance, OPENING_SCENE_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [advance, sceneIndex]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onComplete();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onComplete]);

  return (
    <main className={`opening-screen opening-${scene.art}`} style={{ '--opening-duration': `${OPENING_SCENE_DURATION_MS}ms` } as CSSProperties}>
      <img className="opening-visual" src={scene.image} style={{ objectPosition: scene.imagePosition }} alt="" aria-hidden="true" key={scene.image} />
      <div className="opening-atmosphere" aria-hidden="true" />
      <div className="opening-preload" aria-hidden="true">
        {openingScenes.map((entry) => <img src={entry.image} alt="" key={entry.image} />)}
      </div>
      <button className="opening-skip" onClick={onComplete}>오프닝 건너뛰기 <span>Esc</span></button>
      <section className="opening-story" aria-live="polite" key={scene.title}>
        <span className="eyebrow">{scene.eyebrow}</span>
        <h1>{scene.title}</h1>
        <p>{scene.text}</p>
        <div className="opening-progress" aria-label={`오프닝 ${sceneIndex + 1}/${openingScenes.length}`}>
          {openingScenes.map((entry, index) => <i className={index < sceneIndex ? 'complete' : index === sceneIndex ? 'active' : ''} key={entry.title} />)}
        </div>
        <small>자동 재생 · {sceneIndex + 1} / {openingScenes.length}</small>
      </section>
    </main>
  );
}

function Credits({ onBack }: { onBack: () => void }) {
  return <main className="panel-screen credits-screen">
    <ShellHeader title="크레딧" onBack={onBack} />
    <section className="credits-card">
      <span className="title-crest">♜</span>
      <small>LAST BASTION · PRE-ALPHA</small>
      <h2>최후의 성채</h2>
      <p>마왕군에게 빼앗긴 대륙을 되찾는 웹 기반 횡스크롤 공성 전략 게임.</p>
      <dl><div><dt>GAME DESIGN & DEVELOPMENT</dt><dd>Player × AI Collaborative Project</dd></div><div><dt>ENGINE</dt><dd>React · Phaser · Vite</dd></div><div><dt>FONT</dt><dd>Pretendard Variable · Runtime CDN</dd></div><div><dt>AUDIO</dt><dd>Procedural Web Audio Soundtrack</dd></div></dl>
      <button className="primary-button" onClick={onBack}>타이틀로 돌아가기</button>
    </section>
  </main>;
}

const mapHeightPattern = [75, 57, 73, 45, 62, 28, 50, 72, 46, 65, 40, 23];
const mapStageSpacing = 185;
const mapPositions = stages.map((_, index) => ({ x: 135 + index * mapStageSpacing, y: mapHeightPattern[index % mapHeightPattern.length] }));
const challengeMapPositions: Record<number, { x: number; y: number }> = {
  101: { x: mapPositions[5].x + 55, y: 11 },
  102: { x: mapPositions[17].x + 35, y: 88 },
  103: { x: mapPositions[29].x - 110, y: 10 },
  104: { x: mapPositions[29].x + 95, y: 86 },
};
const campaignRegionNames = ['서부 변경', '점령 왕도', '오크 고원', '정령 설원', '마왕성 균열'];
const campaignDifficultyReport = analyzeCampaignDifficulty(stages);

function MapCommandCenter({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const selectedHero = useGameStore((state) => state.selectedHero);
  const unlockedAchievements = useGameStore((state) => state.unlockedAchievementIds);
  const claimedAchievements = useGameStore((state) => state.claimedAchievementIds);
  const codexEntries = useGameStore((state) => codexEntryCount(state.unlockedUnits, state.unlockedHeroes, state.discoveredEnemies));
  const clearedStages = useGameStore((state) => state.clearedStages);
  const lastDailyClaimDate = useGameStore((state) => state.lastDailyClaimDate);
  const claimDailyReward = useGameStore((state) => state.claimDailyReward);
  const battleSpeedUnlocked = useGameStore((state) => state.battleSpeedUnlocked);
  const muted = useGameStore((state) => state.muted);
  const toggleMuted = useGameStore((state) => state.toggleMuted);
  const [notice, setNotice] = useState('');
  const claimable = unlockedAchievements.filter((id) => !claimedAchievements.includes(id)).length;
  const dailyAvailable = lastDailyClaimDate !== localDateKey();
  const trainingUnlocked = isGameFeatureUnlocked('hero-training', clearedStages);
  const speedLicenseRevealed = clearedStages.includes(BATTLE_SPEED_LICENSE.unlockStage);

  const receiveDaily = () => {
    if (!claimDailyReward()) return;
    setNotice(`${DAILY_REWARD.label}: 왕실 보석 ${DAILY_REWARD.gems}개를 받았습니다.`);
    window.setTimeout(() => setNotice(''), 1_800);
  };

  const toggleMusic = () => {
    const nextMuted = !muted;
    musicEngine.setMuted(nextMuted);
    toggleMuted();
    if (!nextMuted) void musicEngine.unlock();
  };

  return <>
    <section className="map-command-center" aria-label="원정대 관리">
      <header><span>EXPEDITION</span><strong>왕국 운영</strong></header>
      <button onClick={() => onNavigate('armory')}><i>♢</i><span>병영과 강화<small>ARMORY · {allTroopOrder.length}</small></span></button>
      <button onClick={() => onNavigate('heroes')}><i>{heroDefinitions[selectedHero].icon}</i><span>영웅의 전당<small>{heroDefinitions[selectedHero].name}</small></span></button>
      <button onClick={() => onNavigate('fortress')}><i>♜</i><span>성채 기술<small>3 BRANCHES</small></span></button>
      <button className={trainingUnlocked ? '' : 'feature-locked'} disabled={!trainingUnlocked} onClick={() => onNavigate('training')}><i>♛</i><span>영웅 훈련소<small>{trainingUnlocked ? 'GOLD → HERO XP' : `${gameFeatures['hero-training'].unlockStage}장 클리어 시 해금`}</small></span></button>
      <button onClick={() => onNavigate('achievements')}><i>✦</i><span>업적 기록<small>{claimable ? `${claimable} 보상 대기` : `${unlockedAchievements.length}/${achievements.length}`}</small></span></button>
      <button onClick={() => onNavigate('codex')}><i>▤</i><span>전쟁 사전<small>{codexEntries}/{CODEX_TOTAL}</small></span></button>
      <button className={dailyAvailable ? 'daily-ready' : ''} disabled={!dailyAvailable} onClick={receiveDaily}><i>◆</i><span>{DAILY_REWARD.label}<small>{dailyAvailable ? `보석 ${DAILY_REWARD.gems}개 받기` : '오늘 수령 완료'}</small></span></button>
      <button className={speedLicenseRevealed ? 'merchant-ready' : 'feature-locked'} disabled={!speedLicenseRevealed} onClick={() => onNavigate('merchant')}><i>?</i><span>수수께끼 상인<small>{!speedLicenseRevealed ? `${BATTLE_SPEED_LICENSE.unlockStage}장 보스 격파 시 출현` : battleSpeedUnlocked ? '가속 허가 보유 · 상점 방문' : '희귀한 물건을 거래합니다'}</small></span></button>
      <button onClick={toggleMusic}><i>{muted ? '♩̸' : '♪'}</i><span>게임 사운드<small>{muted ? 'OFF' : 'ON'}</small></span></button>
    </section>
    {notice && <div className="toast" role="status">{notice}</div>}
  </>;
}

function MysteryMerchant({ onBack }: { onBack: () => void }) {
  const gems = useGameStore((state) => state.gems);
  const battleSpeedUnlocked = useGameStore((state) => state.battleSpeedUnlocked);
  const purchaseBattleSpeed = useGameStore((state) => state.purchaseBattleSpeed);
  const [notice, setNotice] = useState('');
  const canAfford = gems >= BATTLE_SPEED_LICENSE.cost;

  const buyBattleSpeed = () => {
    if (!purchaseBattleSpeed()) return;
    setNotice(`${BATTLE_SPEED_LICENSE.label}: 전투 1.5배속이 영구 해금되었습니다.`);
    window.setTimeout(() => setNotice(''), 1_800);
  };

  return (
    <main className="panel-screen merchant-screen">
      <ShellHeader title="수수께끼 상인" onBack={onBack} />
      <section className="merchant-intro">
        <div className="merchant-silhouette" aria-hidden="true"><span>?</span></div>
        <div>
          <span className="eyebrow">THE VEILED CARAVAN</span>
          <h2>“값을 치를 준비가 됐다면, 물건의 내력은 묻지 마시오.”</h2>
          <p>첫 마수의 성채가 무너진 뒤 나타난 정체불명의 행상인입니다. 업적과 일일 지원으로 모은 왕실 보석을 희귀한 영구 허가와 교환합니다.</p>
        </div>
      </section>
      <section className="merchant-shelf" aria-label="상인 판매 목록">
        <article className={`merchant-item ${battleSpeedUnlocked ? 'owned' : ''}`}>
          <div className="merchant-item-mark"><span>×1.5</span><small>PERMANENT</small></div>
          <div className="merchant-item-copy">
            <small>왕실 인장 · 희귀품</small>
            <h3>{BATTLE_SPEED_LICENSE.label}</h3>
            <p>{BATTLE_SPEED_LICENSE.description}</p>
            <ul><li>전투 HUD에서 1×와 1.5× 전환</li><li>모든 전투 시뮬레이션 시간에 동일 적용</li><li>한 번 구매하면 영구 보유</li></ul>
          </div>
          <div className="merchant-item-action">
            <span>보유 보석 <strong>◆ {gems.toLocaleString()}</strong></span>
            <button disabled={battleSpeedUnlocked || !canAfford} onClick={buyBattleSpeed}>
              {battleSpeedUnlocked ? '거래 완료' : canAfford ? `◆ ${BATTLE_SPEED_LICENSE.cost} · 구매` : `◆ ${BATTLE_SPEED_LICENSE.cost} · 보석 부족`}
            </button>
          </div>
        </article>
        <article className="merchant-empty"><span>◇</span><div><small>EMPTY DISPLAY</small><strong>천막의 빈 진열대</strong><p>상인은 다음 원정에서 새로운 물건을 구해 오겠다고 말합니다.</p></div></article>
      </section>
      {notice && <div className="toast" role="status">{notice}</div>}
    </main>
  );
}

export function StageSelect({ onBack, onSelect, onNavigate }: { onBack: () => void; onSelect: (id: number) => void; onNavigate: (screen: Screen) => void }) {
  const unlocked = useGameStore((state) => state.unlockedStage);
  const clearedStages = useGameStore((state) => state.clearedStages);
  const clearedChallenges = useGameStore((state) => state.clearedChallenges);
  const castleTechLevels = useGameStore((state) => state.castleTechLevels);
  const [selectedId, setSelectedId] = useState(Math.min(unlocked, stages.length));
  const [mapDragging, setMapDragging] = useState(false);
  const mapRef = useRef<HTMLElement>(null);
  const mapDragRef = useRef({ pointerId: -1, startX: 0, scrollLeft: 0, moved: false });
  const suppressMapClickRef = useRef(false);
  const selected = getStage(selectedId);
  const isChallenge = Boolean(selected.challenge);
  const locked = isChallenge ? !clearedStages.includes(selected.requiredCampaignStage ?? 1) : selected.id > unlocked;
  const cleared = isChallenge ? clearedChallenges.includes(selected.id) : clearedStages.includes(selected.id);
  const visibleRegionCount = Math.min(5, Math.max(1, Math.ceil(unlocked / 6)));
  const visibleStages = stages.slice(0, visibleRegionCount * 6);
  const visibleChallenges = challengeStages.filter((challenge) => clearedStages.includes(challenge.requiredCampaignStage ?? 1));
  const difficulty = stageDifficultyPresentation(selected, campaignDifficultyReport);
  const progressionStats = castleBattleStats(castleTechLevels);
  const displayedBattleReward = scaledProgressionReward(selected.reward, progressionStats.battleGoldMultiplier);
  const displayedFirstClearGold = selected.firstClearReward.gold === undefined
    ? undefined
    : scaledProgressionReward(selected.firstClearReward.gold, progressionStats.battleGoldMultiplier);
  const mapWidth = Math.max(1_320, visibleStages.length * mapStageSpacing + 260);
  const roadPath = visibleStages.map((stage, index) => {
    const position = mapPositions[stage.id - 1];
    return `${index === 0 ? 'M' : 'L'}${position.x} ${position.y * 5}`;
  }).join(' ');

  useEffect(() => {
    const map = mapRef.current;
    const position = isChallenge ? challengeMapPositions[selectedId] : mapPositions[selectedId - 1];
    if (!map || !position) return;
    map.scrollTo({ left: Math.max(0, position.x - map.clientWidth / 2), behavior: 'smooth' });
  }, [isChallenge, selectedId, visibleRegionCount]);

  const startMapDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    const map = mapRef.current;
    if (!map) return;
    mapDragRef.current = { pointerId: event.pointerId, startX: event.clientX, scrollLeft: map.scrollLeft, moved: false };
  };

  const moveMapDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const map = mapRef.current;
    const drag = mapDragRef.current;
    if (!map || drag.pointerId !== event.pointerId) return;
    const distance = event.clientX - drag.startX;
    if (!drag.moved && Math.abs(distance) < 6) return;
    if (!drag.moved) {
      drag.moved = true;
      map.setPointerCapture(event.pointerId);
    }
    setMapDragging(true);
    map.scrollLeft = drag.scrollLeft - distance;
    event.preventDefault();
  };

  const finishMapDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const map = mapRef.current;
    const drag = mapDragRef.current;
    if (!map || drag.pointerId !== event.pointerId) return;
    if (drag.moved) {
      suppressMapClickRef.current = true;
      window.setTimeout(() => { suppressMapClickRef.current = false; }, 0);
    }
    if (map.hasPointerCapture(event.pointerId)) map.releasePointerCapture(event.pointerId);
    mapDragRef.current.pointerId = -1;
    setMapDragging(false);
  };

  const selectMapStage = (event: ReactMouseEvent<HTMLButtonElement>, id: number) => {
    if (suppressMapClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    setSelectedId(id);
  };

  return (
    <main className="panel-screen campaign-map-screen">
      <ShellHeader title="왕국 지도" onBack={onBack} />
      <div className="map-shell-layout">
        <MapCommandCenter onNavigate={onNavigate} />
        <div className="map-content-column">
          <section className="map-heading">
            <div><span className="eyebrow">CAMPAIGN MAP</span><h2>대륙 탈환의 길</h2></div>
            <p><strong>해금 {Math.min(unlocked, stages.length)}/{stages.length} · 마수 영역 {visibleChallenges.length}/{challengeStages.length} · 지도를 잡아 드래그</strong><br />{visibleRegionCount > 1 ? `${campaignRegionNames[visibleRegionCount - 1]}까지 원정로가 개방되었습니다.` : '마왕군에게 빼앗긴 대륙을 서부 변경부터 되찾으세요.'}</p>
          </section>
          <div className="campaign-map-layout">
        <section
          className={`campaign-map ${visibleRegionCount > 1 ? 'expanded' : ''} ${mapDragging ? 'dragging' : ''}`}
          aria-label="캠페인 지도 · 좌우로 드래그하여 이동"
          ref={mapRef}
          onPointerDown={startMapDrag}
          onPointerMove={moveMapDrag}
          onPointerUp={finishMapDrag}
          onPointerCancel={finishMapDrag}
        >
          <div className="campaign-map-world" style={{ width: `${mapWidth}px` }} onDragStart={(event) => event.preventDefault()}>
          <div className="map-sea"><span>잿빛 해안</span></div>
          <div className="map-land" />
          <div className="map-mountains">▲ ▲<br /> ▲ ▲ ▲</div>
          <div className="map-forest forest-one">♠ ♠ ♠<br /> ♠ ♠</div>
          <div className="map-forest forest-two">♠ ♠<br />♠ ♠ ♠</div>
          {Array.from({ length: visibleRegionCount }, (_, index) => <span className="map-region" style={{ left: `${170 + index * 930}px`, top: `${index % 2 === 0 ? 14 : 82}%` }} key={campaignRegionNames[index]}>{campaignRegionNames[index]}</span>)}
          <svg className="campaign-road" viewBox={`0 0 ${mapWidth} 500`} preserveAspectRatio="none" aria-hidden="true">
            <path d={roadPath} />
            <path className="road-glow" d={roadPath} />
          </svg>
          {visibleStages.map((stage) => {
            const nodeLocked = stage.id > unlocked;
            const nodeCleared = clearedStages.includes(stage.id);
            const position = mapPositions[stage.id - 1];
            return (
              <button
                key={stage.id}
                className={`map-node ${stage.boss ? 'boss-node' : ''} ${nodeLocked ? 'locked' : ''} ${nodeCleared ? 'cleared' : ''} ${selectedId === stage.id ? 'selected' : ''}`}
                style={{ left: `${position.x}px`, top: `${position.y}%` }}
                onClick={(event) => selectMapStage(event, stage.id)}
                aria-label={`${stage.id}장 ${stage.name}${nodeLocked ? ' 잠김' : ''}`}
              >
                <span className="node-beacon">{nodeLocked ? '◆' : stage.boss ? '◉' : nodeCleared ? '✓' : stage.id}</span>
                <strong>{stage.name}</strong>
                <small>{stage.boss ? 'BOSS' : `0${stage.id}`}</small>
              </button>
            );
          })}
          {visibleChallenges.map((challenge) => {
            const position = challengeMapPositions[challenge.id];
            const challengeCleared = clearedChallenges.includes(challenge.id);
            return (
              <button
                key={challenge.id}
                className={`map-node challenge-map-node ${challengeCleared ? 'cleared' : ''} ${selectedId === challenge.id ? 'selected' : ''}`}
                style={{ left: `${position.x}px`, top: `${position.y}%` }}
                onClick={(event) => selectMapStage(event, challenge.id)}
                aria-label={`마수 도전 ${challenge.name}`}
              >
                <span className="challenge-rift" aria-hidden="true" />
                <span className="node-beacon">◉</span>
                <strong>{challenge.name}</strong>
                <small>{challengeCleared ? 'SUBJUGATED' : 'BEAST RIFT'}</small>
              </button>
            );
          })}
          <div className="map-compass"><span>✦</span><i>N</i></div>
          </div>
        </section>

        <aside className={`map-mission ${selected.boss ? 'boss-mission' : ''} ${isChallenge ? 'challenge-mission' : ''}`}>
          <div className="mission-number">{isChallenge ? '☠' : selected.boss ? '◉' : String(selected.id).padStart(2, '0')}</div>
          <span className="eyebrow">{isChallenge ? 'BEAST CHALLENGE' : selected.boss ? 'BOSS SIEGE' : `CHAPTER ${selected.id}`}</span>
          <h2>{selected.name}</h2>
          <div className={`difficulty difficulty-rank-${difficulty.rank}`} aria-label={`병력과 목표 데이터 기반 전투 평가 ${difficulty.label}, 5단계 중 ${difficulty.rank}단계`} title={`위협 지수 ${difficulty.threatIndex} · 성채, 병력, 증원, 정예, 보스, 전장 거리 분석`}>
            <span>전투 평가 <strong>{difficulty.label}</strong></span>
            <b aria-hidden="true">{'◆'.repeat(difficulty.rank)}<i>{'◇'.repeat(5 - difficulty.rank)}</i></b>
            <small>전투 데이터 분석</small>
          </div>
          <p>{locked ? '안개 너머의 지역입니다. 이전 전장을 먼저 정복해야 합니다.' : selected.subtitle}</p>
          <div className="stage-context"><span>적 세력 <b>{enemyFactionLabels[selected.enemyFaction]}</b></span><span>지형 <b>{selected.terrain.name}</b></span></div>
          {isChallenge && <div className="challenge-terrain-preview"><small>TERRAIN AMPLIFICATION</small><strong>적 HP ×{selected.terrain.enemyHpMultiplier} · 공격 ×{selected.terrain.enemyAttackMultiplier}</strong><span>{selected.terrain.description}</span></div>}
          <div className="mission-objective"><small>MISSION · 전선 거리 {selected.fortressDistance}</small><strong>{isChallenge ? `${selected.bossName ?? selected.name} 단독 격파` : selected.boss ? '성채 수비대와 마수를 돌파하고 적 성채 파괴' : '적 성채 파괴'}</strong></div>
          {selected.eliteGuard && <div className="elite-guard-preview"><small>ELITE DEFENDER</small><strong>{selected.eliteGuard.name}</strong><span>적 성채 앞을 지키는 단 한 명의 정예 수비대</span></div>}
          <div className={`first-clear-reward ${cleared ? 'claimed' : ''}`}>
            <span>{selected.firstClearReward.icon}</span>
            <div><small>{cleared ? 'FIRST CLEAR · 획득 완료' : 'FIRST CLEAR REWARD'}</small><strong>{selected.firstClearReward.label}</strong><p>{selected.firstClearReward.description}</p>{displayedFirstClearGold !== undefined && <em>연구 적용 골드 ● {displayedFirstClearGold}</em>}</div>
          </div>
          <div className="mission-footer"><span>{isChallenge ? '반복 보상' : '기본 보상'} <strong>● {displayedBattleReward}</strong>{progressionStats.battleGoldMultiplier > 1 && <small>전리품 회계 +{Math.round((progressionStats.battleGoldMultiplier - 1) * 100)}%</small>}</span><button disabled={locked} onClick={() => onSelect(selected.id)}>{locked ? '경로 잠김' : isChallenge ? cleared ? '다시 도전' : '마수에 도전' : cleared ? '다시 출정' : '출정하기'}</button></div>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}

function Armory({ onBack }: { onBack: () => void }) {
  const equipmentLevels = useGameStore((state) => state.equipmentLevels);
  const unlockedUnits = useGameStore((state) => state.unlockedUnits);
  const equippedUnits = useGameStore((state) => state.equippedUnits);
  const discoveredEnemies = useGameStore((state) => state.discoveredEnemies);
  const fortressTier = useGameStore((state) => state.fortressTier);
  const unitMasteryXp = useGameStore((state) => state.unitMasteryXp);
  const gold = useGameStore((state) => state.gold);
  const upgradeUnit = useGameStore((state) => state.upgradeUnitEquipment);
  const recruitUnit = useGameStore((state) => state.recruitUnit);
  const toggleEquippedUnit = useGameStore((state) => state.toggleEquippedUnit);
  const resetProgress = useGameStore((state) => state.resetProgress);
  const [notice, setNotice] = useState('');
  const [familyFilter, setFamilyFilter] = useState<UnitFamily | 'all'>('all');
  const visibleRoster = familyFilter === 'all' ? allTroopOrder : allTroopOrder.filter((id) => unitFamilyById[id] === familyFilter);

  const buy = (id: UnitId, slot: EquipmentSlot) => {
    const slotName = equipmentSlots.find((item) => item.id === slot)?.name ?? '장비';
    setNotice(upgradeUnit(id, slot) ? `${troopDefinitions[id].name}의 ${slotName} 장비가 강화되었습니다.` : '금화가 부족하거나 최고 장비 단계입니다.');
    window.setTimeout(() => setNotice(''), 1800);
  };

  const recruit = (id: UnitId) => {
    const requiredTier = troopDefinitions[id].requiredFortressTier ?? 1;
    setNotice(recruitUnit(id)
      ? `${troopDefinitions[id].name}이(가) 아군에 합류했습니다.`
      : fortressTier < requiredTier ? `성채를 ${requiredTier}티어로 승급해야 영입할 수 있습니다.` : '영입에 필요한 조우 기록이나 금화를 확인하세요.');
    window.setTimeout(() => setNotice(''), 1800);
  };

  const toggleFormation = (id: UnitId) => {
    const wasEquipped = equippedUnits.includes(id);
    setNotice(toggleEquippedUnit(id)
      ? `${troopDefinitions[id].name}을(를) 전투 편성에서 ${wasEquipped ? '제외' : '등록'}했습니다.`
      : '전투 편성은 1종 이상, 최대 4종까지 가능합니다.');
    window.setTimeout(() => setNotice(''), 1800);
  };

  const reset = () => {
    if (window.confirm('모든 금화와 업그레이드, 스테이지 진행도를 초기화할까요?')) resetProgress();
  };

  return (
    <main className="panel-screen armory-screen">
      <ShellHeader title="왕립 병영" onBack={onBack} />
      <section className="armory-intro">
        <div><span className="eyebrow">ARMORY</span><h2>병사 장비고</h2></div>
        <p>조우한 적 병종은 성채 티어에 맞는 영입 허가가 필요합니다. 보유 병종 중 최대 4종을 편성하고 성장시키세요.</p>
      </section>
      <section className="formation-strip">
        <div><span className="eyebrow">BATTLE FORMATION</span><strong>현재 편성 {equippedUnits.length}/4</strong></div>
        <div>{equippedUnits.map((id, index) => <span key={id}><i>{index + 1}</i>{troopDefinitions[id].icon} {troopDefinitions[id].name}</span>)}</div>
      </section>
      <nav className="roster-filters" aria-label="병종 계열 필터">
        <button className={familyFilter === 'all' ? 'active' : ''} onClick={() => setFamilyFilter('all')}>전체 <b>{allTroopOrder.length}</b></button>
        {(Object.entries(unitFamilyLabels) as Array<[UnitFamily, string]>).map(([family, label]) => (
          <button className={familyFilter === family ? 'active' : ''} onClick={() => setFamilyFilter(family)} key={family}>{label} <b>{allTroopOrder.filter((id) => unitFamilyById[id] === family).length}</b></button>
        ))}
      </nav>
      <div className="unit-grid">
        {visibleRoster.map((id) => {
          const unit = troopDefinitions[id];
          const equipment = equipmentLevels[id];
          const unlocked = unlockedUnits.includes(id);
          const encountered = discoveredEnemies.includes(id);
          const knownReward = id === 'archer' || id === 'lancer' || unit.recruitSource === 'challenge';
          const equipped = equippedUnits.includes(id);
          const requiredTier = unit.requiredFortressTier ?? 1;
          const tierLocked = fortressTier < requiredTier;
          const tierRecruitable = unit.requiresEncounter === false && !tierLocked;
          const known = unlocked || encountered || knownReward || tierRecruitable;
          const canRecruit = unit.recruitSource !== 'challenge' && (encountered || tierRecruitable);
          const mastery = masteryLevelFromXp(unitMasteryXp[id]);
          const stats = upgradedStats(unit, equipment, mastery.level);
          const equipmentCapstone = hasEquipmentCapstone(equipment);
          const closestCapstoneLevel = Math.max(...Object.values(equipment));
          return (
            <article className={`unit-card accent-${id} ${unlocked ? '' : 'unit-card-locked'} ${canRecruit && !unlocked && !tierLocked ? 'unit-card-recruitable' : ''}`} key={id}>
              <div className="unit-card-portrait">{known ? <CharacterSprite id={id} className="character-sprite-card" /> : <span>?</span>}<small>{unlocked ? `숙련 LV.${mastery.level}` : canRecruit ? tierLocked ? `성채 ${requiredTier}티어 필요` : '영입 가능' : knownReward ? '지도에서 해금' : '미조우'}</small></div>
              <div className="unit-card-copy">
                <span className="eyebrow">{known ? `${unitFamilyLabels[unitFamilyById[id]]} · ${unit.tags.includes('flying') ? 'AIRBORNE' : unit.tags.includes('mounted') ? 'CAVALRY' : unit.tags.includes('ranged') ? 'RANGED' : unit.tags.includes('armored') ? 'VANGUARD' : 'INFANTRY'}` : 'UNKNOWN'}</span>
                <h3>{known ? unit.name : '미확인 병종'}</h3>
                {unlocked ? <>
                  <div className="mastery-line"><b>숙련 LV.{mastery.level}</b><span>{mastery.requiredXp ? `${mastery.currentXp}/${mastery.requiredXp} XP` : 'MAX'}</span></div>
                  <div className="mastery-track"><i style={{ width: mastery.requiredXp ? `${mastery.currentXp / mastery.requiredXp * 100}%` : '100%' }} /></div>
                  <div className="mastery-benefit"><b>레벨당 고정 성장</b><span>HP +{soldierMasteryGrowth[id].hp} · 공격 +{soldierMasteryGrowth[id].attack}</span></div>
                  <div className="unit-deployment-traits"><span>1회 배치 <b>{stats.squadSize}명{equipmentCapstone ? ' (+1)' : ''}</b></span><span>공격 방식 <b>{attackPatternLabel(unit)}</b></span>{stats.healingPower && <span>치유 <b>{stats.healingPower} · 사거리 {stats.healingRange}</b></span>}{unit.maxActivePerSide && <span>전장 제한 <b>진영당 {unit.maxActivePerSide}명</b></span>}</div>
                  <dl>
                    <div><dt>생명력</dt><dd><GrowthStat current={stats.maxHp} base={unit.maxHp} /></dd></div>
                    <div><dt>공격 / 방어</dt><dd className="growth-pair"><GrowthStat current={stats.attackDamage} base={unit.attackDamage} /><i>/</i><GrowthStat current={stats.defense ?? 0} base={unit.defense ?? 0} /></dd></div>
                    <div><dt>이동속도</dt><dd><GrowthStat current={stats.moveSpeed} base={unit.moveSpeed} /></dd></div>
                  </dl>
                  <button className={`formation-button ${equipped ? 'equipped' : ''}`} onClick={() => toggleFormation(id)}>{equipped ? '편성 제외' : '전투 편성'} <span>{equipped ? 'ACTIVE' : `${equippedUnits.length}/4`}</span></button>
                  <div className={`equipment-capstone ${equipmentCapstone ? 'unlocked' : ''}`}>
                    <span>{equipmentCapstone ? '✦' : '◇'}</span>
                    <div><b>장비 완성 보너스</b><small>{equipmentCapstone ? '활성화 · 1회 배치 인원 +1' : `장비 하나를 5단계까지 강화 · ${closestCapstoneLevel}/5`}</small></div>
                  </div>
                  <div className="equipment-list">
                  {equipmentSlots.map((slot) => {
                    const level = equipment[slot.id];
                    const cost = equipmentCost(unit, level);
                    return <button key={slot.id} disabled={!unlocked || level >= 5 || gold < cost} onClick={() => buy(id, slot.id)}>
                      <i>{slot.icon}</i><span><b>{slot.name} +{level}</b><small>{equipmentEffect(unit, slot.id)}</small></span><em>{level >= 5 ? 'MAX' : `● ${cost}`}</em>
                    </button>;
                  })}
                  </div>
                </> : canRecruit ? <div className="recruit-panel"><p>{tierRecruitable && !encountered ? '성채 승급으로 정규 병종의 영입 허가가 열렸습니다.' : tierLocked ? `${requiredTier}티어 성채의 병영 허가가 필요한 병종입니다.` : '전장에서 확인한 병종입니다. 영입하면 적과 동일한 기본 능력으로 성장시킬 수 있습니다.'}</p><button disabled={tierLocked || gold < (unit.recruitCost ?? 0)} onClick={() => recruit(id)}>{tierLocked ? `${requiredTier}티어 승급 필요` : <>영입하기 <span>● {unit.recruitCost}</span></>}</button></div> : <p className="unknown-unit-copy">{unit.recruitSource === 'challenge' ? '마수 도전을 최초 격파하면 지형 보정이 없는 기본 개체가 합류합니다.' : knownReward ? '왕국 지도에서 해당 병종의 합류 조건을 확인하세요.' : unit.requiresEncounter === false ? `성채 ${requiredTier}티어 승급 시 정규 병종 정보와 영입 허가가 열립니다.` : '전장에서 직접 조우하면 병종 정보와 영입 협상이 열립니다.'}</p>}
              </div>
            </article>
          );
        })}
      </div>
      <button className="reset-button" onClick={reset}>진행 데이터 초기화</button>
      {notice && <div className="toast" role="status">{notice}</div>}
    </main>
  );
}

function HeroHall({ onBack }: { onBack: () => void }) {
  const gold = useGameStore((state) => state.gold);
  const selectedHero = useGameStore((state) => state.selectedHero);
  const unlockedHeroes = useGameStore((state) => state.unlockedHeroes);
  const heroEquipmentLevels = useGameStore((state) => state.heroEquipmentLevels);
  const heroMasteryXp = useGameStore((state) => state.heroMasteryXp);
  const unlockHero = useGameStore((state) => state.unlockHero);
  const selectHero = useGameStore((state) => state.selectHero);
  const upgradeHero = useGameStore((state) => state.upgradeHeroEquipment);
  const [notice, setNotice] = useState('');

  const notify = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 1800);
  };

  const recruit = (id: HeroId) => {
    const hero = heroDefinitions[id];
    if (unlockHero(id, hero.unlockCost)) {
      selectHero(id);
      notify(`${hero.name}이(가) 원정대에 합류했습니다.`);
    } else notify('영웅을 해금할 금화가 부족합니다.');
  };

  const train = (id: HeroId, slot: EquipmentSlot) => {
    const slotName = equipmentSlots.find((item) => item.id === slot)?.name ?? '장비';
    notify(upgradeHero(id, slot) ? `${heroDefinitions[id].name}의 ${slotName} 장비가 강화되었습니다.` : '금화가 부족하거나 최고 장비 단계입니다.');
  };

  return (
    <main className="panel-screen hero-hall-screen">
      <ShellHeader title="영웅의 전당" onBack={onBack} />
      <section className="armory-intro">
        <div><span className="eyebrow">HERO HALL</span><h2>원정대 지휘관</h2></div>
        <p>영웅은 무료로 출전하고 경험치로 숙련이 성장합니다. 금화는 장비 강화와 새로운 영웅 영입에 사용합니다.</p>
      </section>
      <div className="hero-roster">
        {heroOrder.map((id) => {
          const hero = heroDefinitions[id];
          const unlocked = unlockedHeroes.includes(id);
          const selected = selectedHero === id;
          const equipment = heroEquipmentLevels[id];
          const mastery = heroMasteryLevelFromXp(heroMasteryXp[id]);
          const stats = upgradedStats(hero, equipment, mastery.level);
          const respawnMs = scaledHeroRespawnMs(hero, mastery.level);
          const respawnReduction = heroRespawnReductionMs(hero, mastery.level);
          const skillCooldownMs = scaledHeroSkillCooldownMs(hero, mastery.level);
          const masteryGrowth = heroMasteryGrowth[id];
          const awakeningRank = heroAwakeningRank(mastery.level);
          const awakeningAura = heroAwakeningAuras[id];
          const nextAwakeningLevel = HERO_AWAKENING_LEVELS.find((level) => level > mastery.level);
          return (
            <article className={`hero-card hero-${id} ${selected ? 'selected' : ''} ${unlocked ? '' : 'hero-locked'}`} key={id}>
              <div className="hero-art">
                <CharacterSprite id={id} className="hero-character-art" />
                <div className="hero-level">{unlocked ? `숙련 ${mastery.level} · ${awakeningRank > 0 ? `각성 ${['', 'I', 'II', 'III'][awakeningRank]}` : '각성 전'}` : '미해금'}</div>
              </div>
              <div className="hero-info">
                <span className="eyebrow">{hero.title}</span>
                <h3>{hero.name}</h3>
                <p className="hero-description">{hero.description}</p>
                {unlocked && <><div className="mastery-line"><b>숙련 경험치</b><span>{mastery.requiredXp ? `${mastery.currentXp}/${mastery.requiredXp} XP` : 'MAX'}</span></div><div className="mastery-track"><i style={{ width: mastery.requiredXp ? `${mastery.currentXp / mastery.requiredXp * 100}%` : '100%' }} /></div><div className="awakening-track"><div>{HERO_AWAKENING_LEVELS.map((level, index) => <i className={mastery.level >= level ? 'active' : ''} key={level}>{index + 1}</i>)}</div><span>{nextAwakeningLevel ? `다음 각성 LV.${nextAwakeningLevel}` : '최종 각성 완료'}</span></div><div className="mastery-benefit hero-mastery-benefit"><b>레벨당 HP +{masteryGrowth.hp} · 공격 +{masteryGrowth.attack}</b><span>{heroSkillPowerSummary(id, mastery.level)}</span><span>재사용 {(skillCooldownMs / 1000).toFixed(1)}초 · 부활 -{(respawnReduction / 1000).toFixed(1)}초</span></div></>}
                <div className="hero-traits">
                  <div><span>PASSIVE</span><strong>{hero.passiveName}</strong><p>{hero.passiveDescription}</p></div>
                  <div className={awakeningRank > 0 ? 'awakening-aura-active' : ''}><span>AWAKENING AURA</span><strong>{awakeningAura.name}</strong><p>{awakeningRank > 0 ? `각성 ${awakeningRank}단계 · ${awakeningAura.description.replace(/\+\d+/, (value) => `+${Number(value.slice(1)) * awakeningRank}`)} · 범위 ${awakeningAura.radius}` : `숙련 10에 해금 · ${awakeningAura.description} · 범위 ${awakeningAura.radius}`}</p></div>
                  <div><span>ACTIVE</span><strong>{hero.skillName}</strong><p>{hero.skillDescription}</p></div>
                </div>
                <dl className="hero-stats">
                  <div><dt>생명력</dt><dd><GrowthStat current={stats.maxHp} base={hero.maxHp} /></dd></div>
                  <div><dt>공격 / 방어</dt><dd className="growth-pair"><GrowthStat current={stats.attackDamage} base={hero.attackDamage} /><i>/</i><GrowthStat current={stats.defense ?? 0} base={hero.defense ?? 0} /></dd></div>
                  <div><dt>이동속도</dt><dd><GrowthStat current={stats.moveSpeed} base={hero.moveSpeed} /></dd></div>
                  <div><dt>부활</dt><dd><GrowthStat current={respawnMs / 1000} base={hero.respawnMs / 1000} /></dd></div>
                </dl>
                {unlocked && <div className="equipment-list hero-equipment-list">
                  {equipmentSlots.map((slot) => {
                    const level = equipment[slot.id];
                    const cost = equipmentCost(hero, level);
                    return <button key={slot.id} disabled={level >= 5 || gold < cost} onClick={() => train(id, slot.id)}>
                      <i>{slot.icon}</i><span><b>{slot.name} +{level}</b><small>{equipmentEffect(hero, slot.id)}</small></span><em>{level >= 5 ? 'MAX' : `● ${cost}`}</em>
                    </button>;
                  })}
                </div>}
                <div className="hero-actions">
                  {!unlocked ? (
                    <button disabled={gold < hero.unlockCost} onClick={() => recruit(id)}>영입하기 <span>● {hero.unlockCost}</span></button>
                  ) : (
                    <>
                      <button className="select-hero" disabled={selected} onClick={() => selectHero(id)}>{selected ? '출전 중' : '출전 선택'}</button>
                    </>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {notice && <div className="toast" role="status">{notice}</div>}
    </main>
  );
}

function HeroTrainingGround({ onBack }: { onBack: () => void }) {
  const gold = useGameStore((state) => state.gold);
  const selectedHero = useGameStore((state) => state.selectedHero);
  const unlockedHeroes = useGameStore((state) => state.unlockedHeroes);
  const heroMasteryXp = useGameStore((state) => state.heroMasteryXp);
  const trainHeroMastery = useGameStore((state) => state.trainHeroMastery);
  const [notice, setNotice] = useState('');

  const train = (id: HeroId, packageId: typeof heroTrainingPackages[number]['id']) => {
    const trainingPackage = heroTrainingPackages.find((item) => item.id === packageId)!;
    const success = trainHeroMastery(id, packageId);
    setNotice(success ? `${heroDefinitions[id].name}이(가) ${trainingPackage.xp} XP를 획득했습니다.` : '금화가 부족하거나 이미 최고 숙련도입니다.');
    window.setTimeout(() => setNotice(''), 1_800);
  };

  return (
    <main className="panel-screen hero-training-screen">
      <ShellHeader title="영웅 훈련소" onBack={onBack} />
      <section className="armory-intro">
        <div><span className="eyebrow">ROYAL TRAINING GROUND</span><h2>전승과 모의전</h2></div>
        <p>9장에서 복구한 왕실 시설입니다. 남는 금화를 보유 영웅의 숙련 경험치로 전환하며, 전투로 얻는 경험치는 그대로 유지됩니다.</p>
      </section>
      <section className="training-roster">
        {unlockedHeroes.map((id) => {
          const hero = heroDefinitions[id];
          const mastery = heroMasteryLevelFromXp(heroMasteryXp[id]);
          const maxed = mastery.level >= HERO_MASTERY_MAX_LEVEL;
          return (
            <article className={`training-hero-card ${selectedHero === id ? 'selected' : ''}`} key={id}>
              <div className="training-hero-portrait"><CharacterSprite id={id} /><span>{selectedHero === id ? '출전 영웅' : hero.title}</span></div>
              <div className="training-hero-copy">
                <small>{hero.title}</small><h3>{hero.name}</h3>
                <div className="training-level"><strong>숙련 {mastery.level}/{HERO_MASTERY_MAX_LEVEL}</strong><span>{maxed ? 'MAX' : `${mastery.currentXp}/${mastery.requiredXp} XP`}</span></div>
                <div className="mastery-track"><i style={{ width: maxed ? '100%' : `${mastery.currentXp / mastery.requiredXp * 100}%` }} /></div>
                <div className="training-packages">
                  {heroTrainingPackages.map((trainingPackage) => (
                    <button key={trainingPackage.id} disabled={maxed || gold < trainingPackage.goldCost} onClick={() => train(id, trainingPackage.id)}>
                      <span><b>{trainingPackage.name}</b><small>{trainingPackage.description}</small></span>
                      <em>+{trainingPackage.xp} XP</em><strong>● {trainingPackage.goldCost.toLocaleString()}</strong>
                    </button>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </section>
      {notice && <div className="toast" role="status">{notice}</div>}
    </main>
  );
}

interface FortressTechNodeProps {
  id: CastleTechId;
  levels: Record<CastleTechId, number>;
  fortressTier: FortressTier;
  gold: number;
  onBuy: (id: CastleTechId) => void;
}

function FortressTechNode({ id, levels, fortressTier, gold, onBuy }: FortressTechNodeProps) {
  const definition = castleTechDefinitions[id];
  const level = levels[id] ?? 0;
  const tierLocked = fortressTier < definition.requiredTier;
  const available = canUpgradeCastleTech(id, levels, fortressTier);
  const cost = castleTechCost(definition, level);
  const maxed = level >= definition.maxLevel;
  const prerequisite = castleTechPrerequisiteStatus(id, levels);
  const grandfathered = level > 0 && prerequisite && !prerequisite.met;
  const children = castleTechChildren(id);

  return (
    <div className="tech-tree-node" role="treeitem" aria-label={`${definition.name}, ${level}/${definition.maxLevel}단계`} aria-expanded={children.length ? true : undefined}>
      <article className={`tech-node ${level ? 'researched' : ''} ${available ? '' : 'unavailable'}`}>
        <span className="tech-icon">{definition.icon}</span>
        <div>
          <strong>{definition.name}<em>T{definition.requiredTier}</em></strong>
          <small>{definition.description}</small>
          {prerequisite && (
            <small className={`tech-requirement ${prerequisite.met || grandfathered ? 'met' : 'missing'}`}>
              {prerequisite.label}{grandfathered ? ' · 기존 연구 보존' : ''}
            </small>
          )}
        </div>
        <div className="tech-ranks" aria-label={`연구 단계 ${level}/${definition.maxLevel}`}>
          {Array.from({ length: definition.maxLevel }, (_, rank) => <b key={rank} className={rank < level ? 'filled' : ''} />)}
        </div>
        <button disabled={maxed || !available || gold < cost} onClick={() => onBuy(id)}>
          {maxed ? '연구 완료' : tierLocked ? `${definition.requiredTier}티어 성채 필요` : !available && prerequisite ? `${prerequisite.name} ${prerequisite.requiredLevel}단계 필요 · 현재 ${prerequisite.currentLevel}` : <>연구 <span>● {cost}</span></>}
        </button>
      </article>
      {children.length > 0 && (
        <div className={`tech-tree-children children-${children.length}`} role="group">
          {children.map((childId) => (
            <FortressTechNode key={childId} id={childId} levels={levels} fortressTier={fortressTier} gold={gold} onBuy={onBuy} />
          ))}
        </div>
      )}
    </div>
  );
}

function DraggableTechTreeViewport({ label, children }: { label: string; children: ReactNode }) {
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ pointerId: -1, startX: 0, scrollLeft: 0, moved: false, viewport: null as HTMLElement | null });
  const suppressClickRef = useRef(false);

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: event.currentTarget.scrollLeft,
      moved: false,
      viewport: event.currentTarget,
    };
  };

  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag.viewport || drag.pointerId !== event.pointerId) return;
    const distance = event.clientX - drag.startX;
    if (!drag.moved && Math.abs(distance) < 6) return;
    if (!drag.moved) {
      drag.moved = true;
      drag.viewport.setPointerCapture(event.pointerId);
    }
    setDragging(true);
    drag.viewport.scrollLeft = drag.scrollLeft - distance;
    event.preventDefault();
  };

  const finishDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag.viewport || drag.pointerId !== event.pointerId) return;
    if (drag.moved) {
      suppressClickRef.current = true;
      window.setTimeout(() => { suppressClickRef.current = false; }, 0);
    }
    if (drag.viewport.hasPointerCapture(event.pointerId)) drag.viewport.releasePointerCapture(event.pointerId);
    drag.pointerId = -1;
    drag.viewport = null;
    setDragging(false);
  };

  const suppressDraggedClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!suppressClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div
      className={`tech-tree-viewport ${dragging ? 'dragging' : ''}`}
      aria-label={`${label} · 좌우로 드래그하여 이동`}
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      onClickCapture={suppressDraggedClick}
      onDragStart={(event) => event.preventDefault()}
    >
      {children}
    </div>
  );
}

export function FortressWorkshop({ onBack }: { onBack: () => void }) {
  const gold = useGameStore((state) => state.gold);
  const fortressTier = useGameStore((state) => state.fortressTier);
  const levels = useGameStore((state) => state.castleTechLevels);
  const promote = useGameStore((state) => state.promoteFortress);
  const upgrade = useGameStore((state) => state.upgradeCastleTech);
  const [notice, setNotice] = useState('');
  const stats = castleBattleStats(levels);
  const researchTotal = totalCastleResearch(levels);
  const nextTier = fortressTier < 3 ? fortressTierDefinitions[(fortressTier + 1) as 2 | 3] : undefined;
  const branches = [
    { id: 'economy', name: '지휘·보급 체계', description: '병력 전개와 전투 이후의 골드·숙련 성장을 개선합니다.' },
    { id: 'defense', name: '성벽 공학', description: '성채를 강화하고 접근한 적을 자동 공격합니다.' },
    { id: 'artillery', name: '왕실 포병대', description: '직접 사용하는 포격의 위력을 개선합니다.' },
  ] as const;

  const buy = (id: CastleTechId) => {
    const definition = castleTechDefinitions[id];
    setNotice(upgrade(id) ? `${definition.name} 연구가 완료되었습니다.` : '선행 기술이나 금화를 확인하세요.');
    window.setTimeout(() => setNotice(''), 1800);
  };

  const promoteTier = () => {
    setNotice(promote() ? `${nextTier?.name ?? '성채'} 승급이 완료되었습니다.` : '승급에 필요한 누적 연구나 금화를 확인하세요.');
    window.setTimeout(() => setNotice(''), 1800);
  };

  return (
    <main className="panel-screen fortress-screen">
      <ShellHeader title="성채 기술" onBack={onBack} />
      <section className="armory-intro">
        <div><span className="eyebrow">FORTRESS</span><h2>최후의 방벽</h2></div>
        <p>연구를 누적해 성채 티어를 승급하고, 상위 기술과 새로운 용병 영입 허가를 개방하세요.</p>
      </section>
      <section className={`fortress-tier-banner tier-${fortressTier}`}>
        <div className="tier-crest"><span>♜</span><b>TIER {fortressTier}</b></div>
        <div className="tier-copy"><span className="eyebrow">FORTRESS RANK</span><h3>{fortressTierDefinitions[fortressTier].name}</h3><p>{fortressTierDefinitions[fortressTier].description}</p><strong>{fortressTierDefinitions[fortressTier].unlocks}</strong></div>
        <div className="tier-progress">
          {nextTier ? <>
            <div><span>누적 연구</span><b>{Math.min(researchTotal, nextTier.requiredResearch)} / {nextTier.requiredResearch}</b></div>
            <div className="tier-progress-track"><i style={{ width: `${Math.min(100, researchTotal / nextTier.requiredResearch * 100)}%` }} /></div>
            <button disabled={researchTotal < nextTier.requiredResearch || gold < nextTier.promotionCost} onClick={promoteTier}>{researchTotal < nextTier.requiredResearch ? `연구 ${nextTier.requiredResearch - researchTotal}회 필요` : <>성채 승급 <span>● {nextTier.promotionCost}</span></>}</button>
            <small>승급 보상: {nextTier.unlocks}</small>
          </> : <><b>최고 티어 달성</b><small>모든 성채 연구와 용병 영입 허가가 개방되었습니다.</small></>}
        </div>
      </section>
      <section className="castle-summary">
        <div><span>시작 지휘력</span><strong>{stats.startingCommand}</strong></div>
        <div><span>초당 회복</span><strong>{stats.commandRegen}</strong></div>
        <div><span>최대 지휘력</span><strong>{stats.maxCommand}</strong></div>
        <div><span>성채 체력</span><strong>{stats.maxHp}</strong></div>
        <div><span>피해 감소</span><strong>{stats.damageReduction}</strong></div>
        <div><span>망루 공격</span><strong>{stats.towerDamage}</strong></div>
        <div><span>소환 대기</span><strong>-{Math.round((1 - stats.summonCooldownMultiplier) * 100)}%</strong></div>
        <div><span>소환 비용</span><strong>-{Math.round((1 - stats.summonCostMultiplier) * 100)}%</strong></div>
        <div><span>처치 지휘력</span><strong>{stats.commandPerKill}</strong></div>
        <div><span>포격 피해</span><strong>{stats.bombardDamage}</strong></div>
        <div><span>전투 골드</span><strong>+{Math.round((stats.battleGoldMultiplier - 1) * 100)}%</strong></div>
        <div><span>전투 숙련 XP</span><strong>+{Math.round((stats.masteryXpMultiplier - 1) * 100)}%</strong></div>
      </section>
      <div className="tech-branches">
        {branches.map((branch) => (
          <section className={`tech-branch branch-${branch.id}`} key={branch.id}>
            <header><span className="eyebrow">{branch.id}</span><h3>{branch.name}</h3><p>{branch.description}</p></header>
            <DraggableTechTreeViewport label={branch.name}>
              <div className="tech-tree-guide" aria-hidden="true"><span>선행 기술</span><b>→</b><span>후속 기술</span><em>노드의 T 표시는 필요한 성채 티어입니다</em></div>
              <div className="tech-tree" role="tree" aria-label={`${branch.name} 기술 트리`}>
                {castleTechRoots(branch.id)
                  .map((id) => <FortressTechNode key={id} id={id} levels={levels} fortressTier={fortressTier} gold={gold} onBuy={buy} />)}
              </div>
            </DraggableTechTreeViewport>
          </section>
        ))}
      </div>
      {notice && <div className="toast" role="status">{notice}</div>}
    </main>
  );
}

function Achievements({ onBack }: { onBack: () => void }) {
  const stats = useGameStore((state) => state.stats);
  const unlocked = useGameStore((state) => state.unlockedAchievementIds);
  const claimed = useGameStore((state) => state.claimedAchievementIds);
  const claim = useGameStore((state) => state.claimAchievement);
  const [notice, setNotice] = useState('');
  const [viewMode, setViewMode] = useState<'grouped' | 'all'>('grouped');

  const receive = (id: string) => {
    if (claim(id)) {
      const achievement = achievementById[id];
      setNotice(`${achievement.name}: 금화 ${achievement.goldReward}, 왕실 보석 ${achievement.gemReward}개를 받았습니다.`);
      window.setTimeout(() => setNotice(''), 1800);
    }
  };

  const renderAchievement = (achievement: (typeof achievements)[number], group?: (typeof achievementGroups)[number]) => {
    const progress = achievementProgress(achievement, stats);
    const isUnlocked = unlocked.includes(achievement.id);
    const isClaimed = claimed.includes(achievement.id);
    const percent = Math.min(100, progress / achievement.target * 100);
    const step = group ? group.achievements.findIndex((entry) => entry.id === achievement.id) + 1 : 0;
    const claimedSteps = group ? group.achievements.filter((entry) => claimed.includes(entry.id)).length : 0;
    const claimableSteps = group ? group.achievements.filter((entry) => unlocked.includes(entry.id) && !claimed.includes(entry.id)).length : 0;
    return (
      <article className={`achievement-card category-${achievement.category} ${isUnlocked ? 'unlocked' : ''} ${group && group.achievements.length > 1 ? 'stacked' : ''}`} key={achievement.id}>
        <span className="achievement-icon">{achievement.icon}</span>
        <div className="achievement-copy">
          <small>{group ? `${group.label} · ${step}/${group.achievements.length}단계` : achievement.category}</small><h3>{achievement.name}</h3><p>{achievement.description}</p>
          <div className="achievement-progress"><i style={{ width: `${percent}%` }} /></div>
          <span className="progress-copy">{Math.min(progress, achievement.target)} / {achievement.target}</span>
          {group && <span className="achievement-series-progress">수령 {claimedSteps}/{group.achievements.length}{claimableSteps > 0 ? ` · 보상 대기 ${claimableSteps}` : ''}</span>}
        </div>
        <div className="achievement-reward">
          <div className="achievement-currencies"><strong>● {achievement.goldReward}</strong><strong>◆ {achievement.gemReward}</strong></div>
          <button disabled={!isUnlocked || isClaimed} onClick={() => receive(achievement.id)}>{isClaimed ? '수령 완료' : isUnlocked ? '보상 받기' : '진행 중'}</button>
        </div>
      </article>
    );
  };

  return (
    <main className="panel-screen achievements-screen">
      <ShellHeader title="업적 기록" onBack={onBack} />
      <section className="armory-intro">
        <div><span className="eyebrow">ACHIEVEMENTS</span><h2>왕국 연대기</h2></div>
        <p>승리와 패배, 희생과 지휘의 모든 기록이 남습니다. 달성한 업적에서 금화와 왕실 보석을 받으세요.</p>
      </section>
      <section className="career-stats">
        <div><span>전투</span><strong>{stats.battles}</strong></div><div><span>승리</span><strong>{stats.victories}</strong></div>
        <div><span>패배</span><strong>{stats.defeats}</strong></div><div><span>처치</span><strong>{stats.kills}</strong></div>
        <div><span>병사 전사</span><strong>{stats.unitDeaths}</strong></div><div><span>최고 연승</span><strong>{stats.maxWinStreak}</strong></div>
      </section>
      <section className="achievement-toolbar">
        <div><strong>{viewMode === 'grouped' ? `${achievementGroups.length}개 업적 계열` : `전체 ${achievements.length}개`}</strong><span>{viewMode === 'grouped' ? '보상 대기 단계와 다음 목표를 우선 표시합니다.' : '모든 단계별 업적을 펼쳐 봅니다.'}</span></div>
        <div className="achievement-view-toggle" role="group" aria-label="업적 표시 방식">
          <button aria-pressed={viewMode === 'grouped'} onClick={() => setViewMode('grouped')}>묶음 보기</button>
          <button aria-pressed={viewMode === 'all'} onClick={() => setViewMode('all')}>전체 보기</button>
        </div>
      </section>
      <div className={`achievement-grid ${viewMode}`}>
        {viewMode === 'grouped'
          ? achievementGroups.map((group) => renderAchievement(featuredAchievement(group, unlocked, claimed), group))
          : achievements.map((achievement) => renderAchievement(achievement))}
      </div>
      {notice && <div className="toast" role="status">{notice}</div>}
    </main>
  );
}

function WarCodex({ onBack }: { onBack: () => void }) {
  const unlockedUnits = useGameStore((state) => state.unlockedUnits);
  const unlockedHeroes = useGameStore((state) => state.unlockedHeroes);
  const discoveredEnemies = useGameStore((state) => state.discoveredEnemies);
  const visibleTroops = allTroopOrder.filter((id) => unlockedUnits.includes(id) || discoveredEnemies.includes(id));
  const completion = codexEntryCount(unlockedUnits, unlockedHeroes, discoveredEnemies);
  const percent = Math.round(completion / CODEX_TOTAL * 100);

  return (
    <main className="panel-screen codex-screen">
      <ShellHeader title="전쟁 사전" onBack={onBack} />
      <section className="codex-heading">
        <div><span className="eyebrow">WAR CODEX</span><h2>발견된 존재의 기록</h2><p>영입하거나 전장에서 직접 조우한 존재만 연대기에 기록됩니다.</p></div>
        <div className="codex-completion"><span>{percent}%</span><div><i style={{ width: `${percent}%` }} /></div><small>{completion} / {CODEX_TOTAL} ENTRIES</small></div>
      </section>

      <section className="codex-section">
        <header><span>♟</span><div><small>SHARED TROOPS</small><h3>확보·조우 병종</h3></div><b>{visibleTroops.length}/{allTroopOrder.length}</b></header>
        <div className="codex-grid">
          {visibleTroops.map((id) => {
            const entry = troopCodex[id];
            const unit = troopDefinitions[id];
            const acquired = unlockedUnits.includes(id);
            const encountered = discoveredEnemies.includes(id);
            return <article className="codex-card allied-entry" key={id}><span className="codex-icon"><CharacterSprite id={id} className="codex-character-art" /></span><div><small>{entry.role}</small><h4>{entry.title}</h4><div className="codex-tags">{acquired && <b>아군 확보</b>}{encountered && <b className="enemy-tag">적군 조우</b>}</div><p>{entry.description}</p><blockquote>{entry.lore}</blockquote><dl><div><dt>HP</dt><dd>{unit.maxHp}</dd></div><div><dt>ATK</dt><dd>{unit.attackDamage}</dd></div><div><dt>RANGE</dt><dd>{unit.attackRange}</dd></div></dl></div></article>;
          })}
        </div>
      </section>

      <section className="codex-section">
        <header><span>♛</span><div><small>HEROES</small><h3>원정대 영웅</h3></div><b>{unlockedHeroes.length}/3</b></header>
        <div className="codex-grid">
          {unlockedHeroes.map((id) => {
            const entry = heroCodex[id];
            const hero = heroDefinitions[id];
            return <article className="codex-card hero-entry" key={id}><span className="codex-icon"><CharacterSprite id={id} className="codex-character-art" /></span><div><small>{entry.role}</small><h4>{entry.title}</h4><p>{entry.description}</p><blockquote>{entry.lore}</blockquote><dl><div><dt>HP</dt><dd>{hero.maxHp}</dd></div><div><dt>ATK</dt><dd>{hero.attackDamage}</dd></div><div><dt>REVIVE</dt><dd>{hero.respawnMs / 1000}s</dd></div></dl></div></article>;
          })}
        </div>
      </section>

      {discoveredEnemies.includes('boss') && <section className="codex-section enemy-codex-section">
        <header><span>☠</span><div><small>BOSS</small><h3>조우한 거대 개체</h3></div><b>1/1</b></header>
        <div className="codex-grid">
          <article className="codex-card enemy-entry boss-entry"><span className="codex-icon">{bossDefinition.icon}</span><div><small>{bossCodex.boss.role}</small><h4>{bossCodex.boss.title}</h4><p>{bossCodex.boss.description}</p><blockquote>{bossCodex.boss.lore}</blockquote><dl><div><dt>HP</dt><dd>{bossDefinition.maxHp}</dd></div><div><dt>ATK</dt><dd>{bossDefinition.attackDamage}</dd></div><div><dt>RANGE</dt><dd>{bossDefinition.attackRange}</dd></div></dl></div></article>
        </div>
      </section>}
      {completion < CODEX_TOTAL && <p className="codex-missing">아직 기록되지 않은 항목 {CODEX_TOTAL - completion}개 · 지도 탐험과 영웅 영입을 계속하세요.</p>}
    </main>
  );
}

function ResultScreen({ result, onMenu, onRetry }: { result: BattleResult; onMenu: () => void; onRetry: () => void }) {
  return (
    <main className={`result-screen ${result.victory ? 'victory' : 'defeat'}`}>
      <div className="result-rays" />
      <section className="result-card">
        <span className="result-emblem">{result.victory ? '♜' : '♞'}</span>
        <span className="eyebrow">BATTLE REPORT</span>
        <h1>{result.victory ? '승리' : '퇴각'}</h1>
        <p>{result.victory ? '전선이 다시 왕국의 깃발 아래 놓였습니다.' : '성채는 무너졌지만, 병사들은 다시 일어설 것입니다.'}</p>
        <div className="result-stats">
          <div><span>전투 시간</span><strong>{formatTime(result.elapsedMs)}</strong></div>
          <div><span>적 처치</span><strong>{result.kills}</strong></div>
          <div><span>아군 전사</span><strong>{result.unitsLost}</strong></div>
          <div><span>획득 금화</span><strong>● {result.reward}</strong></div>
        </div>
        {result.masteryGains && result.masteryGains.length > 0 && (
          <div className="result-progression">
            <span className="eyebrow">MASTERY XP</span>
            <div>{result.masteryGains.map((gain) => {
              const name = gain.kind === 'unit' ? troopDefinitions[gain.id as UnitId].name : heroDefinitions[gain.id as HeroId].name;
              return <span key={`${gain.kind}-${gain.id}`}>{name} <strong>+{gain.amount} XP</strong></span>;
            })}</div>
          </div>
        )}
        {result.newAchievements && result.newAchievements.length > 0 && (
          <div className="result-achievements">
            <span className="eyebrow">ACHIEVEMENT UNLOCKED</span>
            {result.newAchievements.map((id) => <strong key={id}>{achievementById[id].icon} {achievementById[id].name}</strong>)}
          </div>
        )}
        {result.firstClearReward && (
          <div className="result-first-clear">
            <span>{result.firstClearReward.icon}</span>
            <div><small>FIRST CLEAR REWARD</small><strong>{result.firstClearReward.label}</strong><p>{result.firstClearReward.description}</p>{result.firstClearReward.gold !== undefined && <em>실제 획득 ● {result.firstClearReward.gold}</em>}</div>
          </div>
        )}
        <div className="result-actions">
          <button className="primary-button" onClick={onRetry}>다시 도전</button>
          <button className="plain-button" onClick={onMenu}>왕국 지도로 돌아가기</button>
        </div>
      </section>
    </main>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [stageId, setStageId] = useState(1);
  const [result, setResult] = useState<BattleResult | null>(null);
  const addReward = useGameStore((state) => state.addReward);
  const recordBattle = useGameStore((state) => state.recordBattle);
  const completeStage = useGameStore((state) => state.completeStage);
  const completeChallenge = useGameStore((state) => state.completeChallenge);
  const muted = useGameStore((state) => state.muted);

  useEffect(() => {
    const musicScene: MusicScene = screen === 'battle' ? 'battle' : screen === 'result' ? result?.victory ? 'victory' : 'defeat' : 'menu';
    musicEngine.setScene(musicScene);
  }, [screen, result?.victory]);

  useEffect(() => {
    musicEngine.setMuted(muted);
  }, [muted]);

  useEffect(() => {
    const unlockMusic = () => { void musicEngine.unlock(); };
    const handleVisibility = () => musicEngine.setVisible(!document.hidden);
    window.addEventListener('pointerdown', unlockMusic, { passive: true });
    window.addEventListener('keydown', unlockMusic);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('pointerdown', unlockMusic);
      window.removeEventListener('keydown', unlockMusic);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const startStage = (id: number) => {
    setStageId(id);
    setResult(null);
    setScreen('battle');
  };

  const handleResult = useCallback((battleResult: BattleResult) => {
    const playedStage = getStage(battleResult.stageId);
    const campaignClearId = battleResult.victory && !playedStage.challenge ? battleResult.stageId : 0;
    const battleGoldReward = addReward(battleResult.reward, campaignClearId);
    const firstClearReward = battleResult.victory
      ? playedStage.challenge ? completeChallenge(battleResult.stageId) : completeStage(campaignClearId)
      : undefined;
    const record = recordBattle(battleResult);
    setResult({ ...battleResult, reward: battleGoldReward, newAchievements: record.unlocked, masteryGains: record.gains, firstClearReward });
    setScreen('result');
  }, [addReward, completeChallenge, completeStage, recordBattle]);

  if (screen === 'menu') return <MainMenu onNavigate={setScreen} />;
  if (screen === 'opening') return <Opening onComplete={() => setScreen('stages')} />;
  if (screen === 'credits') return <Credits onBack={() => setScreen('menu')} />;
  if (screen === 'stages') return <StageSelect onBack={() => setScreen('menu')} onSelect={startStage} onNavigate={setScreen} />;
  if (screen === 'merchant') return <MysteryMerchant onBack={() => setScreen('stages')} />;
  if (screen === 'training') return <HeroTrainingGround onBack={() => setScreen('stages')} />;
  if (screen === 'armory') return <Armory onBack={() => setScreen('stages')} />;
  if (screen === 'heroes') return <HeroHall onBack={() => setScreen('stages')} />;
  if (screen === 'fortress') return <FortressWorkshop onBack={() => setScreen('stages')} />;
  if (screen === 'achievements') return <Achievements onBack={() => setScreen('stages')} />;
  if (screen === 'codex') return <WarCodex onBack={() => setScreen('stages')} />;
  if (screen === 'battle') {
    return (
      <Suspense fallback={<main className="loading-screen"><span>♜</span><p>전장을 준비하고 있습니다…</p></main>}>
        <BattleView stageId={stageId} onResult={handleResult} />
      </Suspense>
    );
  }
  if (screen === 'result' && result) {
    return <ResultScreen result={result} onMenu={() => setScreen('stages')} onRetry={() => startStage(stageId)} />;
  }
  return null;
}
