export const UNIT_IDS = [
  'militia', 'guardian', 'archer', 'lancer', 'raider', 'bulwark', 'cavalry', 'crossbow', 'brute', 'griffin', 'spirit', 'hellhound',
  'swordsman', 'pikeman', 'scout', 'priest', 'mage', 'archmage', 'assassin',
  'goblinArcher', 'goblinBomber', 'orcBerserker', 'orcShaman', 'troll', 'ogreMage', 'wolfRider', 'harpy', 'minotaur', 'wyvern', 'slime', 'basilisk',
  'fireSpirit', 'iceSpirit', 'earthSpirit', 'lightSpirit', 'darkSpirit',
  'direwolf', 'giantEagle', 'treant', 'golem', 'hydra',
  'imp', 'succubus', 'demonGuard', 'demonMage', 'gargoyle', 'cerberus', 'ifrit', 'reaper', 'abyssKnight', 'dragon',
] as const;
export type UnitId = typeof UNIT_IDS[number];
export type EnemyId = UnitId;
export type CodexEnemyId = EnemyId | 'boss';
export type EnemyFaction = 'betrayers' | 'goblins' | 'orcs' | 'monsters' | 'demons' | 'spirits' | 'mixed';
export type UnitFamily = 'kingdom' | 'betrayer' | 'goblin' | 'orc' | 'ogre' | 'beast' | 'spirit' | 'demon';
export type UnitGrade = 1 | 2 | 3 | 4 | 5;
export type HeroId = 'warden' | 'pyromancer' | 'huntress' | 'saint' | 'marshal' | 'orcChampion' | 'windSpirit';
export type FortressTier = 1 | 2 | 3;
export type CastleTechId =
  | 'war_coffers' | 'logistics' | 'command_vault' | 'drill_yard' | 'supply_standardization' | 'spoils_accounting' | 'field_manuals' | 'war_tithe'
  | 'fortified_walls' | 'stone_plating' | 'watchtower' | 'battlements' | 'mending_stone'
  | 'black_powder' | 'rapid_reload' | 'wide_blast' | 'giantbreaker_shells' | 'siege_calculus'
  | 'rally_orders' | 'heroic_orders' | 'mobilization_drill' | 'field_recovery' | 'transcendent_orders';
export type EquipmentSlot = 'weapon' | 'armor' | 'boots';
export type EquipmentLevels = Record<EquipmentSlot, number>;
export interface EquipmentGrowth {
  attack: number;
  hp: number;
  defense: number;
  moveSpeed: number;
}
export type MovementDomain = 'ground' | 'flying';
export interface GuardProtection {
  stopsPierce: boolean;
  rearRangeMultiplier: number;
  protectedDomains: MovementDomain[];
}
export type AttackPattern =
  | { kind: 'single' }
  | { kind: 'pierce'; maxTargets: 2 | 3; followThroughRange: number; secondaryDamageMultiplier: number }
  | { kind: 'cleave'; secondaryDamageMultiplier: number }
  | { kind: 'splash'; radius: number; secondaryDamageMultiplier: number; targetDomain: 'ground' | 'all' }
  | { kind: 'directional'; length: number; secondaryDamageMultiplier: number; targetDomain: 'ground' | 'all' }
  | { kind: 'groundBurst'; radius: number; secondaryDamageMultiplier: number; targetDomain: 'ground' | 'all'; telegraphMs: number };
export type Side = 'player' | 'enemy';
export type BattleSpeed = 1 | 1.5;
export type Screen = 'menu' | 'opening' | 'credits' | 'stages' | 'merchant' | 'monument' | 'armory' | 'heroes' | 'fortress' | 'achievements' | 'codex' | 'battle' | 'result';
export type GameFeatureId = 'hero-training';
export type HeroTrainingPackageId = 'field-drill' | 'tactical-lesson' | 'royal-tutoring';

export interface UnitDefinition {
  id: UnitId | EnemyId | HeroId | 'boss';
  name: string;
  cost: number;
  maxHp: number;
  defense?: number;
  attackDamage: number;
  attackRange: number;
  minimumAttackRange: number;
  attackIntervalMs: number;
  attackWindupMs: number;
  moveSpeed: number;
  spawnCooldownMs: number;
  color: number;
  accent: number;
  size: number;
  tags: string[];
  icon: string;
  squadSize: number;
  attackPattern: AttackPattern;
  equipmentCostBase: number;
  equipmentGrowth: EquipmentGrowth;
  recruitCost?: number;
  requiredFortressTier?: FortressTier;
  requiresEncounter?: boolean;
  recruitSource?: 'encounter' | 'fortress' | 'challenge';
  maxActivePerSide?: number;
  guardProtection?: GuardProtection;
  healingPower?: number;
  healingRange?: number;
  grade?: UnitGrade;
}

export type TroopDefinition = UnitDefinition & { id: UnitId; grade: UnitGrade };

export interface HeroDefinition extends UnitDefinition {
  id: HeroId;
  title: string;
  description: string;
  passiveName: string;
  passiveDescription: string;
  skillName: string;
  skillDescription: string;
  skillCooldownMs: number;
  respawnMs: number;
  unlockCost: number;
}

export interface WaveEntry {
  timeMs: number;
  unitId: EnemyId;
  count: number;
  intervalMs: number;
}

export interface StageDefinition {
  id: number;
  name: string;
  subtitle: string;
  reward: number;
  enemyCastleHp: number;
  enemyFortressAttack?: EnemyFortressAttack;
  fortressDistance: number;
  enemyUpgrades: EnemyUpgradeProfile;
  waves: WaveEntry[];
  reinforcement?: EnemyReinforcement;
  eliteGuards?: EliteGuardDefinition[];
  enemyFaction: EnemyFaction;
  terrain: TerrainEffect;
  boss?: boolean;
  bossName?: string;
  bossUnitId?: UnitId;
  challenge?: boolean;
  requiredCampaignStage?: number;
  bossModifiers?: BossStageModifiers;
  firstClearReward: FirstClearReward;
}

export interface EnemyFortressAttack {
  damage: number;
  range: number;
  intervalMs: number;
}

export interface TerrainEffect {
  id: string;
  name: string;
  description: string;
  enemyHpMultiplier: number;
  enemyAttackMultiplier: number;
  enemyMoveSpeedMultiplier: number;
}

export interface EnemyReinforcement {
  startMs: number;
  intervalMs: number;
  unitIds: EnemyId[];
  maxAlive: number;
}

export interface EnemyUpgradeProfile {
  equipment: EquipmentLevels;
}

export interface EliteGuardDefinition {
  unitId: EnemyId;
  name: string;
  positionRatio: number;
  hpMultiplier: number;
  attackMultiplier: number;
  defenseBonus: number;
}

export interface BossStageModifiers {
  hpMultiplier: number;
  attackMultiplier: number;
  stompCadenceMultiplier: number;
}

export interface FirstClearReward {
  label: string;
  description: string;
  icon: string;
  gold?: number;
  unitId?: UnitId;
  heroId?: HeroId;
  featureId?: GameFeatureId;
}

export interface BattleHudState {
  command: number;
  maxCommand: number;
  playerCastleHp: number;
  playerCastleMaxHp: number;
  enemyHp: number;
  enemyMaxHp: number;
  enemyName: string;
  heroHp: number;
  heroMaxHp: number;
  heroRespawnMs: number;
  heroSkillCooldownMs: number;
  heroSkillMaxCooldownMs: number;
  heroName: string;
  heroSkillName: string;
  heroIcon: string;
  castleSkillCooldownMs: number;
  castleSkillMaxCooldownMs: number;
  mobilizationUses: number;
  mobilizationMaxUses: number;
  rallyUnlocked: boolean;
  rallyHeroControl: boolean;
  rallyTranscendentControl: boolean;
  rallyTargeting: boolean;
  rallyTargetActive: boolean;
  rallyRemainingMs: number;
  rallyCooldownMs: number;
  rallyCooldownMaxMs: number;
  spawnCooldowns: Partial<Record<UnitId, number>>;
  unitCosts: Partial<Record<UnitId, number>>;
  activeUnitCounts: Partial<Record<UnitId, number>>;
  elapsedMs: number;
  bossAwake: boolean;
  bossPhase: number;
  bossHp: number;
  bossMaxHp: number;
  paused: boolean;
  battleSpeed: BattleSpeed;
}

export interface BattleResult {
  victory: boolean;
  stageId: number;
  reward: number;
  elapsedMs: number;
  kills: number;
  unitsLost: number;
  heroDeaths: number;
  summons: Record<UnitId, number>;
  usedHeroId: HeroId;
  heroSkillUses: number;
  castleSkillUses: number;
  encounteredEnemies: CodexEnemyId[];
  newAchievements?: string[];
  masteryGains?: Array<{ id: UnitId | HeroId; amount: number; kind: 'unit' | 'hero' }>;
  firstClearReward?: FirstClearReward;
}

export interface PlayerStats {
  battles: number;
  victories: number;
  defeats: number;
  kills: number;
  unitDeaths: number;
  heroDeaths: number;
  summons: number;
  heroSkillUses: number;
  castleSkillUses: number;
  bossWins: number;
  currentWinStreak: number;
  maxWinStreak: number;
  codexEntries: number;
}

export interface CodexEntry {
  id: UnitId | HeroId | CodexEnemyId;
  kind: 'unit' | 'hero' | 'enemy';
  title: string;
  description: string;
  lore: string;
  role: string;
}

export type AchievementMetric = keyof PlayerStats;

export type CastleTechBranch = 'command' | 'growth' | 'defense' | 'artillery' | 'expedition';

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  metric: AchievementMetric;
  target: number;
  goldReward: number;
  gemReward: number;
  icon: string;
  category: 'combat' | 'campaign' | 'endurance' | 'command';
}

export interface CastleTechDefinition {
  id: CastleTechId;
  branch: CastleTechBranch;
  name: string;
  description: string;
  icon: string;
  maxLevel: number;
  baseCost: number;
  requiredTier: FortressTier;
  prerequisite?: { id: CastleTechId; level: number };
}

export interface FortressTierDefinition {
  tier: FortressTier;
  name: string;
  requiredResearch: number;
  promotionCost: number;
  description: string;
  unlocks: string;
}

export interface CastleBattleStats {
  startingCommand: number;
  commandRegen: number;
  maxCommand: number;
  summonCooldownMultiplier: number;
  summonCostMultiplier: number;
  commandPerKill: number;
  battleGoldMultiplier: number;
  masteryXpMultiplier: number;
  maxHp: number;
  damageReduction: number;
  castleRegenPerSecond: number;
  towerDamage: number;
  towerRange: number;
  towerIntervalMs: number;
  bombardDamage: number;
  bombardRadius: number;
  bombardRange: number;
  bombardCooldownMs: number;
  bombardBossBonus: number;
  bombardCastleDamage: number;
  heroSkillCooldownMultiplier: number;
  heroRespawnMultiplier: number;
  mobilizationMaxCommandBonus: number;
  mobilizationCommandRegenBonus: number;
  rallyUnlocked: boolean;
  rallyHeroControl: boolean;
  rallyTranscendentControl: boolean;
  rallyCooldownMs: number;
  rallyMoveSpeedMultiplier: number;
}
