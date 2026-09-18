export type SaveSlotId = 1 | 2 | 3;

export interface SaveSlotSummary {
  id: SaveSlotId;
  occupied: boolean;
  corrupted: boolean;
  unlockedStage: number;
  clearedStages: number;
  battles: number;
  gold: number;
  updatedAt: string | null;
  gameVersion: string | null;
}

export const SAVE_SLOT_IDS: readonly SaveSlotId[] = [1, 2, 3];

const LEGACY_SAVE_KEY = 'last-bastion-profile-v1';
const SLOT_KEY_PREFIX = 'last-bastion-save-slot-v1-';
const ACTIVE_SLOT_KEY = 'last-bastion-active-save-slot-v1';
const SLOT_MIGRATION_KEY = 'last-bastion-save-slots-migrated-v1';

const slotKey = (id: SaveSlotId) => `${SLOT_KEY_PREFIX}${id}`;

function storageAvailable(): boolean {
  return typeof localStorage !== 'undefined';
}

export function initializeSaveSlots(): void {
  if (!storageAvailable() || localStorage.getItem(SLOT_MIGRATION_KEY)) return;
  const hasSlot = SAVE_SLOT_IDS.some((id) => localStorage.getItem(slotKey(id)) !== null);
  const legacy = localStorage.getItem(LEGACY_SAVE_KEY);
  if (!hasSlot && legacy) {
    localStorage.setItem(slotKey(1), legacy);
    localStorage.setItem(ACTIVE_SLOT_KEY, '1');
  }
  localStorage.setItem(SLOT_MIGRATION_KEY, '1');
}

export function activeSaveSlot(): SaveSlotId | null {
  if (!storageAvailable()) return null;
  const value = Number(localStorage.getItem(ACTIVE_SLOT_KEY));
  return SAVE_SLOT_IDS.includes(value as SaveSlotId) ? value as SaveSlotId : null;
}

export function setActiveSaveSlot(id: SaveSlotId | null): void {
  if (!storageAvailable()) return;
  if (id === null) localStorage.removeItem(ACTIVE_SLOT_KEY);
  else localStorage.setItem(ACTIVE_SLOT_KEY, String(id));
}

export function readSaveSlot(id: SaveSlotId): string | null {
  return storageAvailable() ? localStorage.getItem(slotKey(id)) : null;
}

export function writeActiveSaveSlot(serialized: string): void {
  const id = activeSaveSlot();
  if (id === null || !storageAvailable()) return;
  localStorage.setItem(slotKey(id), serialized);
}

export function deleteSaveSlot(id: SaveSlotId): void {
  if (!storageAvailable()) return;
  localStorage.removeItem(slotKey(id));
  if (activeSaveSlot() === id) setActiveSaveSlot(null);
}

function savedState(serialized: string): { state: Record<string, unknown>; exportedAt: string | null; gameVersion: string | null } | null {
  try {
    const parsed = JSON.parse(serialized) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    const record = parsed as Record<string, unknown>;
    const source = record.state && typeof record.state === 'object' ? record.state : record;
    const state = source as Record<string, unknown>;
    if (!('gold' in state) && !('unlockedStage' in state) && !('clearedStages' in state)) return null;
    return {
      state,
      exportedAt: typeof record.exportedAt === 'string' ? record.exportedAt : null,
      gameVersion: typeof record.gameVersion === 'string' ? record.gameVersion : null,
    };
  } catch {
    return null;
  }
}

const safeInteger = (value: unknown, fallback = 0) => typeof value === 'number' && Number.isFinite(value)
  ? Math.max(0, Math.floor(value))
  : fallback;

export function saveSlotSummary(id: SaveSlotId, serialized = readSaveSlot(id)): SaveSlotSummary {
  if (!serialized) return { id, occupied: false, corrupted: false, unlockedStage: 1, clearedStages: 0, battles: 0, gold: 0, updatedAt: null, gameVersion: null };
  const saved = savedState(serialized);
  if (!saved) return { id, occupied: true, corrupted: true, unlockedStage: 1, clearedStages: 0, battles: 0, gold: 0, updatedAt: null, gameVersion: null };
  const stats = saved.state.stats && typeof saved.state.stats === 'object' ? saved.state.stats as Record<string, unknown> : {};
  const clearedStages = Array.isArray(saved.state.clearedStages)
    ? saved.state.clearedStages.filter((stage) => Number.isInteger(stage)).length
    : 0;
  return {
    id,
    occupied: true,
    corrupted: false,
    unlockedStage: Math.max(1, safeInteger(saved.state.unlockedStage, 1)),
    clearedStages,
    battles: safeInteger(stats.battles),
    gold: safeInteger(saved.state.gold),
    updatedAt: saved.exportedAt,
    gameVersion: saved.gameVersion,
  };
}

export function saveSlotSummaries(): SaveSlotSummary[] {
  return SAVE_SLOT_IDS.map((id) => saveSlotSummary(id));
}
