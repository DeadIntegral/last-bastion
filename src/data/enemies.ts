import type { EnemyId, ExclusiveEnemyId, UnitDefinition } from '../types/game';
import { troopDefinitions } from './units';

const construct = (id: ExclusiveEnemyId, values: Partial<UnitDefinition> & Pick<UnitDefinition, 'name' | 'maxHp' | 'attackDamage' | 'attackPattern' | 'icon'>): UnitDefinition => ({
  id, enemyOnly: true, cost: 0, attackRange: 55, minimumAttackRange: 0, attackIntervalMs: 2400, attackWindupMs: 850,
  moveSpeed: 26, spawnCooldownMs: 0, color: 0x394c61, accent: 0xafd7df, size: 28,
  tags: ['ground'], squadSize: 1, equipmentCostBase: 0,
  equipmentGrowth: { hp: 300, attack: 20, defense: 1, moveSpeed: 1 }, ...values,
});

/** Unrecruitable, ungraded invaders. Never add these IDs to troopDefinitions. */
export const exclusiveEnemyDefinitions: Record<ExclusiveEnemyId, UnitDefinition> = {
  voidSentinel: construct('voidSentinel', { name: '공허 방벽', maxHp: 6500, attackDamage: 260, defense: 18, moveSpeed: 18, icon: '⬢',
    attackPattern: { kind: 'cleave', secondaryDamageMultiplier: .7 }, guardProtection: { stopsPierce: true, rearRangeMultiplier: .15, protectedDomains: ['ground'] } }),
  riftArbalest: construct('riftArbalest', { name: '균열 노포', maxHp: 3600, attackDamage: 420, defense: 4, attackRange: 285, minimumAttackRange: 95, attackIntervalMs: 2800, attackWindupMs: 1100, icon: '⋈', accent: 0xd9a9f4,
    tags: ['ground', 'ranged', 'magic'], attackPattern: { kind: 'pierce', maxTargets: 2, followThroughRange: 165, secondaryDamageMultiplier: .8 } }),
  nullCantor: construct('nullCantor', { name: '침묵의 성가대', maxHp: 4800, attackDamage: 190, defense: 7, attackRange: 220, minimumAttackRange: 75, healingPower: 260, healingRange: 250, icon: '◈', accent: 0x9ee1cf,
    tags: ['ground', 'ranged', 'magic', 'healer'], attackPattern: { kind: 'groundBurst', radius: 82, maxTargets: 4, secondaryDamageMultiplier: .7, targetDomain: 'ground', telegraphMs: 1200 } }),
  duskExecutioner: construct('duskExecutioner', { name: '황혼의 집행자', maxHp: 11000, attackDamage: 650, defense: 12, attackRange: 70, attackIntervalMs: 2800, attackWindupMs: 1200, moveSpeed: 22, size: 36, icon: '†', accent: 0xe9aa96,
    tags: ['ground', 'large'], attackPattern: { kind: 'cleave', secondaryDamageMultiplier: .75 } }),
  veilRegent: construct('veilRegent', { name: '장막의 섭정', maxHp: 45000, attackDamage: 500, defense: 18, attackRange: 90, attackIntervalMs: 3000, attackWindupMs: 1300, moveSpeed: 19, size: 55, icon: '♜', accent: 0xe0baee,
    tags: ['ground', 'large', 'boss'], attackPattern: { kind: 'cleave', secondaryDamageMultiplier: .85 } }),
};
export const exclusiveEnemyIds = Object.keys(exclusiveEnemyDefinitions) as ExclusiveEnemyId[];
export const enemyDefinitions: Record<EnemyId, UnitDefinition> = { ...troopDefinitions, ...exclusiveEnemyDefinitions };
export const exclusiveEnemyLore: Record<ExclusiveEnemyId, { description: string; counter: string }> = {
  voidSentinel: { description: '장막 너머의 길을 지키는 무인 방벽입니다. 관통을 끊고 뒤쪽 지상 병력을 보호합니다.', counter: '지면 발현 마법이나 공중 병력으로 보호선의 빈틈을 노리세요.' },
  riftArbalest: { description: '생명 대신 균열의 압력으로 움직이는 공성 장치입니다. 긴 사거리의 마법창을 두 대상에게 발사합니다.', counter: '수호병으로 관통을 막고 빠른 병력으로 최소 사거리 안에 진입하세요.' },
  nullCantor: { description: '의지가 지워진 성가대가 구축체를 수복합니다. 부상자가 없으면 지면을 폭발시킵니다.', counter: '곡사 병력으로 후열을 노리거나 공중 병력으로 지면 폭발을 피하세요.' },
  duskExecutioner: { description: '장막의 명령만을 따르는 거대 집행자입니다. 느리고 큰 베기로 밀집한 지상 전열을 무너뜨립니다.', counter: '공중 병력과 대형 적 특화 공격으로 긴 준비 동작을 공략하세요.' },
  veilRegent: { description: '왕국 침공을 지휘한 장막의 섭정입니다. 성채와 함께 전장을 지키며 체력이 줄면 각성합니다.', counter: '성채와 섭정을 모두 격파해야 합니다. 수비대와 지상 내려찍기에 대비하세요.' },
};
