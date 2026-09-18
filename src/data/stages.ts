import type { EnemyFaction, StageDefinition, TerrainEffect, UnitId } from '../types/game';
import { troopDefinitions } from './units';

export const ENEMY_EQUIPMENT_MAX_LEVEL = 5;
export const MIN_FORTRESS_DISTANCE = 1_050;
export const MAX_FORTRESS_DISTANCE = 1_390;
export const FORTRESS_DISTANCE_PER_STAGE = 25;

export const campaignFortressDistance = (stageId: number) => Math.min(
  MAX_FORTRESS_DISTANCE,
  MIN_FORTRESS_DISTANCE + Math.max(0, stageId - 1) * FORTRESS_DISTANCE_PER_STAGE,
);

export const enemyFactionLabels: Record<EnemyFaction, string> = {
  betrayers: '배신한 인간군',
  goblins: '고블린 부족',
  orcs: '오크 군단',
  monsters: '마수·몬스터 군세',
  demons: '마왕군 악마',
  spirits: '속박된 정령',
  mixed: '마왕군 혼성군',
};

const campaignTerrain = (stageId: number): TerrainEffect => {
  if (stageId <= 6) return { id: 'ruined-border', name: '황폐한 변경', description: '마왕군의 첫 침공으로 폐허가 된 왕국 서부입니다.', enemyHpMultiplier: 1, enemyAttackMultiplier: 1, enemyMoveSpeedMultiplier: 1 };
  if (stageId <= 12) return { id: 'fallen-capital', name: '점령된 왕도', description: '배신자들이 마왕군의 깃발 아래 왕국의 진형을 사용합니다.', enemyHpMultiplier: 1, enemyAttackMultiplier: 1, enemyMoveSpeedMultiplier: 1 };
  if (stageId <= 18) return { id: 'ash-highland', name: '잿불 고원', description: '오크 군단과 화염 마물이 지키는 북부 진격로입니다.', enemyHpMultiplier: 1, enemyAttackMultiplier: 1, enemyMoveSpeedMultiplier: 1 };
  if (stageId <= 24) return { id: 'spirit-tundra', name: '정령 설원', description: '마왕군에 속박된 바람과 서리 정령이 날뛰는 땅입니다.', enemyHpMultiplier: 1, enemyAttackMultiplier: 1, enemyMoveSpeedMultiplier: 1 };
  return { id: 'demon-rift', name: '마계 균열', description: '마왕성으로 이어지는 균열에서 악마 군세가 쏟아집니다.', enemyHpMultiplier: 1, enemyAttackMultiplier: 1, enemyMoveSpeedMultiplier: 1 };
};

const campaignFaction = (stageId: number): EnemyFaction => {
  if (stageId <= 3) return stageId === 1 ? 'goblins' : 'betrayers';
  if (stageId === 4 || stageId === 6 || stageId === 18) return 'monsters';
  if (stageId <= 12) return 'mixed';
  if (stageId <= 18) return stageId % 2 === 1 ? 'orcs' : 'mixed';
  if (stageId <= 24) return stageId % 2 === 1 || stageId === 24 ? 'spirits' : 'mixed';
  return stageId % 2 === 1 || stageId === 30 ? 'demons' : 'mixed';
};

export const advancedEnemyIntroductionStages = {
  cavalry: 8,
  griffin: 10,
} satisfies Partial<Record<UnitId, number>>;

const campaignStageBlueprints: Array<Omit<StageDefinition, 'fortressDistance' | 'enemyFaction' | 'terrain'>> = [
  {
    id: 1, name: '국경의 불씨', subtitle: '다가오는 약탈대를 막아내세요', reward: 100, enemyCastleHp: 800,
    enemyUpgrades: { equipment: { weapon: 0, armor: 0, boots: 0 } },
    firstClearReward: { label: '방패병 해금', description: '단단한 전열 병종 방패병을 편성할 수 있습니다.', icon: '◆', unitId: 'guardian' },
    waves: [
      { timeMs: 1500, unitId: 'raider', count: 1, intervalMs: 2600 },
      { timeMs: 11000, unitId: 'raider', count: 2, intervalMs: 4200 },
      { timeMs: 23500, unitId: 'raider', count: 2, intervalMs: 3500 },
    ],
    reinforcement: { startMs: 34_000, intervalMs: 3_500, unitIds: ['raider', 'militia'], maxAlive: 6 },
  },
  {
    id: 2, name: '철의 행렬', subtitle: '단단한 전열에는 끈기가 필요합니다', reward: 200, enemyCastleHp: 1100,
    enemyUpgrades: { equipment: { weapon: 1, armor: 1, boots: 0 } },
    firstClearReward: { label: '궁수 해금', description: '원거리 병종 궁수를 편성할 수 있습니다.', icon: '➶', unitId: 'archer' },
    waves: [
      { timeMs: 1200, unitId: 'guardian', count: 2, intervalMs: 3600 },
      { timeMs: 9000, unitId: 'bulwark', count: 2, intervalMs: 4500 },
      { timeMs: 21000, unitId: 'raider', count: 2, intervalMs: 3300 },
    ],
    eliteGuard: { unitId: 'guardian', name: '철문 부대장', hpMultiplier: 1.8, attackMultiplier: 1.15, defenseBonus: 2 },
    reinforcement: { startMs: 32_000, intervalMs: 3_200, unitIds: ['guardian', 'raider', 'bulwark'], maxAlive: 7 },
  },
  {
    id: 3, name: '붉은 화살비', subtitle: '후방의 석궁병을 돌파하세요', reward: 300, enemyCastleHp: 1400,
    enemyUpgrades: { equipment: { weapon: 2, armor: 1, boots: 1 } },
    firstClearReward: { label: '창병과 왕실 보급품', description: '창병을 편성할 수 있고 금화 300개를 획득합니다.', icon: '♢', unitId: 'lancer', gold: 300 },
    waves: [
      { timeMs: 1200, unitId: 'archer', count: 2, intervalMs: 3200 },
      { timeMs: 7000, unitId: 'crossbow', count: 3, intervalMs: 3000 },
      { timeMs: 19000, unitId: 'bulwark', count: 2, intervalMs: 3300 },
      { timeMs: 25000, unitId: 'crossbow', count: 2, intervalMs: 2400 },
    ],
    eliteGuard: { unitId: 'lancer', name: '붉은 선봉대장', hpMultiplier: 1.5, attackMultiplier: 1.2, defenseBonus: 2 },
    reinforcement: { startMs: 33_000, intervalMs: 3_000, unitIds: ['archer', 'guardian', 'crossbow'], maxAlive: 8 },
  },
  {
    id: 4, name: '파쇄자의 길', subtitle: '창끝을 세워 오우거 전열을 쓰러뜨리세요', reward: 400, enemyCastleHp: 1800,
    enemyUpgrades: { equipment: { weapon: 2, armor: 3, boots: 1 } },
    firstClearReward: { label: '잿불 마녀 영입', description: '영웅 셀레네가 무료로 원정대에 합류합니다.', icon: '✹', heroId: 'pyromancer' },
    waves: [
      { timeMs: 1000, unitId: 'lancer', count: 5, intervalMs: 1800 },
      { timeMs: 8000, unitId: 'brute', count: 1, intervalMs: 6000 },
      { timeMs: 17000, unitId: 'crossbow', count: 4, intervalMs: 2200 },
      { timeMs: 25000, unitId: 'brute', count: 1, intervalMs: 4500 },
    ],
    eliteGuard: { unitId: 'brute', name: '산길 파쇄대장', hpMultiplier: 1.15, attackMultiplier: 1.05, defenseBonus: 1 },
    reinforcement: { startMs: 36_000, intervalMs: 2_800, unitIds: ['lancer', 'crossbow', 'bulwark'], maxAlive: 9 },
  },
  {
    id: 5, name: '검은 성문', subtitle: '모든 병종을 활용해 성문을 여세요', reward: 500, enemyCastleHp: 2300,
    enemyUpgrades: { equipment: { weapon: 4, armor: 4, boots: 3 } },
    firstClearReward: { label: '대형 보급 궤짝', description: '최종 도전을 준비할 금화 500개입니다.', icon: '▣', gold: 500 },
    waves: [
      { timeMs: 800, unitId: 'raider', count: 2, intervalMs: 3000 },
      { timeMs: 6500, unitId: 'bulwark', count: 2, intervalMs: 3000 },
      { timeMs: 11000, unitId: 'crossbow', count: 3, intervalMs: 2400 },
      { timeMs: 19000, unitId: 'brute', count: 2, intervalMs: 4800 },
      { timeMs: 28000, unitId: 'raider', count: 2, intervalMs: 2800 },
      { timeMs: 33000, unitId: 'militia', count: 2, intervalMs: 2400 },
      { timeMs: 35000, unitId: 'guardian', count: 2, intervalMs: 2800 },
      { timeMs: 38000, unitId: 'archer', count: 2, intervalMs: 2500 },
      { timeMs: 41000, unitId: 'lancer', count: 2, intervalMs: 2300 },
    ],
    eliteGuard: { unitId: 'bulwark', name: '검은 성문장', hpMultiplier: 1.6, attackMultiplier: 1.2, defenseBonus: 3 },
    reinforcement: { startMs: 48_000, intervalMs: 2_800, unitIds: ['raider', 'bulwark', 'crossbow', 'swordsman', 'lancer'], maxAlive: 9 },
  },
  {
    id: 6, name: '검은숲 마수의 성채', subtitle: '마왕군이 풀어놓은 검은숲 마수와 배후 성채를 무너뜨리세요', reward: 600, enemyCastleHp: 3200, boss: true, bossName: '검은숲의 봉인 마수',
    bossModifiers: { hpMultiplier: 1.08, attackMultiplier: 1, stompCadenceMultiplier: 1 },
    enemyUpgrades: { equipment: { weapon: 5, armor: 5, boots: 4 } },
    firstClearReward: { label: '마수 사냥꾼의 맹세', description: '영웅 리아와 금화 800개를 획득합니다.', icon: '➹', heroId: 'huntress', gold: 800 },
    waves: [],
    reinforcement: { startMs: 5_000, intervalMs: 8_500, unitIds: ['raider', 'militia'], maxAlive: 4 },
  },
  {
    id: 7, name: '잿빛 협곡', subtitle: '마수의 성채 너머에서 밀려오는 배신자 부대를 저지하세요', reward: 700, enemyCastleHp: 4000,
    enemyUpgrades: { equipment: { weapon: 5, armor: 5, boots: 5 } },
    firstClearReward: { label: '협곡 원정 보급', description: '동부 원정을 위한 금화 700개를 획득합니다.', icon: '●', gold: 700 },
    waves: [
      { timeMs: 900, unitId: 'militia', count: 3, intervalMs: 2800 },
      { timeMs: 6500, unitId: 'crossbow', count: 3, intervalMs: 2500 },
      { timeMs: 13500, unitId: 'guardian', count: 2, intervalMs: 3200 },
      { timeMs: 22000, unitId: 'brute', count: 2, intervalMs: 4200 },
    ],
    eliteGuard: { unitId: 'brute', name: '협곡 집행자', hpMultiplier: 1.3, attackMultiplier: 1.15, defenseBonus: 3 },
    reinforcement: { startMs: 34_000, intervalMs: 2_200, unitIds: ['militia', 'crossbow', 'guardian', 'swordsman'], maxAlive: 14 },
  },
  {
    id: 8, name: '유리 사막', subtitle: '빠른 기동대와 장거리 사격을 견뎌내세요', reward: 800, enemyCastleHp: 5600,
    enemyUpgrades: { equipment: { weapon: 5, armor: 5, boots: 5 } },
    firstClearReward: { label: '사막의 전리품', description: '금화 800개를 획득합니다.', icon: '◇', gold: 800 },
    waves: [
      { timeMs: 700, unitId: 'raider', count: 2, intervalMs: 2600 },
      { timeMs: 8000, unitId: 'archer', count: 2, intervalMs: 2800 },
      { timeMs: 15500, unitId: 'cavalry', count: 3, intervalMs: 2600 },
      { timeMs: 22000, unitId: 'lancer', count: 4, intervalMs: 1900 },
      { timeMs: 27000, unitId: 'crossbow', count: 5, intervalMs: 1500 },
    ],
    eliteGuard: { unitId: 'bulwark', name: '사막의 철벽', hpMultiplier: 1.8, attackMultiplier: 1.25, defenseBonus: 3 },
    reinforcement: { startMs: 34_000, intervalMs: 2_150, unitIds: ['raider', 'archer', 'lancer', 'crossbow', 'cavalry'], maxAlive: 13 },
  },
  {
    id: 9, name: '무너진 수도', subtitle: '왕국의 옛 병종으로 이루어진 수비선을 돌파하세요', reward: 900, enemyCastleHp: 6800,
    enemyUpgrades: { equipment: { weapon: 5, armor: 5, boots: 5 } },
    firstClearReward: { label: '왕실 훈련소 복구', description: '금화 900개를 획득하고, 금화로 영웅 숙련 경험치를 훈련하는 기능을 해금합니다.', icon: '♛', gold: 900, featureId: 'hero-training' },
    waves: [
      { timeMs: 800, unitId: 'guardian', count: 3, intervalMs: 2700 },
      { timeMs: 5500, unitId: 'cavalry', count: 3, intervalMs: 2500 },
      { timeMs: 12000, unitId: 'militia', count: 3, intervalMs: 2300 },
      { timeMs: 21000, unitId: 'lancer', count: 4, intervalMs: 2100 },
      { timeMs: 28000, unitId: 'bulwark', count: 3, intervalMs: 2900 },
    ],
    eliteGuard: { unitId: 'cavalry', name: '몰락한 근위대장', hpMultiplier: 2.1, attackMultiplier: 1.35, defenseBonus: 3 },
    reinforcement: { startMs: 37_000, intervalMs: 2_150, unitIds: ['guardian', 'cavalry', 'militia', 'lancer', 'bulwark'], maxAlive: 14 },
  },
  {
    id: 10, name: '침묵 수도원', subtitle: '두꺼운 갑주를 넘어 처음 나타난 공중 수비대를 무너뜨리세요', reward: 1000, enemyCastleHp: 9500,
    enemyUpgrades: { equipment: { weapon: 5, armor: 5, boots: 5 } },
    firstClearReward: { label: '봉인된 성물', description: '금화 1,000개를 획득합니다.', icon: '✦', gold: 1000 },
    waves: [
      { timeMs: 700, unitId: 'bulwark', count: 5, intervalMs: 2200 },
      { timeMs: 5000, unitId: 'crossbow', count: 7, intervalMs: 1600 },
      { timeMs: 13000, unitId: 'guardian', count: 3, intervalMs: 2800 },
      { timeMs: 20500, unitId: 'brute', count: 4, intervalMs: 3300 },
      { timeMs: 28500, unitId: 'griffin', count: 1, intervalMs: 2400 },
    ],
    eliteGuard: { unitId: 'brute', name: '수도원 문지기', hpMultiplier: 1.35, attackMultiplier: 1.17, defenseBonus: 4 },
    reinforcement: { startMs: 39_000, intervalMs: 2_100, unitIds: ['bulwark', 'crossbow', 'guardian', 'swordsman'], maxAlive: 14 },
  },
  {
    id: 11, name: '황혼의 관문', subtitle: '모든 병종이 결집한 마지막 성문을 여세요', reward: 1100, enemyCastleHp: 6200,
    enemyUpgrades: { equipment: { weapon: 5, armor: 5, boots: 5 } },
    firstClearReward: { label: '황혼의 군자금', description: '금화 1,100개를 획득합니다.', icon: '●', gold: 1100 },
    waves: [
      { timeMs: 600, unitId: 'cavalry', count: 4, intervalMs: 1800 },
      { timeMs: 4500, unitId: 'bulwark', count: 4, intervalMs: 2100 },
      { timeMs: 9000, unitId: 'crossbow', count: 6, intervalMs: 1600 },
      { timeMs: 15000, unitId: 'brute', count: 4, intervalMs: 3000 },
      { timeMs: 22000, unitId: 'lancer', count: 6, intervalMs: 1700 },
      { timeMs: 29000, unitId: 'griffin', count: 2, intervalMs: 2500 },
    ],
    eliteGuard: { unitId: 'brute', name: '황혼 사령관', hpMultiplier: 1.4, attackMultiplier: 1.2, defenseBonus: 5 },
    reinforcement: { startMs: 39_000, intervalMs: 2_100, unitIds: ['cavalry', 'bulwark', 'crossbow', 'swordsman', 'lancer'], maxAlive: 13 },
  },
  {
    id: 12, name: '철갑 마수의 귀환', subtitle: '배신한 인간군이 깨운 철갑 마수와 동부 성채를 함께 끝내세요', reward: 1200, enemyCastleHp: 8500, boss: true, bossName: '왕도 철갑 마수',
    bossModifiers: { hpMultiplier: 2.1, attackMultiplier: 1.28, stompCadenceMultiplier: 0.84 },
    enemyUpgrades: { equipment: { weapon: 5, armor: 5, boots: 5 } },
    firstClearReward: { label: '새벽의 성녀 합류', description: '영웅 미레나가 합류하고 금화 1,200개를 획득합니다.', icon: '✚', heroId: 'saint', gold: 1200 },
    waves: [],
    reinforcement: { startMs: 5_000, intervalMs: 7_500, unitIds: ['militia', 'raider', 'archer'], maxAlive: 4 },
  },
];

const lateStageNames = [
  ['백은 평원', '백은빛 전열을 가르고 북부 원정로를 확보하세요'],
  ['바람 절벽', '좁은 절벽길의 기동 부대를 밀어내세요'],
  ['망각의 초소', '잊힌 초소의 장거리 수비망을 돌파하세요'],
  ['붉은 수로', '수로를 따라 밀려오는 혼성군을 저지하세요'],
  ['용광로 성벽', '달아오른 철갑 전열과 공중대를 무너뜨리세요'],
  ['잿불 마수의 요새', '오크 주술사가 깨운 잿불 마수를 쓰러뜨리고 북부 요새를 함락하세요'],
  ['서리 벌판', '얼어붙은 벌판의 빠른 파상 공세를 견디세요'],
  ['빙결 관문', '두꺼운 방패벽과 관통 사격을 돌파하세요'],
  ['유령 숲', '안개 속에서 교차하는 지상·공중 전열을 찾으세요'],
  ['부서진 첨탑', '첨탑 아래 집결한 왕립 기동대를 분쇄하세요'],
  ['백야 성채', '밤이 끝나기 전에 끝없는 증원선을 끊으세요'],
  ['서리 정령수의 왕성', '속박된 서리 정령수와 북왕의 성채를 함께 무너뜨리세요'],
  ['폭풍 해안', '폭풍을 타고 내려오는 공중 강습을 버티세요'],
  ['천둥 협곡', '협곡을 울리는 중장 전열을 정면 돌파하세요'],
  ['구름 요새', '고공 수비대와 장거리 화망을 제압하세요'],
  ['왕좌 회랑', '왕좌로 이어지는 정예 회랑을 정복하세요'],
  ['최후의 장벽', '모든 병종이 결집한 마지막 방벽을 여세요'],
  ['마왕성의 심연수', '마왕의 심연 마수를 넘어 마지막 적 성채를 파괴하세요'],
] as const;

const lateCoreComposition: UnitId[] = ['militia', 'guardian', 'archer', 'lancer', 'bulwark', 'crossbow'];
const lateRegionalRosters: Record<3 | 4 | 5, UnitId[]> = {
  3: ['goblinArcher', 'goblinBomber', 'orcBerserker', 'orcShaman', 'troll', 'ogreMage', 'wolfRider', 'harpy', 'minotaur', 'slime', 'basilisk', 'direwolf', 'hydra', 'swordsman', 'pikeman'],
  4: ['spirit', 'fireSpirit', 'iceSpirit', 'earthSpirit', 'lightSpirit', 'darkSpirit', 'griffin', 'giantEagle', 'treant', 'golem', 'wyvern', 'priest', 'mage', 'archmage', 'scout'],
  5: ['hellhound', 'imp', 'succubus', 'demonGuard', 'demonMage', 'gargoyle', 'cerberus', 'reaper', 'abyssKnight', 'assassin', 'cavalry', 'crossbow', 'archer', 'lancer', 'brute'],
};

const lateRegionalReinforcementCore: Record<3 | 4 | 5, UnitId[]> = {
  3: ['raider', 'bulwark'],
  4: ['guardian', 'archer'],
  5: ['imp', 'crossbow'],
};

const lateReinforcementIntervalMs: Record<number, number> = {
  13: 2_200, 14: 4_200, 15: 4_500, 16: 4_200, 17: 3_000,
  19: 2_800, 20: 4_800, 21: 5_200, 22: 4_300, 23: 2_900,
  25: 3_700, 26: 4_500, 27: 4_300, 28: 2_600, 29: 2_600,
};

const lateFortressAttack = (stageId: number): NonNullable<StageDefinition['enemyFortressAttack']> => {
  if (stageId >= 25) return { damage: 105, range: 320, intervalMs: 2_100 };
  if (stageId >= 19) return { damage: 75, range: 290, intervalMs: 2_400 };
  return { damage: 50, range: 260, intervalMs: 2_800 };
};

function lateStageRegionalUnits(id: number): UnitId[] {
  const region = Math.min(5, Math.floor((id - 1) / 6) + 1) as 3 | 4 | 5;
  const regionStart = (region - 1) * 6 + 1;
  const offset = (id - regionStart) * 3;
  const roster = lateRegionalRosters[region];
  return roster.slice(offset, offset + 3);
}

function lateStageComposition(id: number): Array<{ unitId: UnitId; signature: boolean }> {
  const regional = lateStageRegionalUnits(id);
  return lateCoreComposition.flatMap((unitId, index) => index < regional.length
    ? [{ unitId, signature: false }, { unitId: regional[index], signature: true }]
    : [{ unitId, signature: false }]);
}

function lateStageReinforcementUnits(id: number): UnitId[] {
  const region = Math.min(5, Math.floor((id - 1) / 6) + 1) as 3 | 4 | 5;
  const regionStart = (region - 1) * 6 + 1;
  const introducedCount = (id - regionStart + 1) * 3;
  const recentRegional = lateRegionalRosters[region]
    .slice(0, introducedCount)
    .filter((unitId) => troopDefinitions[unitId].grade <= 3)
    .slice(-4);
  return [...new Set([...lateRegionalReinforcementCore[region], ...recentRegional])];
}

function lateBossGarrison(id: number): NonNullable<StageDefinition['reinforcement']> {
  if (id === 18) return { startMs: 5_000, intervalMs: 7_800, unitIds: ['raider', 'goblinArcher'], maxAlive: 4 };
  if (id === 24) return { startMs: 5_000, intervalMs: 7_600, unitIds: ['scout', 'iceSpirit'], maxAlive: 4 };
  return { startMs: 5_000, intervalMs: 7_400, unitIds: ['imp', 'militia'], maxAlive: 5 };
}

function createLateStage(id: number): Omit<StageDefinition, 'fortressDistance' | 'enemyFaction' | 'terrain'> {
  const progress = id - 13;
  const boss = id % 6 === 0;
  const [name, subtitle] = lateStageNames[progress];
  const composition = boss ? [] : lateStageComposition(id);
  const waveInterval = Math.max(1_450, 2_150 - progress * 30);
  const regionOpeningFortressBonus = !boss && id % 6 === 1 ? 1_250 : 0;
  const fortressHardening = 2_000 + progress * 250;
  const waves = composition.map(({ unitId, signature }, index) => ({
    timeMs: 700 + index * 4_500,
    unitId,
    count: signature
      ? troopDefinitions[unitId].cost <= 120 ? 2 : 1
      : 3 + Math.floor((progress + index) / composition.length),
    intervalMs: waveInterval,
  }));
  const bossRank = boss ? id / 6 : 0;
  const bossNames: Partial<Record<number, string>> = {
    18: '잿불 포식수',
    24: '서리의 대정령수',
    30: '심연의 왕관수',
  };
  return {
    id,
    name,
    subtitle,
    reward: id * 100,
    enemyCastleHp: (boss ? 9_000 : 13_250) + progress * 2_500 + fortressHardening + regionOpeningFortressBonus + (id === 28 ? 250 : 0),
    enemyFortressAttack: lateFortressAttack(id),
    enemyUpgrades: { equipment: { weapon: 5, armor: 5, boots: 5 } },
    firstClearReward: id === 18 ? {
      label: '해방군 기수 합류',
      description: '영웅 브란이 합류하고 금화 1,800개를 획득합니다.',
      icon: '⚑', heroId: 'marshal', gold: 1_800,
    } : {
      label: boss ? `${name} 정복 보급` : `${name} 원정 보급`,
      description: `최초 승리 보상으로 금화 ${(id * 100).toLocaleString()}개를 획득합니다.`,
      icon: boss ? '♜' : progress % 2 === 0 ? '▣' : '✦',
      gold: id * 100,
    },
    waves,
    ...(boss ? {
      boss: true,
      bossName: bossNames[id],
      reinforcement: lateBossGarrison(id),
      bossModifiers: {
        hpMultiplier: 1.9 + bossRank * 0.1 + (bossRank === 4 ? 0.03 : bossRank === 5 ? 0.08 : 0),
        attackMultiplier: 1.05 + bossRank * 0.06,
        stompCadenceMultiplier: Math.max(0.74, 1 - bossRank * 0.05),
      },
    } : {
      eliteGuard: {
        unitId: 'brute',
        name: `${name} 수비대장`,
        hpMultiplier: 1.4 + progress * 0.03,
        attackMultiplier: 1.15 + progress * 0.01,
        defenseBonus: 6 + Math.floor(progress / 4),
      },
      reinforcement: {
        startMs: 55_000,
        intervalMs: lateReinforcementIntervalMs[id],
        unitIds: lateStageReinforcementUnits(id),
        maxAlive: Math.min(15, 13 + Math.floor(progress / 8)),
      },
    }),
  };
}

export const stages: StageDefinition[] = [
  ...campaignStageBlueprints,
  ...Array.from({ length: 18 }, (_, index) => createLateStage(index + 13)),
].map((stage) => ({
  ...stage,
  fortressDistance: campaignFortressDistance(stage.id),
  enemyFaction: campaignFaction(stage.id),
  terrain: campaignTerrain(stage.id),
}));

export const challengeStages: StageDefinition[] = [
  {
    id: 101, name: '오우거 대족장', subtitle: '마왕군의 투기장에서 지형의 힘을 얻은 오우거를 굴복시키세요.', reward: 400,
    enemyCastleHp: 0, fortressDistance: MAX_FORTRESS_DISTANCE, challenge: true, requiredCampaignStage: 6, boss: true, bossName: '쇠사슬 대족장', bossUnitId: 'brute', enemyFaction: 'monsters',
    terrain: { id: 'war-arena', name: '피의 투기장', description: '투기장의 광기가 적의 체력을 10배, 공격력을 2.5배로 만듭니다.', enemyHpMultiplier: 10, enemyAttackMultiplier: 2.5, enemyMoveSpeedMultiplier: 1 },
    bossModifiers: { hpMultiplier: 1.5, attackMultiplier: 1, stompCadenceMultiplier: 0.92 },
    enemyUpgrades: { equipment: { weapon: 5, armor: 5, boots: 5 } }, waves: [],
    firstClearReward: { label: '오우거 파쇄자 영입', description: '지형 보정이 없는 기본 오우거 파쇄자가 원정대에 합류합니다.', icon: '●', unitId: 'brute' },
  },
  {
    id: 102, name: '폭풍의 대정령', subtitle: '폭풍의 눈에서 열 배로 증폭된 정령의 생명력을 꺾으세요.', reward: 1_000,
    enemyCastleHp: 0, fortressDistance: MAX_FORTRESS_DISTANCE, challenge: true, requiredCampaignStage: 18, boss: true, bossName: '해방되지 못한 대정령', bossUnitId: 'spirit', enemyFaction: 'spirits',
    terrain: { id: 'storm-eye', name: '폭풍의 눈', description: '응축된 원소가 적의 체력을 10배, 공격력을 2.5배, 이동속도를 1.15배로 만듭니다.', enemyHpMultiplier: 10, enemyAttackMultiplier: 2.5, enemyMoveSpeedMultiplier: 1.15 },
    bossModifiers: { hpMultiplier: 8, attackMultiplier: 1.05, stompCadenceMultiplier: 0.68 },
    enemyUpgrades: { equipment: { weapon: 5, armor: 5, boots: 5 } }, waves: [],
    firstClearReward: { label: '폭풍 정령 계약', description: '지형 증폭이 제거된 기본 폭풍 정령을 전투에 편성할 수 있습니다.', icon: '✦', unitId: 'spirit' },
  },
  {
    id: 103, name: '심연의 마염수', subtitle: '마왕성 아래 균열에서 가장 강한 악마수를 굴복시키세요.', reward: 1_800,
    enemyCastleHp: 0, fortressDistance: MAX_FORTRESS_DISTANCE, challenge: true, requiredCampaignStage: 30, boss: true, bossName: '종말의 마염견', bossUnitId: 'hellhound', enemyFaction: 'demons',
    terrain: { id: 'abyss-rift', name: '심연의 균열', description: '마계의 불길이 적의 체력을 10배, 공격력을 2.5배, 이동속도를 1.2배로 만듭니다.', enemyHpMultiplier: 10, enemyAttackMultiplier: 2.5, enemyMoveSpeedMultiplier: 1.2 },
    bossModifiers: { hpMultiplier: 12, attackMultiplier: 1.05, stompCadenceMultiplier: 0.56 },
    enemyUpgrades: { equipment: { weapon: 5, armor: 5, boots: 5 } }, waves: [],
    firstClearReward: { label: '마염견 복종', description: '지형 증폭이 제거된 기본 마염견이 원정대에 합류합니다.', icon: '♠', unitId: 'hellhound' },
  },
  {
    id: 104, name: '태양 감옥의 이프리트', subtitle: '불타는 공중 영역에서 고대 화염 악마 이프리트를 굴복시키세요.', reward: 2_400,
    enemyCastleHp: 0, fortressDistance: MAX_FORTRESS_DISTANCE, challenge: true, requiredCampaignStage: 30, boss: true, bossName: '태양 포식자 이프리트', bossUnitId: 'ifrit', enemyFaction: 'demons',
    terrain: { id: 'sun-prison', name: '태양 감옥', description: '끝없는 열기가 적의 체력을 10배, 공격력을 2.5배, 이동속도를 1.1배로 만듭니다.', enemyHpMultiplier: 10, enemyAttackMultiplier: 2.5, enemyMoveSpeedMultiplier: 1.1 },
    bossModifiers: { hpMultiplier: 1.5, attackMultiplier: 1, stompCadenceMultiplier: 0.52 },
    enemyUpgrades: { equipment: { weapon: 5, armor: 5, boots: 5 } }, waves: [],
    firstClearReward: { label: '이프리트의 계약', description: '지형 증폭이 제거된 기본 이프리트를 전투에 편성할 수 있습니다.', icon: '✹', unitId: 'ifrit' },
  },
  {
    id: 105, name: '창공의 고룡', subtitle: '마왕성 너머 하늘 왕좌에서 마지막 초월자의 힘을 증명하세요.', reward: 3_000,
    enemyCastleHp: 0, fortressDistance: MAX_FORTRESS_DISTANCE, challenge: true, requiredCampaignStage: 30, boss: true, bossName: '하늘 왕좌의 고룡', bossUnitId: 'dragon', enemyFaction: 'monsters',
    terrain: { id: 'sky-throne', name: '하늘 왕좌', description: '고공의 마력이 적의 체력을 10배, 공격력을 2.5배, 이동속도를 1.15배로 만듭니다.', enemyHpMultiplier: 10, enemyAttackMultiplier: 2.5, enemyMoveSpeedMultiplier: 1.15 },
    bossModifiers: { hpMultiplier: 1, attackMultiplier: 0.7, stompCadenceMultiplier: 0.48 },
    enemyUpgrades: { equipment: { weapon: 5, armor: 5, boots: 5 } }, waves: [],
    firstClearReward: { label: '창공의 맹약', description: '하늘 왕좌의 증폭이 제거된 기본 고룡이 원정대에 합류합니다.', icon: '🐉', unitId: 'dragon' },
  },
];

export const getStage = (id: number) => stages.find((stage) => stage.id === id)
  ?? challengeStages.find((stage) => stage.id === id)
  ?? stages[0];
