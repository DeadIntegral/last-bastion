import type { HeroDefinition, HeroId, TroopDefinition, UnitDefinition, UnitFamily, UnitGrade, UnitId } from '../types/game';

type TroopTemplate = Pick<UnitDefinition, 'name' | 'cost' | 'maxHp' | 'attackDamage' | 'icon' | 'color' | 'accent'>
  & Partial<Pick<UnitDefinition, 'defense' | 'attackRange' | 'minimumAttackRange' | 'attackIntervalMs' | 'attackWindupMs' | 'moveSpeed' | 'spawnCooldownMs' | 'size' | 'tags' | 'squadSize' | 'attackPattern' | 'equipmentCostBase' | 'equipmentGrowth' | 'recruitCost' | 'requiredFortressTier' | 'requiresEncounter' | 'recruitSource' | 'maxActivePerSide' | 'healingPower' | 'healingRange' | 'guardProtection'>>;

export const unitGradeLabels: Record<UnitGrade, string> = {
  1: '일반',
  2: '숙련',
  3: '정예',
  4: '전설',
  5: '초월',
};

export const unitGradeById: Record<UnitId, UnitGrade> = {
  militia: 1, guardian: 1, archer: 1, lancer: 1, raider: 1, bulwark: 2,
  cavalry: 2, crossbow: 1, brute: 3, griffin: 4, spirit: 3, hellhound: 3,
  swordsman: 1, pikeman: 1, scout: 1, priest: 2, mage: 2, archmage: 3, assassin: 2,
  goblinArcher: 1, goblinBomber: 1, orcBerserker: 2, orcShaman: 2, troll: 3,
  ogreMage: 3, wolfRider: 2, harpy: 2, minotaur: 3, wyvern: 3, slime: 1,
  basilisk: 3, fireSpirit: 2, iceSpirit: 2, earthSpirit: 3, lightSpirit: 3,
  darkSpirit: 3, direwolf: 2, giantEagle: 2, treant: 4, golem: 4, hydra: 4,
  imp: 1, succubus: 2, demonGuard: 3, demonMage: 3, gargoyle: 2, cerberus: 4,
  ifrit: 5, reaper: 4, abyssKnight: 4, dragon: 5,
};

export function unitGradeStars(grade: UnitGrade): string {
  return `${'★'.repeat(grade)}${'☆'.repeat(5 - grade)}`;
}

export const troopEquipmentCostBaseByGrade: Record<UnitGrade, number> = {
  1: 75,
  2: 100,
  3: 200,
  4: 300,
  5: 400,
};

function makeTroop(id: UnitId, template: TroopTemplate): TroopDefinition {
  const moveSpeed = template.moveSpeed ?? 42;
  const tags = template.tags ?? ['ground'];
  const ranged = tags.includes('ranged');
  const magic = tags.includes('magic');
  const large = tags.includes('large');
  const charge = tags.includes('charge');
  const attackRange = template.attackRange ?? 38;
  const attackWindupMs = template.attackWindupMs
    ?? (charge ? 190 : ranged && magic ? large ? 720 : 520 : ranged ? 340 : large ? 560 : template.attackPattern?.kind === 'cleave' ? 420 : 240);
  const minimumAttackRange = template.minimumAttackRange
    ?? (ranged && attackRange >= 120 ? magic ? 65 : 45 : 0);
  return {
    id,
    grade: unitGradeById[id],
    defense: 0,
    attackRange,
    minimumAttackRange,
    attackIntervalMs: 1_100,
    attackWindupMs,
    moveSpeed,
    spawnCooldownMs: 3_500,
    size: 19,
    tags,
    squadSize: 1,
    attackPattern: { kind: 'single' },
    equipmentCostBase: troopEquipmentCostBaseByGrade[unitGradeById[id]],
    equipmentGrowth: {
      attack: Math.max(2, Math.round(template.attackDamage * 0.1)),
      hp: Math.max(12, Math.round(template.maxHp * 0.1)),
      defense: template.defense ? 1.5 : 1,
      moveSpeed: Math.max(1, Math.round(moveSpeed * 0.03 * 10) / 10),
    },
    recruitCost: template.cost * 5,
    requiredFortressTier: template.cost >= 110 ? 3 : 2,
    requiresEncounter: true,
    ...template,
  };
}

export const troopDefinitions: Record<UnitId, TroopDefinition> = {
  militia: {
    id: 'militia', name: '민병대', cost: 45, maxHp: 105, attackDamage: 17,
    attackRange: 34, minimumAttackRange: 0, attackIntervalMs: 820, attackWindupMs: 180, moveSpeed: 54, spawnCooldownMs: 2000,
    color: 0x4b9fe8, accent: 0xdcefff, size: 17, tags: ['ground'], icon: '⚔', squadSize: 3, attackPattern: { kind: 'single' }, equipmentCostBase: 50, equipmentGrowth: { attack: 2, hp: 18, defense: 1.2, moveSpeed: 2 }, recruitCost: 0, grade: unitGradeById.militia,
  },
  guardian: {
    id: 'guardian', name: '방패병', cost: 70, maxHp: 285, attackDamage: 11,
    attackRange: 32, minimumAttackRange: 0, attackIntervalMs: 1050, attackWindupMs: 360, moveSpeed: 34, spawnCooldownMs: 3000,
    color: 0x476985, accent: 0xaed0e8, size: 21, tags: ['ground', 'armored'], icon: '◆', squadSize: 2, attackPattern: { kind: 'single' }, guardProtection: { stopsPierce: true, rearRangeMultiplier: 0.35, protectedDomains: ['ground'] }, equipmentCostBase: 75, equipmentGrowth: { attack: 2, hp: 35, defense: 2, moveSpeed: 1.5 }, recruitCost: 0, grade: unitGradeById.guardian,
  },
  archer: {
    id: 'archer', name: '궁수', cost: 75, maxHp: 72, attackDamage: 22,
    attackRange: 215, minimumAttackRange: 55, attackIntervalMs: 1180, attackWindupMs: 320, moveSpeed: 42, spawnCooldownMs: 3200,
    color: 0x59b58b, accent: 0xd8ffe9, size: 16, tags: ['ground', 'ranged'], icon: '➶', squadSize: 2, attackPattern: { kind: 'single' }, equipmentCostBase: 75, equipmentGrowth: { attack: 4, hp: 14, defense: 1, moveSpeed: 1.5 }, recruitCost: 250, grade: unitGradeById.archer,
  },
  lancer: {
    id: 'lancer', name: '창병', cost: 80, maxHp: 165, attackDamage: 31,
    attackRange: 62, minimumAttackRange: 0, attackIntervalMs: 1100, attackWindupMs: 260, moveSpeed: 47, spawnCooldownMs: 2800,
    color: 0xd6a84b, accent: 0xffe5a6, size: 18, tags: ['ground', 'anti-large'], icon: '♢', squadSize: 1, attackPattern: { kind: 'pierce', maxTargets: 2, followThroughRange: 72, secondaryDamageMultiplier: 0.85 }, equipmentCostBase: 75, equipmentGrowth: { attack: 4, hp: 24, defense: 1.2, moveSpeed: 1.8 }, recruitCost: 350, grade: unitGradeById.lancer,
  },
  raider: {
    id: 'raider', name: '고블린 약탈병', cost: 50, maxHp: 90, attackDamage: 14,
    attackRange: 34, minimumAttackRange: 0, attackIntervalMs: 900, attackWindupMs: 160, moveSpeed: 43, spawnCooldownMs: 2200,
    color: 0xd45454, accent: 0xffd0c7, size: 17, tags: ['ground'], icon: '⚔', squadSize: 3, attackPattern: { kind: 'single' }, equipmentCostBase: 50, equipmentGrowth: { attack: 2, hp: 17, defense: 1, moveSpeed: 2 }, recruitCost: 200, requiredFortressTier: 2, grade: unitGradeById.raider,
  },
  bulwark: {
    id: 'bulwark', name: '오크 철갑병', cost: 90, maxHp: 390, defense: 5, attackDamage: 22,
    attackRange: 42, minimumAttackRange: 0, attackIntervalMs: 1250, attackWindupMs: 520, moveSpeed: 28, spawnCooldownMs: 3400,
    color: 0x804e59, accent: 0xe4a4a4, size: 22, tags: ['ground', 'armored'], icon: '◆', squadSize: 1, attackPattern: { kind: 'cleave', secondaryDamageMultiplier: 0.7 }, guardProtection: { stopsPierce: true, rearRangeMultiplier: 0.25, protectedDomains: ['ground'] }, equipmentCostBase: 100, equipmentGrowth: { attack: 3, hp: 38, defense: 2.2, moveSpeed: 1.2 }, recruitCost: 350, requiredFortressTier: 2, grade: unitGradeById.bulwark,
  },
  cavalry: {
    id: 'cavalry', name: '왕립 기마병', cost: 120, maxHp: 250, defense: 3, attackDamage: 40,
    attackRange: 40, minimumAttackRange: 0, attackIntervalMs: 1050, attackWindupMs: 230, moveSpeed: 82, spawnCooldownMs: 3900,
    color: 0x647bb4, accent: 0xe4ecff, size: 24, tags: ['ground', 'mounted', 'charge'], icon: '♞', squadSize: 1, attackPattern: { kind: 'pierce', maxTargets: 2, followThroughRange: 76, secondaryDamageMultiplier: 0.8 }, equipmentCostBase: 100, equipmentGrowth: { attack: 5, hp: 30, defense: 1.4, moveSpeed: 2.4 }, recruitCost: 700, requiredFortressTier: 2, requiresEncounter: false, grade: unitGradeById.cavalry,
  },
  crossbow: {
    id: 'crossbow', name: '석궁병', cost: 85, maxHp: 115, attackDamage: 36,
    attackRange: 160, minimumAttackRange: 75, attackIntervalMs: 1450, attackWindupMs: 650, moveSpeed: 36, spawnCooldownMs: 3000,
    color: 0xac525e, accent: 0xffbbc2, size: 16, tags: ['ground', 'ranged'], icon: '➶', squadSize: 1, attackPattern: { kind: 'pierce', maxTargets: 2, followThroughRange: 120, secondaryDamageMultiplier: 0.75 }, equipmentCostBase: 75, equipmentGrowth: { attack: 4, hp: 13, defense: 1, moveSpeed: 1.4 }, recruitCost: 400, requiredFortressTier: 3, grade: unitGradeById.crossbow,
  },
  brute: {
    id: 'brute', name: '오우거 파쇄자', cost: 170, maxHp: 900, defense: 4, attackDamage: 65,
    attackRange: 52, minimumAttackRange: 0, attackIntervalMs: 1500, attackWindupMs: 680, moveSpeed: 25, spawnCooldownMs: 4300,
    color: 0x923d32, accent: 0xf6a17b, size: 27, tags: ['ground', 'large'], icon: '●', squadSize: 1, attackPattern: { kind: 'cleave', secondaryDamageMultiplier: 0.8 }, equipmentCostBase: 200, equipmentGrowth: { attack: 7, hp: 90, defense: 2, moveSpeed: 1 }, recruitCost: 0, requiredFortressTier: 3, recruitSource: 'challenge', maxActivePerSide: 3, grade: unitGradeById.brute,
  },
  griffin: {
    id: 'griffin', name: '그리폰 기수', cost: 200, maxHp: 1600, defense: 8, attackDamage: 150,
    attackRange: 58, minimumAttackRange: 0, attackIntervalMs: 1050, attackWindupMs: 260, moveSpeed: 78, spawnCooldownMs: 6500,
    color: 0xa477b8, accent: 0xf5dcff, size: 27, tags: ['flying', 'large'], icon: '♜', squadSize: 1, attackPattern: { kind: 'cleave', secondaryDamageMultiplier: 0.85 }, equipmentCostBase: 300, equipmentGrowth: { attack: 15, hp: 160, defense: 2, moveSpeed: 2.2 }, recruitCost: 1500, requiredFortressTier: 3, requiresEncounter: false, maxActivePerSide: 2, grade: unitGradeById.griffin,
  },
  spirit: {
    id: 'spirit', name: '폭풍 정령', cost: 155, maxHp: 600, defense: 3, attackDamage: 55,
    attackRange: 185, minimumAttackRange: 50, attackIntervalMs: 1_150, attackWindupMs: 430, moveSpeed: 58, spawnCooldownMs: 4_500,
    color: 0x6fbad4, accent: 0xe8fbff, size: 20, tags: ['flying', 'ranged', 'elemental'], icon: '✦', squadSize: 1,
    attackPattern: { kind: 'pierce', maxTargets: 2, followThroughRange: 105, secondaryDamageMultiplier: 0.7 },
    equipmentCostBase: 200, equipmentGrowth: { attack: 6, hp: 60, defense: 1.2, moveSpeed: 2 }, recruitCost: 0, requiredFortressTier: 3, recruitSource: 'challenge', maxActivePerSide: 3, grade: unitGradeById.spirit,
  },
  hellhound: {
    id: 'hellhound', name: '마염견', cost: 170, maxHp: 850, defense: 4, attackDamage: 70,
    attackRange: 46, minimumAttackRange: 0, attackIntervalMs: 900, attackWindupMs: 180, moveSpeed: 76, spawnCooldownMs: 4_800,
    color: 0x8d3540, accent: 0xff9b57, size: 23, tags: ['ground', 'large', 'demon', 'charge'], icon: '♠', squadSize: 1,
    attackPattern: { kind: 'cleave', secondaryDamageMultiplier: 0.65 },
    equipmentCostBase: 200, equipmentGrowth: { attack: 7, hp: 85, defense: 1.5, moveSpeed: 2.2 }, recruitCost: 0, requiredFortressTier: 3, recruitSource: 'challenge', maxActivePerSide: 3, grade: unitGradeById.hellhound,
  },
  swordsman: makeTroop('swordsman', { name: '왕국 검병', cost: 75, maxHp: 180, defense: 2, attackDamage: 28, attackRange: 38, attackIntervalMs: 950, attackWindupMs: 220, moveSpeed: 48, spawnCooldownMs: 2_900, squadSize: 2, icon: '⚔', color: 0x527eae, accent: 0xd8ecff }),
  pikeman: makeTroop('pikeman', { name: '장창병', cost: 95, maxHp: 195, defense: 1, attackDamage: 35, attackRange: 72, attackIntervalMs: 1_200, attackWindupMs: 340, moveSpeed: 40, tags: ['ground', 'anti-large'], attackPattern: { kind: 'pierce', maxTargets: 2, followThroughRange: 82, secondaryDamageMultiplier: 0.8 }, icon: '♢', color: 0xb89745, accent: 0xffe7a1 }),
  scout: makeTroop('scout', { name: '변경 척후병', cost: 65, maxHp: 82, attackDamage: 18, attackRange: 200, minimumAttackRange: 40, attackIntervalMs: 900, attackWindupMs: 240, moveSpeed: 68, squadSize: 2, tags: ['ground', 'ranged'], icon: '➶', color: 0x4e9f78, accent: 0xd8ffe9 }),
  priest: makeTroop('priest', { name: '전장 사제', cost: 105, maxHp: 145, defense: 1, attackDamage: 20, attackRange: 175, minimumAttackRange: 55, attackIntervalMs: 1_250, attackWindupMs: 450, moveSpeed: 36, tags: ['ground', 'ranged', 'holy', 'support'], healingPower: 34, healingRange: 190, icon: '✚', color: 0xd6c78b, accent: 0xfff7d1 }),
  mage: makeTroop('mage', { name: '왕국 마법사', cost: 115, maxHp: 110, attackDamage: 36, attackRange: 195, minimumAttackRange: 65, attackIntervalMs: 1_300, attackWindupMs: 520, moveSpeed: 37, tags: ['ground', 'ranged', 'magic'], attackPattern: { kind: 'groundBurst', radius: 72, secondaryDamageMultiplier: 0.7, targetDomain: 'ground', telegraphMs: 520 }, icon: '✧', color: 0x6d69b8, accent: 0xe2dfff }),
  archmage: makeTroop('archmage', { name: '대마법사', cost: 190, maxHp: 700, defense: 4, attackDamage: 110, attackRange: 245, minimumAttackRange: 100, attackIntervalMs: 1_600, attackWindupMs: 780, moveSpeed: 31, spawnCooldownMs: 5_500, tags: ['ground', 'ranged', 'magic'], attackPattern: { kind: 'directional', length: 245, secondaryDamageMultiplier: 0.7, targetDomain: 'all' }, icon: '✺', color: 0x574f9e, accent: 0xf0dcff }),
  assassin: makeTroop('assassin', { name: '그림자 암살자', cost: 110, maxHp: 120, attackDamage: 51, attackRange: 30, attackIntervalMs: 780, attackWindupMs: 120, moveSpeed: 74, spawnCooldownMs: 4_100, tags: ['ground', 'charge'], icon: '†', color: 0x3f4455, accent: 0xc8cee5 }),
  goblinArcher: makeTroop('goblinArcher', { name: '고블린 독궁수', cost: 65, maxHp: 70, attackDamage: 21, attackRange: 180, attackIntervalMs: 1_000, moveSpeed: 49, squadSize: 2, tags: ['ground', 'ranged'], icon: '➹', color: 0x668b3d, accent: 0xd9efa8 }),
  goblinBomber: makeTroop('goblinBomber', { name: '고블린 폭탄병', cost: 90, maxHp: 78, attackDamage: 38, attackRange: 145, minimumAttackRange: 80, attackIntervalMs: 1_600, attackWindupMs: 720, moveSpeed: 44, squadSize: 2, tags: ['ground', 'ranged'], attackPattern: { kind: 'splash', radius: 82, secondaryDamageMultiplier: 0.8, targetDomain: 'ground' }, icon: '●', color: 0x7c7139, accent: 0xffdb69 }),
  orcBerserker: makeTroop('orcBerserker', { name: '오크 광전사', cost: 105, maxHp: 260, defense: 1, attackDamage: 44, attackRange: 44, attackIntervalMs: 850, moveSpeed: 52, tags: ['ground', 'large'], attackPattern: { kind: 'cleave', secondaryDamageMultiplier: 0.65 }, icon: '⚒', color: 0x60773c, accent: 0xd3e58b }),
  orcShaman: makeTroop('orcShaman', { name: '오크 주술사', cost: 125, maxHp: 150, attackDamage: 40, attackRange: 185, minimumAttackRange: 65, attackIntervalMs: 1_350, attackWindupMs: 520, moveSpeed: 34, tags: ['ground', 'ranged', 'magic'], attackPattern: { kind: 'groundBurst', radius: 78, secondaryDamageMultiplier: 0.65, targetDomain: 'ground', telegraphMs: 520 }, icon: '☽', color: 0x55705b, accent: 0xaef2be }),
  troll: makeTroop('troll', { name: '트롤', cost: 170, maxHp: 1200, defense: 6, attackDamage: 75, attackRange: 50, attackIntervalMs: 1_400, moveSpeed: 27, spawnCooldownMs: 5_000, size: 28, tags: ['ground', 'large'], attackPattern: { kind: 'cleave', secondaryDamageMultiplier: 0.75 }, icon: '♣', color: 0x58704b, accent: 0xc0dda8, maxActivePerSide: 3 }),
  ogreMage: makeTroop('ogreMage', { name: '오우거 마도사', cost: 185, maxHp: 900, defense: 4, attackDamage: 100, attackRange: 170, minimumAttackRange: 75, attackIntervalMs: 1_500, attackWindupMs: 720, moveSpeed: 25, spawnCooldownMs: 5_200, size: 27, tags: ['ground', 'large', 'ranged', 'magic'], attackPattern: { kind: 'groundBurst', radius: 95, secondaryDamageMultiplier: 0.7, targetDomain: 'ground', telegraphMs: 720 }, icon: '✹', color: 0x755b47, accent: 0xf6c796, maxActivePerSide: 3 }),
  wolfRider: makeTroop('wolfRider', { name: '고블린 늑대기수', cost: 115, maxHp: 190, defense: 1, attackDamage: 36, attackRange: 38, attackIntervalMs: 900, moveSpeed: 88, tags: ['ground', 'mounted', 'charge'], attackPattern: { kind: 'pierce', maxTargets: 2, followThroughRange: 68, secondaryDamageMultiplier: 0.65 }, icon: '♞', color: 0x725744, accent: 0xe3c39e }),
  harpy: makeTroop('harpy', { name: '하피', cost: 105, maxHp: 105, attackDamage: 29, attackRange: 42, attackIntervalMs: 800, moveSpeed: 78, tags: ['flying'], attackPattern: { kind: 'cleave', secondaryDamageMultiplier: 0.55 }, icon: '⌁', color: 0x8e6f9b, accent: 0xf0d5fa }),
  minotaur: makeTroop('minotaur', { name: '미노타우로스', cost: 190, maxHp: 1350, defense: 6, attackDamage: 95, attackRange: 52, attackIntervalMs: 1_400, moveSpeed: 38, spawnCooldownMs: 5_400, size: 29, tags: ['ground', 'large', 'charge'], attackPattern: { kind: 'cleave', secondaryDamageMultiplier: 0.85 }, icon: '♉', color: 0x6e493b, accent: 0xe8b78a, maxActivePerSide: 2 }),
  wyvern: makeTroop('wyvern', { name: '와이번', cost: 190, maxHp: 1050, defense: 4, attackDamage: 88, attackRange: 72, attackIntervalMs: 1_100, moveSpeed: 76, spawnCooldownMs: 5_800, size: 26, tags: ['flying', 'large'], attackPattern: { kind: 'pierce', maxTargets: 2, followThroughRange: 88, secondaryDamageMultiplier: 0.8 }, icon: '⌁', color: 0x6d5a91, accent: 0xdacaff, maxActivePerSide: 2 }),
  slime: makeTroop('slime', { name: '산성 슬라임', cost: 55, maxHp: 125, attackDamage: 16, attackRange: 30, attackIntervalMs: 950, moveSpeed: 31, squadSize: 3, tags: ['ground', 'elemental'], icon: '●', color: 0x62a953, accent: 0xd8ffc8 }),
  basilisk: makeTroop('basilisk', { name: '바실리스크', cost: 180, maxHp: 1200, defense: 8, attackDamage: 90, attackRange: 105, attackIntervalMs: 1_250, moveSpeed: 35, size: 25, tags: ['ground', 'large', 'ranged'], attackPattern: { kind: 'pierce', maxTargets: 2, followThroughRange: 90, secondaryDamageMultiplier: 0.7 }, icon: '◈', color: 0x687842, accent: 0xdbe694, maxActivePerSide: 2 }),
  fireSpirit: makeTroop('fireSpirit', { name: '화염 정령', cost: 100, maxHp: 95, attackDamage: 38, attackRange: 165, minimumAttackRange: 50, attackIntervalMs: 1_050, attackWindupMs: 430, moveSpeed: 55, tags: ['flying', 'ranged', 'elemental', 'magic'], attackPattern: { kind: 'splash', radius: 68, secondaryDamageMultiplier: 0.6, targetDomain: 'all' }, icon: '✹', color: 0xd85d3f, accent: 0xffc06a }),
  iceSpirit: makeTroop('iceSpirit', { name: '서리 정령', cost: 105, maxHp: 125, defense: 2, attackDamage: 30, attackRange: 180, attackIntervalMs: 1_200, moveSpeed: 49, tags: ['flying', 'ranged', 'elemental', 'magic'], icon: '❄', color: 0x6faac4, accent: 0xe8fbff }),
  earthSpirit: makeTroop('earthSpirit', { name: '대지 정령', cost: 165, maxHp: 1150, defense: 9, attackDamage: 60, attackRange: 40, attackIntervalMs: 1_350, moveSpeed: 24, size: 25, tags: ['ground', 'elemental', 'armored'], attackPattern: { kind: 'cleave', secondaryDamageMultiplier: 0.7 }, guardProtection: { stopsPierce: true, rearRangeMultiplier: 0.4, protectedDomains: ['ground'] }, icon: '◆', color: 0x7d6846, accent: 0xe2c88f, maxActivePerSide: 3 }),
  lightSpirit: makeTroop('lightSpirit', { name: '광휘 정령', cost: 170, maxHp: 650, defense: 3, attackDamage: 75, attackRange: 205, attackIntervalMs: 1_250, moveSpeed: 55, tags: ['flying', 'ranged', 'elemental', 'holy'], attackPattern: { kind: 'pierce', maxTargets: 3, followThroughRange: 120, secondaryDamageMultiplier: 0.6 }, icon: '☼', color: 0xe0c96b, accent: 0xfff8c7, maxActivePerSide: 3 }),
  darkSpirit: makeTroop('darkSpirit', { name: '그림자 정령', cost: 170, maxHp: 650, defense: 3, attackDamage: 80, attackRange: 190, attackIntervalMs: 1_100, moveSpeed: 60, tags: ['flying', 'ranged', 'elemental', 'magic'], attackPattern: { kind: 'pierce', maxTargets: 2, followThroughRange: 115, secondaryDamageMultiplier: 0.85 }, icon: '☾', color: 0x514566, accent: 0xcdb7e8, maxActivePerSide: 3 }),
  direwolf: makeTroop('direwolf', { name: '다이어울프', cost: 85, maxHp: 155, attackDamage: 31, attackRange: 32, attackIntervalMs: 800, moveSpeed: 82, squadSize: 2, tags: ['ground', 'beast', 'charge'], icon: '♠', color: 0x58606b, accent: 0xd7e0e8, recruitCost: 0, recruitSource: 'challenge' }),
  giantEagle: makeTroop('giantEagle', { name: '거대 독수리', cost: 120, maxHp: 145, attackDamage: 34, attackRange: 38, attackIntervalMs: 850, moveSpeed: 92, tags: ['flying', 'large', 'beast'], attackPattern: { kind: 'cleave', secondaryDamageMultiplier: 0.6 }, icon: '⌃', color: 0x9a814e, accent: 0xffe4a8, maxActivePerSide: 3 }),
  treant: makeTroop('treant', { name: '고대 트렌트', cost: 190, maxHp: 1900, defense: 8, attackDamage: 90, attackRange: 58, attackIntervalMs: 1_600, moveSpeed: 19, spawnCooldownMs: 5_800, size: 30, tags: ['ground', 'large', 'elemental'], attackPattern: { kind: 'cleave', secondaryDamageMultiplier: 0.9 }, icon: '♣', color: 0x526c43, accent: 0xb9d89d, maxActivePerSide: 2 }),
  golem: makeTroop('golem', { name: '룬 골렘', cost: 200, maxHp: 2300, defense: 12, attackDamage: 110, attackRange: 46, attackIntervalMs: 1_650, moveSpeed: 17, spawnCooldownMs: 6_200, size: 31, tags: ['ground', 'large', 'elemental', 'armored'], attackPattern: { kind: 'cleave', secondaryDamageMultiplier: 0.85 }, guardProtection: { stopsPierce: true, rearRangeMultiplier: 0.15, protectedDomains: ['ground'] }, icon: '▣', color: 0x737681, accent: 0xd5e2ef, recruitCost: 0, recruitSource: 'challenge', maxActivePerSide: 2 }),
  hydra: makeTroop('hydra', { name: '늪지 히드라', cost: 200, maxHp: 2100, defense: 7, attackDamage: 115, attackRange: 75, attackIntervalMs: 1_450, moveSpeed: 22, spawnCooldownMs: 6_500, size: 32, tags: ['ground', 'large', 'beast'], attackPattern: { kind: 'cleave', secondaryDamageMultiplier: 0.95 }, icon: '♜', color: 0x477058, accent: 0xaee3bf, maxActivePerSide: 2 }),
  imp: makeTroop('imp', { name: '임프', cost: 60, maxHp: 68, attackDamage: 20, attackRange: 120, attackIntervalMs: 850, moveSpeed: 64, squadSize: 3, tags: ['flying', 'ranged', 'demon'], icon: '♠', color: 0x94495b, accent: 0xffa5b5 }),
  succubus: makeTroop('succubus', { name: '서큐버스', cost: 135, maxHp: 145, defense: 1, attackDamage: 43, attackRange: 185, attackIntervalMs: 1_100, moveSpeed: 59, tags: ['flying', 'ranged', 'demon', 'magic'], attackPattern: { kind: 'pierce', maxTargets: 2, followThroughRange: 100, secondaryDamageMultiplier: 0.75 }, icon: '♥', color: 0x9d466e, accent: 0xffbad6 }),
  demonGuard: makeTroop('demonGuard', { name: '악마 근위병', cost: 175, maxHp: 1300, defense: 10, attackDamage: 75, attackRange: 44, attackIntervalMs: 1_200, moveSpeed: 30, tags: ['ground', 'demon', 'armored'], attackPattern: { kind: 'cleave', secondaryDamageMultiplier: 0.75 }, guardProtection: { stopsPierce: true, rearRangeMultiplier: 0.25, protectedDomains: ['ground'] }, icon: '◆', color: 0x663746, accent: 0xe99aaf }),
  demonMage: makeTroop('demonMage', { name: '심연 마도사', cost: 185, maxHp: 750, defense: 4, attackDamage: 95, attackRange: 210, minimumAttackRange: 75, attackIntervalMs: 1_450, attackWindupMs: 620, moveSpeed: 33, tags: ['ground', 'ranged', 'demon', 'magic'], attackPattern: { kind: 'groundBurst', radius: 88, secondaryDamageMultiplier: 0.65, targetDomain: 'ground', telegraphMs: 620 }, icon: '☿', color: 0x563366, accent: 0xdba8ef }),
  gargoyle: makeTroop('gargoyle', { name: '가고일', cost: 145, maxHp: 310, defense: 6, attackDamage: 38, attackRange: 36, attackIntervalMs: 1_050, moveSpeed: 60, tags: ['flying', 'demon', 'armored'], attackPattern: { kind: 'cleave', secondaryDamageMultiplier: 0.7 }, icon: '◆', color: 0x66616f, accent: 0xd8d0e3, maxActivePerSide: 3 }),
  cerberus: makeTroop('cerberus', { name: '케르베로스', cost: 200, maxHp: 1600, defense: 6, attackDamage: 110, attackRange: 55, attackIntervalMs: 950, moveSpeed: 68, spawnCooldownMs: 5_700, size: 28, tags: ['ground', 'large', 'demon', 'charge'], attackPattern: { kind: 'cleave', secondaryDamageMultiplier: 0.9 }, icon: '♠', color: 0x71343c, accent: 0xf39467, maxActivePerSide: 2 }),
  ifrit: makeTroop('ifrit', { name: '이프리트', cost: 200, maxHp: 11000, defense: 8, attackDamage: 140, attackRange: 215, minimumAttackRange: 100, attackIntervalMs: 1_650, attackWindupMs: 850, moveSpeed: 42, spawnCooldownMs: 6_600, size: 29, tags: ['flying', 'large', 'demon', 'elemental', 'ranged', 'magic'], attackPattern: { kind: 'pierce', maxTargets: 3, followThroughRange: 150, secondaryDamageMultiplier: 0.75 }, icon: '✹', color: 0xc44831, accent: 0xffd06a, recruitCost: 0, recruitSource: 'challenge', maxActivePerSide: 2 }),
  reaper: makeTroop('reaper', { name: '영혼 수확자', cost: 200, maxHp: 1200, defense: 6, attackDamage: 125, attackRange: 64, attackIntervalMs: 1_350, moveSpeed: 47, spawnCooldownMs: 6_100, tags: ['ground', 'demon', 'magic'], attackPattern: { kind: 'cleave', secondaryDamageMultiplier: 0.9 }, icon: '☠', color: 0x3d3b4c, accent: 0xc9c3e8 }),
  abyssKnight: makeTroop('abyssKnight', { name: '심연 기사', cost: 200, maxHp: 1900, defense: 12, attackDamage: 115, attackRange: 48, attackIntervalMs: 1_250, moveSpeed: 34, spawnCooldownMs: 6_300, size: 27, tags: ['ground', 'demon', 'armored'], attackPattern: { kind: 'cleave', secondaryDamageMultiplier: 0.85 }, guardProtection: { stopsPierce: true, rearRangeMultiplier: 0.2, protectedDomains: ['ground'] }, icon: '♞', color: 0x44364f, accent: 0xbda8d1 }),
  dragon: makeTroop('dragon', { name: '창공의 고룡', cost: 200, maxHp: 15_000, defense: 12, attackDamage: 240, attackRange: 250, minimumAttackRange: 120, attackIntervalMs: 1_900, attackWindupMs: 1_100, moveSpeed: 36, spawnCooldownMs: 9_000, size: 34, tags: ['flying', 'large', 'beast', 'ranged', 'magic'], attackPattern: { kind: 'pierce', maxTargets: 3, followThroughRange: 180, secondaryDamageMultiplier: 0.8 }, icon: '🐉', color: 0x293656, accent: 0xd7b26a, recruitCost: 0, recruitSource: 'challenge', maxActivePerSide: 1 }),
};

export const heroDefinitions: Record<HeroId, HeroDefinition> = {
  warden: {
    id: 'warden', name: '에드릭', title: '철벽의 기사', cost: 0, maxHp: 520, attackDamage: 29,
    attackRange: 42, minimumAttackRange: 0, attackIntervalMs: 900, attackWindupMs: 300, moveSpeed: 40, spawnCooldownMs: 0,
    color: 0x43b6df, accent: 0xffffff, size: 28, tags: ['ground', 'hero', 'armored'], icon: '♛', squadSize: 1, attackPattern: { kind: 'cleave', secondaryDamageMultiplier: 0.7 }, guardProtection: { stopsPierce: true, rearRangeMultiplier: 0.3, protectedDomains: ['ground'] }, equipmentCostBase: 100, equipmentGrowth: { attack: 3, hp: 42, defense: 2, moveSpeed: 1.2 },
    description: '전열의 중심에서 병사들을 끝까지 지켜내는 왕실 기사입니다.',
    passiveName: '철벽의 맹세', passiveDescription: '관통 공격을 차단하고 후방 지상 파동을 70% 감쇠시키며, 주변 아군이 받는 피해가 15% 감소합니다.',
    skillName: '수호의 결계', skillDescription: '주변 모든 아군에게 기본 100의 보호막을 부여하며 숙련에 따라 강화됩니다.',
    skillCooldownMs: 25_000, respawnMs: 20_000, unlockCost: 0,
  },
  pyromancer: {
    id: 'pyromancer', name: '셀레네', title: '잿불 마녀', cost: 0, maxHp: 285, attackDamage: 43,
    attackRange: 190, minimumAttackRange: 60, attackIntervalMs: 1250, attackWindupMs: 550, moveSpeed: 37, spawnCooldownMs: 0,
    color: 0xcc5948, accent: 0xffc078, size: 25, tags: ['ground', 'hero', 'ranged'], icon: '✹', squadSize: 1, attackPattern: { kind: 'splash', radius: 82, secondaryDamageMultiplier: 0.35, targetDomain: 'all' }, equipmentCostBase: 125, equipmentGrowth: { attack: 5, hp: 24, defense: 1, moveSpeed: 1.4 },
    description: '꺼지지 않는 불꽃을 다루며 밀집한 적을 태우는 전장 마도사입니다.',
    passiveName: '불씨 전이', passiveDescription: '기본 공격이 대상 주변에도 35% 피해를 줍니다.',
    skillName: '잿불 유성', skillDescription: '가장 가까운 적진에 기본 240 피해의 유성을 떨어뜨리며 숙련에 따라 강화됩니다.',
    skillCooldownMs: 22_000, respawnMs: 18_000, unlockCost: 500,
  },
  huntress: {
    id: 'huntress', name: '리아', title: '마수 사냥꾼', cost: 0, maxHp: 350, attackDamage: 48,
    attackRange: 230, minimumAttackRange: 55, attackIntervalMs: 1050, attackWindupMs: 320, moveSpeed: 47, spawnCooldownMs: 0,
    color: 0x5d9d6f, accent: 0xe3f5b1, size: 25, tags: ['ground', 'hero', 'ranged', 'anti-large'], icon: '➹', squadSize: 1, attackPattern: { kind: 'pierce', maxTargets: 3, followThroughRange: 145, secondaryDamageMultiplier: 0.8 }, equipmentCostBase: 125, equipmentGrowth: { attack: 5, hp: 28, defense: 1.2, moveSpeed: 1.8 },
    description: '거대한 적의 약점을 노리고 전장을 빠르게 누비는 사냥꾼입니다.',
    passiveName: '마수의 약점', passiveDescription: '대형 적과 보스에게 75% 추가 피해를 줍니다.',
    skillName: '천공의 화살비', skillDescription: '전장의 모든 적에게 기본 105 피해의 화살을 퍼부으며 숙련에 따라 강화됩니다.',
    skillCooldownMs: 24_000, respawnMs: 16_000, unlockCost: 800,
  },
  saint: {
    id: 'saint', name: '미레나', title: '새벽의 성녀', cost: 0, maxHp: 330, defense: 2, attackDamage: 24,
    attackRange: 185, minimumAttackRange: 50, attackIntervalMs: 1_200, attackWindupMs: 450, moveSpeed: 38, spawnCooldownMs: 0,
    color: 0xd8bd73, accent: 0xfff6ce, size: 25, tags: ['ground', 'hero', 'ranged', 'holy', 'support'], icon: '✚', squadSize: 1, attackPattern: { kind: 'single' }, equipmentCostBase: 125, equipmentGrowth: { attack: 4, hp: 30, defense: 1.4, moveSpeed: 1.4 }, healingPower: 58, healingRange: 215,
    description: '상처 입은 전열을 치유하고 무너진 진군을 다시 일으키는 왕국의 성녀입니다.',
    passiveName: '새벽의 손길', passiveDescription: '공격 범위 안에 부상자가 있으면 공격 대신 가장 크게 다친 아군을 회복시킵니다.',
    skillName: '여명의 기도', skillDescription: '주변 아군과 성채의 체력을 회복하며 숙련에 따라 치유량이 강화됩니다.',
    skillCooldownMs: 23_000, respawnMs: 17_000, unlockCost: 1_200,
  },
  marshal: {
    id: 'marshal', name: '브란', title: '해방군 기수', cost: 0, maxHp: 455, defense: 4, attackDamage: 39,
    attackRange: 46, minimumAttackRange: 0, attackIntervalMs: 950, attackWindupMs: 240, moveSpeed: 52, spawnCooldownMs: 0,
    color: 0x596fa1, accent: 0xe2eaff, size: 27, tags: ['ground', 'hero', 'armored', 'charge'], icon: '⚑', squadSize: 1, attackPattern: { kind: 'cleave', secondaryDamageMultiplier: 0.72 }, equipmentCostBase: 150, equipmentGrowth: { attack: 5, hp: 38, defense: 1.8, moveSpeed: 1.8 },
    description: '선두에서 해방군의 깃발을 들고 전열 전체의 진군을 이끄는 야전 지휘관입니다.',
    passiveName: '선봉의 깃발', passiveDescription: '첫 돌격 공격이 60% 강하며, 각성하면 주변 아군의 이동 속도를 높입니다.',
    skillName: '왕국의 진군', skillDescription: '주변 모든 아군에게 보호막을 부여하고 전열을 다시 정비합니다.',
    skillCooldownMs: 24_000, respawnMs: 19_000, unlockCost: 1_800,
  },
  orcChampion: {
    id: 'orcChampion', name: '카루크', title: '쇠사슬을 끊은 족장', cost: 0, maxHp: 720, defense: 8, attackDamage: 68,
    attackRange: 54, minimumAttackRange: 0, attackIntervalMs: 1_150, attackWindupMs: 550, moveSpeed: 40, spawnCooldownMs: 0,
    color: 0x6e8248, accent: 0xe2b06f, size: 31, tags: ['ground', 'hero', 'armored', 'large', 'charge'], icon: '⚒', squadSize: 1, attackPattern: { kind: 'cleave', secondaryDamageMultiplier: 0.85 }, equipmentCostBase: 175, equipmentGrowth: { attack: 7, hp: 55, defense: 2.3, moveSpeed: 1.3 },
    description: '마왕군의 쇠사슬을 끊고 부족의 생존을 위해 해방군 선봉에 선 오크 족장입니다.',
    passiveName: '해방자의 돌진', passiveDescription: '첫 공격이 60% 강하며 무거운 도끼가 근접 범위의 전열 전체를 공격합니다.',
    skillName: '대지의 포효', skillDescription: '주변 적을 강타하는 동시에 가까운 아군에게 보호막을 부여합니다.',
    skillCooldownMs: 26_000, respawnMs: 22_000, unlockCost: 2_500,
  },
  windSpirit: {
    id: 'windSpirit', name: '네리스', title: '해방된 바람 정령', cost: 0, maxHp: 420, defense: 3, attackDamage: 58,
    attackRange: 230, minimumAttackRange: 70, attackIntervalMs: 1_050, attackWindupMs: 500, moveSpeed: 72, spawnCooldownMs: 0,
    color: 0x62c9db, accent: 0xe9fbff, size: 27, tags: ['flying', 'hero', 'ranged', 'magic', 'elemental'], icon: '✧', squadSize: 1, attackPattern: { kind: 'pierce', maxTargets: 2, followThroughRange: 125, secondaryDamageMultiplier: 0.8 }, equipmentCostBase: 200, equipmentGrowth: { attack: 7, hp: 32, defense: 1.3, moveSpeed: 2.2 },
    description: '속박의 핵을 깨뜨린 뒤 스스로 해방군과 계약한 고대 바람 정령입니다.',
    passiveName: '자유의 기류', passiveDescription: '지상 공격을 받지 않는 공중 영웅이며 기본 공격이 적 두 명을 관통합니다.',
    skillName: '해방의 폭풍', skillDescription: '전방에 거대한 폭풍을 일으켜 지상과 공중의 적을 함께 휩쓸고 성채를 타격합니다.',
    skillCooldownMs: 21_000, respawnMs: 16_000, unlockCost: 4_000,
  },
};

export const heroOrder: HeroId[] = ['warden', 'pyromancer', 'huntress', 'saint', 'marshal', 'orcChampion', 'windSpirit'];

export const bossDefinition: UnitDefinition = {
  id: 'boss', name: '봉인된 마수', cost: 0, maxHp: 5200, attackDamage: 82,
  attackRange: 68, minimumAttackRange: 0, attackIntervalMs: 1500, attackWindupMs: 800, moveSpeed: 20, spawnCooldownMs: 0,
  color: 0x5b394f, accent: 0xf17f4c, size: 48, tags: ['ground', 'large', 'boss'], icon: '◉', squadSize: 1, attackPattern: { kind: 'cleave', secondaryDamageMultiplier: 1 }, equipmentCostBase: 0, equipmentGrowth: { attack: 6, hp: 70, defense: 2, moveSpeed: 0.8 },
};

export const bossCombatTuning = {
  phaseTwoHpRatio: 0.55,
  initialStompDelayMs: 3_600,
  phaseOneStompIntervalMs: 5_200,
  phaseTwoStompIntervalMs: 3_400,
  phaseOneStompDamageMultiplier: 1.05,
  phaseTwoStompDamageMultiplier: 1.55,
  stompRadius: 175,
  stompKnockback: 55,
  phaseTwoAttackIntervalMultiplier: 0.65,
  phaseTwoMoveSpeedMultiplier: 1.6,
} as const;

export const allTroopOrder: UnitId[] = Object.keys(troopDefinitions) as UnitId[];

const familyMembers: Record<UnitFamily, UnitId[]> = {
  kingdom: ['militia', 'guardian', 'archer', 'lancer', 'cavalry', 'swordsman', 'pikeman', 'scout', 'priest', 'mage', 'archmage'],
  betrayer: ['crossbow', 'assassin'],
  goblin: ['raider', 'goblinArcher', 'goblinBomber', 'wolfRider'],
  orc: ['bulwark', 'orcBerserker', 'orcShaman'],
  ogre: ['brute', 'ogreMage'],
  beast: ['griffin', 'troll', 'harpy', 'minotaur', 'wyvern', 'slime', 'basilisk', 'direwolf', 'giantEagle', 'treant', 'golem', 'hydra', 'dragon'],
  spirit: ['spirit', 'fireSpirit', 'iceSpirit', 'earthSpirit', 'lightSpirit', 'darkSpirit'],
  demon: ['hellhound', 'imp', 'succubus', 'demonGuard', 'demonMage', 'gargoyle', 'cerberus', 'ifrit', 'reaper', 'abyssKnight'],
};

export const unitFamilyLabels: Record<UnitFamily, string> = {
  kingdom: '왕국군', betrayer: '배신자', goblin: '고블린', orc: '오크', ogre: '오우거', beast: '마물·야수', spirit: '정령', demon: '악마',
};

export const unitFamilyById = Object.fromEntries(
  Object.entries(familyMembers).flatMap(([family, ids]) => ids.map((id) => [id, family])),
) as Record<UnitId, UnitFamily>;
