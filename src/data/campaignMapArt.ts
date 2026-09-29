export const CAMPAIGN_MAP_WORLD_WIDTH = 4_900;
export const CAMPAIGN_MAP_WORLD_HEIGHT = 1_850;

export interface CampaignMapRegionDefinition {
  id: 'western-frontier' | 'fallen-capital' | 'ash-highland' | 'spirit-tundra' | 'demon-rift';
  name: string;
  stageStart: number;
  stageEnd: number;
  image: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const campaignMapRegions: readonly CampaignMapRegionDefinition[] = [
  { id: 'western-frontier', name: '서부 변경', stageStart: 1, stageEnd: 6, image: '/assets/campaign-map/western-frontier.webp', x: 0, y: 980, width: 1_400, height: 760 },
  { id: 'fallen-capital', name: '점령 왕도', stageStart: 7, stageEnd: 12, image: '/assets/campaign-map/fallen-capital.webp', x: 820, y: 560, width: 1_400, height: 760 },
  { id: 'ash-highland', name: '오크 고원', stageStart: 13, stageEnd: 18, image: '/assets/campaign-map/ash-highland.webp', x: 1_750, y: 80, width: 1_400, height: 760 },
  { id: 'spirit-tundra', name: '정령 설원', stageStart: 19, stageEnd: 24, image: '/assets/campaign-map/spirit-tundra.webp', x: 2_580, y: 1_000, width: 1_400, height: 760 },
  { id: 'demon-rift', name: '마왕성 균열', stageStart: 25, stageEnd: 30, image: '/assets/campaign-map/demon-rift.webp', x: 3_450, y: 430, width: 1_400, height: 760 },
];

export const campaignMapMarkerArt = {
  occupied: '/assets/campaign-map/markers/occupied-outpost.png?v=2',
  boss: '/assets/campaign-map/markers/boss-citadel.png?v=2',
  liberated: '/assets/campaign-map/markers/liberated-keep.png?v=2',
} as const;

export const challengeRiftPresentation = {
  'war-arena': { theme: 'arena', symbol: '✦' },
  'moonlit-hunt': { theme: 'moon', symbol: '☾' },
  'storm-eye': { theme: 'storm', symbol: 'ϟ' },
  'ancient-rune-basin': { theme: 'rune', symbol: '◇' },
  'abyss-rift': { theme: 'abyss', symbol: '◈' },
  'sun-prison': { theme: 'sun', symbol: '☼' },
  'sky-throne': { theme: 'sky', symbol: '♛' },
} as const;

export const farmingMissionPresentation = {
  301: { x: 1_520, y: 290, theme: 'gold', symbol: '●', label: '황금 수송로' },
  302: { x: 2_440, y: 1_510, theme: 'mastery', symbol: '✦', label: '왕립 훈련장' },
} as const;

export const campaignMapLandmarks = [
  { id: 'western-cliffs', requiredStage: 1, theme: 'mountain', symbol: '▲', label: '서부 해안 절벽', x: 170, y: 1_720 },
  { id: 'border-woods', requiredStage: 1, theme: 'forest', symbol: '♣', label: '잿빛 수림', x: 760, y: 900 },
  { id: 'royal-lake', requiredStage: 7, theme: 'water', symbol: '≈', label: '왕도 수원', x: 1_390, y: 1_430 },
  { id: 'old-aqueduct', requiredStage: 7, theme: 'ruin', symbol: '⌂', label: '붕괴한 수로교', x: 1_880, y: 900 },
  { id: 'ash-peaks', requiredStage: 13, theme: 'volcanic', symbol: '▲', label: '잿불 봉우리', x: 2_650, y: 170 },
  { id: 'highland-falls', requiredStage: 13, theme: 'water', symbol: '≈', label: '고원 폭포', x: 2_330, y: 920 },
  { id: 'tundra-pines', requiredStage: 19, theme: 'frost', symbol: '♠', label: '서리 침엽림', x: 3_300, y: 1_690 },
  { id: 'spirit-lake', requiredStage: 19, theme: 'spirit', symbol: '◇', label: '정령 거울호', x: 3_600, y: 950 },
  { id: 'demon-spires', requiredStage: 25, theme: 'abyss', symbol: '†', label: '마계 첨탑군', x: 4_430, y: 1_300 },
  { id: 'rift-waste', requiredStage: 25, theme: 'abyss', symbol: '◈', label: '균열 황무지', x: 4_650, y: 520 },
] as const;

const localX = [250, 430, 620, 800, 1_000, 1_180] as const;
const localY = [
  [570, 360, 600, 300, 500, 210],
  [530, 320, 560, 370, 600, 230],
  [580, 360, 520, 290, 470, 220],
  [560, 340, 600, 420, 270, 500],
  [600, 440, 560, 330, 480, 230],
] as const;

export function campaignMapStagePosition(stageId: number): { x: number; y: number } {
  const stageIndex = Math.max(0, Math.min(29, stageId - 1));
  const regionIndex = Math.floor(stageIndex / 6);
  const localIndex = stageIndex % 6;
  const region = campaignMapRegions[regionIndex];
  return { x: region.x + localX[localIndex], y: region.y + localY[regionIndex][localIndex] };
}
