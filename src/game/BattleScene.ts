import Phaser from 'phaser';
import { musicEngine } from '../audio/music';
import { CHARACTER_ART_FRAME_HEIGHT, CHARACTER_ART_FRAME_WIDTH, characterArtFrameIndex, characterArtFrames, characterArtSheet, characterArtSheets, TRANSCENDENT_BATTLE_ART_SCALE, type CharacterArtId } from '../data/characterArt';
import { battleMobilizationTuning, castleBattleStats, mobilizationCommandCost, rallyCommandTuning, soldierCommandCost } from '../data/castle';
import { triumphMonumentBonuses } from '../data/endgame';
import { fortressArtDefinitions, fortressArtLayout } from '../data/fortressArt';
import { heroAwakeningAuras, heroSkillPower } from '../data/mastery';
import { allTroopOrder, bossCombatTuning, bossDefinition, heroDefinitions, troopDefinitions } from '../data/units';
import type { BattleHudState, BattleSpeed, CastleBattleStats, CastleTechId, CodexEnemyId, EnemyId, EquipmentLevels, HeroDefinition, HeroId, Side, StageDefinition, UnitDefinition, UnitId } from '../types/game';
import { BattleEvent, battleEvents } from './EventBus';
import { attackMotionDurationMs, attackMotionStyle, createAttackMotionPose, projectileVisualStyle, sampleAttackMotion, type AttackMotionPose, type AttackMotionStyle, type ProjectileVisualStyle } from './combatMotion';
import { resolveDirectionalTargets, resolveGroundBurstTargets, resolvePierceTargets, type LaneTargetAccess } from './combatTargeting';
import {
  calculateDamage,
  applyEnemyTerrain,
  applyTriumphMonumentStats,
  canActivateMobilization,
  canAttackTarget,
  canReceiveRallyOrder,
  enemyFortressCanReinforce,
  enemyObjectiveDefeated,
  fortressRearSpawnX,
  heroMasteryLevelFromXp,
  heroAwakeningRank,
  heroAuraBonuses,
  healedHp,
  isBehindLivingFortress,
  isWithinAttackBand,
  masteryLevelFromXp,
  mobilizedCommandStats,
  regenerateCommand,
  scaledBattleDelta,
  scaledHeroRespawnMs,
  scaledHeroSkillCooldownMs,
  scaledHeroSkillPower,
  unitDeploymentCapacity,
  upgradedStats,
} from './rules';

type PendingAttackKind = 'none' | 'unit' | 'heal' | 'playerCastle' | 'enemyCastle';

interface CombatUnit {
  id: number;
  definition: UnitDefinition;
  side: Side;
  hp: number;
  maxHp: number;
  shield: number;
  attackTimer: number;
  attackRecoveryLocked: boolean;
  attackWindupRemainingMs: number;
  pendingAttackKind: PendingAttackKind;
  pendingTargetId: number;
  pendingTargetX: number;
  container: Phaser.GameObjects.Container;
  shadow: Phaser.GameObjects.Ellipse;
  shadowGroundOffset: number;
  hpBar: Phaser.GameObjects.Rectangle;
  alive: boolean;
  isHero: boolean;
  isBoss: boolean;
  isElite: boolean;
  hasCharged: boolean;
  baseScale: number;
  attackMotionMs: number;
  attackMotionDurationMs: number;
  attackRig: CombatAttackRig;
  attackPose: AttackMotionPose;
  damageFlashMs: number;
}

interface CombatAttackRig {
  style: AttackMotionStyle;
  root: Phaser.GameObjects.Container;
  forearm: Phaser.GameObjects.Container;
  weapon: Phaser.GameObjects.Rectangle;
  energy: Phaser.GameObjects.Arc;
  direction: 1 | -1;
  baseX: number;
  baseY: number;
}

interface SpawnOrder {
  at: number;
  id: EnemyId;
}

interface PooledStrikeEffect {
  object: Phaser.GameObjects.Star;
  elapsedMs: number;
  durationMs: number;
}

interface PooledProjectileEffect {
  object: Phaser.GameObjects.Container;
  arrowShaft: Phaser.GameObjects.Rectangle;
  arrowHead: Phaser.GameObjects.Triangle;
  magicCore: Phaser.GameObjects.Star;
  magicRing: Phaser.GameObjects.Arc;
  bombBody: Phaser.GameObjects.Arc;
  bombFuse: Phaser.GameObjects.Rectangle;
  siegeShell: Phaser.GameObjects.Rectangle;
  style: ProjectileVisualStyle;
  elapsedMs: number;
  durationMs: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface PooledFlashEffect {
  object: Phaser.GameObjects.Arc;
  elapsedMs: number;
  durationMs: number;
}

interface PooledGroundTelegraphEffect {
  object: Phaser.GameObjects.Arc;
  elapsedMs: number;
  durationMs: number;
  radius: number;
  owner?: CombatUnit;
}

interface PooledGuardEffect {
  object: Phaser.GameObjects.Container;
  ring: Phaser.GameObjects.Arc;
  wake: Phaser.GameObjects.Rectangle;
  elapsedMs: number;
  durationMs: number;
}

export const WORLD_WIDTH = 1600;
export const WORLD_HEIGHT = 720;
const PLAYER_CASTLE_X = 105;
const GROUND_Y = 550;

export class BattleScene extends Phaser.Scene {
  private stageDefinition: StageDefinition;
  private enemyCastleX: number;
  private equipmentLevels: Record<UnitId, EquipmentLevels>;
  private equippedUnits: UnitId[];
  private unitMasteryXp: Record<UnitId, number>;
  private heroDefinition: HeroDefinition;
  private heroId: HeroId;
  private heroMasteryLevel: number;
  private triumphMonumentLevel: number;
  private castleStats: CastleBattleStats;
  private units: CombatUnit[] = [];
  private pendingUnitRemovalIds = new Set<number>();
  private attackTargetBuffer: CombatUnit[] = [];
  private strikeEffects: PooledStrikeEffect[] = [];
  private projectileEffects: PooledProjectileEffect[] = [];
  private flashEffects: PooledFlashEffect[] = [];
  private groundTelegraphEffects: PooledGroundTelegraphEffect[] = [];
  private guardEffects: PooledGuardEffect[] = [];
  private targetingAttacker?: CombatUnit;
  private readonly combatTargetAccess: LaneTargetAccess<CombatUnit> = {
    x: (target) => target.container.x,
    size: (target) => target.definition.size,
    domain: (target) => target.definition.tags.includes('flying') ? 'flying' : 'ground',
    guardProtection: (target) => target.definition.guardProtection,
    eligible: (target) => Boolean(this.targetingAttacker)
      && target.alive
      && target.side !== this.targetingAttacker!.side
      && canAttackTarget(this.targetingAttacker!.definition, target.definition)
      && !this.isProtectedByLivingFortress(target),
  };
  private nextEntityId = 1;
  private command = 70;
  private elapsed = 0;
  private playerCastleHp = 1800;
  private playerCastleMaxHp = 1800;
  private enemyHp = 1000;
  private enemyMaxHp = 1000;
  private spawnCooldowns: Partial<Record<UnitId, number>> = {};
  private heroSkillCooldown = 0;
  private castleSkillCooldown = 0;
  private mobilizationUses = 0;
  private rallyCooldown = 0;
  private rallyRemaining = 0;
  private rallyTargeting = false;
  private rallyTargetX?: number;
  private rallyFlag?: Phaser.GameObjects.Container;
  private heroRespawn = 0;
  private hero?: CombatUnit;
  private boss?: CombatUnit;
  private bossAwake = false;
  private bossPhase = 1;
  private bossStompTimer: number = bossCombatTuning.initialStompDelayMs;
  private bossStompWarning?: Phaser.GameObjects.Arc;
  private bossStompWarningTween?: Phaser.Tweens.Tween;
  private bossStompEvent?: Phaser.Time.TimerEvent;
  private spawnOrders: SpawnOrder[] = [];
  private spawnOrderIndex = 0;
  private reinforcementIndex = 0;
  private nextReinforcementAt = Number.POSITIVE_INFINITY;
  private kills = 0;
  private ended = false;
  private isPaused = false;
  private battleSpeed: BattleSpeed;
  private hudTimer = 0;
  private towerAttackTimer = 0;
  private enemyFortressAttackTimer = 0;
  private unitsLost = 0;
  private heroDeaths = 0;
  private heroSkillUses = 0;
  private castleSkillUses = 0;
  private summons: Record<UnitId, number> = Object.fromEntries(allTroopOrder.map((id) => [id, 0])) as Record<UnitId, number>;
  private encounteredEnemies = new Set<CodexEnemyId>();
  private playerCastleBar!: Phaser.GameObjects.Rectangle;
  private enemyBar!: Phaser.GameObjects.Rectangle;
  private mist!: Phaser.GameObjects.TileSprite;

  constructor(
    stage: StageDefinition,
    equipmentLevels: Record<UnitId, EquipmentLevels>,
    equippedUnits: UnitId[],
    unitMasteryXp: Record<UnitId, number>,
    heroId: HeroId,
    heroEquipmentLevel: EquipmentLevels,
    heroMasteryXp: number,
    castleTechLevels: Record<CastleTechId, number>,
    triumphMonumentLevel: number,
    battleSpeed: BattleSpeed,
  ) {
    super({ key: 'BattleScene' });
    this.stageDefinition = stage;
    this.enemyCastleX = PLAYER_CASTLE_X + stage.fortressDistance;
    this.equipmentLevels = equipmentLevels;
    this.equippedUnits = equippedUnits;
    this.unitMasteryXp = unitMasteryXp;
    this.battleSpeed = battleSpeed;
    this.heroId = heroId;
    this.triumphMonumentLevel = triumphMonumentLevel;
    this.castleStats = castleBattleStats(castleTechLevels);
    const baseHero = heroDefinitions[heroId];
    this.heroMasteryLevel = heroMasteryLevelFromXp(heroMasteryXp).level;
    const trainedHero = applyTriumphMonumentStats(
      upgradedStats(baseHero, heroEquipmentLevel, this.heroMasteryLevel),
      triumphMonumentLevel,
    );
    this.heroDefinition = {
      ...baseHero,
      maxHp: trainedHero.maxHp,
      attackDamage: trainedHero.attackDamage,
      healingPower: trainedHero.healingPower,
      defense: trainedHero.defense,
      moveSpeed: trainedHero.moveSpeed,
      respawnMs: Math.round(scaledHeroRespawnMs(baseHero, this.heroMasteryLevel) * this.castleStats.heroRespawnMultiplier),
      skillCooldownMs: Math.round(scaledHeroSkillCooldownMs(baseHero, this.heroMasteryLevel) * this.castleStats.heroSkillCooldownMultiplier),
    };
  }

  preload(): void {
    for (const sheet of Object.values(characterArtSheets)) {
      if (this.textures.exists(sheet.textureKey)) continue;
      this.load.spritesheet(sheet.textureKey, sheet.url, {
        frameWidth: CHARACTER_ART_FRAME_WIDTH,
        frameHeight: CHARACTER_ART_FRAME_HEIGHT,
      });
    }
    for (const art of Object.values(fortressArtDefinitions)) {
      if (!this.textures.exists(art.textureKey)) this.load.image(art.textureKey, art.url);
    }
  }

  create(): void {
    this.enemyHp = this.stageDefinition.enemyCastleHp;
    this.enemyMaxHp = this.stageDefinition.enemyCastleHp;
    this.command = this.castleStats.startingCommand;
    const campaignProgressStage = this.stageDefinition.requiredCampaignStage ?? this.stageDefinition.id;
    this.playerCastleMaxHp = this.castleStats.maxHp
      + Math.max(0, campaignProgressStage - 1) * 70
      + triumphMonumentBonuses(this.triumphMonumentLevel).fortressHpBonus;
    this.playerCastleHp = this.playerCastleMaxHp;
    this.drawWorld();
    this.createEffectPools();
    this.createRallyFlag();
    this.time.timeScale = this.battleSpeed;
    this.tweens.timeScale = this.battleSpeed;

    if (!this.stageDefinition.challenge) this.drawCastle(this.enemyCastleX, false);
    if (this.stageDefinition.boss) {
      this.encounteredEnemies.add(this.stageDefinition.bossUnitId ?? 'boss');
      const baseBoss = this.stageDefinition.bossUnitId ? troopDefinitions[this.stageDefinition.bossUnitId] : bossDefinition;
      const trainedBoss = applyEnemyTerrain(upgradedStats(
        baseBoss,
        this.stageDefinition.enemyUpgrades.equipment,
      ), this.stageDefinition.terrain);
      const modifiers = this.stageDefinition.bossModifiers ?? { hpMultiplier: 1, attackMultiplier: 1, stompCadenceMultiplier: 1 };
      const stageBoss = {
        ...trainedBoss,
        name: this.stageDefinition.bossName ?? trainedBoss.name,
        maxHp: Math.round(trainedBoss.maxHp * modifiers.hpMultiplier),
        attackDamage: Math.round(trainedBoss.attackDamage * modifiers.attackMultiplier),
      };
      this.boss = this.createUnit(stageBoss, 'enemy', this.enemyCastleX - (this.stageDefinition.challenge ? 20 : 155), GROUND_Y - 16, false, true);
      if (this.stageDefinition.challenge) {
        this.enemyHp = this.boss.hp;
        this.enemyMaxHp = this.boss.maxHp;
      }
    }
    for (const wave of this.stageDefinition.waves) {
      for (let i = 0; i < wave.count; i += 1) {
        this.spawnOrders.push({ at: wave.timeMs + i * wave.intervalMs, id: wave.unitId });
      }
    }
    this.spawnOrders.sort((a, b) => a.at - b.at);
    this.nextReinforcementAt = this.stageDefinition.reinforcement?.startMs ?? Number.POSITIVE_INFINITY;
    for (const elite of this.stageDefinition.eliteGuards ?? []) this.spawnEliteGuard(elite);

    this.hero = this.createUnit(this.heroDefinition, 'player', fortressRearSpawnX('player', PLAYER_CASTLE_X), GROUND_Y, true, false);
    battleEvents.off(BattleEvent.SPAWN);
    battleEvents.off(BattleEvent.SKILL);
    battleEvents.off(BattleEvent.CASTLE_SKILL);
    battleEvents.off(BattleEvent.MOBILIZE);
    battleEvents.off(BattleEvent.RALLY_MODE);
    battleEvents.off(BattleEvent.RALLY_CLEAR);
    battleEvents.off(BattleEvent.PAUSE);
    battleEvents.off(BattleEvent.SPEED);
    battleEvents.on(BattleEvent.SPAWN, this.handleSpawn, this);
    battleEvents.on(BattleEvent.SKILL, this.activateHeroSkill, this);
    battleEvents.on(BattleEvent.CASTLE_SKILL, this.activateCastleSkill, this);
    battleEvents.on(BattleEvent.MOBILIZE, this.activateMobilization, this);
    battleEvents.on(BattleEvent.RALLY_MODE, this.toggleRallyTargeting, this);
    battleEvents.on(BattleEvent.RALLY_CLEAR, this.clearRallyOrder, this);
    battleEvents.on(BattleEvent.PAUSE, this.togglePause, this);
    battleEvents.on(BattleEvent.SPEED, this.setBattleSpeed, this);
    this.input.on('pointerdown', this.placeRallyFlag, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanup, this);
    this.emitHud();
  }

  update(_time: number, delta: number): void {
    if (this.ended || this.isPaused) return;
    this.flushUnitRemovals();
    const safeDelta = scaledBattleDelta(delta, this.battleSpeed);
    this.elapsed += safeDelta;
    this.command = regenerateCommand(this.command, safeDelta, this.castleStats.maxCommand, this.castleStats.commandRegen);
    if (this.castleStats.castleRegenPerSecond > 0 && this.playerCastleHp < this.playerCastleMaxHp) {
      this.playerCastleHp = Math.min(this.playerCastleMaxHp, this.playerCastleHp + this.castleStats.castleRegenPerSecond * safeDelta / 1000);
    }
    this.mist.tilePositionX += safeDelta * 0.006;
    this.updatePooledEffects(safeDelta);

    for (const id of Object.keys(this.spawnCooldowns) as UnitId[]) {
      this.spawnCooldowns[id] = Math.max(0, (this.spawnCooldowns[id] ?? 0) - safeDelta);
    }
    this.heroSkillCooldown = Math.max(0, this.heroSkillCooldown - safeDelta);
    this.castleSkillCooldown = Math.max(0, this.castleSkillCooldown - safeDelta);
    this.rallyCooldown = Math.max(0, this.rallyCooldown - safeDelta);
    if (this.rallyTargetX !== undefined) {
      this.rallyRemaining = Math.max(0, this.rallyRemaining - safeDelta);
      if (this.rallyRemaining <= 0) this.clearRallyOrder();
    }

    this.processEnemySpawns();
    this.processEnemyReinforcements();
    this.processHeroRespawn(safeDelta);

    for (const unit of this.units) {
      if (!unit.alive) continue;
      this.updateUnitFeedback(unit, safeDelta);
      unit.attackTimer -= safeDelta;
      if (unit.isBoss && !this.bossAwake) continue;
      this.applyPassiveAuraHealing(unit, safeDelta);
      if (this.updatePendingAttack(unit, safeDelta)) continue;
      this.updateUnit(unit, safeDelta);
    }

    if (this.bossAwake && this.boss?.alive) this.updateBoss(safeDelta);
    this.updateWatchtower(safeDelta);
    this.updateEnemyFortressAttack(safeDelta);
    this.flushUnitRemovals();
    this.updateBars();
    this.hudTimer -= safeDelta;
    if (this.hudTimer <= 0) {
      this.emitHud();
      this.hudTimer = 100;
    }
  }

  private drawWorld(): void {
    this.cameras.main.setBackgroundColor('#111928');
    const g = this.add.graphics();
    g.fillGradientStyle(0x101827, 0x101827, 0x2b3042, 0x2b3042, 1);
    g.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    g.fillStyle(0x29364b, 0.7);
    for (let i = 0; i < 15; i += 1) {
      const x = i * 125 - 30;
      const height = 80 + ((i * 47) % 90);
      g.fillTriangle(x, 486, x + 75, 486 - height, x + 160, 486);
    }
    g.fillStyle(0x172235, 0.9);
    for (let i = 0; i < 23; i += 1) {
      const x = i * 75;
      g.fillTriangle(x, 526, x + 40, 426 - (i % 3) * 14, x + 82, 526);
    }

    this.add.circle(1165, 126, 58, 0xd9c391, 0.12);
    this.add.circle(1165, 126, 43, 0xf2dca4, 0.13);
    this.mist = this.add.tileSprite(WORLD_WIDTH / 2, 491, WORLD_WIDTH, 150, '__WHITE').setAlpha(0.12);
    this.mist.setTint(0xbfd9e3);

    g.fillStyle(0x1c2a31, 1);
    g.fillRect(0, 526, WORLD_WIDTH, 194);
    g.fillStyle(0x263a3d, 1);
    g.fillRect(0, 526, WORLD_WIDTH, 5);
    g.lineStyle(1, 0x56706b, 0.16);
    for (let x = 0; x < WORLD_WIDTH; x += 55) g.lineBetween(x, 531, x + 25, WORLD_HEIGHT);

    this.drawCastle(PLAYER_CASTLE_X, true);
    const title = this.add.text(WORLD_WIDTH / 2, 28, this.stageDefinition.name, {
      fontFamily: 'Pretendard Variable, system-ui, sans-serif', fontSize: '17px', fontStyle: 'bold', color: '#e8d8b0', letterSpacing: 3,
    }).setOrigin(0.5);
    title.setShadow(0, 2, '#000000', 4);
  }

  private drawCastle(x: number, player: boolean): void {
    const art = fortressArtDefinitions[player ? 'player' : 'enemy'];
    const visualX = x + (player ? fortressArtLayout.worldEdgeInset : -fortressArtLayout.worldEdgeInset);
    const baselineY = GROUND_Y + fortressArtLayout.baselineOffset;
    this.add.image(visualX, baselineY, art.textureKey)
      .setOrigin(0.5, 1)
      .setDisplaySize(fortressArtLayout.width, fortressArtLayout.height)
      .setDepth(1);

    const barY = baselineY - fortressArtLayout.height - fortressArtLayout.healthBarGap;
    const barX = visualX - fortressArtLayout.healthBarWidth / 2;
    this.add.rectangle(visualX, barY, fortressArtLayout.healthBarWidth, fortressArtLayout.healthBarHeight, 0x111720).setDepth(8);
    const bar = this.add.rectangle(barX, barY, fortressArtLayout.healthBarWidth, fortressArtLayout.healthBarHeight, player ? 0x67c8e8 : 0xe15d62).setOrigin(0, 0.5).setDepth(9);
    if (player) this.playerCastleBar = bar;
    else this.enemyBar = bar;
  }

  private createRallyFlag(): void {
    if (!this.castleStats.rallyUnlocked) return;
    const glow = this.add.circle(0, 24, 30, 0x77d9e8, 0.08).setStrokeStyle(2, 0x8de9f5, 0.4);
    const pole = this.add.rectangle(0, -2, 4, 62, 0xd7c28a).setOrigin(0.5, 1);
    const finial = this.add.circle(0, -66, 5, 0xf3dc91).setStrokeStyle(2, 0xffffff, 0.45);
    const pennant = this.add.triangle(17, -50, 0, 0, 36, 8, 0, 20, 0x4aa8bf, 0.96)
      .setStrokeStyle(2, 0xc7f5ff, 0.75);
    const label = this.add.text(0, 34, '집결', {
      fontFamily: 'Pretendard Variable, system-ui, sans-serif', fontSize: '12px', color: '#d9fbff',
      backgroundColor: '#10232dcc', padding: { x: 7, y: 3 },
    }).setOrigin(0.5, 0);
    this.rallyFlag = this.add.container(0, GROUND_Y - 7, [glow, pole, finial, pennant, label])
      .setDepth(680)
      .setVisible(false);
  }

  private createUnit(definition: UnitDefinition, side: Side, x: number, y: number, hero = false, boss = false, eliteName?: string): CombatUnit {
    const size = definition.size;
    const flying = definition.tags.includes('flying');
    const flightHeight = flying ? 112 : 0;
    const baseScale = boss && this.stageDefinition.challenge ? bossCombatTuning.challengeVisualScale : 1;
    const container = this.add.container(x, y - flightHeight + Phaser.Math.Between(-5, 5)).setScale(baseScale);
    const shadowGroundOffset = flightHeight + size * 0.8;
    const shadow = this.add.ellipse(0, shadowGroundOffset / baseScale, size * 2.3, size * 0.7, 0x000000, flying ? 0.14 : 0.25);
    const aura = this.add.circle(0, 0, size * 1.25, definition.color, hero || eliteName ? 0.18 : 0);
    const awakeningRank = hero && side === 'player' ? heroAwakeningRank(this.heroMasteryLevel) : 0;
    const awakeningAura = hero && awakeningRank > 0 ? heroAwakeningAuras[this.heroId] : undefined;
    const auraRange = awakeningAura
      ? this.add.circle(0, flightHeight, awakeningAura.radius, definition.accent, 0.025).setStrokeStyle(1, definition.accent, 0.22)
      : undefined;
    const artId = definition.id === 'boss' ? undefined : definition.id as CharacterArtId;
    const sheet = artId ? characterArtSheet(artId) : undefined;
    const frame = artId ? characterArtFrames[artId] : undefined;
    const fallbackBackdrop = frame && sheet ? [] : [
      this.add.circle(0, 0, size, definition.color).setStrokeStyle(hero || boss || eliteName ? 3 : 2, definition.accent, 0.9),
      this.add.circle(-size * 0.2, -size * 0.25, size * 0.42, definition.accent, 0.3),
    ];
    const artScale = definition.grade === 5 ? TRANSCENDENT_BATTLE_ART_SCALE : 1;
    const portrait = artId && frame && sheet
      ? this.add.image(0, -size * 0.12, sheet.textureKey, characterArtFrameIndex(artId))
        .setDisplaySize(size * 3.25 * artScale, size * 3.4 * artScale)
        .setFlipX(side === 'enemy')
      : this.add.text(0, -1, definition.icon, {
        fontFamily: 'Georgia, serif', fontSize: `${Math.max(15, size)}px`, color: '#f8f1df', fontStyle: 'bold',
      }).setOrigin(0.5);
    const portraitHalfHeight = artId && frame && sheet ? size * 1.7 * artScale : size;
    const healthBarY = boss ? -Math.max(size + 11, portraitHalfHeight + 8) : -size - 11;
    const hpBg = this.add.rectangle(-size, healthBarY, size * 2, 4, 0x111111, 0.8).setOrigin(0, 0.5);
    const hpBar = this.add.rectangle(-size, healthBarY, size * 2, 4, side === 'player' ? 0x75d5ee : 0xef6b6b).setOrigin(0, 0.5);
    const attackRig = this.createAttackRig(definition, side, size);
    container.add([shadow, ...(auraRange ? [auraRange] : []), aura, ...fallbackBackdrop, portrait, attackRig.root, hpBg, hpBar]);
    container.setDepth(flying ? 650 : Math.round(container.y));

    const unit: CombatUnit = {
      id: this.nextEntityId++, definition, side, hp: definition.maxHp, maxHp: definition.maxHp,
      shield: 0, attackTimer: Phaser.Math.Between(0, 250), attackRecoveryLocked: false,
      attackWindupRemainingMs: 0, pendingAttackKind: 'none', pendingTargetId: 0, pendingTargetX: 0,
      container, shadow, shadowGroundOffset, hpBar, alive: true, isHero: hero, isBoss: boss, isElite: Boolean(eliteName), hasCharged: false,
      baseScale, attackMotionMs: 0, attackMotionDurationMs: 0, attackRig, attackPose: createAttackMotionPose(), damageFlashMs: 0,
    };
    this.units.push(unit);
    if (boss) {
      this.add.text(x, container.y + healthBarY * baseScale - 24, '경계 중', {
        fontFamily: 'Pretendard Variable, system-ui, sans-serif', fontSize: '14px', color: '#d7c2b5', backgroundColor: '#171521aa', padding: { x: 10, y: 5 },
      }).setOrigin(0.5).setName('boss-status');
    }
    if (eliteName) {
      const banner = this.add.text(0, -size - 24, eliteName, {
        fontFamily: 'Pretendard Variable, system-ui, sans-serif', fontSize: '12px', color: '#ffd49b', backgroundColor: '#281b20cc', padding: { x: 7, y: 3 },
      }).setOrigin(0.5);
      container.add(banner);
    }
    return unit;
  }

  private createAttackRig(definition: UnitDefinition, side: Side, size: number): CombatAttackRig {
    const style = attackMotionStyle(definition);
    const direction: 1 | -1 = side === 'player' ? 1 : -1;
    const baseX = size * 0.02;
    const baseY = -size * 0.22;
    const root = this.add.container(direction * baseX, baseY).setAlpha(0).setScale(direction, 1);
    const armThickness = Math.max(3, size * 0.18);
    const upperLength = size * 0.58;
    const forearmLength = size * 0.52;
    const upperArm = this.add.rectangle(0, 0, upperLength, armThickness, definition.color, 0.96)
      .setOrigin(0, 0.5).setStrokeStyle(1, definition.accent, 0.85);
    const forearm = this.add.container(upperLength * 0.82, 0);
    const lowerArm = this.add.rectangle(0, 0, forearmLength, armThickness * 0.9, definition.color, 0.96)
      .setOrigin(0, 0.5).setStrokeStyle(1, definition.accent, 0.8);
    const hand = this.add.circle(forearmLength * 0.82, 0, Math.max(2, size * 0.1), definition.accent, 0.95);
    const weapon = this.add.rectangle(forearmLength * 0.74, 0, size * 0.95, Math.max(2, size * 0.07), definition.accent, 0.92)
      .setOrigin(0, 0.5).setStrokeStyle(1, 0xffffff, 0.35);
    const bow = this.add.arc(forearmLength * 0.82, 0, size * 0.38, 255, 105, false, definition.accent, 0)
      .setStrokeStyle(Math.max(2, size * 0.07), definition.accent, 0.95);
    const claw = this.add.star(forearmLength * 0.95, 0, 3, size * 0.11, size * 0.34, definition.accent, 0.95);
    const energy = this.add.circle(forearmLength * 1.06, 0, size * 0.23, definition.accent, 0.78)
      .setStrokeStyle(2, 0xffffff, 0.72);

    weapon.setVisible(style === 'slash' || style === 'thrust' || style === 'crush');
    bow.setVisible(style === 'shoot');
    claw.setVisible(style === 'lunge');
    energy.setVisible(style === 'cast');
    forearm.add([lowerArm, hand, weapon, bow, claw, energy]);
    root.add([upperArm, forearm]);
    return { style, root, forearm, weapon, energy, direction, baseX, baseY };
  }

  private handleSpawn(id: UnitId): void {
    if (this.ended || this.isPaused) return;
    if (!this.equippedUnits.includes(id)) return;
    const base = troopDefinitions[id];
    const commandCost = soldierCommandCost(base.cost, this.castleStats.summonCostMultiplier);
    const capacity = unitDeploymentCapacity(base, this.activeUnitCount('player', id));
    if (!base || this.command < commandCost || (this.spawnCooldowns[id] ?? 0) > 0 || capacity <= 0) return;
    this.command -= commandCost;
    this.spawnCooldowns[id] = base.spawnCooldownMs * this.castleStats.summonCooldownMultiplier;
    const mastery = masteryLevelFromXp(this.unitMasteryXp[id] ?? 0).level;
    const definition = applyTriumphMonumentStats(
      upgradedStats(base, this.equipmentLevels[id] ?? 0, mastery),
      this.triumphMonumentLevel,
    );
    this.summons[id] += 1;
    for (let index = 0; index < Math.min(definition.squadSize, capacity); index += 1) {
      this.createUnit(definition, 'player', fortressRearSpawnX('player', PLAYER_CASTLE_X, index) + Phaser.Math.Between(-4, 4), GROUND_Y);
    }
    this.flashAt(fortressRearSpawnX('player', PLAYER_CASTLE_X), GROUND_Y, 0x8fe5ff);
    this.emitHud();
  }

  private processEnemySpawns(): void {
    while (this.spawnOrderIndex < this.spawnOrders.length && this.spawnOrders[this.spawnOrderIndex].at <= this.elapsed) {
      const order = this.spawnOrders[this.spawnOrderIndex++];
      this.spawnEnemySquad(order.id);
    }
  }

  private processEnemyReinforcements(): void {
    const reinforcement = this.stageDefinition.reinforcement;
    if (!reinforcement || !enemyFortressCanReinforce(this.stageDefinition, this.enemyHp)) return;
    while (this.elapsed >= this.nextReinforcementAt) {
      this.nextReinforcementAt += reinforcement.intervalMs;
      let activeEnemies = 0;
      for (const unit of this.units) {
        if (unit.alive && unit.side === 'enemy' && !unit.isBoss) activeEnemies += 1;
      }
      if (activeEnemies >= reinforcement.maxAlive) continue;
      const id = reinforcement.unitIds[this.reinforcementIndex % reinforcement.unitIds.length];
      this.reinforcementIndex += 1;
      this.spawnEnemySquad(id, reinforcement.maxAlive - activeEnemies);
    }
  }

  private spawnEnemySquad(id: EnemyId, capacity = Number.POSITIVE_INFINITY): void {
    this.encounteredEnemies.add(id);
    const definition = applyEnemyTerrain(upgradedStats(
      troopDefinitions[id],
      this.stageDefinition.enemyUpgrades.equipment,
    ), this.stageDefinition.terrain);
    const unitCapacity = unitDeploymentCapacity(definition, this.activeUnitCount('enemy', id));
    const count = Math.min(definition.squadSize, Math.max(0, capacity), unitCapacity);
    if (count <= 0) return;
    for (let index = 0; index < count; index += 1) {
      this.createUnit(definition, 'enemy', fortressRearSpawnX('enemy', this.enemyCastleX, index) + Phaser.Math.Between(-4, 4), GROUND_Y);
    }
    this.flashAt(fortressRearSpawnX('enemy', this.enemyCastleX), GROUND_Y, 0xff8b86);
  }

  private activeUnitCount(side: Side, id: UnitId): number {
    let count = 0;
    for (const unit of this.units) {
      if (unit.alive && !unit.isHero && !unit.isBoss && unit.side === side && unit.definition.id === id) count += 1;
    }
    return count;
  }

  private spawnEliteGuard(elite: NonNullable<StageDefinition['eliteGuards']>[number]): void {
    this.encounteredEnemies.add(elite.unitId);
    const trained = applyEnemyTerrain(upgradedStats(troopDefinitions[elite.unitId], this.stageDefinition.enemyUpgrades.equipment), this.stageDefinition.terrain);
    const definition: UnitDefinition = {
      ...trained,
      name: elite.name,
      maxHp: Math.round(trained.maxHp * elite.hpMultiplier),
      attackDamage: Math.round(trained.attackDamage * elite.attackMultiplier),
      defense: Math.round(((trained.defense ?? 0) + elite.defenseBonus) * 10) / 10,
      squadSize: 1,
    };
    const positionX = Phaser.Math.Clamp(
      PLAYER_CASTLE_X + this.stageDefinition.fortressDistance * elite.positionRatio,
      PLAYER_CASTLE_X + 180,
      this.enemyCastleX - 90,
    );
    this.createUnit(definition, 'enemy', positionX, GROUND_Y, false, false, elite.name);
  }

  private processHeroRespawn(delta: number): void {
    if (this.hero?.alive || this.heroRespawn <= 0) return;
    this.heroRespawn -= delta;
    if (this.heroRespawn <= 0) {
      const spawnX = fortressRearSpawnX('player', PLAYER_CASTLE_X);
      this.hero = this.createUnit(this.heroDefinition, 'player', spawnX, GROUND_Y, true, false);
      this.flashAt(spawnX, GROUND_Y, this.heroDefinition.accent);
    }
  }

  private updateUnit(unit: CombatUnit, delta: number): void {
    if (unit.attackRecoveryLocked) {
      if (unit.attackTimer > 0) return;
      unit.attackRecoveryLocked = false;
    }
    const aura = this.heroAuraFor(unit);
    const healTarget = this.findHealTarget(unit);
    if (healTarget && unit.attackTimer <= 0) {
      this.beginAttack(unit, 'heal', healTarget);
      return;
    }
    const target = this.findTarget(unit);
    if (target) {
      const distance = Math.abs(target.container.x - unit.container.x) - target.definition.size - unit.definition.size;
      if (isWithinAttackBand(unit.definition, distance, aura.rangeBonus)) {
        if (unit.attackTimer <= 0) {
          this.beginAttack(unit, 'unit', target);
        }
        return;
      }
      if (distance < unit.definition.minimumAttackRange) {
        this.retreatFrom(unit, target.container.x, delta);
        return;
      }
    }

    const rallyDestination = this.rallyDestinationFor(unit);
    if (rallyDestination !== undefined) {
      if (Math.abs(rallyDestination - unit.container.x) > rallyCommandTuning.arrivalRadius) {
        this.moveUnitToward(unit, rallyDestination, delta, this.castleStats.rallyMoveSpeedMultiplier);
      }
      return;
    }

    const destination = unit.side === 'player' ? this.enemyCastleX : PLAYER_CASTLE_X;
    const distanceToCastle = Math.abs(destination - unit.container.x);
    const castleEdgeDistance = Math.max(0, distanceToCastle - (unit.side === 'player' ? 65 : 58));
    if (!this.stageDefinition.challenge && unit.side === 'player' && isWithinAttackBand(unit.definition, castleEdgeDistance, aura.rangeBonus)) {
      if (unit.attackTimer <= 0) {
        this.beginAttack(unit, 'enemyCastle');
      }
      return;
    }
    if (unit.side === 'enemy' && isWithinAttackBand(unit.definition, castleEdgeDistance, aura.rangeBonus)) {
      if (unit.attackTimer <= 0) {
        this.beginAttack(unit, 'playerCastle');
      }
      return;
    }
    if (castleEdgeDistance < unit.definition.minimumAttackRange) {
      this.retreatFrom(unit, destination, delta);
      return;
    }

    this.moveUnitToward(unit, destination, delta);
  }

  private retreatFrom(unit: CombatUnit, threatX: number, delta: number): void {
    const fallbackDirection = unit.side === 'player' ? -1 : 1;
    const direction = Math.sign(unit.container.x - threatX) || fallbackDirection;
    const destination = Phaser.Math.Clamp(unit.container.x + direction * 120, 20, WORLD_WIDTH - 20);
    this.moveUnitToward(unit, destination, delta);
  }

  private rallyDestinationFor(unit: CombatUnit): number | undefined {
    if (this.rallyTargetX === undefined || unit.side !== 'player') return undefined;
    if (!canReceiveRallyOrder(unit.definition, unit.isHero, {
      soldiers: this.castleStats.rallyUnlocked,
      heroes: this.castleStats.rallyHeroControl,
      transcendent: this.castleStats.rallyTranscendentControl,
    })) return undefined;
    const formationSlot = (unit.id % 7) - 3;
    return Phaser.Math.Clamp(
      this.rallyTargetX + formationSlot * rallyCommandTuning.formationSpacing,
      PLAYER_CASTLE_X + 45,
      this.enemyCastleX - 55,
    );
  }

  private moveUnitToward(unit: CombatUnit, destination: number, delta: number, rallySpeedMultiplier = 1): void {
    const deltaX = destination - unit.container.x;
    if (Math.abs(deltaX) <= 1) return;
    const direction = Math.sign(deltaX);
    const speedModifier = unit.isBoss && this.bossPhase === 2 ? bossCombatTuning.phaseTwoMoveSpeedMultiplier : 1;
    const aura = this.heroAuraFor(unit);
    unit.container.x += direction * (unit.definition.moveSpeed + aura.moveSpeedBonus) * speedModifier * rallySpeedMultiplier * delta / 1000;
    const flying = unit.definition.tags.includes('flying');
    unit.container.y = GROUND_Y - (flying ? 112 : 0) + Math.sin(this.elapsed * (flying ? 0.004 : 0.008) + unit.id) * (flying ? 7 : 2);
    const nextDepth = flying ? 650 : Math.round(unit.container.y);
    if (unit.container.depth !== nextDepth) unit.container.setDepth(nextDepth);
  }

  private findTarget(unit: CombatUnit): CombatUnit | undefined {
    let best: CombatUnit | undefined;
    let bestDistance = Number.POSITIVE_INFINITY;
    let bestGroundBurstTarget: CombatUnit | undefined;
    let bestGroundBurstScore = -1;
    const groundBurst = unit.attackTimer <= 0 && unit.definition.attackPattern.kind === 'groundBurst'
      ? unit.definition.attackPattern
      : undefined;
    const rangeBonus = this.heroAuraFor(unit).rangeBonus;
    for (const candidate of this.units) {
      if (!candidate.alive || candidate.side === unit.side || candidate.id === unit.id) continue;
      if (!canAttackTarget(unit.definition, candidate.definition)) continue;
      if (candidate.side === 'player' && isBehindLivingFortress('player', candidate.container.x, PLAYER_CASTLE_X, this.playerCastleHp)) continue;
      if (!this.stageDefinition.challenge && candidate.side === 'enemy' && isBehindLivingFortress('enemy', candidate.container.x, this.enemyCastleX, this.enemyHp)) continue;
      const deltaX = candidate.container.x - unit.container.x;
      if (unit.side === 'player' && deltaX < -20) continue;
      if (unit.side === 'enemy' && deltaX > 20) continue;
      const distance = Math.abs(deltaX);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = candidate;
      }
      if (!groundBurst) continue;
      const edgeDistance = distance - candidate.definition.size - unit.definition.size;
      if (!isWithinAttackBand(unit.definition, edgeDistance, rangeBonus)) continue;
      let clusteredBodies = 0;
      for (const neighbor of this.units) {
        if (!neighbor.alive || neighbor.side === unit.side || this.isProtectedByLivingFortress(neighbor)) continue;
        if (!canAttackTarget(unit.definition, neighbor.definition)) continue;
        if (Math.abs(neighbor.container.x - candidate.container.x) - neighbor.definition.size <= groundBurst.radius) clusteredBodies += 1;
      }
      const score = clusteredBodies * 10_000 + distance;
      if (score > bestGroundBurstScore) {
        bestGroundBurstScore = score;
        bestGroundBurstTarget = candidate;
      }
    }
    return bestGroundBurstTarget ?? best;
  }

  private findHealTarget(healer: CombatUnit): CombatUnit | undefined {
    const range = healer.definition.healingRange;
    if (!healer.definition.healingPower || !range) return undefined;
    let best: CombatUnit | undefined;
    let mostMissingHp = 0;
    for (const candidate of this.units) {
      if (!candidate.alive || candidate.side !== healer.side || candidate.id === healer.id || candidate.isBoss) continue;
      if (Math.abs(candidate.container.x - healer.container.x) > range) continue;
      const missingHp = candidate.maxHp - candidate.hp;
      if (missingHp > mostMissingHp) {
        mostMissingHp = missingHp;
        best = candidate;
      }
    }
    return best;
  }

  private heroAuraFor(unit: CombatUnit): { attackBonus: number; defenseBonus: number; rangeBonus: number; moveSpeedBonus: number; healingPerSecond: number } {
    const aura = heroAuraBonuses(this.heroId, this.heroMasteryLevel);
    if (unit.side !== 'player' || unit.isHero || !this.hero?.alive || Math.abs(this.hero.container.x - unit.container.x) > aura.radius) {
      return { attackBonus: 0, defenseBonus: 0, rangeBonus: 0, moveSpeedBonus: 0, healingPerSecond: 0 };
    }
    return aura;
  }

  private applyPassiveAuraHealing(unit: CombatUnit, delta: number): void {
    const healingPerSecond = this.heroAuraFor(unit).healingPerSecond;
    if (healingPerSecond > 0 && unit.hp < unit.maxHp) {
      this.healUnit(unit, healingPerSecond * delta / 1000);
    }
  }

  private beginAttack(attacker: CombatUnit, kind: Exclude<PendingAttackKind, 'none'>, target?: CombatUnit): void {
    const cadenceMultiplier = attacker.isBoss && this.bossPhase === 2
      ? bossCombatTuning.phaseTwoAttackIntervalMultiplier
      : 1;
    const cycleMs = attacker.definition.attackIntervalMs * cadenceMultiplier;
    const groundBurstTelegraphMs = kind === 'unit' && attacker.definition.attackPattern.kind === 'groundBurst'
      ? attacker.definition.attackPattern.telegraphMs
      : attacker.definition.attackWindupMs;
    const windupMs = Math.min(cycleMs, groundBurstTelegraphMs * cadenceMultiplier);
    attacker.attackTimer = cycleMs;
    attacker.attackRecoveryLocked = true;
    attacker.attackWindupRemainingMs = windupMs;
    attacker.pendingAttackKind = kind;
    attacker.pendingTargetId = target?.id ?? 0;
    attacker.pendingTargetX = target?.container.x ?? 0;
    if (kind === 'unit' && target && attacker.definition.attackPattern.kind === 'groundBurst') {
      const pattern = attacker.definition.attackPattern;
      this.showGroundTelegraph(attacker, target.container.x, pattern.radius, windupMs, attacker.definition.accent);
    }
    this.startAttackMotion(attacker, Math.max(windupMs, attackMotionDurationMs(attacker.attackRig.style)));
    if (windupMs <= 0) this.resolvePendingAttack(attacker);
  }

  private updatePendingAttack(attacker: CombatUnit, delta: number): boolean {
    if (attacker.pendingAttackKind === 'none') return false;
    attacker.attackWindupRemainingMs = Math.max(0, attacker.attackWindupRemainingMs - delta);
    if (attacker.attackWindupRemainingMs <= 0) this.resolvePendingAttack(attacker);
    return true;
  }

  private resolvePendingAttack(attacker: CombatUnit): void {
    const kind = attacker.pendingAttackKind;
    const targetId = attacker.pendingTargetId;
    const targetX = attacker.pendingTargetX;
    attacker.pendingAttackKind = 'none';
    attacker.pendingTargetId = 0;
    attacker.pendingTargetX = 0;
    attacker.attackWindupRemainingMs = 0;

    if (kind === 'unit') {
      if (attacker.definition.attackPattern.kind === 'groundBurst') {
        this.attackGroundBurst(attacker, targetId, targetX);
        return;
      }
      const target = this.unitById(targetId);
      if (target && this.canResolveAttackAgainst(attacker, target)) this.attackUnit(attacker, target);
      return;
    }
    if (kind === 'heal') {
      const target = this.unitById(targetId);
      const healingRange = attacker.definition.healingRange ?? 0;
      if (target?.alive && target.side === attacker.side && !target.isBoss && target.hp < target.maxHp
        && Math.abs(target.container.x - attacker.container.x) <= healingRange) {
        this.healUnit(target, attacker.definition.healingPower ?? 0, true);
        musicEngine.playEffect('skill');
      }
      return;
    }

    const targetsEnemyCastle = kind === 'enemyCastle';
    const castleX = targetsEnemyCastle ? this.enemyCastleX : PLAYER_CASTLE_X;
    const castleAlive = targetsEnemyCastle ? this.enemyHp > 0 && !this.stageDefinition.challenge : this.playerCastleHp > 0;
    const edgeOffset = targetsEnemyCastle ? 65 : 58;
    const edgeDistance = Math.max(0, Math.abs(castleX - attacker.container.x) - edgeOffset);
    if (!castleAlive || !isWithinAttackBand(attacker.definition, edgeDistance, this.heroAuraFor(attacker).rangeBonus)) return;
    this.damageCastle(targetsEnemyCastle ? 'enemy' : 'player', this.attackDamage(attacker));
    this.showStrike(attacker.container.x + (targetsEnemyCastle ? 30 : -30), attacker.container.y, attacker.definition.color);
    musicEngine.playEffect(attacker.definition.tags.includes('flying') ? 'air' : attacker.definition.tags.includes('ranged') ? 'ranged' : 'melee');
  }

  private unitById(id: number): CombatUnit | undefined {
    for (const unit of this.units) {
      if (unit.id === id) return unit;
    }
    return undefined;
  }

  private canResolveAttackAgainst(attacker: CombatUnit, target: CombatUnit): boolean {
    if (!target.alive || target.side === attacker.side || !canAttackTarget(attacker.definition, target.definition)) return false;
    if (target.side === 'player' && isBehindLivingFortress('player', target.container.x, PLAYER_CASTLE_X, this.playerCastleHp)) return false;
    if (!this.stageDefinition.challenge && target.side === 'enemy' && isBehindLivingFortress('enemy', target.container.x, this.enemyCastleX, this.enemyHp)) return false;
    const deltaX = target.container.x - attacker.container.x;
    if (attacker.side === 'player' ? deltaX < -20 : deltaX > 20) return false;
    const edgeDistance = Math.abs(deltaX) - target.definition.size - attacker.definition.size;
    return isWithinAttackBand(attacker.definition, edgeDistance, this.heroAuraFor(attacker).rangeBonus);
  }

  private isProtectedByLivingFortress(target: CombatUnit): boolean {
    if (target.side === 'player') return isBehindLivingFortress('player', target.container.x, PLAYER_CASTLE_X, this.playerCastleHp);
    return !this.stageDefinition.challenge && isBehindLivingFortress('enemy', target.container.x, this.enemyCastleX, this.enemyHp);
  }

  private attackUnit(attacker: CombatUnit, target: CombatUnit): void {
    const targets = this.attackTargets(attacker, target);
    const primaryDamage = this.attackDamage(attacker, target.definition);
    const secondaryDamageMultiplier = attacker.definition.attackPattern.kind === 'single'
      ? 1
      : attacker.definition.attackPattern.secondaryDamageMultiplier;
    musicEngine.playEffect(attacker.definition.tags.includes('flying') ? 'air' : attacker.definition.tags.includes('ranged') ? 'ranged' : attacker.definition.tags.includes('charge') ? 'heavy' : 'melee');
    for (const hitTarget of targets) {
      const damage = hitTarget.id === target.id
        ? primaryDamage
        : Math.round((calculateDamage(attacker.definition, hitTarget.definition) + this.heroAuraFor(attacker).attackBonus) * secondaryDamageMultiplier);
      if (attacker.definition.tags.includes('ranged')) this.launchProjectile(attacker, hitTarget);
      else this.showStrike(hitTarget.container.x, hitTarget.container.y, attacker.definition.color);
      if (this.guardStopsAttack(attacker, target, hitTarget)) this.showGuardInterception(attacker, hitTarget);
      this.damageUnit(hitTarget, damage);
    }
  }

  private guardStopsAttack(attacker: CombatUnit, primary: CombatUnit, target: CombatUnit): boolean {
    const protection = target.definition.guardProtection;
    if (!protection) return false;
    const pattern = attacker.definition.attackPattern;
    if (pattern.kind === 'directional') {
      const domain = target.definition.tags.includes('flying') ? 'flying' : 'ground';
      return protection.protectedDomains.includes(domain);
    }
    if (pattern.kind !== 'pierce' || !protection.stopsPierce) return false;
    const traversalDomain = primary.definition.tags.includes('flying') ? 'flying' : 'ground';
    return protection.protectedDomains.includes(traversalDomain);
  }

  private attackGroundBurst(attacker: CombatUnit, primaryTargetId: number, targetX: number): void {
    const pattern = attacker.definition.attackPattern;
    if (pattern.kind !== 'groundBurst') return;
    this.targetingAttacker = attacker;
    const targets = resolveGroundBurstTargets(
      targetX,
      this.units,
      pattern.radius,
      pattern.targetDomain,
      this.combatTargetAccess,
      this.attackTargetBuffer,
    );
    if (targets.length === 0) return;
    musicEngine.playEffect('skill');
    this.flashAt(targetX, GROUND_Y, attacker.definition.accent);
    for (const hitTarget of targets) {
      const baseDamage = calculateDamage(attacker.definition, hitTarget.definition) + this.heroAuraFor(attacker).attackBonus;
      const damage = Math.round(baseDamage * (hitTarget.id === primaryTargetId ? 1 : pattern.secondaryDamageMultiplier));
      this.showStrike(hitTarget.container.x, hitTarget.container.y, attacker.definition.accent);
      this.damageUnit(hitTarget, damage);
    }
  }

  private startAttackMotion(unit: CombatUnit, durationMs = attackMotionDurationMs(unit.attackRig.style)): void {
    unit.attackMotionDurationMs = durationMs;
    unit.attackMotionMs = durationMs;
    unit.attackRig.root.setAlpha(1);
  }

  private attackTargets(attacker: CombatUnit, primary: CombatUnit): CombatUnit[] {
    const pattern = attacker.definition.attackPattern;
    const targets = this.attackTargetBuffer;
    targets.length = 0;
    targets.push(primary);
    if (pattern.kind === 'single') return targets;
    if (pattern.kind === 'splash') {
      for (const candidate of this.units) {
        if (!candidate.alive || candidate.side === attacker.side || candidate.id === primary.id) continue;
        if (!canAttackTarget(attacker.definition, candidate.definition)) continue;
        if (this.isProtectedByLivingFortress(candidate)) continue;
        if (Math.abs(candidate.container.x - primary.container.x) <= pattern.radius) targets.push(candidate);
      }
      return targets;
    }
    this.targetingAttacker = attacker;
    if (pattern.kind === 'directional') {
      return resolveDirectionalTargets(
        attacker.side,
        attacker.container.x,
        this.units,
        pattern.length + attacker.definition.size,
        pattern.targetDomain,
        this.combatTargetAccess,
        targets,
      );
    }
    if (pattern.kind === 'groundBurst') return targets;
    if (pattern.kind === 'pierce') {
      return resolvePierceTargets(
        attacker.side,
        primary,
        this.units,
        pattern.maxTargets,
        pattern.followThroughRange,
        this.combatTargetAccess,
        targets,
      );
    }
    const direction = attacker.side === 'player' ? 1 : -1;
    for (const candidate of this.units) {
      if (!candidate.alive || candidate.side === attacker.side || candidate.id === primary.id) continue;
      if (!canAttackTarget(attacker.definition, candidate.definition)) continue;
      if (this.isProtectedByLivingFortress(candidate)) continue;
      const forwardDistance = (candidate.container.x - attacker.container.x) * direction;
      if (forwardDistance < -20) continue;
      if (pattern.kind === 'cleave') {
        const edgeDistance = Math.abs(candidate.container.x - attacker.container.x) - candidate.definition.size - attacker.definition.size;
        if (edgeDistance <= attacker.definition.attackRange) targets.push(candidate);
        continue;
      }
    }
    return targets;
  }

  private attackDamage(attacker: CombatUnit, target?: UnitDefinition): number {
    const baseDamage = (target ? calculateDamage(attacker.definition, target) : attacker.definition.attackDamage) + this.heroAuraFor(attacker).attackBonus;
    if (!attacker.hasCharged && attacker.definition.tags.includes('charge')) {
      attacker.hasCharged = true;
      return Math.round(baseDamage * 1.6);
    }
    return baseDamage;
  }

  private damageUnit(target: CombatUnit, rawDamage: number): void {
    if (!target.alive) return;
    let damage = rawDamage;
    if (target.side === 'player' && !target.isHero && this.heroDefinition.id === 'warden' && this.hero?.alive && Math.abs(this.hero.container.x - target.container.x) <= 135) {
      damage *= 0.85;
    }
    damage = Math.max(1, damage - this.heroAuraFor(target).defenseBonus);
    if (target.shield > 0) {
      const absorbed = Math.min(target.shield, damage);
      target.shield -= absorbed;
      damage -= absorbed;
    }
    target.hp -= Math.round(damage);
    target.hpBar.scaleX = Phaser.Math.Clamp(target.hp / target.maxHp, 0, 1);
    target.damageFlashMs = 70;
    target.container.setAlpha(0.55);

    if (target.isBoss && !this.bossAwake) this.awakenBoss();
    if (target.isBoss && this.stageDefinition.challenge) {
      this.enemyHp = Math.max(0, target.hp);
    }
    if (target.isBoss && this.bossPhase === 1 && target.hp <= target.maxHp * bossCombatTuning.phaseTwoHpRatio) this.enterBossPhaseTwo();
    if (target.hp <= 0) this.killUnit(target);
  }

  private healUnit(target: CombatUnit, amount: number, showEffect = false): void {
    if (!target.alive || amount <= 0 || target.hp >= target.maxHp) return;
    target.hp = healedHp(target.hp, target.maxHp, amount);
    target.hpBar.scaleX = Phaser.Math.Clamp(target.hp / target.maxHp, 0, 1);
    if (showEffect) this.flashAt(target.container.x, target.container.y, 0xffefad);
  }

  private killUnit(unit: CombatUnit): void {
    if (!unit.alive) return;
    unit.alive = false;
    this.pendingUnitRemovalIds.add(unit.id);
    if (unit.side === 'enemy' && !unit.isBoss) {
      this.kills += 1;
      this.command = Math.min(this.castleStats.maxCommand, this.command + this.castleStats.commandPerKill);
    }
    if (unit.side === 'player' && !unit.isHero) this.unitsLost += 1;
    if (unit.isHero) {
      this.heroRespawn = this.heroDefinition.respawnMs;
      this.heroDeaths += 1;
    }
    if (unit.isBoss) {
      this.clearBossStompTelegraph();
      if (this.stageDefinition.challenge) {
        this.enemyHp = 0;
      }
      if (enemyObjectiveDefeated(this.stageDefinition, this.enemyHp, false)) this.finish(true);
    }
    this.tweens.add({
      targets: unit.container, alpha: 0, y: unit.container.y - 18, scale: 0.65, duration: 330,
      onComplete: () => unit.container.destroy(),
    });
  }

  private flushUnitRemovals(): void {
    if (this.pendingUnitRemovalIds.size === 0) return;
    this.units = this.units.filter((unit) => !this.pendingUnitRemovalIds.has(unit.id));
    this.pendingUnitRemovalIds.clear();
  }

  private damageCastle(side: Side, amount: number): void {
    musicEngine.playEffect('castle');
    if (side === 'player') {
      this.playerCastleHp = Math.max(0, this.playerCastleHp - Math.max(1, amount - this.castleStats.damageReduction));
      this.cameras.main.shake(80, 0.002);
      if (this.playerCastleHp <= 0) this.finish(false);
    } else {
      this.enemyHp = Math.max(0, this.enemyHp - amount);
      if (enemyObjectiveDefeated(this.stageDefinition, this.enemyHp, this.boss?.alive ?? false)) this.finish(true);
    }
  }

  private activateHeroSkill(): void {
    if (this.ended || this.isPaused || this.heroSkillCooldown > 0 || !this.hero?.alive) return;
    this.heroSkillCooldown = this.heroDefinition.skillCooldownMs;
    this.heroSkillUses += 1;
    musicEngine.playEffect('skill');
    if (this.heroDefinition.id === 'warden') this.activateWardenSkill();
    if (this.heroDefinition.id === 'pyromancer') this.activatePyromancerSkill();
    if (this.heroDefinition.id === 'huntress') this.activateHuntressSkill();
    if (this.heroDefinition.id === 'saint') this.activateSaintSkill();
    if (this.heroDefinition.id === 'marshal') this.activateMarshalSkill();
    if (this.heroDefinition.id === 'orcChampion') this.activateOrcChampionSkill();
    if (this.heroDefinition.id === 'windSpirit') this.activateWindSpiritSkill();
    this.emitHud();
  }

  private activateWardenSkill(): void {
    const x = this.hero!.container.x;
    const shieldPower = scaledHeroSkillPower(
      heroSkillPower.warden.shield,
      heroSkillPower.warden.shieldPerRank,
      heroSkillPower.warden.shieldPerAwakening,
      this.heroMasteryLevel,
    );
    const ring = this.add.circle(x, GROUND_Y, 18).setStrokeStyle(5, 0x9cecff, 0.9).setDepth(700);
    this.tweens.add({ targets: ring, radius: 165, alpha: 0, duration: 550, onComplete: () => ring.destroy() });
    for (const unit of this.units) {
      if (unit.alive && unit.side === 'player' && Math.abs(unit.container.x - x) <= 160) {
        unit.shield += shieldPower;
        const shield = this.add.circle(unit.container.x, unit.container.y, unit.definition.size + 5)
          .setStrokeStyle(3, 0xa2edff, 0.75).setDepth(499);
        this.tweens.add({ targets: shield, alpha: 0, scale: 1.25, duration: 850, onComplete: () => shield.destroy() });
      }
    }
  }

  private activatePyromancerSkill(): void {
    const unitDamage = scaledHeroSkillPower(
      heroSkillPower.pyromancer.unitDamage,
      heroSkillPower.pyromancer.unitDamagePerRank,
      heroSkillPower.pyromancer.unitDamagePerAwakening,
      this.heroMasteryLevel,
    );
    const castleDamage = scaledHeroSkillPower(
      heroSkillPower.pyromancer.castleDamage,
      heroSkillPower.pyromancer.castleDamagePerRank,
      heroSkillPower.pyromancer.castleDamagePerAwakening,
      this.heroMasteryLevel,
    );
    let centerX = this.enemyCastleX;
    for (const unit of this.units) {
      if (unit.alive && unit.side === 'enemy') centerX = Math.min(centerX, unit.container.x);
    }
    const warning = this.add.circle(centerX, GROUND_Y + 5, 145, 0xe74f36, 0.13).setStrokeStyle(4, 0xff9b62, 0.75).setDepth(4);
    const meteor = this.add.circle(centerX + 110, 80, 24, 0xff824f).setStrokeStyle(7, 0xffd08a).setDepth(800);
    this.tweens.add({ targets: warning, alpha: 0.32, duration: 230, yoyo: true, repeat: 2 });
    this.tweens.add({
      targets: meteor, x: centerX, y: GROUND_Y - 10, scale: 1.5, duration: 650, ease: 'Quad.In',
      onComplete: () => {
        meteor.destroy();
        warning.destroy();
        this.cameras.main.shake(200, 0.006);
        const blast = this.add.circle(centerX, GROUND_Y, 30, 0xff6a42, 0.7).setDepth(650);
        this.tweens.add({ targets: blast, radius: 155, alpha: 0, duration: 430, onComplete: () => blast.destroy() });
        for (const target of this.units) {
          if (target.alive && target.side === 'enemy' && Math.abs(target.container.x - centerX) <= 150) this.damageUnit(target, unitDamage);
        }
        if (!this.stageDefinition.challenge && Math.abs(this.enemyCastleX - centerX) <= 150) this.damageCastle('enemy', castleDamage);
      },
    });
  }

  private activateHuntressSkill(): void {
    const unitDamage = scaledHeroSkillPower(
      heroSkillPower.huntress.unitDamage,
      heroSkillPower.huntress.unitDamagePerRank,
      heroSkillPower.huntress.unitDamagePerAwakening,
      this.heroMasteryLevel,
    );
    const bossDamage = scaledHeroSkillPower(
      heroSkillPower.huntress.bossDamage,
      heroSkillPower.huntress.bossDamagePerRank,
      heroSkillPower.huntress.bossDamagePerAwakening,
      this.heroMasteryLevel,
    );
    const targets = this.units.filter((unit) => unit.alive && unit.side === 'enemy');
    for (const [index, target] of targets.entries()) {
      this.time.delayedCall(index * 55, () => {
        if (!target.alive) return;
        const arrow = this.add.rectangle(target.container.x + 30, 100, 3, 45, 0xe7f5b0).setAngle(25).setDepth(800);
        this.tweens.add({
          targets: arrow, x: target.container.x, y: target.container.y, duration: 280, ease: 'Quad.In',
          onComplete: () => {
            arrow.destroy();
            this.showStrike(target.container.x, target.container.y, 0xc7ef8a);
            this.damageUnit(target, target.isBoss ? bossDamage : unitDamage);
          },
        });
      });
    }
  }

  private activateSaintSkill(): void {
    const centerX = this.hero!.container.x;
    const heal = scaledHeroSkillPower(
      heroSkillPower.saint.heal,
      heroSkillPower.saint.healPerRank,
      heroSkillPower.saint.healPerAwakening,
      this.heroMasteryLevel,
    );
    const castleHeal = scaledHeroSkillPower(
      heroSkillPower.saint.castleHeal,
      heroSkillPower.saint.castleHealPerRank,
      heroSkillPower.saint.castleHealPerAwakening,
      this.heroMasteryLevel,
    );
    const prayer = this.add.circle(centerX, GROUND_Y, 30, 0xffedaa, 0.18).setStrokeStyle(4, 0xfff7d6, 0.8).setDepth(700);
    this.tweens.add({ targets: prayer, radius: 245, alpha: 0, duration: 650, onComplete: () => prayer.destroy() });
    for (const unit of this.units) {
      if (unit.alive && unit.side === 'player' && Math.abs(unit.container.x - centerX) <= 240) this.healUnit(unit, heal, true);
    }
    this.playerCastleHp = Math.min(this.playerCastleMaxHp, this.playerCastleHp + castleHeal);
  }

  private activateMarshalSkill(): void {
    const centerX = this.hero!.container.x;
    const shield = scaledHeroSkillPower(
      heroSkillPower.marshal.shield,
      heroSkillPower.marshal.shieldPerRank,
      heroSkillPower.marshal.shieldPerAwakening,
      this.heroMasteryLevel,
    );
    const rally = this.add.circle(centerX, GROUND_Y, 26, 0x8faeff, 0.16).setStrokeStyle(4, 0xcbd8ff, 0.8).setDepth(700);
    this.tweens.add({ targets: rally, radius: 225, alpha: 0, duration: 600, onComplete: () => rally.destroy() });
    for (const unit of this.units) {
      if (!unit.alive || unit.side !== 'player' || Math.abs(unit.container.x - centerX) > 220) continue;
      unit.shield += shield;
      this.flashAt(unit.container.x, unit.container.y, 0xa8bbff);
    }
  }

  private activateOrcChampionSkill(): void {
    const centerX = this.hero!.container.x;
    const damage = scaledHeroSkillPower(
      heroSkillPower.orcChampion.damage,
      heroSkillPower.orcChampion.damagePerRank,
      heroSkillPower.orcChampion.damagePerAwakening,
      this.heroMasteryLevel,
    );
    const shield = scaledHeroSkillPower(
      heroSkillPower.orcChampion.shield,
      heroSkillPower.orcChampion.shieldPerRank,
      heroSkillPower.orcChampion.shieldPerAwakening,
      this.heroMasteryLevel,
    );
    const shockwave = this.add.circle(centerX, GROUND_Y, 28, 0xb8864c, 0.2).setStrokeStyle(5, 0xe8bd78, 0.85).setDepth(700);
    this.tweens.add({ targets: shockwave, radius: 210, alpha: 0, duration: 620, onComplete: () => shockwave.destroy() });
    this.cameras.main.shake(160, 0.004);
    for (const unit of this.units) {
      if (!unit.alive || Math.abs(unit.container.x - centerX) > 205) continue;
      if (unit.side === 'enemy') this.damageUnit(unit, damage);
      else {
        unit.shield += shield;
        this.flashAt(unit.container.x, unit.container.y, 0xd9ab68);
      }
    }
  }

  private activateWindSpiritSkill(): void {
    const centerX = Phaser.Math.Clamp(this.hero!.container.x + 190, PLAYER_CASTLE_X + 120, this.enemyCastleX);
    const unitDamage = scaledHeroSkillPower(
      heroSkillPower.windSpirit.unitDamage,
      heroSkillPower.windSpirit.unitDamagePerRank,
      heroSkillPower.windSpirit.unitDamagePerAwakening,
      this.heroMasteryLevel,
    );
    const castleDamage = scaledHeroSkillPower(
      heroSkillPower.windSpirit.castleDamage,
      heroSkillPower.windSpirit.castleDamagePerRank,
      heroSkillPower.windSpirit.castleDamagePerAwakening,
      this.heroMasteryLevel,
    );
    const storm = this.add.circle(centerX, GROUND_Y - 55, 35, 0x83e8f1, 0.16).setStrokeStyle(5, 0xd9fbff, 0.82).setDepth(700);
    this.tweens.add({ targets: storm, radius: 190, angle: 300, alpha: 0, duration: 720, onComplete: () => storm.destroy() });
    for (const unit of this.units) {
      if (unit.alive && unit.side === 'enemy' && Math.abs(unit.container.x - centerX) <= 185) {
        this.damageUnit(unit, unitDamage);
        this.flashAt(unit.container.x, unit.container.y, 0x8beaf1);
      }
    }
    if (!this.stageDefinition.challenge && Math.abs(this.enemyCastleX - centerX) <= 185) this.damageCastle('enemy', castleDamage);
  }

  private activateCastleSkill(): void {
    if (this.ended || this.isPaused || this.castleSkillCooldown > 0) return;
    let centerX = this.enemyCastleX;
    let hasTarget = false;
    for (const unit of this.units) {
      if (!unit.alive || unit.side !== 'enemy' || unit.definition.tags.includes('flying')) continue;
      if (unit.container.x - PLAYER_CASTLE_X > this.castleStats.bombardRange) continue;
      hasTarget = true;
      centerX = Math.min(centerX, unit.container.x);
    }
    const castleInRange = !this.stageDefinition.challenge
      && this.castleStats.bombardCastleDamage > 0
      && this.enemyCastleX - PLAYER_CASTLE_X <= this.castleStats.bombardRange;
    if (!hasTarget && !castleInRange) return;
    this.castleSkillCooldown = this.castleStats.bombardCooldownMs;
    this.castleSkillUses += 1;
    const shell = this.add.circle(PLAYER_CASTLE_X + 20, 390, 9, 0xf0d187).setDepth(800);
    this.tweens.add({
      targets: shell, x: centerX, y: GROUND_Y - 8, duration: 720, ease: 'Quad.In',
      onComplete: () => {
        shell.destroy();
        musicEngine.playEffect('heavy');
        this.cameras.main.shake(220, 0.007);
        const blast = this.add.circle(centerX, GROUND_Y, 25, 0xf0b34d, 0.65).setDepth(650);
        this.tweens.add({ targets: blast, radius: this.castleStats.bombardRadius, alpha: 0, duration: 380, onComplete: () => blast.destroy() });
        for (const target of this.units) {
          if (target.alive && target.side === 'enemy' && !target.definition.tags.includes('flying') && Math.abs(target.container.x - centerX) <= this.castleStats.bombardRadius) {
            this.damageUnit(target, this.castleStats.bombardDamage + (target.isBoss ? this.castleStats.bombardBossBonus : 0));
          }
        }
        if (!this.stageDefinition.challenge && this.castleStats.bombardCastleDamage > 0 && Math.abs(this.enemyCastleX - centerX) <= this.castleStats.bombardRadius) {
          this.damageCastle('enemy', this.castleStats.bombardCastleDamage);
        }
      },
    });
    this.emitHud();
  }

  private activateMobilization(): void {
    if (this.ended || this.isPaused) return;
    if (!canActivateMobilization(this.command, this.mobilizationUses, battleMobilizationTuning.maxUses)) return;
    this.command -= mobilizationCommandCost(this.mobilizationUses);
    this.mobilizationUses += 1;
    const mobilizedStats = mobilizedCommandStats(
      this.castleStats.maxCommand,
      this.castleStats.commandRegen,
      this.castleStats.mobilizationMaxCommandBonus,
      this.castleStats.mobilizationCommandRegenBonus,
    );
    this.castleStats = {
      ...this.castleStats,
      ...mobilizedStats,
    };
    musicEngine.playEffect('skill');
    this.cameras.main.flash(240, 100, 205, 235, false);
    const banner = this.add.text(PLAYER_CASTLE_X + 85, GROUND_Y - 135, `${battleMobilizationTuning.name} ${this.mobilizationUses}단계`, {
      fontFamily: 'Pretendard Variable, system-ui, sans-serif', fontSize: '22px', color: '#bcefff', fontStyle: 'bold',
      stroke: '#11232e', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(900);
    this.tweens.add({ targets: banner, y: banner.y - 32, alpha: 0, duration: 900, onComplete: () => banner.destroy() });
    this.emitHud();
  }

  private toggleRallyTargeting(): void {
    if (this.ended || this.isPaused || !this.castleStats.rallyUnlocked || this.rallyCooldown > 0) return;
    this.rallyTargeting = !this.rallyTargeting;
    this.emitHud();
  }

  private placeRallyFlag(pointer: Phaser.Input.Pointer): void {
    if (!this.rallyTargeting || this.ended || this.isPaused || !this.rallyFlag) return;
    const targetX = Phaser.Math.Clamp(pointer.worldX, PLAYER_CASTLE_X + 65, this.enemyCastleX - 80);
    this.rallyTargetX = targetX;
    this.rallyRemaining = rallyCommandTuning.activeDurationMs;
    this.rallyTargeting = false;
    this.rallyCooldown = this.castleStats.rallyCooldownMs;
    this.rallyFlag.setPosition(targetX, GROUND_Y - 7).setVisible(true);
    musicEngine.playEffect('skill');
    this.emitHud();
  }

  private clearRallyOrder(): void {
    if (!this.castleStats.rallyUnlocked) return;
    this.rallyTargetX = undefined;
    this.rallyRemaining = 0;
    this.rallyTargeting = false;
    this.rallyFlag?.setVisible(false);
    this.emitHud();
  }

  private awakenBoss(): void {
    this.bossAwake = true;
    const status = this.children.getByName('boss-status');
    if (status) status.destroy();
    this.cameras.main.shake(420, 0.008);
    const text = this.add.text(WORLD_WIDTH / 2, 185, `${this.stageDefinition.bossName ?? '마수'}가 달려듭니다`, {
      fontFamily: 'Pretendard Variable, system-ui, sans-serif', fontSize: '32px', color: '#ffd0b3', fontStyle: 'bold',
      stroke: '#3b1518', strokeThickness: 7,
    }).setOrigin(0.5).setDepth(800).setAlpha(0);
    this.tweens.add({ targets: text, alpha: 1, y: 140, duration: 350, yoyo: true, hold: 1100, onComplete: () => text.destroy() });
  }

  private enterBossPhaseTwo(): void {
    this.bossPhase = 2;
    if (!this.boss) return;
    const encounterScale = this.stageDefinition.challenge ? bossCombatTuning.challengeVisualScale : 1;
    this.boss.baseScale = encounterScale * bossCombatTuning.phaseTwoVisualScaleMultiplier;
    this.boss.container.setScale(this.boss.baseScale);
    this.boss.shadow.y = this.boss.shadowGroundOffset / this.boss.baseScale;
    this.boss.container.iterate((child: Phaser.GameObjects.GameObject) => {
      if ('setTint' in child && typeof child.setTint === 'function') child.setTint(0xff755c);
    });
    this.cameras.main.flash(350, 145, 35, 30);
    const text = this.add.text(WORLD_WIDTH / 2, 210, '분노', {
      fontFamily: 'Pretendard Variable, system-ui, sans-serif', fontSize: '38px', color: '#ff8f6b', fontStyle: 'bold', stroke: '#311014', strokeThickness: 8,
    }).setOrigin(0.5).setDepth(800);
    this.tweens.add({ targets: text, alpha: 0, scale: 1.3, duration: 1200, onComplete: () => text.destroy() });
  }

  private updateBoss(delta: number): void {
    this.bossStompTimer -= delta;
    if (this.bossStompTimer > 0 || !this.boss?.alive) return;
    const cadence = this.stageDefinition.bossModifiers?.stompCadenceMultiplier ?? 1;
    this.bossStompTimer = (this.bossPhase === 2 ? bossCombatTuning.phaseTwoStompIntervalMs : bossCombatTuning.phaseOneStompIntervalMs) * cadence;
    const x = this.boss.container.x;
    this.clearBossStompTelegraph();
    const warning = this.add.circle(x, GROUND_Y + 12, bossCombatTuning.stompRadius, 0xf15d43, 0.08).setStrokeStyle(3, 0xff795d, 0.65).setDepth(2);
    this.bossStompWarning = warning;
    this.bossStompWarningTween = this.tweens.add({ targets: warning, alpha: 0.28, duration: 320, yoyo: true, repeat: 1 });
    this.bossStompEvent = this.time.delayedCall(850, () => {
      const shouldResolve = Boolean(this.boss?.alive) && !this.ended && !this.isPaused;
      this.clearBossStompTelegraph(false);
      if (!shouldResolve) return;
      musicEngine.playEffect('heavy');
      this.cameras.main.shake(260, 0.009);
      const stompDamage = Math.round(this.boss!.definition.attackDamage * (
        this.bossPhase === 2 ? bossCombatTuning.phaseTwoStompDamageMultiplier : bossCombatTuning.phaseOneStompDamageMultiplier
      ));
      for (const unit of this.units) {
        if (unit.alive && unit.side === 'player' && !unit.definition.tags.includes('flying') && Math.abs(unit.container.x - x) <= bossCombatTuning.stompRadius) {
          this.damageUnit(unit, stompDamage);
          unit.container.x -= bossCombatTuning.stompKnockback;
        }
      }
    });
  }

  private clearBossStompTelegraph(cancelEvent = true): void {
    if (cancelEvent) this.bossStompEvent?.remove(false);
    this.bossStompEvent = undefined;
    this.bossStompWarningTween?.stop();
    this.bossStompWarningTween = undefined;
    this.bossStompWarning?.destroy();
    this.bossStompWarning = undefined;
  }

  private updateWatchtower(delta: number): void {
    if (this.castleStats.towerDamage <= 0) return;
    this.towerAttackTimer -= delta;
    if (this.towerAttackTimer > 0) return;
    let target: CombatUnit | undefined;
    for (const unit of this.units) {
      if (!unit.alive || unit.side !== 'enemy' || unit.container.x - PLAYER_CASTLE_X > this.castleStats.towerRange) continue;
      if (!target || unit.container.x < target.container.x) target = unit;
    }
    if (!target) return;
    this.towerAttackTimer = this.castleStats.towerIntervalMs;
    const bolt = this.add.circle(PLAYER_CASTLE_X + 25, 420, 5, 0xeed68b).setDepth(800);
    this.tweens.add({
      targets: bolt, x: target.container.x, y: target.container.y, duration: 220,
      onComplete: () => {
        bolt.destroy();
        if (target.alive) {
          musicEngine.playEffect('ranged');
          this.showStrike(target.container.x, target.container.y, 0xeed68b);
          this.damageUnit(target, this.castleStats.towerDamage);
        }
      },
    });
  }

  private updateEnemyFortressAttack(delta: number): void {
    const attack = this.stageDefinition.enemyFortressAttack;
    if (!attack || this.enemyHp <= 0) return;
    this.enemyFortressAttackTimer -= delta;
    if (this.enemyFortressAttackTimer > 0) return;
    let target: CombatUnit | undefined;
    for (const unit of this.units) {
      if (!unit.alive || unit.side !== 'player' || this.enemyCastleX - unit.container.x > attack.range) continue;
      if (!target || unit.container.x > target.container.x) target = unit;
    }
    if (!target) return;
    this.enemyFortressAttackTimer = attack.intervalMs;
    this.launchPooledProjectile(this.enemyCastleX - 25, 420, target, 0xe9685d, 220, 'siege');
    musicEngine.playEffect('ranged');
    this.showStrike(target.container.x, target.container.y, 0xe9685d);
    this.damageUnit(target, Math.max(1, attack.damage - (target.definition.defense ?? 0)));
  }

  private launchProjectile(attacker: CombatUnit, target: CombatUnit): void {
    this.launchPooledProjectile(
      attacker.container.x,
      attacker.container.y - 5,
      target,
      attacker.definition.accent,
      150,
      projectileVisualStyle(attacker.definition),
    );
  }

  private launchPooledProjectile(startX: number, startY: number, target: CombatUnit, color: number, durationMs: number, style: ProjectileVisualStyle): void {
    const effect = this.projectileEffects.find((candidate) => !candidate.object.active);
    if (!effect) return;
    effect.elapsedMs = 0;
    effect.durationMs = durationMs;
    effect.startX = startX;
    effect.startY = startY;
    effect.endX = target.container.x;
    effect.endY = target.container.y - 4;
    effect.style = style;
    const angle = Math.atan2(effect.endY - effect.startY, effect.endX - effect.startX);
    effect.arrowShaft.setVisible(style === 'arrow').setFillStyle(0x9a6b36, 1);
    effect.arrowHead.setVisible(style === 'arrow').setFillStyle(color, 1);
    effect.magicCore.setVisible(style === 'magic').setFillStyle(color, 0.95);
    effect.magicRing.setVisible(style === 'magic').setStrokeStyle(2, color, 0.82);
    effect.bombBody.setVisible(style === 'bomb').setFillStyle(0x25242a, 1).setStrokeStyle(2, color, 0.9);
    effect.bombFuse.setVisible(style === 'bomb').setFillStyle(0xf2bd59, 1);
    effect.siegeShell.setVisible(style === 'siege').setFillStyle(color, 1);
    effect.object
      .setPosition(effect.startX, effect.startY)
      .setRotation(angle)
      .setScale(1)
      .setAlpha(1)
      .setVisible(true)
      .setActive(true);
  }

  private showStrike(x: number, y: number, color: number): void {
    const effect = this.strikeEffects.find((candidate) => !candidate.object.active);
    if (!effect) return;
    effect.elapsedMs = 0;
    effect.durationMs = 170;
    effect.object.setPosition(x, y - 4).setFillStyle(color, 0.9).setAlpha(1).setAngle(0).setScale(1).setVisible(true).setActive(true);
  }

  private flashAt(x: number, y: number, color: number): void {
    const effect = this.flashEffects.find((candidate) => !candidate.object.active);
    if (!effect) return;
    effect.elapsedMs = 0;
    effect.durationMs = 300;
    effect.object.setPosition(x, y).setRadius(12).setFillStyle(color, 0.38).setAlpha(1).setVisible(true).setActive(true);
  }

  private showGroundTelegraph(owner: CombatUnit, x: number, radius: number, durationMs: number, color: number): void {
    const effect = this.groundTelegraphEffects.find((candidate) => !candidate.object.active);
    if (!effect) return;
    effect.elapsedMs = 0;
    effect.durationMs = Math.max(1, durationMs);
    effect.radius = radius;
    effect.owner = owner;
    effect.object
      .setPosition(x, GROUND_Y + 4)
      .setRadius(radius)
      .setFillStyle(color, 0.08)
      .setStrokeStyle(3, color, 0.72)
      .setScale(0.72, 0.24)
      .setAlpha(1)
      .setVisible(true)
      .setActive(true);
  }

  private showGuardInterception(attacker: CombatUnit, guard: CombatUnit): void {
    const effect = this.guardEffects.find((candidate) => !candidate.object.active);
    if (!effect) return;
    const direction = attacker.side === 'player' ? 1 : -1;
    const rearMultiplier = guard.definition.guardProtection?.rearRangeMultiplier ?? 0;
    effect.elapsedMs = 0;
    effect.durationMs = 300;
    effect.ring.setStrokeStyle(4, guard.definition.accent, 0.92).setScale(1);
    effect.wake
      .setPosition(direction * (24 + rearMultiplier * 22), 0)
      .setOrigin(direction === 1 ? 0 : 1, 0.5)
      .setDisplaySize(42 + rearMultiplier * 70, 14)
      .setFillStyle(guard.definition.accent, 0.3);
    effect.object
      .setPosition(guard.container.x, guard.container.y)
      .setScale(1)
      .setAlpha(1)
      .setVisible(true)
      .setActive(true);
  }

  private createEffectPools(): void {
    for (let index = 0; index < 32; index += 1) {
      const object = this.add.star(0, 0, 4, 4, 13, 0xffffff, 0.9).setDepth(600).setVisible(false).setActive(false);
      this.strikeEffects.push({ object, elapsedMs: 0, durationMs: 170 });
    }
    for (let index = 0; index < 24; index += 1) {
      const arrowShaft = this.add.rectangle(0, 0, 18, 2, 0x9a6b36).setOrigin(0.5);
      const arrowHead = this.add.triangle(11, 0, 0, -4, 0, 4, 7, 0, 0xffffff);
      const magicCore = this.add.star(0, 0, 6, 3, 8, 0xffffff, 0.95);
      const magicRing = this.add.circle(0, 0, 11, 0xffffff, 0).setStrokeStyle(2, 0xffffff, 0.82);
      const bombBody = this.add.circle(0, 0, 7, 0x25242a).setStrokeStyle(2, 0xffffff, 0.9);
      const bombFuse = this.add.rectangle(4, -8, 2, 7, 0xf2bd59).setRotation(-0.6);
      const siegeShell = this.add.rectangle(0, 0, 15, 6, 0xffffff).setOrigin(0.5).setStrokeStyle(1, 0x3d2730, 0.9);
      const object = this.add.container(0, 0, [arrowShaft, arrowHead, magicRing, magicCore, bombBody, bombFuse, siegeShell])
        .setDepth(600)
        .setVisible(false)
        .setActive(false);
      arrowShaft.setVisible(false);
      arrowHead.setVisible(false);
      magicCore.setVisible(false);
      magicRing.setVisible(false);
      bombBody.setVisible(false);
      bombFuse.setVisible(false);
      siegeShell.setVisible(false);
      this.projectileEffects.push({
        object,
        arrowShaft,
        arrowHead,
        magicCore,
        magicRing,
        bombBody,
        bombFuse,
        siegeShell,
        style: 'magic',
        elapsedMs: 0,
        durationMs: 150,
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0,
      });
    }
    for (let index = 0; index < 8; index += 1) {
      const object = this.add.circle(0, 0, 12, 0xffffff, 0.38).setDepth(500).setVisible(false).setActive(false);
      this.flashEffects.push({ object, elapsedMs: 0, durationMs: 300 });
    }
    for (let index = 0; index < 12; index += 1) {
      const object = this.add.circle(0, 0, 20, 0xffffff, 0.08)
        .setStrokeStyle(3, 0xffffff, 0.72)
        .setDepth(495)
        .setVisible(false)
        .setActive(false);
      this.groundTelegraphEffects.push({ object, elapsedMs: 0, durationMs: 1, radius: 20 });
    }
    for (let index = 0; index < 12; index += 1) {
      const ring = this.add.circle(0, 0, 25, 0xffffff, 0).setStrokeStyle(4, 0xffffff, 0.92);
      const wake = this.add.rectangle(28, 0, 48, 14, 0xffffff, 0.3).setOrigin(0, 0.5);
      const object = this.add.container(0, 0, [wake, ring]).setDepth(610).setVisible(false).setActive(false);
      this.guardEffects.push({ object, ring, wake, elapsedMs: 0, durationMs: 300 });
    }
  }

  private updatePooledEffects(delta: number): void {
    for (const effect of this.strikeEffects) {
      if (!effect.object.active) continue;
      effect.elapsedMs = Math.min(effect.durationMs, effect.elapsedMs + delta);
      const progress = effect.elapsedMs / effect.durationMs;
      effect.object.setAlpha(1 - progress).setAngle(80 * progress).setScale(1 + 0.7 * progress);
      if (progress >= 1) effect.object.setVisible(false).setActive(false);
    }
    for (const effect of this.projectileEffects) {
      if (!effect.object.active) continue;
      effect.elapsedMs = Math.min(effect.durationMs, effect.elapsedMs + delta);
      const progress = effect.elapsedMs / effect.durationMs;
      const flightArc = effect.style === 'bomb' ? 18 : effect.style === 'magic' ? 7 : 0;
      effect.object.setPosition(
        Phaser.Math.Linear(effect.startX, effect.endX, progress),
        Phaser.Math.Linear(effect.startY, effect.endY, progress) - Math.sin(progress * Math.PI) * flightArc,
      );
      if (effect.style === 'magic') {
        effect.object.setRotation(effect.object.rotation + delta * 0.012).setScale(0.9 + Math.sin(progress * Math.PI) * 0.3);
      } else if (effect.style === 'bomb') {
        effect.object.setRotation(effect.object.rotation + delta * 0.01);
      }
      if (progress >= 1) effect.object.setVisible(false).setActive(false);
    }
    for (const effect of this.flashEffects) {
      if (!effect.object.active) continue;
      effect.elapsedMs = Math.min(effect.durationMs, effect.elapsedMs + delta);
      const progress = effect.elapsedMs / effect.durationMs;
      effect.object.setRadius(12 + 30 * progress).setAlpha(1 - progress);
      if (progress >= 1) effect.object.setVisible(false).setActive(false);
    }
    for (const effect of this.groundTelegraphEffects) {
      if (!effect.object.active) continue;
      if (!effect.owner?.alive) {
        effect.owner = undefined;
        effect.object.setVisible(false).setActive(false);
        continue;
      }
      effect.elapsedMs = Math.min(effect.durationMs, effect.elapsedMs + delta);
      const progress = effect.elapsedMs / effect.durationMs;
      const pulse = 0.82 + Math.sin(progress * Math.PI * 5) * 0.05;
      effect.object
        .setRadius(effect.radius)
        .setScale((0.72 + progress * 0.28) * pulse, (0.24 + progress * 0.05) * pulse)
        .setAlpha(0.4 + progress * 0.6);
      if (progress >= 1) {
        effect.owner = undefined;
        effect.object.setVisible(false).setActive(false);
      }
    }
    for (const effect of this.guardEffects) {
      if (!effect.object.active) continue;
      effect.elapsedMs = Math.min(effect.durationMs, effect.elapsedMs + delta);
      const progress = effect.elapsedMs / effect.durationMs;
      effect.ring.setScale(1 + progress * 0.45);
      effect.object.setScale(1 + progress * 0.18, 1 - progress * 0.08).setAlpha(1 - progress);
      if (progress >= 1) effect.object.setVisible(false).setActive(false);
    }
  }

  private updateUnitFeedback(unit: CombatUnit, delta: number): void {
    if (unit.damageFlashMs > 0) {
      unit.damageFlashMs = Math.max(0, unit.damageFlashMs - delta);
      if (unit.damageFlashMs === 0) unit.container.setAlpha(1);
    }
    if (unit.attackMotionMs > 0) {
      const duration = Math.max(1, unit.attackMotionDurationMs);
      unit.attackMotionMs = Math.max(0, unit.attackMotionMs - delta);
      sampleAttackMotion(unit.attackRig.style, 1 - unit.attackMotionMs / duration, unit.attackPose);
      const { attackRig: rig, attackPose: pose } = unit;
      rig.root.x = rig.direction * (rig.baseX + pose.reach);
      rig.root.y = rig.baseY + pose.lift;
      rig.root.setAngle(rig.direction * pose.shoulderAngle).setAlpha(pose.opacity);
      rig.forearm.setAngle(pose.elbowAngle);
      rig.weapon.setAngle(pose.weaponAngle);
      rig.energy.setScale(pose.energyScale);
      if (unit.attackMotionMs === 0) rig.root.setAlpha(0);
    } else if (unit.attackRig.root.alpha !== 0) {
      unit.attackRig.root.setAlpha(0);
    }
  }

  private updateBars(): void {
    this.playerCastleBar.scaleX = Phaser.Math.Clamp(this.playerCastleHp / this.playerCastleMaxHp, 0, 1);
    if (!this.stageDefinition.challenge && this.enemyBar) this.enemyBar.scaleX = Phaser.Math.Clamp(this.enemyHp / this.enemyMaxHp, 0, 1);
  }

  private togglePause(): void {
    if (this.ended) return;
    if (this.rallyTargeting) {
      this.rallyTargeting = false;
      this.emitHud();
      return;
    }
    this.isPaused = !this.isPaused;
    this.emitHud();
  }

  private setBattleSpeed(speed: BattleSpeed): void {
    if (speed !== 1 && speed !== 1.5) return;
    this.battleSpeed = speed;
    this.time.timeScale = speed;
    this.tweens.timeScale = speed;
    this.emitHud();
  }

  private emitHud(): void {
    const state: BattleHudState = {
      command: Math.floor(this.command), maxCommand: this.castleStats.maxCommand,
      playerCastleHp: Math.ceil(this.playerCastleHp), playerCastleMaxHp: this.playerCastleMaxHp,
      enemyHp: Math.ceil(this.enemyHp), enemyMaxHp: this.enemyMaxHp,
      enemyName: this.stageDefinition.challenge ? (this.stageDefinition.bossName ?? '마수') : this.stageDefinition.boss ? '마수 수비 성채' : '적 성채',
      heroHp: this.hero?.alive ? Math.ceil(this.hero.hp) : 0, heroMaxHp: this.heroDefinition.maxHp,
      heroRespawnMs: Math.max(0, this.heroRespawn), heroSkillCooldownMs: this.heroSkillCooldown,
      heroSkillMaxCooldownMs: this.heroDefinition.skillCooldownMs,
      heroName: `${this.heroDefinition.name} · ${this.heroDefinition.title}`,
      heroSkillName: this.heroDefinition.skillName,
      heroIcon: this.heroDefinition.icon,
      castleSkillCooldownMs: this.castleSkillCooldown,
      castleSkillMaxCooldownMs: this.castleStats.bombardCooldownMs,
      mobilizationUses: this.mobilizationUses,
      mobilizationMaxUses: battleMobilizationTuning.maxUses,
      rallyUnlocked: this.castleStats.rallyUnlocked,
      rallyHeroControl: this.castleStats.rallyHeroControl,
      rallyTranscendentControl: this.castleStats.rallyTranscendentControl,
      rallyTargeting: this.rallyTargeting,
      rallyTargetActive: this.rallyTargetX !== undefined,
      rallyRemainingMs: this.rallyRemaining,
      rallyCooldownMs: this.rallyCooldown,
      rallyCooldownMaxMs: this.castleStats.rallyCooldownMs,
      spawnCooldowns: { ...this.spawnCooldowns },
      unitCosts: Object.fromEntries(this.equippedUnits.map((id) => [id, soldierCommandCost(troopDefinitions[id].cost, this.castleStats.summonCostMultiplier)])),
      activeUnitCounts: Object.fromEntries(this.equippedUnits.map((id) => [id, this.activeUnitCount('player', id)])),
      elapsedMs: this.elapsed,
      bossAwake: this.bossAwake, bossPhase: this.bossPhase,
      bossHp: this.boss?.alive ? Math.max(0, Math.ceil(this.boss.hp)) : 0,
      bossMaxHp: this.boss?.maxHp ?? 0,
      paused: this.isPaused,
      battleSpeed: this.battleSpeed,
    };
    battleEvents.emit(BattleEvent.HUD, state);
  }

  private finish(victory: boolean): void {
    if (this.ended) return;
    this.ended = true;
    this.clearBossStompTelegraph();
    this.cameras.main.fadeOut(700, victory ? 230 : 70, victory ? 210 : 30, victory ? 155 : 35);
    this.time.delayedCall(650, () => {
      battleEvents.emit(BattleEvent.RESULT, {
        victory, stageId: this.stageDefinition.id,
        reward: victory ? this.stageDefinition.reward : Math.floor(this.stageDefinition.reward * 0.2),
        elapsedMs: this.elapsed, kills: this.kills, unitsLost: this.unitsLost, heroDeaths: this.heroDeaths,
        summons: { ...this.summons }, usedHeroId: this.heroId,
        heroSkillUses: this.heroSkillUses, castleSkillUses: this.castleSkillUses,
        encounteredEnemies: [...this.encounteredEnemies],
      });
    });
  }

  private cleanup(): void {
    this.clearBossStompTelegraph();
    battleEvents.off(BattleEvent.SPAWN, this.handleSpawn, this);
    battleEvents.off(BattleEvent.SKILL, this.activateHeroSkill, this);
    battleEvents.off(BattleEvent.CASTLE_SKILL, this.activateCastleSkill, this);
    battleEvents.off(BattleEvent.MOBILIZE, this.activateMobilization, this);
    battleEvents.off(BattleEvent.RALLY_MODE, this.toggleRallyTargeting, this);
    battleEvents.off(BattleEvent.RALLY_CLEAR, this.clearRallyOrder, this);
    battleEvents.off(BattleEvent.PAUSE, this.togglePause, this);
    battleEvents.off(BattleEvent.SPEED, this.setBattleSpeed, this);
    this.input.off('pointerdown', this.placeRallyFlag, this);
    this.pendingUnitRemovalIds.clear();
    this.attackTargetBuffer.length = 0;
    this.strikeEffects.length = 0;
    this.projectileEffects.length = 0;
    this.flashEffects.length = 0;
    this.groundTelegraphEffects.length = 0;
    this.guardEffects.length = 0;
  }
}
