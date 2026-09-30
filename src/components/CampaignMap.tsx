import { Fragment, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { campaignMapBounds, continentMapArt, campaignMapLandmarks, campaignMapMarkerArt, campaignMapRegions, campaignMapStagePosition, campaignMapRoadSegment, challengeMapPositions, chapterTwoMapRegion, chapterTwoMapPosition, challengeRiftPresentation, farmingMissionPresentation, mapLocationArt } from '../data/campaignMapArt';
import { monumentBuildings } from '../data/endgame';
import { mapTreasures } from '../data/mapTreasures';
import { challengeStages, enemyFactionLabels, farmingStages, getStage, stages } from '../data/stages';
import { canEnterChapterTwoStage, chapterTwoStages, isChapterTwoUnlocked } from '../data/chapterTwo';
import { castleBattleStats } from '../data/castle';
import { analyzeCampaignDifficulty, stageDifficultyPresentation } from '../game/difficulty';
import { scaledProgressionReward } from '../game/rules';
import { useGameStore } from '../store/useGameStore';
import { Localized } from '../shared/i18n/Localized';
import { t } from '../shared/i18n/i18n';
import type { MapTreasureId } from '../types/game';
import { CharacterSprite } from './CharacterSprite';
import { GameButton } from './GameButton';
import { ContinentTerrain } from './ContinentTerrain';
import { MapMonuments } from './MapMonuments';
import { ChapterTwoMap, ChapterTwoMission } from './ChapterTwoMap';

const mapPositions = stages.map((stage) => campaignMapStagePosition(stage.id));
const campaignDifficultyReport = analyzeCampaignDifficulty(stages);

export function CampaignMap({ initialStageId, initialMonumentId, header, operations, onSelect, onMonuments, onChapterTwoEntry }: { initialStageId?: number; initialMonumentId?: string; header: ReactNode; operations: ReactNode; onSelect: (id: number) => void; onMonuments: () => void; onChapterTwoEntry?: () => boolean }) {
  const builtMonumentIds = useGameStore((state) => state.builtMonumentIds);
  const clearedChapterTwoStages = useGameStore((state) => state.clearedChapterTwoStages);
  const chapterTwoOpen = isChapterTwoUnlocked(builtMonumentIds);
  const unlocked = useGameStore((state) => state.unlockedStage);
  const clearedStages = useGameStore((state) => state.clearedStages);
  const clearedChallenges = useGameStore((state) => state.clearedChallenges);
  const clearedMapTreasureGuardianIds = useGameStore((state) => state.clearedMapTreasureGuardianIds);
  const claimedMapTreasureIds = useGameStore((state) => state.claimedMapTreasureIds);
  const claimMapTreasure = useGameStore((state) => state.claimMapTreasure);
  const castleTechLevels = useGameStore((state) => state.castleTechLevels);
  const monumentIndex = monumentBuildings.findIndex((entry) => entry.id === initialMonumentId);
  const [selectedId, setSelectedId] = useState(monumentIndex >= 0 ? monumentIndex * 6 + 1 : initialStageId ?? Math.min(unlocked, stages.length));
  const initialMonumentFocus = useRef(monumentIndex >= 0 ? monumentBuildings[monumentIndex] : undefined);
  const [mapDragging, setMapDragging] = useState(false);
  const [notice, setNotice] = useState('');
  const mapRef = useRef<HTMLElement>(null);
  const mapDragRef = useRef({ pointerId: -1, startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0, moved: false });
  const suppressMapClickRef = useRef(false);
  const selected = getStage(selectedId);
  const isChapterTwo = selected.chapter === 2;
  const isChallenge = Boolean(selected.challenge);
  const isTreasureMission = Boolean(selected.sideMission && selected.treasureId);
  const isFarmingMission = Boolean(selected.sideMission && selected.farmingKind);
  const selectedTreasure = isTreasureMission ? mapTreasures.find((treasure) => treasure.missionStageId === selected.id) : undefined;
  const selectedFarmingMission = isFarmingMission ? farmingMissionPresentation[selected.id as keyof typeof farmingMissionPresentation] : undefined;
  const locked = isChapterTwo ? !canEnterChapterTwoStage(selected.id, builtMonumentIds, clearedChapterTwoStages) : isChallenge || isTreasureMission || isFarmingMission ? !clearedStages.includes(selected.requiredCampaignStage ?? 1) : selected.id > unlocked;
  const cleared = isChallenge
    ? clearedChallenges.includes(selected.id)
    : isTreasureMission ? clearedMapTreasureGuardianIds.includes(selected.treasureId!) : isFarmingMission ? false : clearedStages.includes(selected.id);
  const visibleRegionCount = Math.min(5, Math.max(1, Math.ceil(unlocked / 6)));
  const visibleStages = stages.slice(0, visibleRegionCount * 6);
  const visibleChallenges = challengeStages.filter((challenge) => clearedStages.includes(challenge.requiredCampaignStage ?? 1));
  const visibleFarmingMissions = farmingStages.filter((mission) => clearedStages.includes(mission.requiredCampaignStage ?? 1));
  const liberatedRegionCount = campaignMapRegions.filter((region) => clearedStages.includes(region.stageEnd)).length;
  const difficulty = stageDifficultyPresentation(selected, campaignDifficultyReport);
  const progressionStats = castleBattleStats(castleTechLevels);
  const displayedBattleReward = scaledProgressionReward(selected.reward, progressionStats.battleGoldMultiplier);
  const displayedFirstClearGold = selected.firstClearReward.gold === undefined
    ? undefined
    : isTreasureMission ? selected.firstClearReward.gold : scaledProgressionReward(selected.firstClearReward.gold, progressionStats.battleGoldMultiplier);
  const { x: mapOriginX, y: mapOriginY, width: mapWidth, height: mapHeight } = campaignMapBounds(visibleRegionCount, chapterTwoOpen);
  const roadPath = visibleStages.slice(1).map((stage) => campaignMapRoadSegment(stage.id)).join(' ');
  const roadSegments = visibleStages.slice(1).map((stage) => {
    const from = mapPositions[stage.id - 2];
    const to = mapPositions[stage.id - 1];
    const state = clearedStages.includes(stage.id - 1) && clearedStages.includes(stage.id)
      ? 'liberated'
      : stage.id <= unlocked ? 'frontline' : 'occupied';
    return { id: stage.id, from, to, state };
  });

  useEffect(() => {
    const map = mapRef.current;
    const position = initialMonumentFocus.current ?? (isChapterTwo ? chapterTwoMapPosition(selectedId) : isChallenge
      ? challengeMapPositions[selectedId]
      : selectedTreasure ? { x: selectedTreasure.guardianX, y: selectedTreasure.guardianY }
        : selectedFarmingMission ? { x: selectedFarmingMission.x, y: selectedFarmingMission.y }
          : mapPositions[selectedId - 1]);
    if (!map || !position) return;
    map.scrollTo({ left: Math.max(0, position.x - mapOriginX - map.clientWidth / 2), top: Math.max(0, position.y - mapOriginY - map.clientHeight / 2), behavior: 'auto' });
  }, [isChallenge, isChapterTwo, selectedFarmingMission, selectedId, selectedTreasure, visibleRegionCount, mapOriginX, mapOriginY]);

  const startMapDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    const map = mapRef.current;
    if (!map) return;
    if (event.pointerType === 'touch') return;
    mapDragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, scrollLeft: map.scrollLeft, scrollTop: map.scrollTop, moved: false };
  };

  const moveMapDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const map = mapRef.current;
    const drag = mapDragRef.current;
    if (!map || drag.pointerId !== event.pointerId) return;
    const distance = event.clientX - drag.startX;
    const verticalDistance = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(distance, verticalDistance) < 6) return;
    if (!drag.moved) {
      drag.moved = true;
      map.setPointerCapture(event.pointerId);
    }
    setMapDragging(true);
    map.scrollLeft = drag.scrollLeft - distance;
    map.scrollTop = drag.scrollTop - verticalDistance;
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
    if (getStage(id).chapter === 2 && onChapterTwoEntry?.()) return;
    initialMonumentFocus.current = undefined;
    setSelectedId(id);
  };

  const collectMapTreasure = (event: ReactMouseEvent<HTMLButtonElement>, id: MapTreasureId) => {
    if (suppressMapClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const treasure = mapTreasures.find((entry) => entry.id === id);
    if (!treasure || !claimMapTreasure(id)) return;
    setNotice(`${treasure.name}: 금화 ${treasure.gold.toLocaleString()}개를 획득했습니다.`);
    window.setTimeout(() => setNotice(''), 2_000);
  };

  const scrollToRegion = (regionIndex: number) => {
    initialMonumentFocus.current = undefined;
    const map = mapRef.current;
    const region = campaignMapRegions[regionIndex];
    if (!map || !region) return;
    map.scrollTo({
      left: Math.max(0, region.x + region.width / 2 - mapOriginX - map.clientWidth / 2),
      top: Math.max(0, region.y + region.height / 2 - mapOriginY - map.clientHeight / 2),
      behavior: 'smooth',
    });
  };

  const selectedCampaignStage = selected.requiredCampaignStage ?? selected.id;
  const selectedRegionIndex = Math.min(campaignMapRegions.length - 1, Math.floor((selectedCampaignStage - 1) / 6));

  return <Localized>{(
    <main className="panel-screen campaign-map-screen">
      {header}
      <div className="map-shell-layout">
        {operations}
        <div className="map-content-column">
          <section className="map-heading">
            <div><span className="eyebrow">{isChapterTwo ? '챕터 2 · 장막 너머' : '챕터 1 · 대륙 탈환'}</span><h2>{isChapterTwo ? '장막 접경지' : '대륙 탈환의 길'}</h2></div>
            {isChapterTwo ? <p><strong>{t('확보한 전선 {count}/{total}', { count: clearedChapterTwoStages.length, total: chapterTwoStages.length })}</strong></p> : <p><strong>해금 {Math.min(unlocked, stages.length)}/{stages.length} · 해방 {liberatedRegionCount}/{campaignMapRegions.length} · 마수 영역 {visibleChallenges.length}/{challengeStages.length} · {t('보급 거점 {current}/{total}', { current: visibleFarmingMissions.length, total: farmingStages.length })}</strong><br />{visibleRegionCount > 1 ? `${campaignMapRegions[visibleRegionCount - 1].name}까지 원정로가 개방되었습니다.` : '남서쪽 끝에 남은 최후의 성채. 이곳에서 대륙을 되찾으세요.'}</p>}
          </section>
          <nav className="map-region-nav" aria-label="지역 바로가기">
            {campaignMapRegions.slice(0, visibleRegionCount).map((region, index) => {
              const liberated = clearedStages.includes(region.stageEnd);
              return <button type="button" className={`${!isChapterTwo && selectedRegionIndex === index ? 'active' : ''} ${liberated ? 'liberated' : 'frontline'}`} onClick={() => scrollToRegion(index)} key={region.id}>
                <span>{String(index + 1).padStart(2, '0')}</span><b>{region.name}</b><small>{liberated ? '해방 완료' : '교전 중'}</small>
              </button>;
            })}
            {chapterTwoOpen && <GameButton className={isChapterTwo ? 'active' : ''} onClick={() => { if (onChapterTwoEntry?.()) return; initialMonumentFocus.current = undefined; setSelectedId(chapterTwoStages.find((stage) => !clearedChapterTwoStages.includes(stage.id))?.id ?? 406); mapRef.current?.scrollTo({ left: chapterTwoMapRegion.x - mapOriginX, top: chapterTwoMapRegion.y - mapOriginY, behavior: 'smooth' }); }}><span>Ⅱ</span><b>장막 접경지</b><small>챕터 2 · 장막 너머</small></GameButton>}
          </nav>
          <div className="campaign-map-layout">
        <section
          className={`campaign-map ${visibleRegionCount > 1 ? 'expanded' : ''} ${mapDragging ? 'dragging' : ''}`}
          aria-label="캠페인 지도 · 상하좌우로 드래그하여 이동"
          ref={mapRef}
          onPointerDown={startMapDrag}
          onPointerMove={moveMapDrag}
          onPointerUp={finishMapDrag}
          onPointerCancel={finishMapDrag}
        >
          <div className="campaign-map-world" style={{ width: `${mapWidth}px`, height: `${mapHeight}px` }} onDragStart={(event) => event.preventDefault()}>
          <div className="campaign-map-content" style={{ left: -mapOriginX, top: -mapOriginY, width: continentMapArt.width, height: continentMapArt.height }}>
          <ContinentTerrain regionCount={visibleRegionCount} chapterTwo={chapterTwoOpen} clearedStages={clearedStages} />
          <div className="last-bastion-marker" style={{ left: 330, top: 1950 }}><img className="last-bastion-art" src={mapLocationArt.lastBastion} alt="" aria-hidden="true" draggable={false} /><strong>최후의 성채</strong></div>
          {chapterTwoOpen && <ChapterTwoMap selectedId={selectedId} onSelect={selectMapStage} />}
          <MapMonuments builtIds={builtMonumentIds} onOpen={(event) => {
            if (suppressMapClickRef.current) { event.preventDefault(); event.stopPropagation(); return; }
            onMonuments();
          }} />
          {campaignMapRegions.slice(0, visibleRegionCount).map((region, index) => {
            const state = clearedStages.includes(region.stageEnd) ? 'liberated' : unlocked >= region.stageStart ? 'frontline' : 'occupied';
            return <Fragment key={region.id}>
              <div className={`map-region-zone region-theme-${index + 1} ${state}`} style={{ left: region.labelX, top: region.labelY }} aria-hidden="true">
              <span className="region-state"><b>{region.name}</b><small>{state === 'liberated' ? '해방 완료' : state === 'frontline' ? '교전 중' : '마왕군 점령'}</small></span>
              {state === 'liberated' && <span className="liberation-beacon"><img src={campaignMapMarkerArt.liberated} alt="" draggable={false} /></span>}
              </div>
            </Fragment>;
          })}
          {campaignMapLandmarks.filter((landmark) => landmark.requiredStage <= unlocked).map((landmark) => (
            <div className={`map-landmark landmark-${landmark.theme}`} style={{ left: `${landmark.x}px`, top: `${landmark.y}px` }} aria-hidden="true" key={landmark.id}>
              <span>{landmark.label}</span>
            </div>
          ))}
          <svg className="campaign-road" viewBox={`0 0 ${continentMapArt.width} ${continentMapArt.height}`} preserveAspectRatio="none" aria-hidden="true">
            <path d={roadPath} />
            <path className="road-segment liberated" d="M330 1950 Q390 1850 490 1790" />
            {chapterTwoOpen && chapterTwoStages.map((stage, index) => {
              const from = index === 0 ? mapPositions[29] : chapterTwoMapPosition(stage.id - 1);
              const to = chapterTwoMapPosition(stage.id);
              return <line key={stage.id} className={`road-segment ${clearedChapterTwoStages.includes(stage.id) ? 'liberated' : canEnterChapterTwoStage(stage.id, builtMonumentIds, clearedChapterTwoStages) ? 'frontline' : 'occupied'}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} />;
            })}
            {roadSegments.map((segment) => <path className={`road-segment ${segment.state}`} d={campaignMapRoadSegment(segment.id)} key={segment.id} />)}
            {mapTreasures.filter((treasure) => clearedMapTreasureGuardianIds.includes(treasure.id)).map((treasure) => <line className={`treasure-route ${claimedMapTreasureIds.includes(treasure.id) ? 'claimed' : ''}`} x1={treasure.guardianX} y1={treasure.guardianY} x2={treasure.x} y2={treasure.y} key={`route-${treasure.id}`} />)}
          </svg>
          {visibleStages.map((stage) => {
            const nodeLocked = stage.id > unlocked;
            const nodeCleared = clearedStages.includes(stage.id);
            const position = mapPositions[stage.id - 1];
            return (
              <button
                key={stage.id}
                className={`map-node ${stage.boss ? 'boss-node' : ''} ${nodeLocked ? 'locked' : ''} ${nodeCleared ? 'cleared' : ''} ${selectedId === stage.id ? 'selected' : ''}`}
                style={{ left: `${position.x}px`, top: `${position.y}px` }}
                onClick={(event) => selectMapStage(event, stage.id)}
                aria-label={`${stage.id}장 ${stage.name}${nodeLocked ? ' 잠김' : nodeCleared ? ' 해방 완료' : ''}`}
              >
                <span className="node-beacon fortress-beacon" aria-hidden="true"><img src={nodeCleared ? campaignMapMarkerArt.liberated : stage.boss ? campaignMapMarkerArt.boss : campaignMapMarkerArt.occupied} alt="" draggable={false} />{nodeCleared && <i className="liberation-flag" />}<b>{stage.id}</b></span>
                <strong>{stage.name}</strong>
                <small>{stage.boss ? '보스' : `0${stage.id}`}</small>
              </button>
            );
          })}
          {visibleChallenges.map((challenge) => {
            const position = challengeMapPositions[challenge.id];
            const challengeCleared = clearedChallenges.includes(challenge.id);
            const rift = challengeRiftPresentation[challenge.terrain.id as keyof typeof challengeRiftPresentation];
            return (
              <button
                key={challenge.id}
                className={`map-node challenge-map-node ${challengeCleared ? 'cleared' : ''} ${selectedId === challenge.id ? 'selected' : ''}`}
                style={{ left: `${position.x}px`, top: `${position.y}px` }}
                onClick={(event) => selectMapStage(event, challenge.id)}
                aria-label={`마수 도전 ${challenge.name}`}
              >
                <span className={`challenge-rift rift-${rift.theme}`} aria-hidden="true" />
                <span className="challenge-portrait" data-boss-id={challenge.bossUnitId} aria-hidden="true"><CharacterSprite id={challenge.bossUnitId!} className="map-challenge-art" />{challengeCleared && <span className="map-node-completion">✓</span>}</span>
                <strong>{challenge.name}</strong>
                <small>{challengeCleared ? '격파 완료' : '마수 균열'}</small>
              </button>
            );
          })}
          {visibleFarmingMissions.map((mission) => {
            const presentation = farmingMissionPresentation[mission.id as keyof typeof farmingMissionPresentation];
            return <button
              type="button"
              className={`map-node farming-map-node farming-${presentation.theme} ${selectedId === mission.id ? 'selected' : ''}`}
              style={{ left: `${presentation.x}px`, top: `${presentation.y}px` }}
              onClick={(event) => selectMapStage(event, mission.id)}
              aria-label={t('{name}, 반복 {kind} 파밍', { name: t(mission.name), kind: t(mission.farmingKind === 'gold' ? '골드' : '숙련 경험치') })}
              key={mission.id}
            >
              <span className="map-site-art" aria-hidden="true"><img src={presentation.image} alt="" draggable={false} /></span>
              <strong>{mission.name}</strong>
              <small>{mission.farmingKind === 'gold' ? '금화 보급' : t('전투 숙련 XP ×{multiplier}', { multiplier: mission.masteryRewardMultiplier ?? 1 })}</small>
            </button>;
          })}
          {mapTreasures.filter((treasure) => clearedStages.includes(treasure.revealStage)).map((treasure) => {
            const defeated = clearedMapTreasureGuardianIds.includes(treasure.id);
            return <Fragment key={`guardian-${treasure.id}`}>
              <button type="button" className={`map-node treasure-guardian-node ${defeated ? 'defeated' : ''} ${selectedId === treasure.missionStageId ? 'selected' : ''}`} style={{ left: `${treasure.guardianX}px`, top: `${treasure.guardianY}px` }} aria-label={`${treasure.name} 수호자, ${defeated ? '격파 완료' : '강적 도전'}`} onClick={(event) => selectMapStage(event, treasure.missionStageId)}>
                <span className="treasure-guardian-crest" aria-hidden="true"><CharacterSprite id={treasure.guardianUnitId} className="treasure-guardian-art" /></span>
                <strong>{getStage(treasure.missionStageId).name}</strong>
                <small>{defeated ? '격파 완료' : '강적 도전'}</small>
              </button>
              {defeated && (() => {
                const claimed = claimedMapTreasureIds.includes(treasure.id);
                return <button type="button" className={`map-node map-treasure-node ${claimed ? 'claimed' : ''}`} style={{ left: `${treasure.x}px`, top: `${treasure.y}px` }} aria-label={`${treasure.name}, ${claimed ? '수령 완료' : `금화 ${treasure.gold.toLocaleString()}개 수령`}`} aria-disabled={claimed} onClick={(event) => collectMapTreasure(event, treasure.id)}>
                  <span className="map-site-art treasure-chest" aria-hidden="true"><img src={claimed ? mapLocationArt.treasureOpen : mapLocationArt.treasureClosed} alt="" draggable={false} /></span><strong>{treasure.name}</strong><small>{claimed ? '수령 완료' : `● ${treasure.gold.toLocaleString()}`}</small>
                </button>;
              })()}
            </Fragment>;
          })}
          <div className="map-compass"><span>✦</span><i>N</i></div>
          </div>
          </div>
        </section>

        {isChapterTwo ? <ChapterTwoMission selectedId={selectedId} onSelect={onSelect} /> : <aside className={`map-mission ${selected.boss ? 'boss-mission' : ''} ${isChallenge ? 'challenge-mission' : ''} ${isTreasureMission ? 'treasure-mission' : ''} ${isFarmingMission ? `farming-mission farming-${selected.farmingKind}` : ''}`}>
          <div className="mission-number">{isChallenge ? '☠' : isTreasureMission ? '▣' : isFarmingMission ? selected.farmingKind === 'gold' ? '●' : '✦' : selected.boss ? '◉' : String(selected.id).padStart(2, '0')}</div>
          <span className="eyebrow">{isChallenge ? '마수 도전' : isTreasureMission ? '보물 원정' : isFarmingMission ? selected.farmingKind === 'gold' ? '금화 보급 계약' : '숙련 훈련' : selected.boss ? '보스 공성전' : t('제 {chapter}장', { chapter: selected.id })}</span>
          <h2>{selected.name}</h2>
          <div className={`difficulty difficulty-rank-${difficulty.rank}`} aria-label={`병력과 목표 데이터 기반 전투 평가 ${difficulty.label}, 5단계 중 ${difficulty.rank}단계`} title={`위협 지수 ${difficulty.threatIndex} · 성채, 병력, 증원, 정예, 보스, 전장 거리 분석`}>
            <span>전투 평가 <strong>{difficulty.label}</strong></span>
            <b aria-hidden="true">{'◆'.repeat(difficulty.rank)}<i>{'◇'.repeat(5 - difficulty.rank)}</i></b>
            <small>전투 데이터 분석</small>
          </div>
          <p>{locked ? '안개 너머의 지역입니다. 이전 전장을 먼저 정복해야 합니다.' : selected.subtitle}</p>
          <div className="stage-context"><span>적 세력 <b>{enemyFactionLabels[selected.enemyFaction]}</b></span><span>지형 <b>{selected.terrain.name}</b></span></div>
          {(isTreasureMission || isFarmingMission) && selected.gimmick && <div className="treasure-gimmick-preview"><small>전술 기믹</small><strong>{selected.gimmick.name}</strong><span>{selected.gimmick.description}</span></div>}
          {isChallenge && <div className="challenge-terrain-preview"><small>지형 증폭</small><strong>적 HP ×{selected.terrain.enemyHpMultiplier} · 공격 ×{selected.terrain.enemyAttackMultiplier}</strong><span>{selected.terrain.description}</span></div>}
          <div className="mission-objective" data-tour="map-mission"><small>{t('임무 · 전선 거리 {distance}', { distance: selected.fortressDistance })}</small><strong>{isChallenge ? `${selected.bossName ?? selected.name} 단독 격파` : isTreasureMission ? '기믹 방어선을 돌파하고 보물 수비 성채 파괴' : isFarmingMission ? '반복 방어선을 돌파하고 보급 거점 성채 파괴' : selected.boss ? '성채 수비대와 마수를 돌파하고 적 성채 파괴' : '적 성채 파괴'}</strong></div>
          {selected.enemyFortressAttack && <div className="elite-guard-preview"><small>성채 화력</small><strong>적 성채 수비 사격</strong><span>사거리 {selected.enemyFortressAttack.range} · 공격 {selected.enemyFortressAttack.damage} · {(selected.enemyFortressAttack.intervalMs / 1000).toFixed(1)}초 간격</span></div>}
          {selected.eliteGuards && selected.eliteGuards.length > 0 && <div className="elite-guard-preview"><small>{t('정예 수비대 · {count}', { count: selected.eliteGuards.length })}</small><strong>{selected.eliteGuards.map((elite) => elite.name).join(' · ')}</strong><span>전선 거점에 배치된 중간 우두머리 · 상세 강화 수치는 비공개</span></div>}
          {isFarmingMission ? <div className="first-clear-reward farming-contract">
            <span>{selected.firstClearReward.icon}</span>
            <div><small>반복 의뢰</small><strong>{selected.firstClearReward.label}</strong><p>{selected.firstClearReward.description}</p>{selected.masteryRewardMultiplier && <em>{t('전투 숙련 XP ×{multiplier}', { multiplier: selected.masteryRewardMultiplier })}</em>}</div>
          </div> : <div className={`first-clear-reward ${cleared ? 'claimed' : ''}`}>
            <span>{selected.firstClearReward.icon}</span>
            <div><small>{cleared ? '최초 클리어 · 획득 완료' : '최초 클리어 보상'}</small><strong>{selected.firstClearReward.label}</strong><p>{selected.firstClearReward.description}</p>{displayedFirstClearGold !== undefined && <em>{isTreasureMission ? '보물 골드' : '연구 적용 골드'} ● {displayedFirstClearGold}</em>}</div>
          </div>}
          <div className="mission-footer" data-tour="deployment"><span>{isChallenge || isTreasureMission || isFarmingMission ? '반복 보상' : '기본 보상'} <strong>● {displayedBattleReward}</strong>{progressionStats.battleGoldMultiplier > 1 && <small>전리품 회계 +{Math.round((progressionStats.battleGoldMultiplier - 1) * 100)}%</small>}{selected.masteryRewardMultiplier && <small>{t('전투 숙련 XP ×{multiplier}', { multiplier: selected.masteryRewardMultiplier })}</small>}</span><button disabled={locked} onClick={() => onSelect(selected.id)}>{locked ? '경로 잠김' : isChallenge ? cleared ? '다시 도전' : '마수에 도전' : isTreasureMission ? cleared ? '다시 수복전' : '보물 수복전' : isFarmingMission ? '파밍 출정' : cleared ? '다시 출정' : '출정하기'}</button></div>
            </aside>}
          </div>
        </div>
      </div>
      {notice && <div className="toast" role="status">{notice}</div>}
    </main>
  )}</Localized>;
}
