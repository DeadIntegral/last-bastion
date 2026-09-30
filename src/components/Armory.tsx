import { useState, type DragEvent, type ReactNode } from 'react';
import { battleFormationCapacity } from '../data/economy';
import { soldierMasteryGrowth } from '../data/mastery';
import { allTroopOrder, rosterFactionById, rosterFactionLabels, troopDefinitions, unitFamilyById, unitFamilyLabels, unitGradeLabels, unitGradeStars, type RosterFaction } from '../data/units';
import { STAT_EQUIPMENT_CAPSTONE_BONUS_RANKS, attackPatternLabel, attackRangeLabel, equipmentCost, guardProtectionLabel, hasEquipmentCapstone, masteryLevelFromXp, spacingTraitLabel, upgradedStats, usesStatEquipmentCapstone } from '../game/rules';
import { Localized } from '../shared/i18n/Localized';
import { t } from '../shared/i18n/i18n';
import { formatGameNumber } from '../shared/number';
import { useGameStore } from '../store/useGameStore';
import type { EquipmentSlot, UnitGrade, UnitId } from '../types/game';
import { CharacterSprite } from './CharacterSprite';
import { GameModal } from './GameModal';
import { GameButton } from './GameButton';
import { equipmentEffect, equipmentSlots, GrowthStat } from './ProgressionUi';

const factionMarks: Record<RosterFaction | 'all', string> = {
  all: '▦', human: '⚔', tribes: '◆', monster: '♜', spirit: '✦', demon: '☾',
};
const unitGrades: UnitGrade[] = [1, 2, 3, 4, 5];

export function Armory({ header }: { header: ReactNode }) {
  const equipmentLevels = useGameStore((state) => state.equipmentLevels);
  const unlockedUnits = useGameStore((state) => state.unlockedUnits);
  const equippedUnits = useGameStore((state) => state.equippedUnits);
  const formationSlots = useGameStore((state) => state.formationSlots);
  const formationSlotPurchases = useGameStore((state) => state.formationSlotPurchases);
  const discoveredEnemies = useGameStore((state) => state.discoveredEnemies);
  const clearedStages = useGameStore((state) => state.clearedStages);
  const fortressTier = useGameStore((state) => state.fortressTier);
  const unitMasteryXp = useGameStore((state) => state.unitMasteryXp);
  const gold = useGameStore((state) => state.gold);
  const upgradeUnit = useGameStore((state) => state.upgradeUnitEquipment);
  const recruitUnit = useGameStore((state) => state.recruitUnit);
  const toggleEquippedUnit = useGameStore((state) => state.toggleEquippedUnit);
  const assignEquippedUnit = useGameStore((state) => state.assignEquippedUnit);
  const resetProgress = useGameStore((state) => state.resetProgress);
  const [notice, setNotice] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [factionFilter, setFactionFilter] = useState<RosterFaction | 'all'>('human');
  const [gradeFilter, setGradeFilter] = useState<UnitGrade | 'all'>('all');
  const [armoryView, setArmoryView] = useState<'focus' | 'cards'>('focus');
  const [selectedUnitId, setSelectedUnitId] = useState<UnitId>('militia');
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const formationCapacity = battleFormationCapacity(formationSlotPurchases);

  const isKnownUnit = (id: UnitId) => {
    const unit = troopDefinitions[id];
    const knownReward = id === 'archer' || id === 'lancer' || unit.recruitSource === 'challenge';
    const stageUnlocked = !unit.requiredClearedStage || clearedStages.includes(unit.requiredClearedStage);
    const tierUnlocked = fortressTier >= (unit.requiredFortressTier ?? 1);
    return unlockedUnits.includes(id) || discoveredEnemies.includes(id) || knownReward || unit.requiresEncounter === false && stageUnlocked && tierUnlocked;
  };

  const rosterForFilters = (faction: RosterFaction | 'all', grade: UnitGrade | 'all') => allTroopOrder.filter((id) => grade !== 'all'
    ? isKnownUnit(id) && troopDefinitions[id].grade === grade
    : faction === 'all' || rosterFactionById[id] === faction);

  const visibleRoster = rosterForFilters(factionFilter, gradeFilter);
  const knownRoster = allTroopOrder.filter(isKnownUnit);
  const detailUnitId = visibleRoster.includes(selectedUnitId) ? selectedUnitId : visibleRoster[0];

  const selectFaction = (faction: RosterFaction | 'all') => {
    setFactionFilter(faction);
    setGradeFilter('all');
    const nextRoster = rosterForFilters(faction, 'all');
    if (!nextRoster.includes(selectedUnitId) && nextRoster[0]) setSelectedUnitId(nextRoster[0]);
  };

  const selectGrade = (grade: UnitGrade) => {
    setGradeFilter(grade);
    setFactionFilter('all');
    const nextRoster = rosterForFilters('all', grade);
    if (!nextRoster.includes(selectedUnitId) && nextRoster[0]) setSelectedUnitId(nextRoster[0]);
  };

  const buy = (id: UnitId, slot: EquipmentSlot) => {
    const slotName = equipmentSlots.find((item) => item.id === slot)?.name ?? '장비';
    setNotice(upgradeUnit(id, slot) ? `${troopDefinitions[id].name}의 ${slotName} 장비가 강화되었습니다.` : '금화가 부족하거나 최고 장비 단계입니다.');
    window.setTimeout(() => setNotice(''), 1800);
  };

  const recruit = (id: UnitId) => {
    const requiredTier = troopDefinitions[id].requiredFortressTier ?? 1;
    const requiredStage = troopDefinitions[id].requiredClearedStage;
    setNotice(recruitUnit(id)
      ? `${troopDefinitions[id].name}이(가) 아군에 합류했습니다.`
      : requiredStage && !clearedStages.includes(requiredStage) ? `${requiredStage}장을 클리어해야 영입할 수 있습니다.`
        : fortressTier < requiredTier ? `성채를 ${requiredTier}티어로 승급해야 영입할 수 있습니다.` : '영입에 필요한 조우 기록이나 금화를 확인하세요.');
    window.setTimeout(() => setNotice(''), 1800);
  };

  const toggleFormation = (id: UnitId) => {
    const wasEquipped = equippedUnits.includes(id);
    setNotice(toggleEquippedUnit(id)
      ? `${troopDefinitions[id].name}을(를) 전투 편성에서 ${wasEquipped ? '제외' : '등록'}했습니다.`
      : `전투 편성은 1종 이상, 최대 ${formationCapacity}종까지 가능합니다.`);
    window.setTimeout(() => setNotice(''), 1800);
  };

  const assignFormation = (id: UnitId, slotIndex: number) => {
    setNotice(assignEquippedUnit(id, slotIndex)
      ? `${troopDefinitions[id].name}을(를) ${slotIndex + 1}번에 배치했습니다.`
      : '앞 번호부터 빈 슬롯을 채우거나 이미 편성된 병종끼리 위치를 교환하세요.');
    window.setTimeout(() => setNotice(''), 1800);
  };

  const startUnitDrag = (event: DragEvent<HTMLElement>, id: UnitId) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/x-last-bastion-unit', id);
    event.dataTransfer.setData('text/plain', id);
  };

  const dropUnit = (event: DragEvent<HTMLElement>, slotIndex: number) => {
    event.preventDefault();
    setDragOverSlot(null);
    const id = event.dataTransfer.getData('application/x-last-bastion-unit') || event.dataTransfer.getData('text/plain');
    if (allTroopOrder.includes(id as UnitId)) assignFormation(id as UnitId, slotIndex);
  };

  const unitPresentation = (id: UnitId) => {
    const unit = troopDefinitions[id];
    const unlocked = unlockedUnits.includes(id);
    const encountered = discoveredEnemies.includes(id);
    const knownReward = id === 'archer' || id === 'lancer' || unit.recruitSource === 'challenge';
    const requiredTier = unit.requiredFortressTier ?? 1;
    const requiredStage = unit.requiredClearedStage;
    const stageLocked = Boolean(requiredStage && !clearedStages.includes(requiredStage));
    const tierLocked = fortressTier < requiredTier;
    const directRecruitable = unit.requiresEncounter === false && !stageLocked && !tierLocked;
    const known = unlocked || encountered || knownReward || directRecruitable;
    const canRecruit = unit.recruitSource !== 'challenge' && (encountered || directRecruitable);
    const mastery = masteryLevelFromXp(unitMasteryXp[id]);
    const status = unlocked ? `숙련 LV.${mastery.level}` : stageLocked ? `${requiredStage}장 클리어 필요` : canRecruit ? tierLocked ? `성채 ${requiredTier}티어 필요` : '영입 가능' : knownReward ? '지도에서 해금' : '미조우';
    return { unit, unlocked, encountered, knownReward, requiredTier, requiredStage, stageLocked, tierLocked, directRecruitable, known, canRecruit, mastery, status };
  };

  const renderUnitCard = (id: UnitId) => {
    const { unit, unlocked, encountered, knownReward, requiredTier, requiredStage, stageLocked, tierLocked, directRecruitable, known, canRecruit, mastery, status } = unitPresentation(id);
    const equipment = equipmentLevels[id];
    const equipped = equippedUnits.includes(id);
    const stats = upgradedStats(unit, equipment, mastery.level);
    const equipmentCapstone = hasEquipmentCapstone(equipment);
    const statEquipmentCapstone = usesStatEquipmentCapstone(unit);
    const closestCapstoneLevel = Math.max(...Object.values(equipment));
    return (
      <article className={`unit-card accent-${id} ${selectedUnitId === id ? 'selected' : ''} ${unlocked ? '' : 'unit-card-locked'} ${canRecruit && !unlocked && !tierLocked ? 'unit-card-recruitable' : ''}`} key={id}>
        <GameButton type="button" className="unit-card-portrait" draggable={unlocked} onDragStart={(event) => startUnitDrag(event, id)} onClick={() => setSelectedUnitId(id)} aria-pressed={selectedUnitId === id} aria-label={`${known ? unit.name : '미확인 병종'} 선택`}>{known ? <CharacterSprite id={id} className="character-sprite-card" /> : <span>?</span>}<small>{status}</small></GameButton>
        <div className="unit-card-copy">
          <span className="eyebrow">{known ? `${t(unitFamilyLabels[unitFamilyById[id]])} · ${t(unit.tags.includes('flying') ? '공중' : unit.tags.includes('mounted') ? '기병' : unit.tags.includes('ranged') ? '원거리' : unit.tags.includes('armored') ? '선봉' : '보병')}` : t('미확인')}</span>
          <div className="unit-card-title-row">
            <h3>{known ? unit.name : '미확인 병종'}</h3>
            {known && <div className={`unit-grade grade-${unit.grade}`} aria-label={`${unit.grade}성 ${unitGradeLabels[unit.grade]} 병종`}><b>{unitGradeStars(unit.grade)}</b><span>{unit.grade}성 · {unitGradeLabels[unit.grade]}</span></div>}
          </div>
          {unlocked ? <>
            <div className="mastery-line"><b>숙련 LV.{mastery.level}</b><span>{mastery.requiredXp ? `${mastery.currentXp}/${mastery.requiredXp} XP` : '최대'}</span></div>
            <div className="mastery-track"><i style={{ width: mastery.requiredXp ? `${mastery.currentXp / mastery.requiredXp * 100}%` : '100%' }} /></div>
            <div className="mastery-benefit"><b>레벨당 고정 성장</b><span>HP +{soldierMasteryGrowth[id].hp} · 공격 +{soldierMasteryGrowth[id].attack}</span></div>
            <div className="unit-deployment-traits"><span>1회 배치 <b>{stats.squadSize}명{equipmentCapstone && !statEquipmentCapstone ? ' (+1)' : ''}</b></span><span>공격 방식 <b>{attackPatternLabel(unit)}</b></span><span>유효 사거리 <b>{attackRangeLabel(unit)}</b></span>{spacingTraitLabel(unit) && <span>기동 특성 <b>{spacingTraitLabel(unit)}</b></span>}{guardProtectionLabel(unit) && <span>수호 특성 <b>{guardProtectionLabel(unit)}</b></span>}{stats.healingPower && <span>치유 <b>{stats.healingPower} · 사거리 {stats.healingRange}</b></span>}{unit.maxActivePerSide && <span>전장 제한 <b>진영당 {unit.maxActivePerSide}명</b></span>}{unit.grade === 5 && <span>지휘 분류 <b>5성 초월 병종</b></span>}</div>
            <dl>
              <div><dt>생명력</dt><dd><GrowthStat current={stats.maxHp} base={unit.maxHp} /></dd></div>
              <div><dt>공격 / 방어</dt><dd className="growth-pair"><GrowthStat current={stats.attackDamage} base={unit.attackDamage} /><i>/</i><GrowthStat current={stats.defense ?? 0} base={unit.defense ?? 0} /></dd></div>
              <div><dt>이동속도</dt><dd><GrowthStat current={stats.moveSpeed} base={unit.moveSpeed} /></dd></div>
            </dl>
            <GameButton variant={equipped ? 'primary' : 'secondary'} className={`formation-button ${equipped ? 'equipped' : ''}`} onClick={() => toggleFormation(id)}>{equipped ? '편성 제외' : '전투 편성'} <span>{equipped ? '편성 중' : `${equippedUnits.length}/${formationCapacity}`}</span></GameButton>
            <div className={`equipment-capstone ${equipmentCapstone ? 'unlocked' : ''}`}>
              <span>{equipmentCapstone ? '✦' : '◇'}</span>
              <div><b>{statEquipmentCapstone ? '최상위 개체 완성 보너스' : '장비 완성 보너스'}</b><small>{equipmentCapstone
                ? statEquipmentCapstone
                  ? `활성화 · 1명 유지 · 장비 ${STAT_EQUIPMENT_CAPSTONE_BONUS_RANKS}단계분 추가 · HP +${formatGameNumber(unit.equipmentGrowth.hp * STAT_EQUIPMENT_CAPSTONE_BONUS_RANKS)} · 공격 +${formatGameNumber(unit.equipmentGrowth.attack * STAT_EQUIPMENT_CAPSTONE_BONUS_RANKS)} · 방어 +${formatGameNumber(unit.equipmentGrowth.defense * STAT_EQUIPMENT_CAPSTONE_BONUS_RANKS)} · 속도 +${formatGameNumber(unit.equipmentGrowth.moveSpeed * STAT_EQUIPMENT_CAPSTONE_BONUS_RANKS)}`
                  : '활성화 · 1회 배치 인원 +1'
                : statEquipmentCapstone
                  ? `장비 하나를 5단계까지 강화 · 완성 시 1명 유지 · ${closestCapstoneLevel}/5`
                  : `장비 하나를 5단계까지 강화 · ${closestCapstoneLevel}/5`}</small></div>
            </div>
            <div className="equipment-list">
            {equipmentSlots.map((slot) => {
              const level = equipment[slot.id];
              const cost = equipmentCost(unit, level);
              return <GameButton variant="secondary" size="small" key={slot.id} disabled={!unlocked || level >= 5 || gold < cost} onClick={() => buy(id, slot.id)}>
                <i>{slot.icon}</i><span><b>{slot.name} +{level}</b><small>{equipmentEffect(unit, slot.id)}</small></span><em>{level >= 5 ? '최대' : `● ${cost}`}</em>
              </GameButton>;
            })}
            </div>
          </> : canRecruit ? <div className="recruit-panel"><p>{unit.recruitSource === 'campaign' ? '대륙 탈환 완료로 연합 최고 전력의 고용 협상이 열렸습니다.' : directRecruitable && !encountered ? '성채 승급으로 정규 병종의 영입 허가가 열렸습니다.' : tierLocked ? `${requiredTier}티어 성채의 병영 허가가 필요한 병종입니다.` : '전장에서 확인한 병종입니다. 영입하면 적과 동일한 기본 능력으로 성장시킬 수 있습니다.'}</p><GameButton variant="primary" size="large" disabled={tierLocked || stageLocked || gold < (unit.recruitCost ?? 0)} onClick={() => recruit(id)}>{stageLocked ? `${requiredStage}장 클리어 필요` : tierLocked ? `${requiredTier}티어 승급 필요` : <>영입하기 <span>● {unit.recruitCost}</span></>}</GameButton></div> : <p className="unknown-unit-copy">{unit.recruitSource === 'challenge' ? '마수 도전을 최초 격파하면 지형 보정이 없는 기본 개체가 합류합니다.' : unit.recruitSource === 'campaign' && requiredStage ? `${requiredStage}장 클리어 후 정체와 고용 조건이 공개됩니다.` : knownReward ? '왕국 지도에서 해당 병종의 합류 조건을 확인하세요.' : unit.requiresEncounter === false ? `성채 ${requiredTier}티어 승급 시 정규 병종 정보와 영입 허가가 열립니다.` : '전장에서 직접 조우하면 병종 정보와 영입 협상이 열립니다.'}</p>}
        </div>
      </article>
    );
  };

  return <Localized>{(
    <main className="panel-screen armory-screen">
      {header}
      <div className="armory-browser-toolbar">
        <div className="armory-view-switch" role="group" aria-label="병영 보기 방식">
          <GameButton variant="filter" size="small" active={armoryView === 'focus'} onClick={() => setArmoryView('focus')}>집중 보기 <small>선택한 병종 상세</small></GameButton>
          <GameButton variant="filter" size="small" active={armoryView === 'cards'} onClick={() => setArmoryView('cards')}>전체 카드 <small>한 번에 비교</small></GameButton>
        </div>
        <div className="armory-filter-stack">
          <nav className="roster-filters faction-filters" aria-label="병종 진영 필터">
            <GameButton variant="filter" size="small" active={factionFilter === 'all' && gradeFilter === 'all'} onClick={() => selectFaction('all')}><i aria-hidden="true">{factionMarks.all}</i><span>전체</span><b>{allTroopOrder.length}</b></GameButton>
            {(Object.entries(rosterFactionLabels) as Array<[RosterFaction, string]>).map(([faction, label]) => (
              <GameButton variant="filter" size="small" active={gradeFilter === 'all' && factionFilter === faction} onClick={() => selectFaction(faction)} key={faction}><i aria-hidden="true">{factionMarks[faction]}</i><span>{label}</span><b>{allTroopOrder.filter((id) => rosterFactionById[id] === faction).length}</b></GameButton>
            ))}
          </nav>
          <nav className="roster-filters grade-filters" aria-label="병종 성급 필터">
            {unitGrades.map((grade) => <GameButton variant="filter" size="small" active={gradeFilter === grade} className={`grade-${grade}`} onClick={() => selectGrade(grade)} key={grade}><i aria-hidden="true">★</i><span>{grade}성</span><b>{knownRoster.filter((id) => troopDefinitions[id].grade === grade).length}</b></GameButton>)}
          </nav>
        </div>
      </div>
      <section className="armory-intro">
        <div><span className="eyebrow">왕국 병영</span><h2>병사 장비고</h2></div>
        <p>조우한 적 병종은 성채 티어에 맞는 영입 허가가 필요합니다. 보유 병종 중 최대 {formationCapacity}종을 편성하고 성장시키세요.</p>
      </section>
      <section className="formation-strip">
        <div><span className="eyebrow">출전 부대</span><strong>현재 편성 {equippedUnits.length}/{formationCapacity}</strong><small>보유 유닛을 슬롯으로 드래그하거나, 유닛 선택 후 슬롯을 누르세요.</small></div>
        <div className="formation-dnd-slots">{formationSlots.map((id, index) => (
          <div className={`formation-dnd-slot ${dragOverSlot === index ? 'drag-over' : ''} ${id ? 'occupied' : 'empty'}`} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; setDragOverSlot(index); }} onDragLeave={() => setDragOverSlot((current) => current === index ? null : current)} onDrop={(event) => dropUnit(event, index)} key={index}>
            <GameButton variant="ghost" size="small" draggable={Boolean(id)} onDragStart={(event) => id && startUnitDrag(event, id)} onDragEnd={() => setDragOverSlot(null)} onClick={() => assignFormation(selectedUnitId, index)} aria-label={`${index + 1}번 슬롯${id ? `, ${troopDefinitions[id].name}` : ', 빈 슬롯'}, 선택 병종 배치`}>
              <i>{index + 1}</i>{id ? <><CharacterSprite id={id} className="formation-slot-art" /><span>{troopDefinitions[id].name}</span></> : <span className="formation-empty-label">빈 슬롯</span>}
            </GameButton>
            {id && <GameButton variant="danger" size="small" className="formation-slot-remove" disabled={equippedUnits.length <= 1} onClick={() => toggleFormation(id)} aria-label={`${troopDefinitions[id].name} 편성 제외`}>×</GameButton>}
          </div>
        ))}</div>
      </section>
      {armoryView === 'focus' ? <div className="armory-focus-layout">
        <div className="unit-compact-grid" aria-label="병종 목록">
          {visibleRoster.map((id) => {
            const { unit, unlocked, known, canRecruit, tierLocked, status } = unitPresentation(id);
            return <GameButton
              variant="filter"
              active={selectedUnitId === id}
              type="button"
              draggable={unlocked}
              onDragStart={(event) => startUnitDrag(event, id)}
              className={`unit-compact-button accent-${id} ${selectedUnitId === id ? 'selected' : ''} ${unlocked ? '' : 'unit-card-locked'} ${canRecruit && !unlocked && !tierLocked ? 'unit-card-recruitable' : ''}`}
              key={id}
              onClick={() => setSelectedUnitId(id)}
              aria-pressed={selectedUnitId === id}
              aria-label={`${known ? unit.name : '미확인 병종'} 선택`}
            >
              <span className="unit-compact-art">{known ? <CharacterSprite id={id} className="character-sprite-card" /> : <b>?</b>}</span>
              <span className="unit-compact-copy"><b>{known ? unit.name : '미확인 병종'}</b>{known && <em>{unitGradeStars(unit.grade)}</em>}<small>{status}</small></span>
            </GameButton>;
          })}
        </div>
        {detailUnitId ? <aside className="armory-detail-sticky" aria-label="선택한 병종 상세">{renderUnitCard(detailUnitId)}</aside> : <aside className="armory-detail-empty">선택한 조건에 해당하는 확인 병종이 없습니다.</aside>}
      </div> : <div className="unit-grid card-view">
        {visibleRoster.map(renderUnitCard)}
        {visibleRoster.length === 0 && <p className="armory-empty-filter">선택한 조건에 해당하는 확인 병종이 없습니다.</p>}
      </div>}
      <GameButton variant="danger" size="small" className="reset-button" onClick={() => setConfirmReset(true)}>진행 데이터 초기화</GameButton>
      {notice && <div className="toast" role="status">{notice}</div>}
      {confirmReset && <GameModal eyebrow="RESET PROFILE" title="모든 진행도를 초기화할까요?" tone="danger" onClose={() => setConfirmReset(false)} actions={<><GameButton variant="ghost" className="modal-button secondary" data-autofocus onClick={() => setConfirmReset(false)}>취소</GameButton><GameButton variant="danger" className="modal-button danger" onClick={() => { resetProgress(); setConfirmReset(false); }}>모든 기록 초기화</GameButton></>}>
        <p>금화, 보석, 장비, 숙련도, 영웅, 성채 기술과 스테이지 진행이 모두 처음 상태로 돌아갑니다. 이 작업은 되돌릴 수 없습니다.</p>
      </GameModal>}
    </main>
  )}</Localized>;
}
