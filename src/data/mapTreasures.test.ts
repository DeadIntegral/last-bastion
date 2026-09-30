import { describe, expect, it } from 'vitest';
import { campaignMapStagePosition } from './campaignMapArt';
import { mapTreasures } from './mapTreasures';

describe('campaign map treasure placement', () => {
  it('keeps every optional guardian and revealed chest clear of its six story nodes', () => {
    for (const treasure of mapTreasures) {
      const regionStart = treasure.regionBossStage - 5;
      const storyPositions = Array.from({ length: 6 }, (_, index) => campaignMapStagePosition(regionStart + index));
      // Compact placement must separate the 150px objective footprints on at least one axis.
      for (const position of storyPositions) {
        expect(Math.max(Math.abs(treasure.guardianX - position.x), Math.abs(treasure.guardianY - position.y))).toBeGreaterThan(150);
        expect(Math.max(Math.abs(treasure.x - position.x), Math.abs(treasure.y - position.y))).toBeGreaterThan(150);
      }
      expect(Math.hypot(treasure.x - treasure.guardianX, treasure.y - treasure.guardianY)).toBeLessThan(220);
    }
  });
});
