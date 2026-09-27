import { describe, expect, it } from 'vitest';
import { CAMPAIGN_MAP_WORLD_HEIGHT, CAMPAIGN_MAP_WORLD_WIDTH, campaignMapMarkerArt, campaignMapRegions, campaignMapStagePosition, challengeRiftPresentation } from './campaignMapArt';

describe('campaign map art', () => {
  it('covers five six-stage regions with unique optimized art and compact node placement', () => {
    expect(campaignMapRegions).toHaveLength(5);
    expect(new Set(campaignMapRegions.map((region) => region.image)).size).toBe(5);
    expect(campaignMapRegions.every((region, index) => region.stageStart === index * 6 + 1 && region.stageEnd === (index + 1) * 6)).toBe(true);
    expect(campaignMapRegions.every((region) => region.image.endsWith('.webp'))).toBe(true);
    expect(campaignMapStagePosition(30).x).toBeLessThan(CAMPAIGN_MAP_WORLD_WIDTH);
    expect(campaignMapStagePosition(24).y).toBeLessThan(CAMPAIGN_MAP_WORLD_HEIGHT);
    expect(Math.abs(campaignMapStagePosition(7).x - campaignMapStagePosition(6).x)).toBeLessThan(350);
    expect(Math.max(...campaignMapRegions.map((region) => region.y)) - Math.min(...campaignMapRegions.map((region) => region.y))).toBeGreaterThan(800);
    expect(new Set(Object.values(campaignMapMarkerArt)).size).toBe(3);
    expect(new Set(Object.values(challengeRiftPresentation).map((rift) => rift.theme)).size).toBe(7);
  });
});
