import type { MapTreasureId } from '../types/game';
import type { UnitId } from '../types/game';

export const MAP_TREASURE_IDS = ['western-reliquary', 'capital-vault', 'highland-cache', 'tundra-sanctum', 'rift-treasury'] as const satisfies readonly MapTreasureId[];

export interface MapTreasureDefinition {
  id: MapTreasureId;
  name: string;
  description: string;
  revealStage: 1 | 7 | 13 | 19 | 25;
  regionBossStage: 6 | 12 | 18 | 24 | 30;
  missionStageId: 201 | 202 | 203 | 204 | 205;
  guardianUnitId: UnitId;
  guardianX: number;
  guardianY: number;
  gold: number;
  x: number;
  y: number;
}

export const mapTreasures: readonly MapTreasureDefinition[] = [
  { id: 'western-reliquary', name: '변경 수복 궤짝', description: '폐허의 봉화대 아래 되찾은 왕국 보급품입니다.', revealStage: 1, regionBossStage: 6, missionStageId: 201, guardianUnitId: 'goblinBomber', guardianX: 280, guardianY: 1650, gold: 600, x: 300, y: 1450 },
  { id: 'capital-vault', name: '왕도 비밀 금고', description: '점령군이 찾지 못한 왕실 비상 금고입니다.', revealStage: 7, regionBossStage: 12, missionStageId: 202, guardianUnitId: 'guardian', guardianX: 270, guardianY: 1160, gold: 1_200, x: 160, y: 990 },
  { id: 'highland-cache', name: '고원 전리품 창고', description: '오크 군단의 보급로에서 확보한 전리품입니다.', revealStage: 13, regionBossStage: 18, missionStageId: 203, guardianUnitId: 'orcShaman', guardianX: 1120, guardianY: 1710, gold: 1_800, x: 1300, y: 1760 },
  { id: 'tundra-sanctum', name: '해방된 정령 제단', description: '속박이 풀린 정령들이 남긴 오래된 공물입니다.', revealStage: 19, regionBossStage: 24, missionStageId: 204, guardianUnitId: 'earthSpirit', guardianX: 2200, guardianY: 1050, gold: 2_400, x: 2290, y: 880 },
  { id: 'rift-treasury', name: '마왕성 봉인 보물', description: '마왕군이 균열 깊숙이 감춰 둔 최후의 군자금입니다.', revealStage: 25, regionBossStage: 30, missionStageId: 205, guardianUnitId: 'abyssKnight', guardianX: 530, guardianY: 620, gold: 3_000, x: 330, y: 670 },
];

export const mapTreasureById = Object.fromEntries(mapTreasures.map((treasure) => [treasure.id, treasure])) as Record<MapTreasureId, MapTreasureDefinition>;
