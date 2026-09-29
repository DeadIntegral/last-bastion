import { afterEach, describe, expect, it } from 'vitest';
import { changeLanguage, detectLanguage, t } from './i18n';

describe('localization', () => {
  afterEach(async () => {
    await changeLanguage('ko');
    localStorage.clear();
  });

  it('detects Korean and Japanese explicitly and falls back to English for other browser languages', () => {
    expect(detectLanguage('ko-KR')).toBe('ko');
    expect(detectLanguage('en-US')).toBe('en');
    expect(detectLanguage('ja-JP')).toBe('ja');
    expect(detectLanguage('fr-FR')).toBe('en');
  });

  it('loads Japanese messages, dynamic patterns, and English fallback copy', async () => {
    await changeLanguage('ja');
    expect(t('새 게임')).toBe('ニューゲーム');
    expect(t('12장 원정')).toBe('第12章 遠征');
    expect(t('지면 발현 · 최대 4명 · 반경 72')).toBe('地面噴出 · 最大4体 · 半径72');
    expect(t('3명 관통 · 성채 관통')).toBe('3体貫通・要塞貫通');
    expect(t('참전 {participation} · 기여 {contribution}', { participation: 14, contribution: 32 })).toBe('参戦 14・貢献 32');
    expect(t('불락의 성벽핵')).toBe('難攻不落の城壁核');
    expect(t('각성 {rank}단계 · {bonuses}', { rank: 3, bonuses: t('자신 HP +{value}', { value: 330 }) })).toBe('覚醒ランク3 · 自身HP +330');
    expect(t('저장 파일을 읽을 수 없습니다')).toBe('Unable to read save file');
    expect(document.documentElement.lang).toBe('ja');
    expect(document.title).toBe('Last Bastion — 最後の要塞');
  });

  it('loads English messages, patterns, and restores Korean source fallback', async () => {
    await changeLanguage('en');
    expect(t('새 게임')).toBe('New Game');
    expect(t('12장 원정')).toBe('Chapter 12 expedition');
    expect(t('12장 철갑 마수의 귀환')).toBe('Chapter 12: Return of the Ironclad Beast');
    expect(t('지면 발현 · 최대 4명 · 반경 72')).toBe('Ground eruption · up to 4 targets · radius 72');
    expect(t('3명 관통 · 성채 관통')).toBe('Pierces 3 targets · Fortress pierce');
    expect(t('참전 {participation} · 기여 {contribution}', { participation: 14, contribution: 32 })).toBe('Participation 14 · Contribution 32');
    expect(t('불락의 성벽핵')).toBe('Impregnable Wall Core');
    expect(t('각성 {rank}단계 · {bonuses}', { rank: 3, bonuses: t('자신 HP +{value}', { value: 330 }) })).toBe('Awakening rank 3 · Self HP +330');
    expect(t('{name}가 달려듭니다', { name: t('마수') })).toBe('Beast charges!');
    expect(document.documentElement.lang).toBe('en');
    expect(document.title).toBe('Last Bastion');
    expect(t('번역되지 않은 원문')).toBe('번역되지 않은 원문');
    await changeLanguage('ko');
    expect(t('새 게임')).toBe('새 게임');
  });
});
