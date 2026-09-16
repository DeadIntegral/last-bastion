import { describe, expect, it } from 'vitest';
import { bossDefinition, heroDefinitions, troopDefinitions } from '../data/units';
import { attackMotionDurationMs, attackMotionStyle, createAttackMotionPose, sampleAttackMotion, type AttackMotionStyle } from './combatMotion';

describe('localized combat attack motion', () => {
  it('assigns every current troop, hero, and boss a bounded reusable motion style', () => {
    const definitions = [...Object.values(troopDefinitions), ...Object.values(heroDefinitions), bossDefinition];
    const styles: AttackMotionStyle[] = ['slash', 'thrust', 'shoot', 'cast', 'crush', 'lunge'];
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
  });

  it('keeps the base body still while producing finite arm, weapon, and effect channels', () => {
    const pose = createAttackMotionPose();
    for (const style of ['slash', 'thrust', 'shoot', 'cast', 'crush', 'lunge'] as AttackMotionStyle[]) {
      sampleAttackMotion(style, 0.5, pose);
      expect(Object.values(pose).every(Number.isFinite)).toBe(true);
      expect(pose.opacity).toBeGreaterThan(0);
    }
    sampleAttackMotion('thrust', 0.5, pose);
    expect(pose.reach).toBeGreaterThan(0);
    sampleAttackMotion('cast', 0.5, pose);
    expect(pose.energyScale).toBeGreaterThan(1);
  });
});
