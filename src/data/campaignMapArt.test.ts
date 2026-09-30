import { describe, expect, it } from 'vitest';
import { CAMPAIGN_MAP_WORLD_HEIGHT, CAMPAIGN_MAP_WORLD_WIDTH, continentMapArt, campaignMapMarkerArt, campaignMapRegions, campaignMapStagePosition, challengeRiftPresentation, campaignMapWorldWidth, campaignMapBounds, challengeMapPositions, chapterTwoMapPosition, farmingMissionPresentation } from './campaignMapArt';
import { mapTreasures } from './mapTreasures';
import { monumentBuildings } from './endgame';
import { mapLocationArt } from './campaignMapArt';
import { challengeStages } from './stages';
import { characterArtFrames, characterStandaloneArt } from './characterArt';

describe('campaign map art', () => {
  it('uses real transparent art for every revealed challenge and utility destination', () => {
    for (const challenge of challengeStages) {
      const id = challenge.bossUnitId;
      expect(id).toBeDefined();
      expect(id && (characterArtFrames[id] ?? characterStandaloneArt[id])).toBeDefined();
    }
    expect(new Set(Object.values(farmingMissionPresentation).map((entry) => entry.image)).size).toBe(3);
    expect(mapLocationArt.treasureClosed).not.toBe(mapLocationArt.treasureOpen);
  });
  it('reveals five geographic areas on one continent, advancing from the southwest coast', () => {
    expect(campaignMapRegions).toHaveLength(5);
    expect(continentMapArt.image).toBe('/assets/campaign-map/continent-v1.webp');
    expect(new Set(campaignMapRegions.map((region) => region.outline)).size).toBe(5);
    expect(campaignMapRegions.every((region, index) => region.stageStart === index * 6 + 1 && region.stageEnd === (index + 1) * 6)).toBe(true);
    expect(campaignMapStagePosition(30).x).toBeLessThan(CAMPAIGN_MAP_WORLD_WIDTH);
    expect(campaignMapStagePosition(24).y).toBeLessThan(CAMPAIGN_MAP_WORLD_HEIGHT);
    const start = campaignMapStagePosition(1);
    expect(start.x).toBeLessThan(continentMapArt.width * .2);
    expect(start.y).toBeGreaterThan(continentMapArt.height * .7);
    expect(campaignMapStagePosition(30).y).toBeLessThan(continentMapArt.height * .1);
    const regionEnds = [6, 12, 18, 24, 30].map((id) => campaignMapStagePosition(id).y);
    expect(regionEnds.every((y, i) => i === 0 || y < regionEnds[i - 1])).toBe(true);
    expect(new Set(Object.values(campaignMapMarkerArt)).size).toBe(3);
    expect(new Set(Object.values(challengeRiftPresentation).map((rift) => rift.theme)).size).toBe(7);
  });
  it('bounds the discovered world and keeps every objective inside its compact region', () => {
    expect(campaignMapWorldWidth(1, false)).toBeLessThan(1400);
    expect(campaignMapBounds(1, false).y).toBeGreaterThan(1200);
    expect(campaignMapBounds(1, false).height).toBeLessThan(1200);
    const extent = campaignMapBounds(5, true);
    expect(Math.max(extent.width, extent.height) / Math.min(extent.width, extent.height)).toBeLessThan(1.2);
    for (let count = 2; count <= 5; count += 1) {
      const before = campaignMapBounds(count - 1, false);
      const after = campaignMapBounds(count, false);
      expect(after.width).toBeGreaterThanOrEqual(before.width);
      expect(after.height).toBeGreaterThanOrEqual(before.height);
    }
    expect(campaignMapWorldWidth(5, false)).toBe(CAMPAIGN_MAP_WORLD_WIDTH);
    expect(campaignMapWorldWidth(5, true)).toBeGreaterThan(CAMPAIGN_MAP_WORLD_WIDTH);
    const points = [...Array.from({ length: 30 }, (_, i) => campaignMapStagePosition(i + 1)), ...Object.values(challengeMapPositions), ...Object.values(farmingMissionPresentation), ...monumentBuildings, ...mapTreasures.flatMap((entry) => [entry, { x: entry.guardianX, y: entry.guardianY }])];
    for (const point of points) {
      expect(point.x).toBeGreaterThanOrEqual(70);
      expect(point.x).toBeLessThan(CAMPAIGN_MAP_WORLD_WIDTH - 70);
      expect(point.y).toBeGreaterThanOrEqual(70);
      expect(point.y).toBeLessThan(CAMPAIGN_MAP_WORLD_HEIGHT - 70);
    }
    expect(chapterTwoMapPosition(401).x).toBeGreaterThan(campaignMapStagePosition(30).x);
    expect(chapterTwoMapPosition(401).y).toBeLessThan(300);
    expect(chapterTwoMapPosition(406).x).toBeLessThan(campaignMapWorldWidth(5, true) - 70);
  });
});
