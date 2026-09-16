import type { HeroId, UnitId } from '../types/game';
import { heroDefinitions, troopDefinitions } from './units';

export type CharacterArtId = UnitId | HeroId;
export type CharacterArtSheetId = 'core' | 'expansion';

export interface CharacterArtFrame {
  sheet: CharacterArtSheetId;
  column: 0 | 1 | 2 | 3;
  row: 0 | 1 | 2 | 3;
}

export const characterArtSheets: Record<CharacterArtSheetId, { url: string; textureKey: string }> = {
  core: { url: '/assets/characters/roster-atlas.png?v=2', textureKey: 'character-roster-atlas' },
  expansion: { url: '/assets/characters/expansion-atlas.png?v=2', textureKey: 'character-expansion-atlas' },
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
