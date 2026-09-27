import { describe, expect, it } from 'vitest';
import { CAMPAIGN_MAP_REGION_WIDTH, campaignMapRegions, campaignMapStagePosition } from './campaignMapArt';

describe('campaign map art', () => {
  it('covers five six-stage regions with unique optimized art and compact node placement', () => {
    expect(campaignMapRegions).toHaveLength(5);
    expect(new Set(campaignMapRegions.map((region) => region.image)).size).toBe(5);
    expect(campaignMapRegions.every((region, index) => region.stageStart === index * 6 + 1 && region.stageEnd === (index + 1) * 6)).toBe(true);
    expect(campaignMapRegions.every((region) => region.image.endsWith('.webp'))).toBe(true);
    expect(campaignMapStagePosition(30).x).toBeLessThan(CAMPAIGN_MAP_REGION_WIDTH * 5);
    expect(campaignMapStagePosition(7).x - campaignMapStagePosition(6).x).toBeLessThan(350);
  });
});
