import { useState, type ReactNode } from 'react';
import { monumentBuildings, monumentDeeds, monumentTitles, TRIUMPH_MONUMENT, triumphMonumentBonuses, monumentConstructionCost } from '../data/endgame';
import { Localized } from '../shared/i18n/Localized';
import { useTranslation } from '../shared/i18n/i18n';
import { useGameStore } from '../store/useGameStore';
import { GameButton } from './GameButton';
import { combatTerms } from '../shared/combatTerms';
import { MonumentSilhouette } from './MonumentSilhouette';

export function TriumphMonument({ header, onViewMission, onEnterChapterTwo, onViewBuilding }: { header: ReactNode; onViewMission: (stageId: number) => void; onEnterChapterTwo: () => void; onViewBuilding: (id: string) => void }) {
  const { t } = useTranslation();
  const gold = useGameStore((state) => state.gold);
  const builtIds = useGameStore((state) => state.builtMonumentIds);
  const level = builtIds.length;
  const clearedStages = useGameStore((state) => state.clearedStages);
  const deeds = useGameStore((state) => state.monumentDeedIds);
  const construct = useGameStore((state) => state.constructMonument);

  const [notice, setNotice] = useState('');
  const maxed = level >= TRIUMPH_MONUMENT.maxLevel;
  const unlocked = clearedStages.includes(TRIUMPH_MONUMENT.unlockStage);
  const current = triumphMonumentBonuses(builtIds);

  const percent = (multiplier: number) => `${Math.round((multiplier - 1) * 100)}%`;
  const rows = [
    { label: '아군 체력', value: percent(current.combatantHpMultiplier), hint: combatTerms.allies.description },
    { label: '아군 위력', value: percent(current.combatantAttackMultiplier), hint: combatTerms.power.description },
    { label: '성채 체력', value: current.fortressHpBonus.toLocaleString(), hint: '' },
  ];

  return <Localized><main className="panel-screen monument-screen">
    {header}
    <section className={`monument-panel monument-honors-${deeds.length}`}>
      <div className="monument-visual" aria-hidden="true">
        <div className="monument-stone"><b className="monument-crown">♜</b><div className="monument-inscriptions">{monumentDeeds.map((deed) => <b key={deed.id} className={deeds.includes(deed.id) ? 'engraved' : ''}>{deed.icon}</b>)}</div></div>
        <i />
      </div>
      <div className="monument-copy">
        <span className="eyebrow">대륙 승전 기념비</span>
        <h2>{monumentTitles[deeds.length]}</h2>
        <p>끝까지 싸운 이들과 돌아오지 못한 이들을 위해, 왕국은 승리를 돌에 새깁니다.</p>
        <div className="monument-honor-summary"><strong>{t('전공 {count} / {total}', { count: deeds.length, total: monumentDeeds.length })}</strong><span>{t('건립 비용 −{percent}%', { percent: Math.round(deeds.length * TRIUMPH_MONUMENT.discountPerDeed * 100) })}</span></div>
        <div className="monument-progress-heading"><strong>{t('건설 {level} / {max}', { level, max: TRIUMPH_MONUMENT.maxLevel })}</strong><span>{maxed ? '건설 완료' : '기념비 건설'}</span></div>
        <div className="monument-ranks" role="progressbar" aria-label="기념비 건립 진행도" aria-valuemin={0} aria-valuemax={TRIUMPH_MONUMENT.maxLevel} aria-valuenow={level}>
          {Array.from({ length: TRIUMPH_MONUMENT.maxLevel }, (_, rank) => <i key={rank} className={rank < level ? 'filled' : ''} />)}
        </div>
        <table className="monument-comparison">
          <caption>기념비 누적 효과</caption>
          <thead><tr><th scope="col">적용 대상</th><th scope="col">현재 효과</th></tr></thead>
          <tbody>{rows.map((row) => <tr key={row.label}><th scope="row" title={t(row.hint)}>{row.label}</th><td>+{row.value}</td></tr>)}</tbody>
        </table>
        <p className="monument-scope">기념비의 축복이 원정대와 왕국의 성벽을 지킵니다.</p>
        {maxed && <p className="monument-complete">마지막 돌에 빛이 스며듭니다. 다섯 기념비가 대륙 너머의 무언가에 응답합니다.</p>}
        {maxed && <GameButton variant="primary" onClick={onEnterChapterTwo}>빛을 따라가기</GameButton>}
        <p className="monument-notice" role="status">{notice ? t('{name} 건설 완료 · 지도에 기념비가 세워졌습니다.', { name: t(notice) }) : ''}</p>
      </div>
    </section>
    <section className="monument-buildings" aria-label="기념비 건설">
      <header><h2>대륙에 남기는 다섯 유산</h2><p>되찾은 땅에, 잊지 않을 이름을 남기세요.</p></header>
      <div className="monument-building-grid" data-tour="monument-building">{monumentBuildings.map((building, index) => {
        const built = builtIds.includes(building.id);
        const cost = monumentConstructionCost(building.id, deeds.length)!;
        return <article key={building.id} className={`monument-building ${built ? 'built' : ''}`}>
          <MonumentSilhouette index={index} /><div><small>{building.region}</small><h3>{building.name}</h3></div>
          <dl className="monument-building-effects">
            <div><dt title={t(combatTerms.allies.description)}>아군 체력</dt><dd>+{building.hpPercent}%</dd></div>
            <div><dt title={t(combatTerms.power.description)}>아군 위력</dt><dd>+{building.powerPercent}%</dd></div>
            <div><dt>성채 체력</dt><dd>+{building.fortressHp.toLocaleString()}</dd></div>
          </dl>
          <GameButton variant={built ? 'secondary' : 'primary'} disabled={!built && (!unlocked || gold < cost)} onClick={() => {
            if (built) { onViewBuilding(building.id); return; }
            if (construct(building.id)) setNotice(building.name);
          }}>{built ? '지도에서 보기' : t('건설 · {cost} 금화', { cost: cost.toLocaleString() })}</GameButton>
        </article>;
      })}</div>
    </section>
    <section className="monument-deeds" aria-labelledby="monument-deeds-title">
      <header><span className="eyebrow">왕국의 전공</span><h2 id="monument-deeds-title">승리를 돌에 새기다</h2>
        <p>전장을 거쳐 온 이야기를 기념비에 새깁니다.</p>
        <p>{t('전공마다 기념비 건립 비용이 영구적으로 {percent}%씩 줄어듭니다.', { percent: TRIUMPH_MONUMENT.discountPerDeed * 100 })}</p>
      </header>
      <div className="monument-deed-grid">{monumentDeeds.map((deed) => {
        const completed = deeds.includes(deed.id);
        return <article key={deed.id} className={`monument-deed ${completed ? 'completed' : ''}`}>
          <span className="monument-deed-icon" aria-hidden="true">{deed.icon}</span>
          <div><small>{completed ? '✓ 전공 각인 완료' : '미완성 전공'}</small><h3>{deed.name}</h3><p>{deed.description}</p></div>
          <GameButton size="small" disabled={!unlocked} onClick={() => onViewMission(deed.stageId)}>{completed ? '임무 다시 보기' : '목표 임무 보기'}</GameButton>
        </article>;
      })}</div>
      {maxed && deeds.length === monumentDeeds.length && <p className="monument-complete">기념비와 네 전공이 모두 완성되었습니다. 대륙의 전설로 기록됩니다.</p>}
    </section>
  </main></Localized>;
}
