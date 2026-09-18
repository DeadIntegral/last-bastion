import { beforeEach, describe, expect, it } from 'vitest';
import { activeSaveSlot, deleteSaveSlot, initializeSaveSlots, readSaveSlot, saveSlotSummary, setActiveSaveSlot, writeActiveSaveSlot } from './saveSlots';

describe('three-slot local saves', () => {
  beforeEach(() => localStorage.clear());

  it('migrates the legacy single Zustand save into slot one once', () => {
    const legacy = JSON.stringify({ state: { gold: 450, unlockedStage: 4, clearedStages: [1, 2, 3], stats: { battles: 7 } }, version: 0 });
    localStorage.setItem('last-bastion-profile-v1', legacy);

    initializeSaveSlots();

    expect(activeSaveSlot()).toBe(1);
    expect(readSaveSlot(1)).toBe(legacy);
    expect(saveSlotSummary(1)).toMatchObject({ occupied: true, unlockedStage: 4, clearedStages: 3, battles: 7, gold: 450, gameVersion: null });
  });

  it('keeps slots independent and clears the active marker when deleting it', () => {
    setActiveSaveSlot(2);
    writeActiveSaveSlot(JSON.stringify({ gameVersion: '0.2.0', state: { gold: 900, unlockedStage: 8 } }));

    expect(saveSlotSummary(1).occupied).toBe(false);
    expect(saveSlotSummary(2)).toMatchObject({ occupied: true, gold: 900, unlockedStage: 8, gameVersion: '0.2.0' });

    deleteSaveSlot(2);
    expect(activeSaveSlot()).toBeNull();
    expect(saveSlotSummary(2).occupied).toBe(false);
  });

  it('marks unrelated or malformed slot data as corrupted', () => {
    expect(saveSlotSummary(1, '{"hello":"world"}')).toMatchObject({ occupied: true, corrupted: true });
    expect(saveSlotSummary(2, 'not-json')).toMatchObject({ occupied: true, corrupted: true });
  });
});
