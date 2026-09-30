export const CAMPAIGN_MAP_WORLD_WIDTH = 2_490;
export const CAMPAIGN_MAP_WORLD_HEIGHT = 2_400;
export const continentMapArt = { image: '/assets/campaign-map/continent-v1.webp', width: 2800, height: 2400 } as const;

export interface CampaignMapRegionDefinition {
  id: string;
  name: string;
  stageStart: number;
  stageEnd: number;
  x: number; y: number; width: number; height: number;
  labelX: number; labelY: number;
  outline: string;
}

/** Bounds guide discovery/scrolling; organic outlines reveal one shared terrain image. */
export const campaignMapRegions: readonly CampaignMapRegionDefinition[] = [
  { id: 'western-frontier', name: '서부 변경', stageStart: 1, stageEnd: 6, x: 0, y: 1380, width: 1240, height: 860, labelX: 670, labelY: 2010, outline: 'M120 1600 Q180 1390 490 1380 L960 1340 Q1240 1400 1250 1650 L1190 2020 Q870 2250 490 2180 L200 2010Z' },
  { id: 'fallen-capital', name: '점령 왕도', stageStart: 7, stageEnd: 12, x: 80, y: 760, width: 1080, height: 820, labelX: 470, labelY: 800, outline: 'M100 960 Q220 720 590 760 L940 800 Q1190 1010 1160 1280 L1000 1530 680 1620 280 1500 90 1260Z' },
  { id: 'ash-highland', name: '오크 고원', stageStart: 13, stageEnd: 18, x: 980, y: 740, width: 960, height: 1100, labelX: 1560, labelY: 1570, outline: 'M1070 990 1300 760 1610 720 1890 940 1940 1340 1860 1770 1560 1850 1120 1780 990 1500Z' },
  { id: 'spirit-tundra', name: '정령 설원', stageStart: 19, stageEnd: 24, x: 1300, y: 160, width: 1130, height: 1330, labelX: 2100, labelY: 400, outline: 'M1370 450 1510 220 1810 160 2180 310 2400 690 2430 1120 2280 1440 2080 1370 1850 1060 1470 950 1280 740Z' },
  { id: 'demon-rift', name: '마왕성 균열', stageStart: 25, stageEnd: 30, x: 180, y: 0, width: 1400, height: 1030, labelX: 770, labelY: 610, outline: 'M230 340 460 60 980 0 1380 130 1580 420 1510 770 1100 1000 710 1050 260 880 170 570Z' },
];

export const campaignMapMarkerArt = {
  occupied: '/assets/campaign-map/markers/occupied-outpost.png?v=2',
  boss: '/assets/campaign-map/markers/boss-citadel.png?v=2',
  liberated: '/assets/campaign-map/markers/liberated-keep.png?v=2',
} as const;

export const mapLocationArt = {
  lastBastion: campaignMapMarkerArt.liberated,
  supplyCaravan: '/assets/campaign-map/markers/supply-caravan-v1.png',
  trainingYard: '/assets/campaign-map/markers/royal-training-yard-v1.png',
  remnantCamp: '/assets/campaign-map/markers/remnant-camp-v1.png',
  treasureClosed: '/assets/campaign-map/markers/treasure-closed-v1.png',
  treasureOpen: '/assets/campaign-map/markers/treasure-open-v1.png',
} as const;

export const challengeRiftPresentation = {
  'war-arena': { theme: 'arena' },
  'moonlit-hunt': { theme: 'moon' },
  'storm-eye': { theme: 'storm' },
  'ancient-rune-basin': { theme: 'rune' },
  'abyss-rift': { theme: 'abyss' },
  'sun-prison': { theme: 'sun' },
  'sky-throne': { theme: 'sky' },
} as const;

export const farmingMissionPresentation = {
  301: { x: 110, y: 1450, theme: 'gold', image: mapLocationArt.supplyCaravan, label: '황금 수송로' },
  302: { x: 2230, y: 1370, theme: 'mastery', image: mapLocationArt.trainingYard, label: '왕립 훈련장' },
  303: { x: 180, y: 800, theme: 'gold', image: mapLocationArt.remnantCamp, label: '자유 원정지' },
} as const;

export const campaignMapLandmarks = [
  { id: 'western-cliffs', requiredStage: 1, theme: 'mountain', symbol: '▲', label: '서부 해안 절벽', x: 160, y: 1910 },
  { id: 'border-woods', requiredStage: 1, theme: 'forest', symbol: '♣', label: '잿빛 수림', x: 900, y: 1350 },
  { id: 'royal-lake', requiredStage: 7, theme: 'water', symbol: '≈', label: '왕도 수원', x: 340, y: 1120 },
  { id: 'old-aqueduct', requiredStage: 7, theme: 'ruin', symbol: '⌂', label: '붕괴한 수로교', x: 940, y: 870 },
  { id: 'ash-peaks', requiredStage: 13, theme: 'volcanic', symbol: '▲', label: '잿불 봉우리', x: 1730, y: 1300 },
  { id: 'highland-falls', requiredStage: 13, theme: 'water', symbol: '≈', label: '고원 폭포', x: 1230, y: 1600 },
  { id: 'tundra-pines', requiredStage: 19, theme: 'frost', symbol: '♠', label: '서리 침엽림', x: 1700, y: 810 },
  { id: 'spirit-lake', requiredStage: 19, theme: 'spirit', symbol: '◇', label: '정령 거울호', x: 2140, y: 930 },
  { id: 'demon-spires', requiredStage: 25, theme: 'abyss', symbol: '†', label: '마계 첨탑군', x: 520, y: 470 },
  { id: 'rift-waste', requiredStage: 25, theme: 'abyss', symbol: '◈', label: '균열 황무지', x: 1120, y: 580 },
] as const;

const stagePositions = [
  { x: 490, y: 1790 },
  { x: 650, y: 1680 },
  { x: 490, y: 1490 },
  { x: 770, y: 1450 },
  { x: 900, y: 1630 },
  { x: 1080, y: 1440 },
  { x: 730, y: 1290 },
  { x: 490, y: 1370 },
  { x: 630, y: 1180 },
  { x: 440, y: 1000 },
  { x: 640, y: 910 },
  { x: 870, y: 1050 },
  { x: 1170, y: 1250 },
  { x: 1390, y: 1420 },
  { x: 1570, y: 1230 },
  { x: 1280, y: 990 },
  { x: 1480, y: 840 },
  { x: 1730, y: 980 },
  { x: 1910, y: 820 },
  { x: 2080, y: 710 },
  { x: 1810, y: 600 },
  { x: 1590, y: 670 },
  { x: 1460, y: 510 },
  { x: 1680, y: 330 },
  { x: 1380, y: 280 },
  { x: 1200, y: 420 },
  { x: 1030, y: 280 },
  { x: 810, y: 430 },
  { x: 620, y: 250 },
  { x: 900, y: 140 },
] as const;

export function campaignMapStagePosition(stageId: number): { x: number; y: number } {
  return stagePositions[Math.max(0, Math.min(stagePositions.length - 1, stageId - 1))];
}

export function campaignMapRoadSegment(stageId: number): string {
  const from = campaignMapStagePosition(stageId - 1);
  const to = campaignMapStagePosition(stageId);
  const midY = (from.y + to.y) / 2;
  return `M${from.x} ${from.y} C${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`;
}

export const challengeMapPositions: Record<number, { x: number; y: number }> = {
  101: { x: 850, y: 1840 },
  106: { x: 980, y: 1270 },
  102: { x: 1820, y: 1490 },
  107: { x: 1950, y: 440 },
  103: { x: 1360, y: 660 },
  104: { x: 660, y: 770 },
  105: { x: 400, y: 340 },
};

export const chapterTwoMapRegion = { x: 1680, y: 0, width: 1120, height: 850, outline: 'M1690 140 1970 0 2580 0 2800 170 2770 660 2450 850 2120 790 1820 490Z' } as const;

export function chapterTwoMapPosition(stageId: number): { x: number; y: number } {
  const index = Math.max(0, Math.min(5, stageId - 401));
  return [{ x: 1810, y: 150 }, { x: 2070, y: 290 }, { x: 2210, y: 120 }, { x: 2430, y: 350 }, { x: 2630, y: 180 }, { x: 2600, y: 600 }][index];
}

export function campaignMapBounds(regionCount: number, chapterTwo: boolean): { x: number; y: number; width: number; height: number } {
  const visible = campaignMapRegions.slice(0, Math.max(1, Math.min(campaignMapRegions.length, regionCount)));
  const regions = chapterTwo ? [...visible, chapterTwoMapRegion] : visible;
  const x = Math.max(0, Math.min(...regions.map((region) => region.x)) - 60);
  const y = Math.max(0, Math.min(...regions.map((region) => region.y)) - 60);
  return { x, y, width: Math.min(continentMapArt.width, Math.max(...regions.map((region) => region.x + region.width)) + 60) - x, height: Math.min(continentMapArt.height, Math.max(...regions.map((region) => region.y + region.height)) + 160) - y };
}

export function campaignMapWorldWidth(regionCount: number, chapterTwo: boolean): number {
  return campaignMapBounds(regionCount, chapterTwo).width;
}
