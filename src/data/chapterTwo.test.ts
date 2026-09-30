import { beforeEach, describe, expect, it } from 'vitest';
import { canEnterChapterTwoStage, chapterTwoStages, isChapterTwoUnlocked, normalizeChapterTwoClears } from './chapterTwo';
import { monumentBuildings } from './endgame';
import { exclusiveEnemyDefinitions, exclusiveEnemyIds } from './enemies';
import { troopDefinitions } from './units';
import { characterStandaloneArt } from './characterArt';
import { useGameStore } from '../store/useGameStore';

const allBuilt = monumentBuildings.map((entry) => entry.id);
describe('chapter boundaries', () => {
  beforeEach(() => useGameStore.getState().resetProgress());
  it('requires all unique monuments and ordered clears, including imported saves', () => {
    expect(isChapterTwoUnlocked(Array(5).fill(allBuilt[0]))).toBe(false);
    expect(canEnterChapterTwoStage(401, allBuilt.slice(0, 4), [])).toBe(false);
    expect(canEnterChapterTwoStage(401, allBuilt, [])).toBe(true);
    expect(canEnterChapterTwoStage(402, allBuilt, [])).toBe(false);
    expect(canEnterChapterTwoStage(402, allBuilt, [401])).toBe(true);
    expect(canEnterChapterTwoStage(999, allBuilt, [401])).toBe(false);
    expect(normalizeChapterTwoClears([401, 401, 403, 999], allBuilt)).toEqual([401]);
    expect(normalizeChapterTwoClears([401], [])).toEqual([]);
  });
  it('settles first-clear rewards once without altering chapter-one progress or granting enemies', () => {
    const store = () => useGameStore.getState();
    expect(store().completeChapterTwoStage(401)).toBeUndefined();
    useGameStore.setState({ clearedStages: [30], unlockedStage: 30, builtMonumentIds: allBuilt, gold: 0 });
    expect(store().completeChapterTwoStage(402)).toBeUndefined();
    expect(store().completeChapterTwoStage(401)?.gold).toBe(chapterTwoStages[0].firstClearReward.gold);
    const gold = store().gold;
    expect(store().completeChapterTwoStage(401)).toBeUndefined();
    expect(store().gold).toBe(gold);
    expect(store().clearedStages).toEqual([30]);
    expect(store().unlockedStage).toBe(30);
    expect(store().completeStage(401)).toBeUndefined();
    for (const id of exclusiveEnemyIds) {
      expect(id in troopDefinitions).toBe(false);
      expect(exclusiveEnemyDefinitions[id].enemyOnly).toBe(true);
      expect(characterStandaloneArt[id]?.url).toContain(`/chapter-two/${id}.svg`);
      expect(store().recruitUnit(id as never)).toBe(false);
    }
    const saved = store().exportSave();
    store().resetProgress(); store().importSave(saved);
    expect(store().clearedChapterTwoStages).toEqual([401]);
    expect(store().builtMonumentIds).toEqual(allBuilt);
  });
});
