import { useEffect, useRef, useState, type ReactNode } from 'react';
import { heroDefinitions, heroOrder } from '../data/units';
import { gameFeatures, heroTrainingPackages, isGameFeatureUnlocked } from '../data/features';
import { HERO_AWAKENING_LEVELS, HERO_MASTERY_MAX_LEVEL, heroAwakeningAuras, heroAwakeningSelfBonuses, heroMasteryGrowth, heroSkillPower } from '../data/mastery';
import { attackRangeLabel, equipmentCost, guardProtectionLabel, heroAwakeningRank, heroMasteryLevelFromXp, heroRespawnReductionMs, scaledHeroRespawnMs, scaledHeroSkillCooldownMs, scaledHeroSkillPower, spacingTraitLabel, upgradedStats } from '../game/rules';
import { useGameStore } from '../store/useGameStore';
import { Localized } from '../shared/i18n/Localized';
import { t, useTranslation } from '../shared/i18n/i18n';
import type { EquipmentSlot, HeroId } from '../types/game';
import { CharacterSprite } from './CharacterSprite';
import { GameButton } from './GameButton';
import { equipmentEffect, equipmentSlots, GrowthStat } from './ProgressionUi';

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

function heroSelfAwakeningSummary(id: HeroId, awakeningRank: number): string {
  const bonus = heroAwakeningSelfBonuses[id];
  const multiplier = awakeningRank;
  const parts = [t('자신 HP +{value}', { value: bonus.hpPerRank * multiplier })];
  if (bonus.attackPerRank > 0) parts.push(t('자신 공격 +{value}', { value: bonus.attackPerRank * multiplier }));
  if (bonus.defensePerRank) parts.push(t('자신 방어 +{value}', { value: bonus.defensePerRank * multiplier }));
  if (bonus.rangePerRank) parts.push(t('자신 사거리 +{value}', { value: bonus.rangePerRank * multiplier }));
  if (bonus.moveSpeedPerRank) parts.push(t('자신 이동 +{value}', { value: bonus.moveSpeedPerRank * multiplier }));
  if (bonus.healingPerRank) parts.push(t('자신 치유 +{value}', { value: bonus.healingPerRank * multiplier }));
  const bonuses = parts.join(' · ');
  return t('각성 {rank}단계 · {bonuses}', { rank: awakeningRank, bonuses });
}

export function HeroHall({ header }: { header: ReactNode }) {
  useTranslation();
  const [focusedHeroId, setFocusedHeroId] = useState<HeroId | null>(null);
  const detailRef = useRef<HTMLElement>(null);
  const browserRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!focusedHeroId || !detailRef.current) return;
    detailRef.current.scrollTop = 0;
    if (window.matchMedia?.('(max-width: 820px)').matches) {
      const top = detailRef.current.getBoundingClientRect().top + window.scrollY - 84 - (browserRef.current?.getBoundingClientRect().height ?? 0) - 16;
      window.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
    }
  }, [focusedHeroId]);
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
      {header}
      <section className="armory-intro">
        <div><span className="eyebrow">영웅의 전당</span><h2>원정대 지휘관</h2></div>
        <p>함께할 영웅의 이야기를 만나보세요.</p>
      </section>
      <div className="hero-hall-layout">
        <aside className="hero-browser" ref={browserRef} aria-label="영웅 목록" data-tour="heroes">
          <div className="hero-picker-grid">{heroOrder.map((id) => {
            const hero = heroDefinitions[id];
            const owned = unlockedHeroes.includes(id);
            return <GameButton key={id} variant="ghost" className={`hero-picker-card ${owned ? '' : 'unowned'}`} active={focusedHeroId === id}
              data-hero-id={id} aria-pressed={focusedHeroId === id} aria-controls="hero-detail" aria-label={t('{name} 상세 보기', { name: t(hero.name) })} onClick={() => setFocusedHeroId(id)}>
              <span className="hero-picker-art"><CharacterSprite id={id} /></span><strong>{hero.name}</strong><span className="hero-picker-title" title={hero.title}>{hero.title}</span>
              <small className={selectedHero === id ? 'deployed' : ''}>{selectedHero === id ? '출전 중' : owned ? t('숙련 {level}', { level: heroMasteryLevelFromXp(heroMasteryXp[id]).level }) : t('영입 · {cost} 금화', { cost: hero.unlockCost.toLocaleString() })}</small>
            </GameButton>;
          })}</div>
        </aside>
        <section className="hero-detail" id="hero-detail" ref={detailRef} aria-label="영웅 상세 정보" data-tour="hero-detail">
          {!focusedHeroId && <div className="hero-detail-empty"><span aria-hidden="true">♛</span><h3>영웅을 선택하세요</h3><p>이야기와 능력을 살펴보고 함께할 영웅을 정하세요.</p></div>}
        {focusedHeroId && [focusedHeroId].map((id) => {
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
          const awakeningSelf = heroAwakeningSelfBonuses[id];
          const nextAwakeningLevel = HERO_AWAKENING_LEVELS.find((level) => level > mastery.level);
          return (
            <article className={`hero-card hero-${id} ${selected ? 'selected' : ''} ${unlocked ? '' : 'hero-locked'}`} key={id}>
              {selected && <span className="hero-selected-label">출전 중</span>}
              <div className="hero-art">
                <CharacterSprite id={id} className="hero-character-art" />
                <div className="hero-level">{unlocked ? `숙련 ${mastery.level} · ${awakeningRank > 0 ? `각성 ${['', 'I', 'II', 'III'][awakeningRank]}` : '각성 전'}` : '미해금'}</div>
              </div>
              <div className="hero-info">
                <span className="eyebrow">{hero.title}</span>
                <h3>{hero.name}</h3>
                <p className="hero-description">{hero.description}</p>
                {unlocked && <><div className="mastery-line"><b>숙련 경험치</b><span>{mastery.requiredXp ? `${mastery.currentXp}/${mastery.requiredXp} XP` : '최대'}</span></div><div className="mastery-track"><i style={{ width: mastery.requiredXp ? `${mastery.currentXp / mastery.requiredXp * 100}%` : '100%' }} /></div><div className="awakening-track"><div>{HERO_AWAKENING_LEVELS.map((level, index) => <i className={mastery.level >= level ? 'active' : ''} key={level}>{index + 1}</i>)}</div><span>{nextAwakeningLevel ? `다음 각성 LV.${nextAwakeningLevel}` : '최종 각성 완료'}</span></div><div className="mastery-benefit hero-mastery-benefit"><b>{t('레벨당 HP +{hp} · 위력 +{power}', { hp: masteryGrowth.hp, power: masteryGrowth.attack })}</b><span>{heroSkillPowerSummary(id, mastery.level)}</span><span>재사용 {(skillCooldownMs / 1000).toFixed(1)}초 · 부활 -{(respawnReduction / 1000).toFixed(1)}초</span></div></>}
                <div className="hero-traits">
                  <div><span>고유 특성</span><strong>{hero.passiveName}</strong><p>{hero.passiveDescription}</p></div>
                  {guardProtectionLabel(hero) && <div><span>수호 특성</span><strong>전열 수호</strong><p>{guardProtectionLabel(hero)}</p></div>}
                  {spacingTraitLabel(hero) && <div><span>위치 전술</span><strong>{spacingTraitLabel(hero)}</strong><p>{hero.rangedTargeting === 'backline' ? '유효 사거리 안의 후방 원거리·지원병을 전열 너머로 우선 공격합니다.' : '적이 사각에 들어오면 거리를 확보한 뒤 다시 공격합니다.'}</p></div>}
                  {unlocked && awakeningRank > 0 && <>
                    <div className="awakening-aura-active"><span>각성 강화</span><strong>{awakeningSelf.name}</strong><p>{heroSelfAwakeningSummary(id, awakeningRank)}</p></div>
                    <div className="awakening-aura-active"><span>각성 오라</span><strong>{awakeningAura.name}</strong><p>{`각성 ${awakeningRank}단계 · ${awakeningAura.description.replace(/\+\d+/g, (value) => `+${Number(value.slice(1)) * awakeningRank}`)} · 범위 ${awakeningAura.radius}`}</p></div>
                  </>}
                  <div><span>액티브 스킬</span><strong>{hero.skillName}</strong><p>{hero.skillDescription}</p></div>
                </div>
                <dl className="hero-stats">
                  <div><dt>생명력</dt><dd><GrowthStat current={stats.maxHp} base={hero.maxHp} /></dd></div>
                  <div><dt>공격 / 방어</dt><dd className="growth-pair"><GrowthStat current={stats.attackDamage} base={hero.attackDamage} /><i>/</i><GrowthStat current={stats.defense ?? 0} base={hero.defense ?? 0} /></dd></div>
                  <div><dt>이동속도</dt><dd><GrowthStat current={stats.moveSpeed} base={hero.moveSpeed} /></dd></div>
                  <div><dt>부활</dt><dd><GrowthStat current={respawnMs / 1000} base={hero.respawnMs / 1000} /></dd></div>
                  <div><dt>유효 사거리</dt><dd>{attackRangeLabel(stats)}</dd></div>
                </dl>
                {unlocked && <div className="equipment-list hero-equipment-list">
                  {equipmentSlots.map((slot) => {
                    const level = equipment[slot.id];
                    const cost = equipmentCost(hero, level);
                    return <GameButton key={slot.id} disabled={level >= 5 || gold < cost} onClick={() => upgradeEquipment(id, slot.id)}>
                      <i>{slot.icon}</i><span><b>{slot.name} +{level}</b><small>{equipmentEffect(hero, slot.id)}</small></span><em>{level >= 5 ? '최대' : `● ${cost}`}</em>
                    </GameButton>;
                  })}
                </div>}
                <div className="hero-actions">
                  {!unlocked ? (
                    <GameButton disabled={gold < hero.unlockCost} onClick={() => recruit(id)}>영입하기 <span>● {hero.unlockCost}</span></GameButton>
                  ) : (
                    <>
                      <GameButton className="select-hero" disabled={selected} onClick={() => selectHero(id)}>{selected ? '출전 중' : '출전 선택'}</GameButton>
                    </>
                  )}
                </div>
                {unlocked && <section className={`hero-training-panel ${trainingUnlocked ? '' : 'locked'}`} data-tour="hero-training">
                  <header><span>왕실 훈련</span><strong>{gameFeatures['hero-training'].name}</strong><small>{trainingUnlocked ? '금화를 영웅 숙련 XP로 전환' : `${gameFeatures['hero-training'].unlockStage}장 클리어 시 해금`}</small></header>
                  {trainingUnlocked ? <div className="training-packages">
                    {heroTrainingPackages.map((trainingPackage) => (
                      <GameButton key={trainingPackage.id} disabled={mastery.level >= HERO_MASTERY_MAX_LEVEL || gold < trainingPackage.goldCost} onClick={() => trainMastery(id, trainingPackage.id)}>
                        <span><b>{trainingPackage.name}</b><small>{trainingPackage.description}</small></span>
                        <em>+{trainingPackage.xp} XP</em><strong>● {trainingPackage.goldCost.toLocaleString()}</strong>
                      </GameButton>
                    ))}
                  </div> : <p>왕실 교관단을 복귀시키면 금화로 보유 영웅을 훈련할 수 있습니다.</p>}
                </section>}
              </div>
            </article>
          );
        })}
        </section>
      </div>
      {notice && <div className="toast" role="status">{notice}</div>}
    </main>
  )}</Localized>;
}
