import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '../store/useGameStore';
import { normalizeSeenTutorials, tutorialEligible } from './tutorials';

describe('tutorial progression', () => {
  beforeEach(() => useGameStore.getState().resetProgress());
  it('keeps unavailable systems out of the tutorial and remembers completion per profile', () => {
    const profile = useGameStore.getState();
    expect(profile.seenTutorialIds).toEqual([]);
    expect(tutorialEligible('hero-training', profile)).toBe(false);
    expect(tutorialEligible('item-crafting', profile)).toBe(false);
    expect(tutorialEligible('supply-skill', profile)).toBe(false);
    expect(tutorialEligible('first-item', profile)).toBe(false);
    useGameStore.getState().markTutorialsSeen(['first-expedition', 'first-expedition', 'unknown' as never]);
    expect(useGameStore.getState().seenTutorialIds).toEqual(['first-expedition']);
    const saved = useGameStore.getState().exportSave();
    useGameStore.getState().resetProgress();
    expect(useGameStore.getState().seenTutorialIds).toEqual([]);
    useGameStore.getState().importSave(saved);
    expect(useGameStore.getState().seenTutorialIds).toEqual(['first-expedition']);
  });
  it('does not replay already-available tutorials for established legacy saves', () => {
    const profile = { ...useGameStore.getState(), unlockedStage: 10, clearedStages: [6, 9], stats: { ...useGameStore.getState().stats, battles: 9 } };
    const seen = normalizeSeenTutorials(undefined, profile, true);
    expect(seen).toContain('first-expedition');
    expect(seen).toContain('battle-basics');
    expect(seen).toContain('hero-training');
    expect(seen).not.toContain('item-crafting');
    expect(seen).not.toContain('monuments');
    expect(seen).not.toContain('new-front');
    expect(normalizeSeenTutorials([], profile, true)).toEqual([]);
  });
});
