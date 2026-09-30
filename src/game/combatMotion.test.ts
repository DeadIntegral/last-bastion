import { describe, expect, it } from 'vitest';
import { bossDefinition, heroDefinitions, troopDefinitions } from '../data/units';
import { attackMotionDurationMs, attackMotionStyle, createAttackMotionPose, MAGIC_SPEAR_REAR_EXTENT, magicSpearRevealScale, projectileVisualStyle, sampleAttackMotion, type AttackMotionStyle } from './combatMotion';

describe('localized combat attack motion', () => {
  it('never reveals a magic-spear tail behind its launch point, even on short flights', () => {
    for (const distance of [0, 25, 100, 245, 500]) {
      expect(magicSpearRevealScale(0, distance)).toBe(0);
      for (const progress of [0.01, 0.1, 0.5, 1]) {
        const rearLength = magicSpearRevealScale(progress, distance) * MAGIC_SPEAR_REAR_EXTENT;
        expect(rearLength).toBeLessThanOrEqual(distance * progress + 1e-9);
      }
    }
  });
  it('assigns every current troop, hero, and boss a bounded reusable motion style', () => {
    const definitions = [...Object.values(troopDefinitions), ...Object.values(heroDefinitions), bossDefinition];
    const styles: AttackMotionStyle[] = ['slash', 'thrust', 'shoot', 'cast', 'breath', 'crush', 'lunge'];
    for (const definition of definitions) {
      expect(styles).toContain(attackMotionStyle(definition));
      expect(attackMotionDurationMs(attackMotionStyle(definition))).toBeGreaterThanOrEqual(170);
      expect(attackMotionDurationMs(attackMotionStyle(definition))).toBeLessThanOrEqual(280);
    }
    expect(attackMotionStyle(troopDefinitions.militia)).toBe('slash');
    expect(attackMotionStyle(troopDefinitions.lancer)).toBe('thrust');
    expect(attackMotionStyle(troopDefinitions.archer)).toBe('shoot');
    expect(attackMotionStyle(troopDefinitions.archmage)).toBe('cast');
    expect(attackMotionStyle(troopDefinitions.brute)).toBe('crush');
    expect(attackMotionStyle(troopDefinitions.hellhound)).toBe('lunge');
    expect(attackMotionStyle(troopDefinitions.hydra)).toBe('breath');
    expect(attackMotionStyle(troopDefinitions.allianceGuardian)).toBe('slash');
  });

  it('keeps the base body still while producing finite arm, weapon, and effect channels', () => {
    const pose = createAttackMotionPose();
    for (const style of ['slash', 'thrust', 'shoot', 'cast', 'breath', 'crush', 'lunge'] as AttackMotionStyle[]) {
      sampleAttackMotion(style, 0.5, pose);
      expect(Object.values(pose).every(Number.isFinite)).toBe(true);
      expect(pose.opacity).toBeGreaterThan(0);
      expect(Math.abs(pose.bodyX) + Math.abs(pose.bodyY) + Math.abs(pose.bodyAngle)).toBeGreaterThan(0);
    }
    sampleAttackMotion('thrust', 0.5, pose);
    expect(pose.reach).toBeGreaterThan(0);
    sampleAttackMotion('cast', 0.5, pose);
    expect(pose.energyScale).toBeGreaterThan(0.7);
    sampleAttackMotion('breath', 0.5, pose);
    expect(pose.energyScale).toBeGreaterThan(1);
  });

  it('gives arrows, orb spells, piercing spell-spears, and thrown bombs distinct pooled silhouettes', () => {
    expect(projectileVisualStyle(troopDefinitions.archer)).toBe('arrow');
    expect(projectileVisualStyle(troopDefinitions.crossbow)).toBe('arrow');
    expect(projectileVisualStyle(troopDefinitions.mage)).toBe('magicOrb');
    expect(projectileVisualStyle(troopDefinitions.archmage)).toBe('magicSpear');
    expect(projectileVisualStyle(troopDefinitions.ifrit)).toBe('magicSpear');
    expect(projectileVisualStyle(troopDefinitions.goblinBomber)).toBe('bomb');
    expect(projectileVisualStyle(troopDefinitions.hydra)).toBe('poisonBreath');
  });
});
