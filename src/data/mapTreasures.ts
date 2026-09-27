export const MAP_TREASURE_IDS = ['western-reliquary', 'capital-vault', 'highland-cache', 'tundra-sanctum', 'rift-treasury'] as const;
export type MapTreasureId = typeof MAP_TREASURE_IDS[number];

export interface MapTreasureDefinition {
  id: MapTreasureId;
  name: string;
  description: string;
  requiredStage: 6 | 12 | 18 | 24 | 30;
  gold: number;
  x: number;
  y: number;
}

export const mapTreasures: readonly MapTreasureDefinition[] = [
  { id: 'western-reliquary', name: '변경 수복 궤짝', description: '폐허의 봉화대 아래 되찾은 왕국 보급품입니다.', requiredStage: 6, gold: 600, x: 650, y: 1_570 },
  { id: 'capital-vault', name: '왕도 비밀 금고', description: '점령군이 찾지 못한 왕실 비상 금고입니다.', requiredStage: 12, gold: 1_200, x: 1_510, y: 690 },
  { id: 'highland-cache', name: '고원 전리품 창고', description: '오크 군단의 보급로에서 확보한 전리품입니다.', requiredStage: 18, gold: 1_800, x: 2_380, y: 640 },
  { id: 'tundra-sanctum', name: '해방된 정령 제단', description: '속박이 풀린 정령들이 남긴 오래된 공물입니다.', requiredStage: 24, gold: 2_400, x: 3_210, y: 1_590 },
  { id: 'rift-treasury', name: '마왕성 봉인 보물', description: '마왕군이 균열 깊숙이 감춰 둔 최후의 군자금입니다.', requiredStage: 30, gold: 3_000, x: 4_180, y: 1_080 },
];

export const mapTreasureById = Object.fromEntries(mapTreasures.map((treasure) => [treasure.id, treasure])) as Record<MapTreasureId, MapTreasureDefinition>;
