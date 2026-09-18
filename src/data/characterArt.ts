import type { HeroId, UnitId } from '../types/game';
import { heroDefinitions, troopDefinitions } from './units';

export type CharacterArtId = UnitId | HeroId;
export type CharacterArtSheetId = 'core' | 'expansion' | 'regional' | 'elemental' | 'demon';

export interface CharacterArtFrame {
  sheet: CharacterArtSheetId;
  column: 0 | 1 | 2 | 3;
  row: 0 | 1 | 2 | 3;
}

export const characterArtSheets: Record<CharacterArtSheetId, { url: string; textureKey: string }> = {
  core: { url: '/assets/characters/roster-atlas.png?v=2', textureKey: 'character-roster-atlas' },
  expansion: { url: '/assets/characters/expansion-atlas.png?v=2', textureKey: 'character-expansion-atlas' },
  regional: { url: '/assets/characters/regional-atlas.png?v=1', textureKey: 'character-regional-atlas' },
  elemental: { url: '/assets/characters/elemental-atlas.png?v=1', textureKey: 'character-elemental-atlas' },
  demon: { url: '/assets/characters/demon-atlas.png?v=1', textureKey: 'character-demon-atlas' },
};
export const CHARACTER_ART_COLUMNS = 4;
export const CHARACTER_ART_FRAME_WIDTH = 153;
export const CHARACTER_ART_FRAME_HEIGHT = 160;

export const characterArtFrames: Partial<Record<CharacterArtId, CharacterArtFrame>> = {
  militia: { sheet: 'core', column: 0, row: 0 },
  guardian: { sheet: 'core', column: 1, row: 0 },
  archer: { sheet: 'core', column: 2, row: 0 },
  lancer: { sheet: 'core', column: 3, row: 0 },
  raider: { sheet: 'core', column: 0, row: 1 },
  bulwark: { sheet: 'core', column: 1, row: 1 },
  cavalry: { sheet: 'core', column: 2, row: 1 },
  crossbow: { sheet: 'core', column: 3, row: 1 },
  brute: { sheet: 'core', column: 0, row: 2 },
  griffin: { sheet: 'core', column: 1, row: 2 },
  warden: { sheet: 'core', column: 2, row: 2 },
  pyromancer: { sheet: 'core', column: 3, row: 2 },
  huntress: { sheet: 'core', column: 0, row: 3 },
  goblinArcher: { sheet: 'expansion', column: 0, row: 0 },
  goblinBomber: { sheet: 'expansion', column: 1, row: 0 },
  orcBerserker: { sheet: 'expansion', column: 2, row: 0 },
  orcShaman: { sheet: 'expansion', column: 3, row: 0 },
  swordsman: { sheet: 'regional', column: 0, row: 0 },
  pikeman: { sheet: 'regional', column: 1, row: 0 },
  scout: { sheet: 'regional', column: 2, row: 0 },
  priest: { sheet: 'regional', column: 3, row: 0 },
  mage: { sheet: 'regional', column: 0, row: 1 },
  archmage: { sheet: 'regional', column: 1, row: 1 },
  assassin: { sheet: 'regional', column: 2, row: 1 },
  troll: { sheet: 'regional', column: 3, row: 1 },
  ogreMage: { sheet: 'regional', column: 0, row: 2 },
  wolfRider: { sheet: 'regional', column: 1, row: 2 },
  harpy: { sheet: 'regional', column: 2, row: 2 },
  minotaur: { sheet: 'regional', column: 3, row: 2 },
  wyvern: { sheet: 'regional', column: 0, row: 3 },
  slime: { sheet: 'regional', column: 1, row: 3 },
  basilisk: { sheet: 'regional', column: 2, row: 3 },
  direwolf: { sheet: 'regional', column: 3, row: 3 },
  spirit: { sheet: 'elemental', column: 0, row: 0 },
  fireSpirit: { sheet: 'elemental', column: 1, row: 0 },
  iceSpirit: { sheet: 'elemental', column: 2, row: 0 },
  earthSpirit: { sheet: 'elemental', column: 3, row: 0 },
  lightSpirit: { sheet: 'elemental', column: 0, row: 1 },
  darkSpirit: { sheet: 'elemental', column: 1, row: 1 },
  giantEagle: { sheet: 'elemental', column: 2, row: 1 },
  treant: { sheet: 'elemental', column: 3, row: 1 },
  golem: { sheet: 'elemental', column: 0, row: 2 },
  hydra: { sheet: 'elemental', column: 1, row: 2 },
  hellhound: { sheet: 'elemental', column: 2, row: 2 },
  saint: { sheet: 'elemental', column: 3, row: 2 },
  imp: { sheet: 'demon', column: 0, row: 0 },
  succubus: { sheet: 'demon', column: 1, row: 0 },
  demonGuard: { sheet: 'demon', column: 2, row: 0 },
  demonMage: { sheet: 'demon', column: 3, row: 0 },
  gargoyle: { sheet: 'demon', column: 0, row: 1 },
  cerberus: { sheet: 'demon', column: 1, row: 1 },
  ifrit: { sheet: 'demon', column: 2, row: 1 },
  reaper: { sheet: 'demon', column: 3, row: 1 },
  abyssKnight: { sheet: 'demon', column: 0, row: 2 },
  marshal: { sheet: 'demon', column: 1, row: 2 },
};

export const proceduralCharacterIcons = Object.fromEntries(
  [...Object.entries(troopDefinitions), ...Object.entries(heroDefinitions)]
    .filter(([id]) => !characterArtFrames[id as CharacterArtId])
    .map(([id, definition]) => [id, definition.icon]),
) as Partial<Record<CharacterArtId, string>>;

export function characterArtFrameIndex(id: CharacterArtId): number {
  const frame = characterArtFrames[id];
  if (!frame) return -1;
  return frame.row * CHARACTER_ART_COLUMNS + frame.column;
}

export function characterArtSheet(id: CharacterArtId) {
  const frame = characterArtFrames[id];
  return frame ? characterArtSheets[frame.sheet] : undefined;
}
