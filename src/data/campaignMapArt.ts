export const CAMPAIGN_MAP_REGION_WIDTH = 1_000;

export interface CampaignMapRegionDefinition {
  id: 'western-frontier' | 'fallen-capital' | 'ash-highland' | 'spirit-tundra' | 'demon-rift';
  name: string;
  stageStart: number;
  stageEnd: number;
  image: string;
}

export const campaignMapRegions: readonly CampaignMapRegionDefinition[] = [
  { id: 'western-frontier', name: '서부 변경', stageStart: 1, stageEnd: 6, image: '/assets/campaign-map/western-frontier.webp' },
  { id: 'fallen-capital', name: '점령 왕도', stageStart: 7, stageEnd: 12, image: '/assets/campaign-map/fallen-capital.webp' },
  { id: 'ash-highland', name: '오크 고원', stageStart: 13, stageEnd: 18, image: '/assets/campaign-map/ash-highland.webp' },
  { id: 'spirit-tundra', name: '정령 설원', stageStart: 19, stageEnd: 24, image: '/assets/campaign-map/spirit-tundra.webp' },
  { id: 'demon-rift', name: '마왕성 균열', stageStart: 25, stageEnd: 30, image: '/assets/campaign-map/demon-rift.webp' },
];

const firstRegionX = [250, 350, 455, 565, 685, 825] as const;
const regionX = [115, 265, 420, 575, 735, 885] as const;
const regionY = [
  [74, 48, 70, 40, 62, 30],
  [62, 35, 70, 47, 72, 27],
  [72, 43, 65, 32, 58, 24],
  [67, 36, 73, 49, 29, 57],
  [74, 51, 67, 39, 56, 24],
] as const;

export function campaignMapStagePosition(stageId: number): { x: number; y: number } {
  const stageIndex = Math.max(0, Math.min(29, stageId - 1));
  const regionIndex = Math.floor(stageIndex / 6);
  const localIndex = stageIndex % 6;
  const localX = regionIndex === 0 ? firstRegionX[localIndex] : regionX[localIndex];
  return {
    x: regionIndex * CAMPAIGN_MAP_REGION_WIDTH + localX,
    y: regionY[regionIndex][localIndex],
  };
}
