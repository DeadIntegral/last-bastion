import { isChapterTwoUnlocked } from './chapterTwo';

export const BASE_EQUIPMENT_MAX_RANK = 5;
export const CHAPTER_TWO_EQUIPMENT_MAX_RANK = 10;
export const ADVANCED_EQUIPMENT_COST_MULTIPLIER = 2;

export function playerEquipmentMaxRank(builtMonumentIds: readonly string[]): number {
  return isChapterTwoUnlocked(builtMonumentIds) ? CHAPTER_TWO_EQUIPMENT_MAX_RANK : BASE_EQUIPMENT_MAX_RANK;
}
