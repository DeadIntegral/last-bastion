import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ChangeEvent, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { allTroopOrder, bossDefinition, heroDefinitions, heroOrder, troopDefinitions, unitFamilyById, unitFamilyLabels, unitGradeLabels, unitGradeStars } from './data/units';
import { bossCodex, CODEX_TOTAL, codexEntryCount, heroCodex, troopCodex } from './data/codex';
import { achievementById, achievementGroups, achievementProgress, achievements, featuredAchievement } from './data/achievements';
import { canUpgradeCastleTech, castleBattleStats, castleTechChildren, castleTechCost, castleTechDefinitions, castleTechPrerequisiteStatus, castleTechRoots, fortressTierDefinitions, totalCastleResearch } from './data/castle';
import { battleFormationCapacity, BATTLE_SPEED_LICENSE, DAILY_REWARD, FORMATION_SLOT_LICENSES, MAX_FORMATION_SLOT_PURCHASES } from './data/economy';
import { TRIUMPH_MONUMENT, triumphMonumentBonuses, triumphMonumentCost } from './data/endgame';
import { gameFeatures, heroTrainingPackages, isGameFeatureUnlocked } from './data/features';
import { OPENING_SCENE_DURATION_MS, openingScenes } from './data/opening';
import { HERO_AWAKENING_LEVELS, HERO_MASTERY_MAX_LEVEL, heroAwakeningAuras, heroMasteryGrowth, heroSkillPower, soldierMasteryGrowth } from './data/mastery';
import { challengeStages, enemyFactionLabels, getStage, stages } from './data/stages';
import { GAME_VERSION_LABEL } from './data/version';
import { localDateKey } from './game/daily';
import { analyzeCampaignDifficulty, stageDifficultyPresentation } from './game/difficulty';
import { decryptSave, encryptSave, isEncryptedSave, MAX_SAVE_FILE_BYTES } from './game/saveCrypto';
import { activeSaveSlot, deleteSaveSlot, readSaveSlot, saveSlotSummaries, saveSlotSummary, setActiveSaveSlot, type SaveSlotId } from './game/saveSlots';
import { screenTransitionDecision } from './game/screenTransitions';
import { musicEngine, type MusicScene } from './audio/music';
import { ATTACK_RHYTHM_REVEAL_MASTERY_LEVEL, STAT_EQUIPMENT_CAPSTONE_BONUS_RANKS, attackPatternLabel, attackRangeLabel, attackTimingLabel, equipmentCost, formatTime, guardProtectionLabel, hasEquipmentCapstone, heroAwakeningRank, heroMasteryLevelFromXp, heroRespawnReductionMs, masteryLevelFromXp, scaledHeroRespawnMs, scaledHeroSkillCooldownMs, scaledHeroSkillPower, scaledProgressionReward, upgradedStats, usesStatEquipmentCapstone } from './game/rules';
import { useGameStore } from './store/useGameStore';
import { CharacterSprite } from './components/CharacterSprite';
import { GameModal } from './components/GameModal';
import { Localized } from './shared/i18n/Localized';
import { changeLanguage, getLanguageLocale, supportedLanguages, t, useTranslation, type Language } from './shared/i18n/i18n';
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
  if (id === 'marshal') {
    return `보호막 ${scaledHeroSkillPower(heroSkillPower.marshal.shield, heroSkillPower.marshal.shieldPerRank, heroSkillPower.marshal.shieldPerAwakening, masteryLevel)}`;
  }
  if (id === 'orcChampion') {
    const damage = scaledHeroSkillPower(heroSkillPower.orcChampion.damage, heroSkillPower.orcChampion.damagePerRank, heroSkillPower.orcChampion.damagePerAwakening, masteryLevel);
    const shield = scaledHeroSkillPower(heroSkillPower.orcChampion.shield, heroSkillPower.orcChampion.shieldPerRank, heroSkillPower.orcChampion.shieldPerAwakening, masteryLevel);
    return `범위 피해 ${damage} · 보호막 ${shield}`;
  }
  const unitDamage = scaledHeroSkillPower(heroSkillPower.windSpirit.unitDamage, heroSkillPower.windSpirit.unitDamagePerRank, heroSkillPower.windSpirit.unitDamagePerAwakening, masteryLevel);
  const castleDamage = scaledHeroSkillPower(heroSkillPower.windSpirit.castleDamage, heroSkillPower.windSpirit.castleDamagePerRank, heroSkillPower.windSpirit.castleDamagePerAwakening, masteryLevel);
  return `폭풍 피해 ${unitDamage} · 성채 ${castleDamage}`;
}

const BattleView = lazy(() => import('./components/BattleView').then((module) => ({ default: module.BattleView })));

function LanguageSelect() {
  const { lang } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const activeLanguage = supportedLanguages.find((language) => language.id === lang) ?? supportedLanguages[0];

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus();

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      } else if (event.key === 'Tab') setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const chooseLanguage = (language: Language) => {
    setOpen(false);
    triggerRef.current?.focus();
    void changeLanguage(language);
  };

  const handleMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const options = [...(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? [])];
    const currentIndex = options.indexOf(document.activeElement as HTMLButtonElement);
    let nextIndex = currentIndex;
    if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % options.length;
    else if (event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + options.length) % options.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = options.length - 1;
    else return;
    event.preventDefault();
    options[nextIndex]?.focus();
  };

  return (
    <div className={`language-picker ${open ? 'open' : ''}`} ref={rootRef}>
      <button className="language-trigger" type="button" ref={triggerRef} aria-label={`${t('언어 선택')}: ${activeLanguage.label}`} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((value) => !value)} onKeyDown={(event) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          setOpen(true);
        }
      }}>
        <span className="language-trigger-copy"><b>{activeLanguage.label}</b><small>{activeLanguage.id.toUpperCase()}</small></span>
        <i aria-hidden="true">⌄</i>
      </button>
      {open && <div className="language-dropdown-menu" role="listbox" aria-label={t('언어 선택')} ref={menuRef} onKeyDown={handleMenuKeyDown}>
        <span className="language-menu-caption">LANGUAGE</span>
        {supportedLanguages.map((language) => (
          <button type="button" role="option" aria-selected={lang === language.id} className={lang === language.id ? 'active' : ''} onClick={() => chooseLanguage(language.id)} key={language.id}>
            <span>{language.id.toUpperCase()}</span><b>{language.label}</b><i aria-hidden="true">{lang === language.id ? '✓' : ''}</i>
          </button>
        ))}
      </div>}
    </div>
  );
}

function Wallet({ gold, gems }: { gold: number; gems: number }) {
  return <div className="wallet"><div className="gold-pill"><span>●</span><strong>{gold.toLocaleString()}</strong></div><div className="gem-pill"><span>◆</span><strong>{gems.toLocaleString()}</strong></div></div>;
}

function GrowthStat({ current, base }: { current: number; base: number }) {
  const delta = Math.round((current - base) * 10) / 10;
  const deltaLabel = delta > 0 ? `+${delta}` : delta < 0 ? String(delta) : '+0';
  return <span className="growth-stat" title={`기본 ${base}`} aria-label={`현재 ${current}, 기본 대비 ${deltaLabel}`}><span>{current}</span><small>{deltaLabel}</small></span>;
}

function downloadSaveFile(serialized: string, slotId: SaveSlotId): void {
  const blob = new Blob([serialized], { type: 'application/json;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  link.href = objectUrl;
  link.download = `last-bastion-slot-${slotId}-${date}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}

function ShellHeader({ title, onBack }: { title: string; onBack: () => void }) {
  const gold = useGameStore((state) => state.gold);
  const gems = useGameStore((state) => state.gems);
  return <Localized>{(
    <header className="shell-header">
      <button className="back-button" onClick={onBack} aria-label="뒤로 가기">‹</button>
      <div><span className="eyebrow">LAST BASTION</span><h1>{title}</h1></div>
      <div className="shell-header-actions"><LanguageSelect /><Wallet gold={gold} gems={gems} /></div>
    </header>
  )}</Localized>;
}

function MainMenu({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const resetProgress = useGameStore((state) => state.resetProgress);
  const importSave = useGameStore((state) => state.importSave);
  const [, refreshSlots] = useState(0);
  const [activeModal, setActiveModal] = useState<'delete-slot' | 'export-password' | 'import-password' | 'import-target' | 'import-confirm' | 'invalid-save' | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<SaveSlotId | null>(null);
  const [pendingImport, setPendingImport] = useState<{ name: string; serialized: string } | null>(null);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [cryptoError, setCryptoError] = useState('');
  const [cryptoBusy, setCryptoBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const importRef = useRef<HTMLInputElement>(null);
  const slots = saveSlotSummaries();
  const currentSlot = activeSaveSlot();

  const closeModal = () => {
    if (cryptoBusy) return;
    setActiveModal(null);
    setSelectedSlotId(null);
    setPassword('');
    setPasswordConfirm('');
    setCryptoError('');
  };

  const startNewGame = (slotId: SaveSlotId) => {
    setActiveSaveSlot(slotId);
    resetProgress();
    refreshSlots((value) => value + 1);
    onNavigate('opening');
  };

  const continueGame = (slotId: SaveSlotId) => {
    const serialized = readSaveSlot(slotId);
    if (!serialized) return;
    const previousSlot = activeSaveSlot();
    setActiveSaveSlot(slotId);
    if (importSave(serialized)) onNavigate('stages');
    else {
      setActiveSaveSlot(previousSlot);
      setSelectedSlotId(slotId);
      setActiveModal('invalid-save');
    }
  };

  const requestDelete = (slotId: SaveSlotId) => {
    setSelectedSlotId(slotId);
    setActiveModal('delete-slot');
  };

  const confirmDelete = () => {
    if (selectedSlotId === null) return;
    const deletingActiveSlot = activeSaveSlot() === selectedSlotId;
    deleteSaveSlot(selectedSlotId);
    if (deletingActiveSlot) resetProgress();
    refreshSlots((value) => value + 1);
    closeModal();
  };

  const requestExport = (slotId: SaveSlotId) => {
    setSelectedSlotId(slotId);
    setPassword('');
    setPasswordConfirm('');
    setCryptoError('');
    setActiveModal('export-password');
  };

  const exportEncryptedSave = async () => {
    if (selectedSlotId === null) return;
    if (password.length < 8) {
      setCryptoError('비밀번호는 8자 이상 입력해 주세요.');
      return;
    }
    if (password !== passwordConfirm) {
      setCryptoError('비밀번호 확인이 일치하지 않습니다.');
      return;
    }
    const serialized = readSaveSlot(selectedSlotId);
    if (!serialized) return;
    setCryptoBusy(true);
    setCryptoError('');
    try {
      downloadSaveFile(await encryptSave(serialized, password), selectedSlotId);
      setNotice(`슬롯 ${selectedSlotId}을 암호화된 저장 파일로 내보냈습니다.`);
      window.setTimeout(() => setNotice(''), 1_800);
      setActiveModal(null);
      setSelectedSlotId(null);
      setPassword('');
      setPasswordConfirm('');
    } catch {
      setCryptoError('암호화 저장 파일을 만들지 못했습니다. 다시 시도해 주세요.');
    } finally {
      setCryptoBusy(false);
    }
  };

  const loadFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > MAX_SAVE_FILE_BYTES) {
      setActiveModal('invalid-save');
      return;
    }
    try {
      const serialized = await file.text();
      setPendingImport({ name: file.name, serialized });
      setPassword('');
      setCryptoError('');
      setActiveModal(isEncryptedSave(serialized) ? 'import-password' : 'import-target');
    } catch {
      setActiveModal('invalid-save');
    }
  };

  const decryptImport = async () => {
    if (!pendingImport || !password) {
      setCryptoError('저장 파일의 비밀번호를 입력해 주세요.');
      return;
    }
    setCryptoBusy(true);
    setCryptoError('');
    try {
      const serialized = await decryptSave(pendingImport.serialized, password);
      setPendingImport({ ...pendingImport, serialized });
      setPassword('');
      setActiveModal('import-target');
    } catch {
      setCryptoError('비밀번호가 틀렸거나 파일의 체크섬·인증 정보가 손상되었습니다.');
    } finally {
      setCryptoBusy(false);
    }
  };

  const chooseImportTarget = (slotId: SaveSlotId) => {
    setSelectedSlotId(slotId);
    setActiveModal(slots.find((slot) => slot.id === slotId)?.occupied ? 'import-confirm' : 'import-target');
    if (!slots.find((slot) => slot.id === slotId)?.occupied) applyImport(slotId);
  };

  const applyImport = (slotId: SaveSlotId) => {
    if (!pendingImport) return;
    const previousSlot = activeSaveSlot();
    setActiveSaveSlot(slotId);
    if (importSave(pendingImport.serialized)) {
      setPendingImport(null);
      setActiveModal(null);
      refreshSlots((value) => value + 1);
      onNavigate('stages');
    } else {
      setActiveSaveSlot(previousSlot);
      setActiveModal('invalid-save');
    }
  };

  const importPreview = pendingImport ? saveSlotSummary(1, pendingImport.serialized) : null;

  return <Localized>{(
    <main className="menu-screen menu-screen-slots">
      <div className="menu-clouds" />
      <div className="menu-castle" aria-hidden="true">
        <span className="tower left" /><span className="keep" /><span className="tower right" />
      </div>
      <nav className="menu-top"><span className="version">{GAME_VERSION_LABEL}</span><LanguageSelect /></nav>
      <section className="title-lockup">
        <span className="title-crest">♜</span>
        <p>THE LAST LINE STANDS</p>
        <h1>LAST <em>BASTION</em></h1>
        <p className="korean-title">최후의 성채</p>
      </section>
      <section className="save-slot-menu" aria-label="저장 슬롯 선택">
        <header><span className="eyebrow">CAMPAIGN ARCHIVE</span><strong>원정 기록을 선택하세요</strong></header>
        <div className="save-slot-grid">
          {slots.map((slot) => slot.occupied ? (
            <article className={`save-slot-card occupied ${currentSlot === slot.id ? 'active' : ''} ${slot.corrupted ? 'corrupted' : ''}`} key={slot.id}>
              <header><span>SLOT {slot.id}</span>{currentSlot === slot.id && <i>최근 사용</i>}</header>
              {slot.corrupted ? <><h2>손상된 기록</h2><p>저장 데이터를 읽을 수 없습니다.</p></> : <>
                <h2>{Math.min(slot.unlockedStage, stages.length)}장 원정</h2>
                <dl><div><dt>클리어</dt><dd>{slot.clearedStages}/{stages.length}</dd></div><div><dt>전투</dt><dd>{slot.battles.toLocaleString()}회</dd></div><div><dt>금화</dt><dd>● {slot.gold.toLocaleString()}</dd></div></dl>
                <small>{slot.updatedAt ? new Date(slot.updatedAt).toLocaleString(getLanguageLocale()) : '기존 자동 저장에서 이전됨'} · {slot.gameVersion ? `v${slot.gameVersion}` : 'LEGACY'}</small>
              </>}
              <div className="save-slot-actions">
                <button className="continue" disabled={slot.corrupted} onClick={() => continueGame(slot.id)}>이어하기</button>
                <button disabled={slot.corrupted} onClick={() => requestExport(slot.id)}>내보내기</button>
                <button className="delete" onClick={() => requestDelete(slot.id)}>삭제</button>
              </div>
            </article>
          ) : (
            <button className="save-slot-card empty" onClick={() => startNewGame(slot.id)} key={slot.id}>
              <span>SLOT {slot.id}</span><i>＋</i><strong>새 게임</strong><small>비어 있는 원정 기록</small>
            </button>
          ))}
        </div>
        <div className="save-slot-footer">
          <button onClick={() => importRef.current?.click()}><span>↓</span> 암호화 저장 가져오기</button>
          <button onClick={() => onNavigate('credits')}>크레딧</button>
        </div>
        <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={loadFile} />
      </section>
      <p className="menu-tip">“세 개의 원정 기록은 각각 독립적으로 자동 저장됩니다.”</p>
      {notice && <div className="toast" role="status">{notice}</div>}

      {activeModal === 'delete-slot' && selectedSlotId !== null && <GameModal eyebrow="DELETE CAMPAIGN" title={`슬롯 ${selectedSlotId}을 삭제할까요?`} tone="danger" onClose={closeModal} actions={<><button className="modal-button secondary" data-autofocus onClick={closeModal}>취소</button><button className="modal-button danger" onClick={confirmDelete}>원정 기록 삭제</button></>}>
        <p>이 슬롯의 진행도는 브라우저에서 완전히 삭제됩니다. 필요하다면 먼저 암호화 저장 파일로 내보내세요.</p>
      </GameModal>}

      {activeModal === 'export-password' && selectedSlotId !== null && <GameModal eyebrow="ENCRYPT SAVE" title={`슬롯 ${selectedSlotId} 암호화 내보내기`} onClose={closeModal} actions={<><button className="modal-button secondary" onClick={closeModal} disabled={cryptoBusy}>취소</button><button className="modal-button primary" onClick={() => void exportEncryptedSave()} disabled={cryptoBusy}>{cryptoBusy ? '암호화 중…' : '암호화하여 다운로드'}</button></>}>
        <p>AES-256-GCM으로 저장 파일을 암호화합니다. 비밀번호는 저장되지 않으며 잊어버리면 복구할 수 없습니다.</p>
        <div className="save-password-fields"><label>비밀번호<input data-autofocus type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} /></label><label>비밀번호 확인<input type="password" autoComplete="new-password" value={passwordConfirm} onChange={(event) => setPasswordConfirm(event.target.value)} minLength={8} /></label></div>
        <div className="crypto-spec"><span>AES-GCM 256</span><span>PBKDF2 · SHA-256</span><span>210,000회</span><span>CHECKSUM</span></div>
        {cryptoError && <p className="modal-error" role="alert">{cryptoError}</p>}
      </GameModal>}

      {activeModal === 'import-password' && pendingImport && <GameModal eyebrow="DECRYPT SAVE" title="암호화 저장 불러오기" onClose={closeModal} actions={<><button className="modal-button secondary" onClick={closeModal} disabled={cryptoBusy}>취소</button><button className="modal-button primary" onClick={() => void decryptImport()} disabled={cryptoBusy}>{cryptoBusy ? '검증 중…' : '복호화하고 검증'}</button></>}>
        <p><strong>{pendingImport.name}</strong>의 비밀번호를 입력하세요. 체크섬과 AES-GCM 인증을 모두 통과해야 불러올 수 있습니다.</p>
        <div className="save-password-fields"><label>비밀번호<input data-autofocus type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label></div>
        {cryptoError && <p className="modal-error" role="alert">{cryptoError}</p>}
      </GameModal>}

      {activeModal === 'import-target' && pendingImport && <GameModal eyebrow="IMPORT CAMPAIGN" title="가져올 슬롯 선택" onClose={closeModal} actions={<button className="modal-button secondary" onClick={closeModal}>취소</button>}>
        <p><strong>{pendingImport.name}</strong>{importPreview && !importPreview.corrupted ? ` · ${importPreview.unlockedStage}장 · 전투 ${importPreview.battles}회` : ''}</p>
        <div className="import-slot-list">{slots.map((slot) => <button data-autofocus={slot.id === 1 ? true : undefined} className={slot.occupied ? 'occupied' : ''} onClick={() => chooseImportTarget(slot.id)} key={slot.id}><span>SLOT {slot.id}</span><strong>{slot.occupied ? slot.corrupted ? '손상된 기록 덮어쓰기' : `${slot.unlockedStage}장 기록 교체` : '빈 슬롯에 가져오기'}</strong></button>)}</div>
      </GameModal>}

      {activeModal === 'import-confirm' && pendingImport && selectedSlotId !== null && <GameModal eyebrow="OVERWRITE SLOT" title={`슬롯 ${selectedSlotId}을 교체할까요?`} tone="danger" onClose={() => setActiveModal('import-target')} actions={<><button className="modal-button secondary" data-autofocus onClick={() => setActiveModal('import-target')}>취소</button><button className="modal-button danger" onClick={() => applyImport(selectedSlotId)}>덮어쓰고 이어하기</button></>}>
        <p>현재 슬롯의 원정 기록이 가져온 저장으로 교체됩니다. 기존 기록은 내보내지 않았다면 복구할 수 없습니다.</p>
      </GameModal>}

      {activeModal === 'invalid-save' && <GameModal eyebrow="IMPORT FAILED" title="저장 파일을 읽을 수 없습니다" onClose={closeModal} actions={<button className="modal-button primary" data-autofocus onClick={closeModal}>확인</button>}>
        <p>파일 형식, 비밀번호, SHA-256 체크섬 또는 AES-GCM 인증 정보를 확인해 주세요. 기존 평문 저장은 가져오기 호환만 지원합니다.</p>
      </GameModal>}
    </main>
  )}</Localized>;
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

  return <Localized>{(
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
  )}</Localized>;
}

function Credits({ onBack }: { onBack: () => void }) {
  return <Localized><main className="panel-screen credits-screen">
    <ShellHeader title="크레딧" onBack={onBack} />
    <section className="credits-card">
      <span className="title-crest">♜</span>
      <small>LAST BASTION · PRE-ALPHA</small>
      <h2>최후의 성채</h2>
      <p>마왕군에게 빼앗긴 대륙을 되찾는 웹 기반 횡스크롤 공성 전략 게임.</p>
      <dl><div><dt>GAME DESIGN & DEVELOPMENT</dt><dd>Player × AI Collaborative Project</dd></div><div><dt>ENGINE</dt><dd>React · Phaser · Vite</dd></div><div><dt>FONT</dt><dd>Pretendard Variable · Runtime CDN</dd></div><div><dt>AUDIO</dt><dd>Procedural Web Audio Soundtrack</dd></div></dl>
      <button className="primary-button" onClick={onBack}>타이틀로 돌아가기</button>
    </section>
  </main></Localized>;
}

const mapHeightPattern = [75, 57, 73, 45, 62, 28, 50, 72, 46, 65, 40, 23];
const mapStageSpacing = 185;
const mapPositions = stages.map((_, index) => ({ x: 135 + index * mapStageSpacing, y: mapHeightPattern[index % mapHeightPattern.length] }));
const challengeMapPositions: Record<number, { x: number; y: number }> = {
  101: { x: mapPositions[5].x + 55, y: 11 },
  106: { x: mapPositions[11].x + 45, y: 88 },
  102: { x: mapPositions[17].x + 35, y: 11 },
  107: { x: mapPositions[23].x + 25, y: 88 },
  103: { x: mapPositions[26].x + 45, y: 12 },
  104: { x: mapPositions[29].x + 70, y: 86 },
  105: { x: mapPositions[29].x + 210, y: 45 },
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
  const formationSlotPurchases = useGameStore((state) => state.formationSlotPurchases);
  const triumphMonumentLevel = useGameStore((state) => state.triumphMonumentLevel);
  const muted = useGameStore((state) => state.muted);
  const toggleMuted = useGameStore((state) => state.toggleMuted);
  const [notice, setNotice] = useState('');
  const claimable = unlockedAchievements.filter((id) => !claimedAchievements.includes(id)).length;
  const dailyAvailable = lastDailyClaimDate !== localDateKey();
  const monumentUnlocked = clearedStages.includes(TRIUMPH_MONUMENT.unlockStage);
  const speedLicenseRevealed = clearedStages.includes(BATTLE_SPEED_LICENSE.unlockStage);
  const formationCapacity = battleFormationCapacity(formationSlotPurchases);
  const merchantStatus = battleSpeedUnlocked && formationSlotPurchases >= MAX_FORMATION_SLOT_PURCHASES
    ? '모든 영구 허가 보유'
    : battleSpeedUnlocked || formationSlotPurchases > 0 ? `편성 ${formationCapacity}종 · 상점 방문` : '희귀한 물건을 거래합니다';

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

  return <Localized><>
    <section className="map-command-center" aria-label="원정대 관리">
      <header><span>EXPEDITION</span><strong>왕국 운영</strong></header>
      <button onClick={() => onNavigate('armory')}><i>♢</i><span>병영과 강화<small>ARMORY · {allTroopOrder.length}</small></span></button>
      <button onClick={() => onNavigate('heroes')}><i>{heroDefinitions[selectedHero].icon}</i><span>영웅의 전당<small>{heroDefinitions[selectedHero].name}</small></span></button>
      <button onClick={() => onNavigate('fortress')}><i>♜</i><span>성채 기술<small>5 BRANCHES</small></span></button>
      <button className={monumentUnlocked ? 'monument-ready' : 'feature-locked'} disabled={!monumentUnlocked} onClick={() => onNavigate('monument')}><i>♜</i><span>{TRIUMPH_MONUMENT.name}<small>{monumentUnlocked ? `${triumphMonumentLevel}/${TRIUMPH_MONUMENT.maxLevel}단계` : `${TRIUMPH_MONUMENT.unlockStage}장 클리어 시 건립`}</small></span></button>
      <button onClick={() => onNavigate('achievements')}><i>✦</i><span>업적 기록<small>{claimable ? `${claimable} 보상 대기` : `${unlockedAchievements.length}/${achievements.length}`}</small></span></button>
      <button onClick={() => onNavigate('codex')}><i>▤</i><span>전쟁 사전<small>{codexEntries}/{CODEX_TOTAL}</small></span></button>
      <button className={dailyAvailable ? 'daily-ready' : ''} disabled={!dailyAvailable} onClick={receiveDaily}><i>◆</i><span>{DAILY_REWARD.label}<small>{dailyAvailable ? `보석 ${DAILY_REWARD.gems}개 받기` : '오늘 수령 완료'}</small></span></button>
      <button className={speedLicenseRevealed ? 'merchant-ready' : 'feature-locked'} disabled={!speedLicenseRevealed} onClick={() => onNavigate('merchant')}><i>?</i><span>수수께끼 상인<small>{!speedLicenseRevealed ? `${BATTLE_SPEED_LICENSE.unlockStage}장 보스 격파 시 출현` : merchantStatus}</small></span></button>
      <button onClick={toggleMusic}><i>{muted ? '♩̸' : '♪'}</i><span>게임 사운드<small>{muted ? 'OFF' : 'ON'}</small></span></button>
    </section>
    {notice && <div className="toast" role="status">{notice}</div>}
  </></Localized>;
}

function MysteryMerchant({ onBack }: { onBack: () => void }) {
  const gems = useGameStore((state) => state.gems);
  const clearedStages = useGameStore((state) => state.clearedStages);
  const battleSpeedUnlocked = useGameStore((state) => state.battleSpeedUnlocked);
  const formationSlotPurchases = useGameStore((state) => state.formationSlotPurchases);
  const purchaseBattleSpeed = useGameStore((state) => state.purchaseBattleSpeed);
  const purchaseFormationSlot = useGameStore((state) => state.purchaseFormationSlot);
  const [notice, setNotice] = useState('');
  const canAffordSpeed = gems >= BATTLE_SPEED_LICENSE.cost;
  const currentFormationCapacity = battleFormationCapacity(formationSlotPurchases);
  const nextFormationLicense = FORMATION_SLOT_LICENSES[formationSlotPurchases];
  const formationLicenseRevealed = Boolean(nextFormationLicense && clearedStages.includes(nextFormationLicense.unlockStage));
  const canAffordFormation = Boolean(nextFormationLicense && gems >= nextFormationLicense.cost);

  const buyBattleSpeed = () => {
    if (!purchaseBattleSpeed()) return;
    setNotice(`${BATTLE_SPEED_LICENSE.label}: 전투 1.5배속이 영구 해금되었습니다.`);
    window.setTimeout(() => setNotice(''), 1_800);
  };

  const buyFormationSlot = () => {
    if (!nextFormationLicense) return;
    if (!purchaseFormationSlot()) return;
    setNotice(`${nextFormationLicense.label}: 전투 편성이 최대 ${nextFormationLicense.capacity}종으로 확장되었습니다.`);
    window.setTimeout(() => setNotice(''), 1_800);
  };

  return <Localized>{(
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
            <button disabled={battleSpeedUnlocked || !canAffordSpeed} onClick={buyBattleSpeed}>
              {battleSpeedUnlocked ? '거래 완료' : canAffordSpeed ? `◆ ${BATTLE_SPEED_LICENSE.cost} · 구매` : `◆ ${BATTLE_SPEED_LICENSE.cost} · 보석 부족`}
            </button>
          </div>
        </article>
        <article className={`merchant-item formation-license ${!nextFormationLicense ? 'owned' : ''} ${nextFormationLicense && !formationLicenseRevealed ? 'locked' : ''}`}>
          <div className="merchant-item-mark"><span>{nextFormationLicense ? `${currentFormationCapacity}→${nextFormationLicense.capacity}` : '4→7'}</span><small>FORMATION</small></div>
          <div className="merchant-item-copy">
            <small>왕실 인장 · 희귀품</small>
            <h3>{nextFormationLicense?.label ?? '편성 확장 허가 완료'}</h3>
            <p>{nextFormationLicense ? `${nextFormationLicense.unlockStage}장 이후 편성을 ${nextFormationLicense.capacity}종으로 늘리는 영구 허가입니다.` : '원정대가 운용할 수 있는 모든 편성 슬롯을 해금했습니다.'}</p>
            <ul><li>편성 한도를 5·6·7종까지 단계적으로 확장</li><li>추가 병종은 편성 순서의 숫자키로 소환</li><li>구매한 슬롯은 모든 원정에서 영구 적용</li></ul>
          </div>
          <div className="merchant-item-action">
            <span>보유 보석 <strong>◆ {gems.toLocaleString()}</strong></span>
            <button disabled={!nextFormationLicense || !formationLicenseRevealed || !canAffordFormation} onClick={buyFormationSlot}>
              {!nextFormationLicense
                ? '거래 완료'
                : !formationLicenseRevealed
                  ? `${nextFormationLicense.unlockStage}장 클리어 필요`
                  : canAffordFormation ? `◆ ${nextFormationLicense.cost} · 구매` : `◆ ${nextFormationLicense.cost} · 보석 부족`}
            </button>
          </div>
        </article>
      </section>
      {notice && <div className="toast" role="status">{notice}</div>}
    </main>
  )}</Localized>;
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

  return <Localized>{(
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
                <span className="node-beacon fortress-beacon" aria-hidden="true"><i className="fortress-wall" /><b>{nodeCleared ? '✓' : stage.id}</b></span>
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
          {selected.enemyFortressAttack && <div className="elite-guard-preview"><small>FORTRESS FIRE</small><strong>적 성채 수비 사격</strong><span>사거리 {selected.enemyFortressAttack.range} · 공격 {selected.enemyFortressAttack.damage} · {(selected.enemyFortressAttack.intervalMs / 1000).toFixed(1)}초 간격</span></div>}
          {selected.eliteGuards && selected.eliteGuards.length > 0 && <div className="elite-guard-preview"><small>ELITE DEFENDERS · {selected.eliteGuards.length}</small><strong>{selected.eliteGuards.map((elite) => elite.name).join(' · ')}</strong><span>전선 거점에 배치된 중간 우두머리 · 상세 강화 수치는 비공개</span></div>}
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
  )}</Localized>;
}

function Armory({ onBack }: { onBack: () => void }) {
  const equipmentLevels = useGameStore((state) => state.equipmentLevels);
  const unlockedUnits = useGameStore((state) => state.unlockedUnits);
  const equippedUnits = useGameStore((state) => state.equippedUnits);
  const formationSlotPurchases = useGameStore((state) => state.formationSlotPurchases);
  const discoveredEnemies = useGameStore((state) => state.discoveredEnemies);
  const fortressTier = useGameStore((state) => state.fortressTier);
  const unitMasteryXp = useGameStore((state) => state.unitMasteryXp);
  const gold = useGameStore((state) => state.gold);
  const upgradeUnit = useGameStore((state) => state.upgradeUnitEquipment);
  const recruitUnit = useGameStore((state) => state.recruitUnit);
  const toggleEquippedUnit = useGameStore((state) => state.toggleEquippedUnit);
  const resetProgress = useGameStore((state) => state.resetProgress);
  const [notice, setNotice] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [familyFilter, setFamilyFilter] = useState<UnitFamily | 'all'>('all');
  const visibleRoster = familyFilter === 'all' ? allTroopOrder : allTroopOrder.filter((id) => unitFamilyById[id] === familyFilter);
  const formationCapacity = battleFormationCapacity(formationSlotPurchases);

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
      : `전투 편성은 1종 이상, 최대 ${formationCapacity}종까지 가능합니다.`);
    window.setTimeout(() => setNotice(''), 1800);
  };

  return <Localized>{(
    <main className="panel-screen armory-screen">
      <ShellHeader title="왕립 병영" onBack={onBack} />
      <section className="armory-intro">
        <div><span className="eyebrow">ARMORY</span><h2>병사 장비고</h2></div>
        <p>조우한 적 병종은 성채 티어에 맞는 영입 허가가 필요합니다. 보유 병종 중 최대 {formationCapacity}종을 편성하고 성장시키세요.</p>
      </section>
      <section className="formation-strip">
        <div><span className="eyebrow">BATTLE FORMATION</span><strong>현재 편성 {equippedUnits.length}/{formationCapacity}</strong></div>
        <div>{equippedUnits.map((id, index) => (
          <button
            key={id}
            type="button"
            disabled={equippedUnits.length <= 1}
            onClick={() => toggleFormation(id)}
            aria-label={`${troopDefinitions[id].name} 편성 제외`}
            title={equippedUnits.length <= 1 ? '전투 편성은 최소 1종이 필요합니다.' : `${troopDefinitions[id].name} 편성 제외`}
          ><i>{index + 1}</i>{troopDefinitions[id].icon} {troopDefinitions[id].name}<b aria-hidden="true">×</b></button>
        ))}</div>
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
          const statEquipmentCapstone = usesStatEquipmentCapstone(unit);
          const closestCapstoneLevel = Math.max(...Object.values(equipment));
          return (
            <article className={`unit-card accent-${id} ${unlocked ? '' : 'unit-card-locked'} ${canRecruit && !unlocked && !tierLocked ? 'unit-card-recruitable' : ''}`} key={id}>
              <div className="unit-card-portrait">{known ? <CharacterSprite id={id} className="character-sprite-card" /> : <span>?</span>}<small>{unlocked ? `숙련 LV.${mastery.level}` : canRecruit ? tierLocked ? `성채 ${requiredTier}티어 필요` : '영입 가능' : knownReward ? '지도에서 해금' : '미조우'}</small></div>
              <div className="unit-card-copy">
                <span className="eyebrow">{known ? `${unitFamilyLabels[unitFamilyById[id]]} · ${unit.tags.includes('flying') ? 'AIRBORNE' : unit.tags.includes('mounted') ? 'CAVALRY' : unit.tags.includes('ranged') ? 'RANGED' : unit.tags.includes('armored') ? 'VANGUARD' : 'INFANTRY'}` : 'UNKNOWN'}</span>
                <div className="unit-card-title-row">
                  <h3>{known ? unit.name : '미확인 병종'}</h3>
                  {known && <div className={`unit-grade grade-${unit.grade}`} aria-label={`${unit.grade}성 ${unitGradeLabels[unit.grade]} 병종`}><b>{unitGradeStars(unit.grade)}</b><span>{unit.grade}성 · {unitGradeLabels[unit.grade]}</span></div>}
                </div>
                {unlocked ? <>
                  <div className="mastery-line"><b>숙련 LV.{mastery.level}</b><span>{mastery.requiredXp ? `${mastery.currentXp}/${mastery.requiredXp} XP` : 'MAX'}</span></div>
                  <div className="mastery-track"><i style={{ width: mastery.requiredXp ? `${mastery.currentXp / mastery.requiredXp * 100}%` : '100%' }} /></div>
                  <div className="mastery-benefit"><b>레벨당 고정 성장</b><span>HP +{soldierMasteryGrowth[id].hp} · 공격 +{soldierMasteryGrowth[id].attack}</span></div>
                  <div className="unit-deployment-traits"><span>1회 배치 <b>{stats.squadSize}명{equipmentCapstone && !statEquipmentCapstone ? ' (+1)' : ''}</b></span><span>공격 방식 <b>{attackPatternLabel(unit)}</b></span><span>유효 사거리 <b>{attackRangeLabel(unit)}</b></span>{guardProtectionLabel(unit) && <span>수호 특성 <b>{guardProtectionLabel(unit)}</b></span>}{stats.healingPower && <span>치유 <b>{stats.healingPower} · 사거리 {stats.healingRange}</b></span>}{unit.maxActivePerSide && <span>전장 제한 <b>진영당 {unit.maxActivePerSide}명</b></span>}{unit.grade === 5 && <span>지휘 분류 <b>5성 초월 병종</b></span>}</div>
                  <dl>
                    <div><dt>생명력</dt><dd><GrowthStat current={stats.maxHp} base={unit.maxHp} /></dd></div>
                    <div><dt>공격 / 방어</dt><dd className="growth-pair"><GrowthStat current={stats.attackDamage} base={unit.attackDamage} /><i>/</i><GrowthStat current={stats.defense ?? 0} base={unit.defense ?? 0} /></dd></div>
                    <div><dt>이동속도</dt><dd><GrowthStat current={stats.moveSpeed} base={unit.moveSpeed} /></dd></div>
                  </dl>
                  <button className={`formation-button ${equipped ? 'equipped' : ''}`} onClick={() => toggleFormation(id)}>{equipped ? '편성 제외' : '전투 편성'} <span>{equipped ? 'ACTIVE' : `${equippedUnits.length}/${formationCapacity}`}</span></button>
                  <div className={`equipment-capstone ${equipmentCapstone ? 'unlocked' : ''}`}>
                    <span>{equipmentCapstone ? '✦' : '◇'}</span>
                    <div><b>{statEquipmentCapstone ? '최상위 개체 완성 보너스' : '장비 완성 보너스'}</b><small>{equipmentCapstone
                      ? statEquipmentCapstone
                        ? `활성화 · 1명 유지 · 장비 ${STAT_EQUIPMENT_CAPSTONE_BONUS_RANKS}단계분 추가 · HP +${unit.equipmentGrowth.hp * STAT_EQUIPMENT_CAPSTONE_BONUS_RANKS} · 공격 +${unit.equipmentGrowth.attack * STAT_EQUIPMENT_CAPSTONE_BONUS_RANKS} · 방어 +${unit.equipmentGrowth.defense * STAT_EQUIPMENT_CAPSTONE_BONUS_RANKS} · 속도 +${unit.equipmentGrowth.moveSpeed * STAT_EQUIPMENT_CAPSTONE_BONUS_RANKS}`
                        : '활성화 · 1회 배치 인원 +1'
                      : statEquipmentCapstone
                        ? `장비 하나를 5단계까지 강화 · 완성 시 1명 유지 · ${closestCapstoneLevel}/5`
                        : `장비 하나를 5단계까지 강화 · ${closestCapstoneLevel}/5`}</small></div>
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
      <button className="reset-button" onClick={() => setConfirmReset(true)}>진행 데이터 초기화</button>
      {notice && <div className="toast" role="status">{notice}</div>}
      {confirmReset && <GameModal eyebrow="RESET PROFILE" title="모든 진행도를 초기화할까요?" tone="danger" onClose={() => setConfirmReset(false)} actions={<><button className="modal-button secondary" data-autofocus onClick={() => setConfirmReset(false)}>취소</button><button className="modal-button danger" onClick={() => { resetProgress(); setConfirmReset(false); }}>모든 기록 초기화</button></>}>
        <p>금화, 보석, 장비, 숙련도, 영웅, 성채 기술과 스테이지 진행이 모두 처음 상태로 돌아갑니다. 이 작업은 되돌릴 수 없습니다.</p>
      </GameModal>}
    </main>
  )}</Localized>;
}

function HeroHall({ onBack }: { onBack: () => void }) {
  const gold = useGameStore((state) => state.gold);
  const clearedStages = useGameStore((state) => state.clearedStages);
  const selectedHero = useGameStore((state) => state.selectedHero);
  const unlockedHeroes = useGameStore((state) => state.unlockedHeroes);
  const heroEquipmentLevels = useGameStore((state) => state.heroEquipmentLevels);
  const heroMasteryXp = useGameStore((state) => state.heroMasteryXp);
  const unlockHero = useGameStore((state) => state.unlockHero);
  const selectHero = useGameStore((state) => state.selectHero);
  const upgradeHero = useGameStore((state) => state.upgradeHeroEquipment);
  const trainHeroMastery = useGameStore((state) => state.trainHeroMastery);
  const [notice, setNotice] = useState('');
  const trainingUnlocked = isGameFeatureUnlocked('hero-training', clearedStages);

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

  const upgradeEquipment = (id: HeroId, slot: EquipmentSlot) => {
    const slotName = equipmentSlots.find((item) => item.id === slot)?.name ?? '장비';
    notify(upgradeHero(id, slot) ? `${heroDefinitions[id].name}의 ${slotName} 장비가 강화되었습니다.` : '금화가 부족하거나 최고 장비 단계입니다.');
  };

  const trainMastery = (id: HeroId, packageId: typeof heroTrainingPackages[number]['id']) => {
    const trainingPackage = heroTrainingPackages.find((item) => item.id === packageId)!;
    notify(trainHeroMastery(id, packageId)
      ? `${heroDefinitions[id].name}이(가) ${trainingPackage.xp} XP를 획득했습니다.`
      : '금화가 부족하거나 이미 최고 숙련도입니다.');
  };

  return <Localized>{(
    <main className="panel-screen hero-hall-screen">
      <ShellHeader title="영웅의 전당" onBack={onBack} />
      <section className="armory-intro">
        <div><span className="eyebrow">HERO HALL</span><h2>원정대 지휘관</h2></div>
        <p>영웅은 무료로 출전하고 경험치로 숙련이 성장합니다. 영입·장비 강화와 9장 이후의 숙련까지 한곳에서 관리합니다.</p>
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
                  {guardProtectionLabel(hero) && <div><span>GUARD</span><strong>전열 수호</strong><p>{guardProtectionLabel(hero)}</p></div>}
                  <div className={awakeningRank > 0 ? 'awakening-aura-active' : ''}><span>AWAKENING AURA</span><strong>{awakeningAura.name}</strong><p>{awakeningRank > 0 ? `각성 ${awakeningRank}단계 · ${awakeningAura.description.replace(/\+\d+/g, (value) => `+${Number(value.slice(1)) * awakeningRank}`)} · 범위 ${awakeningAura.radius}` : `숙련 10에 해금 · ${awakeningAura.description} · 범위 ${awakeningAura.radius}`}</p></div>
                  <div><span>ACTIVE</span><strong>{hero.skillName}</strong><p>{hero.skillDescription}</p></div>
                </div>
                <dl className="hero-stats">
                  <div><dt>생명력</dt><dd><GrowthStat current={stats.maxHp} base={hero.maxHp} /></dd></div>
                  <div><dt>공격 / 방어</dt><dd className="growth-pair"><GrowthStat current={stats.attackDamage} base={hero.attackDamage} /><i>/</i><GrowthStat current={stats.defense ?? 0} base={hero.defense ?? 0} /></dd></div>
                  <div><dt>이동속도</dt><dd><GrowthStat current={stats.moveSpeed} base={hero.moveSpeed} /></dd></div>
                  <div><dt>부활</dt><dd><GrowthStat current={respawnMs / 1000} base={hero.respawnMs / 1000} /></dd></div>
                  <div><dt>유효 사거리</dt><dd>{attackRangeLabel(hero)}</dd></div>
                </dl>
                {unlocked && <div className="equipment-list hero-equipment-list">
                  {equipmentSlots.map((slot) => {
                    const level = equipment[slot.id];
                    const cost = equipmentCost(hero, level);
                    return <button key={slot.id} disabled={level >= 5 || gold < cost} onClick={() => upgradeEquipment(id, slot.id)}>
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
                {unlocked && <section className={`hero-training-panel ${trainingUnlocked ? '' : 'locked'}`}>
                  <header><span>ROYAL TRAINING</span><strong>{gameFeatures['hero-training'].name}</strong><small>{trainingUnlocked ? '금화를 영웅 숙련 XP로 전환' : `${gameFeatures['hero-training'].unlockStage}장 클리어 시 해금`}</small></header>
                  {trainingUnlocked ? <div className="training-packages">
                    {heroTrainingPackages.map((trainingPackage) => (
                      <button key={trainingPackage.id} disabled={mastery.level >= HERO_MASTERY_MAX_LEVEL || gold < trainingPackage.goldCost} onClick={() => trainMastery(id, trainingPackage.id)}>
                        <span><b>{trainingPackage.name}</b><small>{trainingPackage.description}</small></span>
                        <em>+{trainingPackage.xp} XP</em><strong>● {trainingPackage.goldCost.toLocaleString()}</strong>
                      </button>
                    ))}
                  </div> : <p>왕실 교관단을 복귀시키면 금화로 보유 영웅을 훈련할 수 있습니다.</p>}
                </section>}
              </div>
            </article>
          );
        })}
      </div>
      {notice && <div className="toast" role="status">{notice}</div>}
    </main>
  )}</Localized>;
}

function TriumphMonument({ onBack }: { onBack: () => void }) {
  const gold = useGameStore((state) => state.gold);
  const level = useGameStore((state) => state.triumphMonumentLevel);
  const upgrade = useGameStore((state) => state.upgradeTriumphMonument);
  const [notice, setNotice] = useState('');
  const bonuses = triumphMonumentBonuses(level);
  const maxed = level >= TRIUMPH_MONUMENT.maxLevel;
  const cost = triumphMonumentCost(level);

  const strengthen = () => {
    const success = upgrade();
    setNotice(success ? `승전 기념비가 ${level + 1}단계로 강화되었습니다.` : '금화가 부족하거나 이미 최고 단계입니다.');
    window.setTimeout(() => setNotice(''), 1_800);
  };

  return <Localized>{(
    <main className="panel-screen monument-screen">
      <ShellHeader title={TRIUMPH_MONUMENT.name} onBack={onBack} />
      <section className="monument-panel">
        <div className="monument-visual" aria-hidden="true"><span>♜</span><i /></div>
        <div className="monument-copy">
          <span className="eyebrow">CONTINENTAL VICTORY MEMORIAL</span>
          <h2>끝나지 않는 원정을 위한 유산</h2>
          <p>30장 탈환 이후 남는 금화를 왕국 전체의 전투 기반에 투자합니다. 효과는 아군에게만 적용되며 최대 20단계에서 멈춥니다.</p>
          <div className="monument-ranks" aria-label={`기념비 단계 ${level}/${TRIUMPH_MONUMENT.maxLevel}`}>
            {Array.from({ length: TRIUMPH_MONUMENT.maxLevel }, (_, rank) => <i key={rank} className={rank < level ? 'filled' : ''} />)}
          </div>
          <div className="monument-bonuses">
            <div><span>병사·영웅 HP</span><strong>+{level}%</strong><small>다음 +{Math.min(TRIUMPH_MONUMENT.maxLevel, level + 1)}%</small></div>
            <div><span>병사·영웅 공격·치유</span><strong>+{level}%</strong><small>다음 +{Math.min(TRIUMPH_MONUMENT.maxLevel, level + 1)}%</small></div>
            <div><span>아군 성채 HP</span><strong>+{bonuses.fortressHpBonus.toLocaleString()}</strong><small>단계당 +{TRIUMPH_MONUMENT.fortressHpPerLevel}</small></div>
          </div>
          <button className="monument-upgrade" disabled={maxed || gold < cost} onClick={strengthen}>
            {maxed ? '기념비 완성' : <>기념비 강화 <span>● {cost.toLocaleString()}</span></>}
          </button>
        </div>
      </section>
      {notice && <div className="toast" role="status">{notice}</div>}
    </main>
  )}</Localized>;
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

  return <Localized>{(
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
  )}</Localized>;
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

  return <Localized>{(
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
  )}</Localized>;
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
    { id: 'command', name: '지휘·보급 체계', description: '전장의 지휘력과 병력 전개 효율을 개선합니다.' },
    { id: 'growth', name: '성장 지원 체계', description: '전투 골드와 병사·영웅의 실전 숙련 경험치를 늘립니다.' },
    { id: 'defense', name: '성벽 공학', description: '성채를 강화하고 접근한 적을 자동 공격합니다.' },
    { id: 'artillery', name: '왕실 포병대', description: '직접 사용하는 포격의 위력을 개선합니다.' },
    { id: 'expedition', name: '원정 전술', description: '집결 깃발로 1~4성 병사·영웅·5성 초월 병종을 단계적으로 지휘합니다.' },
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

  return <Localized>{(
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
        <div><span>성채 재생</span><strong>+{stats.castleRegenPerSecond}/초</strong></div>
        <div><span>포격 피해</span><strong>{stats.bombardDamage}</strong></div>
        <div><span>전투 골드</span><strong>+{Math.round((stats.battleGoldMultiplier - 1) * 100)}%</strong></div>
        <div><span>전투 숙련 XP</span><strong>+{Math.round((stats.masteryXpMultiplier - 1) * 100)}%</strong></div>
        <div><span>집결 지휘</span><strong>{stats.rallyTranscendentControl ? '5성 초월' : stats.rallyHeroControl ? '영웅' : stats.rallyUnlocked ? '1~4성 병사' : '미해금'}</strong></div>
        <div><span>영웅 스킬 대기</span><strong>-{Math.round((1 - stats.heroSkillCooldownMultiplier) * 100)}%</strong></div>
        <div><span>영웅 부활 대기</span><strong>-{Math.round((1 - stats.heroRespawnMultiplier) * 100)}%</strong></div>
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
  )}</Localized>;
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

  return <Localized>{(
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
  )}</Localized>;
}

function WarCodex({ onBack }: { onBack: () => void }) {
  const unlockedUnits = useGameStore((state) => state.unlockedUnits);
  const unlockedHeroes = useGameStore((state) => state.unlockedHeroes);
  const discoveredEnemies = useGameStore((state) => state.discoveredEnemies);
  const unitMasteryXp = useGameStore((state) => state.unitMasteryXp);
  const heroMasteryXp = useGameStore((state) => state.heroMasteryXp);
  const visibleTroops = allTroopOrder.filter((id) => unlockedUnits.includes(id) || discoveredEnemies.includes(id));
  const completion = codexEntryCount(unlockedUnits, unlockedHeroes, discoveredEnemies);
  const percent = Math.round(completion / CODEX_TOTAL * 100);

  return <Localized>{(
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
            const rhythmKnown = acquired && masteryLevelFromXp(unitMasteryXp[id] ?? 0).level >= ATTACK_RHYTHM_REVEAL_MASTERY_LEVEL;
            return <article className="codex-card allied-entry" key={id}><span className="codex-icon"><CharacterSprite id={id} className="codex-character-art" /></span><div><small>{entry.role}</small><h4>{entry.title}</h4><div className="codex-tags"><b className={`grade-tag grade-${unit.grade}`} title={`${unit.grade}성 ${unitGradeLabels[unit.grade]}`}>{unitGradeStars(unit.grade)} · {unitGradeLabels[unit.grade]}</b>{acquired && <b>아군 확보</b>}{encountered && <b className="enemy-tag">적군 조우</b>}</div><p>{entry.description}</p><blockquote>{entry.lore}</blockquote><dl><div><dt>HP</dt><dd>{unit.maxHp}</dd></div><div><dt>ATK</dt><dd>{unit.attackDamage}</dd></div><div><dt>RANGE</dt><dd>{attackRangeLabel(unit)}</dd></div><div><dt>PATTERN</dt><dd>{attackPatternLabel(unit)}</dd></div>{guardProtectionLabel(unit) && <div><dt>GUARD</dt><dd>{guardProtectionLabel(unit)}</dd></div>}<div><dt>RHYTHM</dt><dd>{rhythmKnown ? attackTimingLabel(unit) : `숙련 ${ATTACK_RHYTHM_REVEAL_MASTERY_LEVEL}에 분석`}</dd></div></dl></div></article>;
          })}
        </div>
      </section>

      <section className="codex-section">
        <header><span>♛</span><div><small>HEROES</small><h3>원정대 영웅</h3></div><b>{unlockedHeroes.length}/{heroOrder.length}</b></header>
        <div className="codex-grid">
          {unlockedHeroes.map((id) => {
            const entry = heroCodex[id];
            const hero = heroDefinitions[id];
            const rhythmKnown = heroMasteryLevelFromXp(heroMasteryXp[id] ?? 0).level >= ATTACK_RHYTHM_REVEAL_MASTERY_LEVEL;
            return <article className="codex-card hero-entry" key={id}><span className="codex-icon"><CharacterSprite id={id} className="codex-character-art" /></span><div><small>{entry.role}</small><h4>{entry.title}</h4><p>{entry.description}</p><blockquote>{entry.lore}</blockquote><dl><div><dt>HP</dt><dd>{hero.maxHp}</dd></div><div><dt>ATK</dt><dd>{hero.attackDamage}</dd></div><div><dt>RANGE</dt><dd>{attackRangeLabel(hero)}</dd></div><div><dt>PATTERN</dt><dd>{attackPatternLabel(hero)}</dd></div>{guardProtectionLabel(hero) && <div><dt>GUARD</dt><dd>{guardProtectionLabel(hero)}</dd></div>}<div><dt>RHYTHM</dt><dd>{rhythmKnown ? attackTimingLabel(hero) : `숙련 ${ATTACK_RHYTHM_REVEAL_MASTERY_LEVEL}에 분석`}</dd></div><div><dt>REVIVE</dt><dd>{hero.respawnMs / 1000}s</dd></div></dl></div></article>;
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
  )}</Localized>;
}

function ResultScreen({ result, onMenu, onRetry }: { result: BattleResult; onMenu: () => void; onRetry: () => void }) {
  return <Localized>{(
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
  )}</Localized>;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [stageId, setStageId] = useState(1);
  const [result, setResult] = useState<BattleResult | null>(null);
  const screenTransitionSequence = useRef(0);
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

  const navigate = useCallback((nextScreen: Screen) => {
    const startViewTransition = document.startViewTransition?.bind(document);
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const decision = screenTransitionDecision(screen, nextScreen, prefersReducedMotion);

    if (!decision.enabled || !startViewTransition) {
      screenTransitionSequence.current += 1;
      delete document.documentElement.dataset.viewTransitionDirection;
      setScreen(nextScreen);
      return;
    }

    const sequence = ++screenTransitionSequence.current;
    document.documentElement.dataset.viewTransitionDirection = decision.direction;
    const transition = startViewTransition(() => {
      flushSync(() => setScreen(nextScreen));
    });
    const cleanup = () => {
      if (screenTransitionSequence.current === sequence) {
        delete document.documentElement.dataset.viewTransitionDirection;
      }
    };
    void transition.finished.then(cleanup, cleanup);
  }, [screen]);

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

  const exitBattle = useCallback(() => {
    setResult(null);
    setScreen('stages');
  }, []);

  if (screen === 'menu') return <MainMenu onNavigate={navigate} />;
  if (screen === 'opening') return <Opening onComplete={() => setScreen('stages')} />;
  if (screen === 'credits') return <Credits onBack={() => navigate('menu')} />;
  if (screen === 'stages') return <StageSelect onBack={() => navigate('menu')} onSelect={startStage} onNavigate={navigate} />;
  if (screen === 'merchant') return <MysteryMerchant onBack={() => navigate('stages')} />;
  if (screen === 'monument') return <TriumphMonument onBack={() => navigate('stages')} />;
  if (screen === 'armory') return <Armory onBack={() => navigate('stages')} />;
  if (screen === 'heroes') return <HeroHall onBack={() => navigate('stages')} />;
  if (screen === 'fortress') return <FortressWorkshop onBack={() => navigate('stages')} />;
  if (screen === 'achievements') return <Achievements onBack={() => navigate('stages')} />;
  if (screen === 'codex') return <WarCodex onBack={() => navigate('stages')} />;
  if (screen === 'battle') {
    return (
      <Suspense fallback={<main className="loading-screen"><span>♜</span><p>전장을 준비하고 있습니다…</p></main>}>
        <BattleView stageId={stageId} onResult={handleResult} onExit={exitBattle} />
      </Suspense>
    );
  }
  if (screen === 'result' && result) {
    return <ResultScreen result={result} onMenu={() => navigate('stages')} onRetry={() => startStage(stageId)} />;
  }
  return null;
}
