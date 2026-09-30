import type { TourStep, TutorialScreen } from '../types/tutorial';
import { isChapterTwoUnlocked } from './chapterTwo';

interface TutorialDefinition { screen: TutorialScreen; steps: readonly TourStep[] }

export const tutorials = {
  'advanced-equipment': { screen: 'armory', steps: [
    { target: '[data-tour="equipment"]', title: '새로운 단련', body: '장비를 더 강화할 수 있습니다. 필요한 부위부터 골라 보세요.' },
  ] },
  'advanced-hero-equipment': { screen: 'heroes', steps: [
    { target: '[data-tour="hero-equipment"]', title: '새로운 단련', body: '장비를 더 강화할 수 있습니다. 필요한 부위부터 골라 보세요.' },
  ] },
  'achievements': { screen: 'achievements', steps: [
    { target: '[data-tour="achievements"]', title: '남겨진 전공', body: '달성한 기록의 보상을 직접 받아 가세요.' },
  ] },
  'codex': { screen: 'codex', steps: [
    { target: '[data-tour="codex"]', title: '전장에서 배운 것', body: '병종·영웅 기록과 아이템 자료를 살펴볼 수 있습니다.' },
  ] },
  'first-expedition': { screen: 'stages', steps: [
    { target: '[data-tour="map-mission"]', title: '첫 원정', body: '선택한 전장의 목표를 여기서 확인하세요.' },
    { target: '[data-tour="operations"]', title: '출전 준비', body: '병영에서 편성을 바꾸고, 영웅과 성채를 정비할 수 있습니다.' },
    { target: '[data-tour="deployment"]', title: '준비되셨나요?', body: '준비가 끝나면 출정 버튼을 눌러 전장으로 향하세요.' },
  ] },
  'armory-basics': { screen: 'armory', steps: [
    { target: '[data-tour="roster"] > :first-child', title: '병종 살펴보기', body: '목록에서 병종을 선택하면 그 병종의 상세 정보가 열립니다.' },
    { target: '[data-tour="formation"]', title: '출전 부대', body: '보유한 병종을 슬롯으로 옮겨 편성하세요. 슬롯 번호가 전투 단축키입니다.' },
    { target: '[data-tour="equipment"]', title: '장비 강화', body: '무기·갑옷·군화 중 필요한 장비에 금화를 투자하세요.' },
  ] },
  'hero-hall': { screen: 'heroes', steps: [
    { target: '[data-tour="heroes"]', title: '함께할 영웅', body: '영웅을 골라 상세 정보를 살펴보세요. 출전 영웅은 상세 화면에서 따로 정합니다.' },
  ] },
  'fortress-basics': { screen: 'fortress', steps: [
    { target: '[data-tour="fortress-research"]', title: '성채 연구', body: '필요한 기술부터 연구하세요. 연결된 기술에는 선행 연구가 필요합니다.' },
    { target: '[data-tour="fortress-tier"]', title: '성채 승급', body: '연구가 쌓이면 성채를 승급해 더 많은 선택지를 열 수 있습니다.' },
  ] },
  'first-item': { screen: 'stages', steps: [
    { target: '[data-tour="items-entry"]', title: '새로운 전리품', body: '획득한 아이템은 원정 장비고에서 장착할 수 있습니다.' },
  ] },
  'monuments-unlocked': { screen: 'stages', steps: [
    { target: '[data-tour="monument-entry"]', title: '승리를 기리는 곳', body: '되찾은 땅에 기념비를 세울 수 있습니다.' },
  ] },
  'item-loadout': { screen: 'items', steps: [
    { target: '[data-tour="item-inventory"] .item-inventory-card:not(.locked)', title: '원정 장비', body: '사용할 아이템을 선택하세요.' },
    { target: '[data-tour="item-slots"] .item-socket', title: '장비 장착', body: '아이템을 맞는 슬롯으로 옮기거나, 선택한 뒤 슬롯을 누르세요.' },
  ] },
  'item-crafting': { screen: 'items', steps: [
    { target: '[data-tour="crafting"] .item-recipe-card:not(.locked)', title: '새로운 조합', body: '모은 재료로 더 강한 장비를 만들 수 있습니다. 장착 중인 재료는 보호됩니다.' },
  ] },
  'hero-training': { screen: 'heroes', steps: [
    { target: '[data-tour="hero-training"]:not(.locked)', title: '왕실 훈련', body: '이제 금화로 선택한 영웅의 숙련을 높일 수 있습니다.' },
  ] },
  'merchant': { screen: 'merchant', steps: [
    { target: '[data-tour="merchant"]', title: '수수께끼 상인', body: '왕실 보석으로 원정을 돕는 영구 허가를 구매할 수 있습니다.' },
  ] },
  'expanded-formation': { screen: 'armory', steps: [
    { target: '[data-tour="formation"]', title: '넓어진 편성', body: '새 슬롯에 병종을 배치하세요. 빈 슬롯의 번호도 그대로 유지됩니다.' },
  ] },
  'monuments': { screen: 'monument', steps: [
    { target: '[data-tour="monument-building"] > :first-child', title: '승리를 기리며', body: '가격과 축복을 살펴보고 기념비를 선택하세요. 세운 기념비는 지도에 남습니다.' },
  ] },
  'new-front': { screen: 'stages', steps: [
    { target: '[data-tour="new-front"]', title: '낯선 전선', body: '길을 따라 나아가며 안개에 가려진 전장을 살펴보세요.' },
  ] },
  'battle-basics': { screen: 'battle', steps: [
    { target: '[data-tour="battle-deploy"]', title: '병력 소환', body: '지휘력을 모아 병종 카드를 누르세요. 병력은 출전 후 스스로 싸웁니다.' },
    { target: '[data-tour="battle-hero"]', title: '영웅 스킬', body: '영웅 초상화를 누르면 고유 스킬을 사용합니다. 결정적인 순간을 노리세요.' },
    { target: '[data-tour="battle-fortress"]', title: '성채를 지키세요', body: '아군 성채가 무너지기 전에 전장의 목표를 달성하세요.' },
  ] },
  'supply-skill': { screen: 'battle', steps: [
    { target: '[data-tour="supply-skill"]', title: '긴급 보급', body: '지휘력이 급할 때 보급을 요청하세요. 다시 사용하려면 기다려야 합니다.' },
  ] },
  'trap-skill': { screen: 'battle', steps: [
    { target: '[data-tour="trap-skill"]', title: '중앙 함정', body: '적이 중앙을 지나갈 때를 노려 함정을 준비하세요. 지상 적이 접근하면 폭발합니다.' },
  ] },
} as const satisfies Record<string, TutorialDefinition>;

export type TutorialId = keyof typeof tutorials;
export const tutorialIds = Object.keys(tutorials) as TutorialId[];
export const TUTORIAL_REPLAY_EVENT = 'last-bastion:tutorial-replay';

export interface TutorialProgress {
  builtMonumentIds?: readonly string[];
  clearedStages: readonly number[];
  clearedChapterTwoStages: readonly number[];
  unlockedStage: number;
  stats: { battles: number };
  formationSlotPurchases: number;
  itemInventory: Partial<Record<string, number>>;
  castleTechLevels: { emergency_supply?: number; central_trap?: number };
}

export function tutorialEligible(id: TutorialId, progress: TutorialProgress, manual = false): boolean {
  if (id === 'advanced-equipment' || id === 'advanced-hero-equipment') return isChapterTwoUnlocked(progress.builtMonumentIds ?? []);
  if (id === 'achievements') return manual || progress.stats.battles > 0;
  if (id === 'item-loadout' || id === 'first-item') return manual || Object.values(progress.itemInventory).some((count) => (count ?? 0) > 0);
  if (id === 'item-crafting') return progress.clearedStages.includes(12);
  if (id === 'hero-training') return progress.clearedStages.includes(9);
  if (id === 'merchant') return true;
  if (id === 'expanded-formation') return progress.formationSlotPurchases > 0;
  if (id === 'monuments' || id === 'monuments-unlocked') return progress.clearedStages.includes(30);
  if (id === 'new-front') return true;
  if (id === 'supply-skill') return (progress.castleTechLevels.emergency_supply ?? 0) > 0;
  if (id === 'trap-skill') return (progress.castleTechLevels.central_trap ?? 0) > 0;
  return true;
}

export function normalizeSeenTutorials(value: unknown, progress: TutorialProgress, hasSave: boolean): TutorialId[] {
  if (Array.isArray(value)) return tutorialIds.filter((id) => value.includes(id));
  const established = hasSave && (progress.stats.battles > 0 || progress.unlockedStage > 1 || progress.clearedStages.length > 0);
  return established ? tutorialIds.filter((id) => !id.startsWith('advanced-') && (id === 'new-front' ? progress.clearedChapterTwoStages.length > 0 : tutorialEligible(id, progress))) : [];
}
