import type { GameFeatureId, HeroTrainingPackageId } from '../types/game';

export interface GameFeatureDefinition {
  id: GameFeatureId;
  name: string;
  description: string;
  unlockStage: number;
}

export interface HeroTrainingPackage {
  id: HeroTrainingPackageId;
  name: string;
  description: string;
  goldCost: number;
  xp: number;
}

export const gameFeatures: Record<GameFeatureId, GameFeatureDefinition> = {
  'hero-training': {
    id: 'hero-training',
    name: '영웅 숙련 훈련',
    description: '영웅의 전당에서 축적한 금화를 보유 영웅의 숙련 경험치로 전환합니다.',
    unlockStage: 9,
  },
};

export const heroTrainingPackages: HeroTrainingPackage[] = [
  { id: 'field-drill', name: '야전 훈련', description: '짧은 반복 훈련', goldCost: 250, xp: 100 },
  { id: 'tactical-lesson', name: '전술 교습', description: '숙련 교관의 집중 수업', goldCost: 1_000, xp: 500 },
  { id: 'royal-tutoring', name: '왕실 전수', description: '왕국의 비전과 실전 기록 전수', goldCost: 2_500, xp: 1_500 },
];

export const heroTrainingPackageById = Object.fromEntries(heroTrainingPackages.map((trainingPackage) => [trainingPackage.id, trainingPackage])) as Record<HeroTrainingPackageId, HeroTrainingPackage>;

export function isGameFeatureUnlocked(id: GameFeatureId, clearedStages: readonly number[]): boolean {
  return clearedStages.includes(gameFeatures[id].unlockStage);
}
