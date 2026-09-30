import type { MouseEvent } from 'react';
import { canEnterChapterTwoStage, chapterTwoStages } from '../data/chapterTwo';
import { enemyDefinitions, exclusiveEnemyIds } from '../data/enemies';
import { castleBattleStats } from '../data/castle';
import { attackPatternLabel, scaledProgressionReward } from '../game/rules';
import { Localized } from '../shared/i18n/Localized';
import { useTranslation } from '../shared/i18n/i18n';
import { useGameStore } from '../store/useGameStore';
import type { ExclusiveEnemyId } from '../types/game';
import { CharacterSprite } from './CharacterSprite';
import { GameButton } from './GameButton';
import { campaignMapMarkerArt, chapterTwoMapPosition, chapterTwoMapRegion } from '../data/campaignMapArt';

export function ChapterTwoMission({ selectedId, onSelect }: { selectedId: number; onSelect: (id: number) => void }) {
  const { t } = useTranslation();
  const built = useGameStore((state) => state.builtMonumentIds);
  const cleared = useGameStore((state) => state.clearedChapterTwoStages);
  const tech = useGameStore((state) => state.castleTechLevels);
  const discovered = useGameStore((state) => state.discoveredEnemies);
  const selected = chapterTwoStages.find((stage) => stage.id === selectedId)!;
  const unlocked = canEnterChapterTwoStage(selected.id, built, cleared);
  const modifiers = castleBattleStats(tech);
  const roster = [...new Set([...selected.waves.map((wave) => wave.unitId), ...(selected.reinforcement?.unitIds ?? []), ...(selected.bossUnitId ? [selected.bossUnitId] : [])])];
  return <Localized><aside className="map-mission veil-mission-detail" data-tour="new-front">
        <span className="eyebrow">{t('챕터 2 · 전투 {number}', { number: chapterTwoStages.indexOf(selected) + 1 })}</span>
        <h2>{unlocked ? selected.name : '미확인 전장'}</h2>
        <p>{unlocked ? selected.subtitle : '짙은 안개에 가려진 길입니다.'}</p>
        {unlocked && <>
          <div className="veil-objective"><strong>{selected.boss ? '섭정과 적 성채를 모두 격파' : '적 성채 파괴'}</strong></div>
          <div className="veil-enemies">{roster.map((id) => {
            const enemy = enemyDefinitions[id];
            const exclusive = exclusiveEnemyIds.includes(id as ExclusiveEnemyId);
            if (exclusive && !discovered.includes(id)) return <article key={id}><span className="unknown-veil-enemy" aria-hidden="true">?</span><div><small>미확인</small><strong>안개 속의 기척</strong></div></article>;
            return <article key={id}><CharacterSprite id={id} /><div><small>{exclusive ? '장막 군세 · 영입 불가' : '점령군 지원 병력'}</small><strong>{enemy.name}</strong><p>{attackPatternLabel(enemy)}</p></div></article>;
          })}</div>

          <p>{t('승리 보상 {gold} 금화', { gold: scaledProgressionReward(selected.reward, modifiers.battleGoldMultiplier).toLocaleString() })}</p>
          {!cleared.includes(selected.id) && <p>{t('최초 탈환 추가 보상 {gold} 금화', { gold: scaledProgressionReward(selected.firstClearReward.gold ?? 0, modifiers.battleGoldMultiplier).toLocaleString() })}</p>}
        </>}
        <div className="mission-footer"><GameButton variant="primary" disabled={!unlocked} onClick={() => onSelect(selected.id)}>{cleared.includes(selected.id) ? '다시 출정' : '출정'}</GameButton></div>
      </aside></Localized>;
}

export function ChapterTwoMap({ selectedId, onSelect }: { selectedId: number; onSelect: (event: MouseEvent<HTMLButtonElement>, id: number) => void }) {
  const { t } = useTranslation();
  const built = useGameStore((state) => state.builtMonumentIds);
  const cleared = useGameStore((state) => state.clearedChapterTwoStages);
  const region = chapterTwoMapRegion;
  return <Localized>
    <div className="veil-region-art" style={{ left: region.x, top: region.y, width: region.width, height: region.height }} aria-hidden="true">

      <span className="veil-region-title"><small>챕터 2 · 장막 너머</small><strong>장막 접경지</strong></span>
    </div>
    {chapterTwoStages.map((stage, index) => {
      const open = canEnterChapterTwoStage(stage.id, built, cleared);
      const done = cleared.includes(stage.id);
      const position = chapterTwoMapPosition(stage.id);
      return <button key={stage.id} className={`map-node veil-campaign-node ${stage.boss ? 'boss-node' : ''} ${!open ? 'locked' : ''} ${done ? 'cleared' : ''} ${selectedId === stage.id ? 'selected' : ''}`} style={{ left: position.x, top: position.y }}
        onClick={(event) => onSelect(event, stage.id)} aria-pressed={selectedId === stage.id} aria-label={open ? t('챕터 2 · 전투 {number}', { number: index + 1 }) + ' ' + t(stage.name) : t('미확인 전장')}>
        <span className="node-beacon fortress-beacon" aria-hidden="true"><img src={done ? campaignMapMarkerArt.liberated : stage.boss ? campaignMapMarkerArt.boss : campaignMapMarkerArt.occupied} alt="" draggable={false}/><b>{index + 1}</b></span>
        <strong>{open ? stage.name : '미확인 전장'}</strong><small>{done ? '탈환 완료' : open ? '진입 가능' : '이전 전투 클리어 필요'}</small>
      </button>;
    })}
  </Localized>;
}
