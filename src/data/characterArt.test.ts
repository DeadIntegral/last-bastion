import { describe, expect, it } from 'vitest';
import { characterArtFrameIndex, characterArtFrames, characterArtSheet, characterArtSheets, proceduralCharacterIcons } from './characterArt';
import { allTroopOrder, heroOrder } from './units';

describe('character art atlas', () => {
  it('assigns every troop and hero to either unique atlas art or a procedural fallback', () => {
    const ids = [...allTroopOrder, ...heroOrder];
    const atlasIds = ids.filter((id) => characterArtFrames[id]);
    const proceduralIds = ids.filter((id) => proceduralCharacterIcons[id]);
    expect(new Set([...atlasIds, ...proceduralIds])).toEqual(new Set(ids));
    const addresses = atlasIds.map((id) => `${characterArtFrames[id]!.sheet}:${characterArtFrameIndex(id)}`);
    expect(new Set(addresses).size).toBe(atlasIds.length);
    expect(proceduralIds).toHaveLength(0);
    expect(atlasIds.filter((id) => characterArtFrames[id]!.sheet === 'core').map(characterArtFrameIndex)).toEqual(Array.from({ length: 13 }, (_, index) => index));
    expect(atlasIds.filter((id) => characterArtFrames[id]!.sheet === 'expansion').map(characterArtFrameIndex)).toEqual([0, 1, 2, 3]);
    expect(atlasIds.filter((id) => characterArtFrames[id]!.sheet === 'regional').map(characterArtFrameIndex).sort((a, b) => a - b)).toEqual(Array.from({ length: 16 }, (_, index) => index));
    expect(atlasIds.filter((id) => characterArtFrames[id]!.sheet === 'elemental').map(characterArtFrameIndex).sort((a, b) => a - b)).toEqual(Array.from({ length: 12 }, (_, index) => index));
    expect(atlasIds.filter((id) => characterArtFrames[id]!.sheet === 'demon').map(characterArtFrameIndex).sort((a, b) => a - b)).toEqual(Array.from({ length: 10 }, (_, index) => index));
    expect(characterArtSheet('goblinArcher')).toBe(characterArtSheets.expansion);
  });
});
