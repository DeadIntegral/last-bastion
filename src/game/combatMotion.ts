import type { UnitDefinition } from '../types/game';

export type AttackMotionStyle = 'slash' | 'thrust' | 'shoot' | 'cast' | 'crush' | 'lunge';
export type ProjectileVisualStyle = 'arrow' | 'magic' | 'bomb' | 'siege';

export interface AttackMotionPose {
  shoulderAngle: number;
  elbowAngle: number;
  weaponAngle: number;
  reach: number;
  lift: number;
  opacity: number;
  energyScale: number;
}

const creatureLungeIds = new Set([
  'griffin', 'hellhound', 'harpy', 'wyvern', 'slime', 'basilisk', 'direwolf', 'giantEagle',
  'hydra', 'gargoyle', 'cerberus',
]);

/** Resolve one of the reusable localized attack rigs without adding presentation fields to combat balance data. */
export function attackMotionStyle(definition: UnitDefinition): AttackMotionStyle {
  if (creatureLungeIds.has(definition.id)) return 'lunge';
  if (definition.id === 'pyromancer' || definition.tags.includes('magic') || definition.tags.includes('holy') || definition.tags.includes('elemental') && definition.tags.includes('ranged')) return 'cast';
  if (definition.tags.includes('ranged')) return 'shoot';
  if (definition.attackPattern.kind === 'pierce') return 'thrust';
  if (definition.tags.includes('large') || definition.attackPattern.kind === 'cleave') return 'crush';
  return 'slash';
}

export function attackMotionDurationMs(style: AttackMotionStyle): number {
  switch (style) {
    case 'thrust': return 170;
    case 'shoot': return 190;
    case 'cast': return 270;
    case 'crush': return 280;
    case 'lunge': return 190;
    default: return 210;
  }
}

/** Resolve a pooled projectile silhouette from canonical presentation tags and icons. */
export function projectileVisualStyle(definition: UnitDefinition): ProjectileVisualStyle {
  if (definition.icon === '➶' || definition.icon === '➹') return 'arrow';
  if (definition.id === 'goblinBomber') return 'bomb';
  return 'magic';
}

export function createAttackMotionPose(): AttackMotionPose {
  return { shoulderAngle: 0, elbowAngle: 0, weaponAngle: 0, reach: 0, lift: 0, opacity: 0, energyScale: 0 };
}

/** Writes into a spawn-time pose object so active battles do not allocate on every animation frame. */
export function sampleAttackMotion(style: AttackMotionStyle, rawProgress: number, pose: AttackMotionPose): void {
  const progress = Math.min(1, Math.max(0, rawProgress));
  const arc = Math.sin(progress * Math.PI);
  const snap = Math.sin(Math.min(1, progress * 1.65) * Math.PI);
  pose.opacity = Math.min(1, arc * 2.8);
  pose.energyScale = 0;
  pose.reach = 0;
  pose.lift = 0;
  pose.weaponAngle = 0;

  switch (style) {
    case 'thrust':
      pose.shoulderAngle = -12 + snap * 18;
      pose.elbowAngle = 28 - snap * 34;
      pose.reach = snap * 11;
      pose.weaponAngle = -4;
      break;
    case 'shoot':
      pose.shoulderAngle = -28 + snap * 25;
      pose.elbowAngle = 58 - snap * 72;
      pose.reach = snap * 4;
      pose.weaponAngle = 0;
      break;
    case 'cast':
      pose.shoulderAngle = -58 + arc * 46;
      pose.elbowAngle = 52 - arc * 26;
      pose.reach = arc * 5;
      pose.lift = -arc * 5;
      pose.energyScale = 0.35 + arc * 1.05;
      break;
    case 'crush':
      pose.shoulderAngle = -88 + snap * 142;
      pose.elbowAngle = 24 - snap * 18;
      pose.lift = -Math.sin(Math.min(1, progress * 1.4) * Math.PI) * 4;
      pose.weaponAngle = 18;
      break;
    case 'lunge':
      pose.shoulderAngle = -18 + snap * 28;
      pose.elbowAngle = 22 - snap * 20;
      pose.reach = snap * 13;
      pose.lift = -arc * 2;
      pose.weaponAngle = snap * 28;
      break;
    default:
      pose.shoulderAngle = -62 + snap * 118;
      pose.elbowAngle = 34 - snap * 30;
      pose.weaponAngle = 12;
      break;
  }
}
