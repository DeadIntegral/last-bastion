import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BattleEvent, battleEvents } from '../game/EventBus';
import { useGameStore } from '../store/useGameStore';
import type { BattleHudState } from '../types/game';
import { BattleView } from './BattleView';

vi.mock('../game/PhaserGame', () => ({ PhaserGame: () => <div data-testid="battlefield" /> }));
vi.mock('../game/EventBus', () => {
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
  const battleEvents = {
    on(event: string, listener: (...args: unknown[]) => void) {
      const eventListeners = listeners.get(event) ?? new Set();
      eventListeners.add(listener);
      listeners.set(event, eventListeners);
    },
    off(event: string, listener?: (...args: unknown[]) => void) {
      if (listener) listeners.get(event)?.delete(listener);
      else listeners.delete(event);
    },
    emit(event: string, ...args: unknown[]) {
      listeners.get(event)?.forEach((listener) => listener(...args));
    },
  };
  return {
    BattleEvent: {
      HUD: 'battle:hud', RESULT: 'battle:result', SPAWN: 'command:spawn', SKILL: 'command:skill',
      CASTLE_SKILL: 'command:castle-skill', MOBILIZE: 'command:mobilize', RALLY_MODE: 'command:rally-mode',
      RALLY_CLEAR: 'command:rally-clear', PAUSE: 'command:pause', SPEED: 'command:speed',
    },
    battleEvents,
  };
});

const pausedHud: BattleHudState = {
  command: 70, maxCommand: 200, playerCastleHp: 1_800, playerCastleMaxHp: 1_800,
  enemyHp: 2_000, enemyMaxHp: 2_000, enemyName: '적 성채', heroHp: 520, heroMaxHp: 520,
  heroRespawnMs: 0, heroSkillCooldownMs: 0, heroSkillMaxCooldownMs: 25_000,
  heroName: '에드릭 · 철벽의 기사', heroSkillName: '수호의 결계', heroIcon: '♛',
  castleSkillCooldownMs: 0, castleSkillMaxCooldownMs: 32_000,
  mobilizationUses: 0, mobilizationMaxUses: 3,
  rallyUnlocked: false, rallyHeroControl: false, rallyTranscendentControl: false,
  rallyTargeting: false, rallyTargetActive: false, rallyRemainingMs: 0, rallyCooldownMs: 0, rallyCooldownMaxMs: 0,
  spawnCooldowns: {}, unitCosts: {}, activeUnitCounts: {}, elapsedMs: 5_000,
  bossAwake: false, bossPhase: 1, bossHp: 0, bossMaxHp: 0, paused: true, battleSpeed: 1,
};

describe('battle exit', () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    localStorage.clear();
    useGameStore.getState().resetProgress();
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
  });

  it('leaves from the pause menu without producing a battle result or changing records', () => {
    const onResult = vi.fn();
    const onExit = vi.fn();
    const statsBefore = { ...useGameStore.getState().stats };
    act(() => root.render(<BattleView stageId={1} onResult={onResult} onExit={onExit} />));
    act(() => battleEvents.emit(BattleEvent.HUD, pausedHud));

    act(() => [...host.querySelectorAll<HTMLButtonElement>('.pause-actions button')]
      .find((button) => button.textContent === '전투 이탈')!.click());
    expect(host.querySelector('[role="dialog"] h2')?.textContent).toBe('전투에서 이탈할까요?');

    act(() => [...host.querySelectorAll<HTMLButtonElement>('.game-modal-actions button')]
      .find((button) => button.textContent === '이탈하고 지도로')!.click());

    expect(onExit).toHaveBeenCalledOnce();
    expect(onResult).not.toHaveBeenCalled();
    expect(useGameStore.getState().stats).toEqual(statsBefore);
  });
});
