import { describe, expect, it } from 'vitest';
import { campaignMapStagePosition } from './campaignMapArt';
import { mapTreasures } from './mapTreasures';

describe('campaign map treasure placement', () => {
  it('keeps every optional guardian and revealed chest clear of its six story nodes', () => {
    for (const treasure of mapTreasures) {
      const regionStart = treasure.regionBossStage - 5;
      const storyPositions = Array.from({ length: 6 }, (_, index) => campaignMapStagePosition(regionStart + index));
      const guardianDistance = Math.min(...storyPositions.map((position) => Math.hypot(treasure.guardianX - position.x, treasure.guardianY - position.y)));
      const chestDistance = Math.min(...storyPositions.map((position) => Math.hypot(treasure.x - position.x, treasure.y - position.y)));
      expect(guardianDistance).toBeGreaterThan(220);
      expect(chestDistance).toBeGreaterThan(220);
      expect(Math.hypot(treasure.x - treasure.guardianX, treasure.y - treasure.guardianY)).toBeLessThan(220);
    }
  });
});
