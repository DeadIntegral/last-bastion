import Phaser from 'phaser';
import type { BattleHudState, BattleResult, BattleSpeed, UnitId } from '../types/game';

export const battleEvents = new Phaser.Events.EventEmitter();

export const BattleEvent = {
  HUD: 'battle:hud',
  RESULT: 'battle:result',
  SPAWN: 'command:spawn',
  SKILL: 'command:skill',
  CASTLE_SKILL: 'command:castle-skill',
  MOBILIZE: 'command:mobilize',
  RALLY_MODE: 'command:rally-mode',
  RALLY_CLEAR: 'command:rally-clear',
  PAUSE: 'command:pause',
  SPEED: 'command:speed',
} as const;

export type HudListener = (state: BattleHudState) => void;
export type ResultListener = (result: BattleResult) => void;
export type SpawnListener = (id: UnitId) => void;
export type SpeedListener = (speed: BattleSpeed) => void;
