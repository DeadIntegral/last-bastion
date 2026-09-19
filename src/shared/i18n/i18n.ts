import { create } from 'zustand';

export type Language = 'ko' | 'en';

const STORAGE_KEY = 'last-bastion-language';

let currentLanguage: Language = 'ko';
let currentMessages: Record<string, string> = {};

interface LanguageState {
  lang: Language;
  version: number;
}

export const useLanguageStore = create<LanguageState>(() => ({ lang: 'ko', version: 0 }));

function interpolate(message: string, values?: Record<string, unknown>): string {
  if (!values) return message;
  return message.replace(/\{(\w+)\}/g, (match, key: string) => values[key] === undefined ? match : String(values[key]));
}

function preserveWhitespace(source: string, translated: string): string {
  const leading = source.match(/^\s*/)?.[0] ?? '';
  const trailing = source.match(/\s*$/)?.[0] ?? '';
  return `${leading}${translated}${trailing}`;
}

function translateEnglishPattern(source: string): string | undefined {
  const patterns: Array<[RegExp, (...matches: string[]) => string]> = [
    [/^슬롯 (\d+)을 삭제할까요\?$/, (slot) => `Delete slot ${slot}?`],
    [/^슬롯 (\d+) 암호화 내보내기$/, (slot) => `Export encrypted slot ${slot}`],
    [/^슬롯 (\d+)을 교체할까요\?$/, (slot) => `Replace slot ${slot}?`],
    [/^슬롯 (\d+)을 암호화된 저장 파일로 내보냈습니다\.$/, (slot) => `Slot ${slot} was exported as an encrypted save.`],
    [/^(\d+)장 원정$/, (stage) => `Chapter ${stage} expedition`],
    [/^(\d+)장 기록 교체$/, (stage) => `Replace chapter ${stage} record`],
    [/^(\d+)장 클리어 시 해금$/, (stage) => `Unlock after chapter ${stage}`],
    [/^(\d+)장 클리어 시 건립$/, (stage) => `Build after chapter ${stage}`],
    [/^(\d+)장 클리어 필요$/, (stage) => `Clear chapter ${stage}`],
    [/^(\d+)장 보스 격파 시 출현$/, (stage) => `Appears after chapter ${stage} boss`],
    [/^(.+)까지 원정로가 개방되었습니다\.$/, (region) => `The expedition route is open through ${t(region)}.`],
    [/^해금 (\d+)\/(\d+) · 마수 영역 (\d+)\/(\d+) · 지도를 잡아 드래그$/, (a, b, c, d) => `Unlocked ${a}/${b} · Beast rifts ${c}/${d} · Drag to pan`],
    [/^전투 (\d+)회$/, (count) => `${count} battles`],
    [/^적 ([\d,]+)명을 처치하세요\.$/, (count) => `Defeat ${count} enemies.`],
    [/^전투에서 (\d+)번 승리하세요\.$/, (count) => `Win ${count} battles.`],
    [/^마수를 (\d+)번 처치하세요\.$/, (count) => `Defeat beasts ${count} times.`],
    [/^(\d+)연승을 달성하세요\.$/, (count) => `Reach a ${count}-battle win streak.`],
    [/^(\d+)번 패배하세요\.$/, (count) => `Lose ${count} battles.`],
    [/^병사 ([\d,]+)명을 잃으세요\.$/, (count) => `Lose ${count} soldiers.`],
    [/^영웅이 쓰러진 뒤 ([\d,]+)번 다시 전장에 나서게 하세요\.$/, (count) => `Have heroes return to battle ${count} times after falling.`],
    [/^병사를 ([\d,]+)번 소환하세요\.$/, (count) => `Deploy troops ${count} times.`],
    [/^영웅 스킬을 ([\d,]+)번 사용하세요\.$/, (count) => `Use hero skills ${count} times.`],
    [/^성채 포격을 ([\d,]+)번 사용하세요\.$/, (count) => `Use fortress bombardment ${count} times.`],
    [/^전투에 ([\d,]+)번 참여하세요\.$/, (count) => `Fight ${count} battles.`],
    [/^전쟁 사전에 (\d+)종을 기록하세요\.$/, (count) => `Record ${count} entries in the War Codex.`],
    [/^전쟁 사전을 (\d+)% 이상 완성하세요\.$/, (percent) => `Complete at least ${percent}% of the War Codex.`],
    [/^(\d+)회$/, (count) => `${count} times`],
    [/^(\d+)개$/, (count) => `${count}`],
    [/^(\d+)단계$/, (level) => `Rank ${level}`],
    [/^(\d+)티어$/, (tier) => `Tier ${tier}`],
    [/^(\d+)티어 성채 필요$/, (tier) => `Requires tier ${tier} fortress`],
    [/^(\d+)티어 승급 필요$/, (tier) => `Requires tier ${tier}`],
    [/^연구 (\d+)회 필요$/, (count) => `${count} more research ranks required`],
    [/^보석 (\d+)개 받기$/, (count) => `Claim ${count} Gems`],
    [/^보상 대기 (\d+)$/, (count) => `${count} rewards ready`],
    [/^현재 (.+), 기본 대비 (.+)$/, (current, delta) => `Current ${current}, ${delta} from base`],
    [/^기본 (.+)$/, (value) => `Base ${value}`],
    [/^공격력 \+(.+)$/, (value) => `Attack +${value}`],
    [/^체력 \+(.+) · 방어 \+(.+)$/, (hp, defense) => `HP +${hp} · Defense +${defense}`],
    [/^이동 속도 \+(.+)$/, (value) => `Move speed +${value}`],
    [/^보호막 (.+)$/, (value) => `Shield ${value}`],
    [/^범위 피해 (.+) · 성채 (.+)$/, (damage, castle) => `Area damage ${damage} · Fortress ${castle}`],
    [/^전체 피해 (.+) · 보스 (.+)$/, (damage, boss) => `All-enemy damage ${damage} · Boss ${boss}`],
    [/^아군 회복 (.+) · 성채 (.+)$/, (heal, castle) => `Allied healing ${heal} · Fortress ${castle}`],
    [/^범위 피해 (.+) · 보호막 (.+)$/, (damage, shield) => `Area damage ${damage} · Shield ${shield}`],
    [/^폭풍 피해 (.+) · 성채 (.+)$/, (damage, castle) => `Storm damage ${damage} · Fortress ${castle}`],
    [/^(\d+)성 (.+)$/, (grade, label) => `${grade}-star ${t(label)}`],
    [/^(\d+)명 관통$/, (count) => `Pierces ${count} targets`],
    [/^착탄 범위 공격 · 반경 (.+)$/, (radius) => `Impact area attack · radius ${radius}`],
    [/^전방 파동 · 길이 (.+)$/, (length) => `Forward wave · length ${length}`],
    [/^지면 발현 · 반경 (.+)$/, (radius) => `Ground eruption · radius ${radius}`],
    [/^관통 차단 · (.+) 후방 파동 (\d+)% 감쇠$/, (domain, reduction) => `Blocks pierce · ${t(domain)} rear-wave range -${reduction}%`],
    [/^선딜 (.+)초 · 후딜 (.+)초$/, (windup, recovery) => `Windup ${windup}s · recovery ${recovery}s`],
    [/^마수 도전 (.+)$/, (name) => `Beast challenge: ${t(name)}`],
    [/^(\d+)장 (.+?)( 잠김)?$/, (stage, name, locked) => `Chapter ${stage}: ${t(name)}${locked ? ' locked' : ''}`],
    [/^(.+) 기술 트리$/, (name) => `${t(name)} technology tree`],
    [/^(.+), (\d+)\/(\d+)단계$/, (name, level, max) => `${t(name)}, rank ${level}/${max}`],
    [/^(.+) 연구가 완료되었습니다\.$/, (name) => `${t(name)} research completed.`],
    [/^(.+)의 (.+) 장비가 강화되었습니다\.$/, (name, slot) => `${t(name)}: ${t(slot)} upgraded.`],
    [/^(.+)이\(가\) 아군에 합류했습니다\.$/, (name) => `${t(name)} joined your forces.`],
    [/^(.+)이\(가\) 원정대에 합류했습니다\.$/, (name) => `${t(name)} joined the expedition.`],
    [/^(.+)이\(가\) (\d+) XP를 획득했습니다\.$/, (name, xp) => `${t(name)} gained ${xp} XP.`],
    [/^(.+) 편성 제외$/, (name) => `Remove ${t(name)} from formation`],
    [/^숙련 (\d+)에 분석$/, (level) => `Analyze at mastery ${level}`],
    [/^숙련 LV\.(\d+)$/, (level) => `Mastery LV.${level}`],
    [/^각성 (.+)$/, (rank) => `Awakening ${rank}`],
    [/^전장 (\d+)\/(\d+)$/, (count, max) => `Field ${count}/${max}`],
    [/^아직 기록되지 않은 항목 (\d+)개 · 지도 탐험과 영웅 영입을 계속하세요\.$/, (count) => `${count} entries remain undiscovered. Keep exploring and recruiting heroes.`],
  ];
  for (const [pattern, format] of patterns) {
    const match = source.match(pattern);
    if (match) return format(...match.slice(1));
  }
  return undefined;
}

async function loadMessages(lang: Language): Promise<void> {
  const module = lang === 'en' ? await import('./en/messages') : await import('./ko/messages');
  currentMessages = module.messages;
  document.documentElement.lang = lang;
  document.title = t('Last Bastion — 최후의 성채');
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('병력을 지휘해 최후의 성채를 지키는 웹 공성 전략 게임'));
  useLanguageStore.setState({ lang, version: Date.now() });
}

export function detectLanguage(language = typeof navigator === 'undefined' ? 'ko' : navigator.language): Language {
  return language.toLowerCase().startsWith('ko') ? 'ko' : 'en';
}

export function setupLanguage(): void {
  const saved = typeof localStorage === 'undefined' ? null : localStorage.getItem(STORAGE_KEY);
  currentLanguage = saved === 'ko' || saved === 'en' ? saved : detectLanguage();
  useLanguageStore.setState({ lang: currentLanguage });
  void loadMessages(currentLanguage);
}

export function getCurrentLanguage(): Language {
  return currentLanguage;
}

export async function changeLanguage(lang: Language): Promise<void> {
  currentLanguage = lang;
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, lang);
  await loadMessages(lang);
}

export function t(key: string, values?: Record<string, unknown>): string {
  if (currentLanguage === 'ko') return interpolate(key, values);
  const core = key.trim();
  if (!core) return key;
  const translated = currentMessages[core] ?? translateEnglishPattern(core) ?? core;
  return preserveWhitespace(key, interpolate(translated, values));
}

export function useTranslation() {
  useLanguageStore((state) => state.version);
  const lang = useLanguageStore((state) => state.lang);
  return { t, lang, changeLanguage };
}
