import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { OPENING_SCENE_DURATION_MS } from './data/opening';
import { achievementGroups, achievements } from './data/achievements';
import { setActiveSaveSlot } from './game/saveSlots';
import { useGameStore } from './store/useGameStore';

describe('title and kingdom-map navigation', () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    useGameStore.getState().resetProgress();
    localStorage.clear();
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', { configurable: true, value: vi.fn() });
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
    act(() => root.render(<App />));
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
  });

  it('keeps the title focused and exposes progression from the map hub', () => {
    const languageTrigger = host.querySelector<HTMLButtonElement>('.language-trigger')!;
    expect(languageTrigger.getAttribute('aria-expanded')).toBe('false');
    act(() => languageTrigger.click());
    expect(host.querySelector('[role="listbox"]')).not.toBeNull();
    expect(host.querySelectorAll('[role="option"]')).toHaveLength(3);
    expect(document.activeElement?.getAttribute('aria-selected')).toBe('true');
    act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    expect(host.querySelector('[role="listbox"]')).toBeNull();
    expect(document.activeElement).toBe(languageTrigger);

    const emptySlots = [...host.querySelectorAll<HTMLButtonElement>('.save-slot-card.empty')];
    expect(emptySlots).toHaveLength(3);
    expect(emptySlots.map((button) => button.textContent)).toEqual([
      'SLOT 1＋새 게임비어 있는 원정 기록',
      'SLOT 2＋새 게임비어 있는 원정 기록',
      'SLOT 3＋새 게임비어 있는 원정 기록',
    ]);

    act(() => emptySlots[0].click());

    expect(host.querySelector('.opening-story h1')?.textContent).toBe('대륙 최후의 밤');
    act(() => host.querySelector<HTMLButtonElement>('.opening-skip')!.click());

    expect(host.querySelector('.shell-header h1')?.textContent).toBe('왕국 지도');
    const hubButtons = [...host.querySelectorAll<HTMLButtonElement>('.map-command-center button')];
    expect(hubButtons).toHaveLength(9);
    expect(hubButtons.some((button) => button.textContent?.includes('마수 도전'))).toBe(false);
    expect(hubButtons.some((button) => button.textContent?.includes('영웅 훈련소'))).toBe(false);
    const heroHallButton = hubButtons.find((button) => button.textContent?.includes('영웅의 전당'))!;
    act(() => heroHallButton.click());
    expect(host.querySelector('.shell-header h1')?.textContent).toBe('영웅의 전당');
    expect(host.querySelector('.hero-training-panel.locked')?.textContent).toContain('9장 클리어 시 해금');
    act(() => host.querySelector<HTMLButtonElement>('.back-button')!.click());
    const refreshedHubButtons = [...host.querySelectorAll<HTMLButtonElement>('.map-command-center button')];
    const monumentButton = refreshedHubButtons.find((button) => button.textContent?.includes('승전 기념비'))!;
    expect(monumentButton.disabled).toBe(true);
    expect(monumentButton.textContent).toContain('30장 클리어 시 건립');
    const merchantButton = refreshedHubButtons.find((button) => button.textContent?.includes('수수께끼 상인'))!;
    expect(merchantButton.disabled).toBe(true);
    expect(merchantButton.textContent).toContain('6장 보스 격파 시 출현');

    act(() => useGameStore.setState({ clearedStages: [6], gems: 200 }));
    expect(merchantButton.disabled).toBe(false);
    act(() => merchantButton.click());
    expect(host.querySelector('.shell-header h1')?.textContent).toBe('수수께끼 상인');
    const licenseButton = host.querySelector<HTMLButtonElement>('.merchant-item-action button')!;
    expect(licenseButton.textContent).toContain('200');
    act(() => licenseButton.click());
    expect(useGameStore.getState().battleSpeedUnlocked).toBe(true);
    expect(useGameStore.getState().battleSpeed).toBe(1.5);
    expect(licenseButton.textContent).toContain('거래 완료');

    const formationButton = [...host.querySelectorAll<HTMLButtonElement>('.merchant-item-action button')][1];
    expect(formationButton.textContent).toContain('12장 클리어 필요');
    act(() => useGameStore.setState({ clearedStages: [6, 12], gems: 150 }));
    expect(formationButton.disabled).toBe(false);
    act(() => formationButton.click());
    expect(useGameStore.getState().formationSlotPurchases).toBe(1);
    expect(formationButton.textContent).toContain('18장 클리어 필요');

    act(() => host.querySelector<HTMLButtonElement>('.back-button')!.click());
    const challengeNode = host.querySelector<HTMLButtonElement>('[aria-label="마수 도전 오우거 대족장"]')!;
    expect(challengeNode).not.toBeNull();

    act(() => challengeNode.click());
    expect(host.querySelector('.map-mission h2')?.textContent).toBe('오우거 대족장');
    expect(host.querySelector('.map-mission')?.classList.contains('challenge-mission')).toBe(true);

    act(() => useGameStore.setState({ clearedStages: [6, 9], gold: 1_000 }));
    const updatedHeroHallButton = [...host.querySelectorAll<HTMLButtonElement>('.map-command-center button')]
      .find((button) => button.textContent?.includes('영웅의 전당'))!;
    act(() => updatedHeroHallButton.click());
    expect(host.querySelector('.hero-training-panel.locked')).toBeNull();
    const fieldDrill = host.querySelector<HTMLButtonElement>('.hero-training-panel .training-packages button')!;
    expect(fieldDrill.textContent).toContain('야전 훈련');
    act(() => fieldDrill.click());
    expect(useGameStore.getState().gold).toBe(750);
    expect(useGameStore.getState().heroMasteryXp.warden).toBe(100);
  });

  it('shows Continue, Export, and Delete on an occupied slot', () => {
    act(() => {
      setActiveSaveSlot(1);
      useGameStore.setState({ unlockedStage: 4, clearedStages: [1, 2, 3] });
      root.render(<App />);
    });

    const occupiedSlot = host.querySelector<HTMLElement>('.save-slot-card.occupied')!;
    expect(occupiedSlot.textContent).toContain('4장 원정');
    expect(occupiedSlot.textContent).toContain('v0.2.0');
    expect([...occupiedSlot.querySelectorAll('button')].map((button) => button.textContent)).toEqual(['이어하기', '내보내기', '삭제']);

    act(() => occupiedSlot.querySelector<HTMLButtonElement>('button.continue')!.click());
    expect(host.querySelector('.shell-header h1')?.textContent).toBe('왕국 지도');
    expect(useGameStore.getState().unlockedStage).toBe(4);
  });

  it('removes an equipped troop from the persistent formation strip across family filters', () => {
    act(() => host.querySelector<HTMLButtonElement>('.save-slot-card.empty')!.click());
    act(() => host.querySelector<HTMLButtonElement>('.opening-skip')!.click());
    act(() => useGameStore.setState({
      unlockedUnits: ['militia', 'guardian'],
      equippedUnits: ['militia', 'guardian'],
    }));

    const armoryButton = [...host.querySelectorAll<HTMLButtonElement>('.map-command-center button')]
      .find((button) => button.textContent?.includes('병영과 강화'))!;
    act(() => armoryButton.click());
    const goblinFilter = [...host.querySelectorAll<HTMLButtonElement>('.roster-filters button')]
      .find((button) => button.textContent?.includes('고블린'))!;
    act(() => goblinFilter.click());

    expect(host.querySelector('.unit-card.accent-guardian')).toBeNull();
    const guardianChip = [...host.querySelectorAll<HTMLButtonElement>('.formation-strip button')]
      .find((button) => button.textContent?.includes('방패병'))!;
    act(() => guardianChip.click());
    expect(useGameStore.getState().equippedUnits).toEqual(['militia']);
  });

  it('uses password and destructive-confirmation modals for slot management', () => {
    act(() => {
      setActiveSaveSlot(1);
      useGameStore.setState({ unlockedStage: 4, clearedStages: [1, 2, 3] });
      root.render(<App />);
    });
    const occupiedSlot = host.querySelector<HTMLElement>('.save-slot-card.occupied')!;
    act(() => [...occupiedSlot.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent === '내보내기')!.click());

    expect(host.querySelector('[role="dialog"] h2')?.textContent).toBe('슬롯 1 암호화 내보내기');
    expect(host.querySelector('.crypto-spec')?.textContent).toContain('AES-GCM 256');
    expect(host.querySelector('.crypto-spec')?.textContent).toContain('PBKDF2 · SHA-256');
    expect(document.activeElement).toBe(host.querySelector<HTMLInputElement>('.save-password-fields input'));
    act(() => host.querySelector<HTMLButtonElement>('.game-modal-close')!.click());

    act(() => [...occupiedSlot.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent === '삭제')!.click());
    expect(host.querySelector('[role="dialog"] h2')?.textContent).toBe('슬롯 1을 삭제할까요?');
    expect(document.activeElement?.textContent).toBe('취소');
    act(() => [...host.querySelectorAll<HTMLButtonElement>('.game-modal-actions button')].find((button) => button.textContent === '원정 기록 삭제')!.click());
    expect(host.querySelectorAll('.save-slot-card.empty')).toHaveLength(3);
  });

  it('autoplays the four-part prologue and enters the map without an advance action', () => {
    vi.useFakeTimers();
    try {
      const firstSlot = host.querySelector<HTMLButtonElement>('.save-slot-card.empty')!;
      act(() => firstSlot.click());
      expect(host.querySelector('.opening-story h1')?.textContent).toBe('대륙 최후의 밤');
      expect(host.querySelector('.opening-next')).toBeNull();

      for (const title of ['꺼지지 않은 불씨', '반격의 맹세', '최후의 성채에서 진군하라']) {
        act(() => vi.advanceTimersByTime(OPENING_SCENE_DURATION_MS));
        expect(host.querySelector('.opening-story h1')?.textContent).toBe(title);
      }
      act(() => vi.advanceTimersByTime(OPENING_SCENE_DURATION_MS));
      expect(host.querySelector('.shell-header h1')?.textContent).toBe('왕국 지도');
    } finally {
      vi.useRealTimers();
    }
  });

  it('defaults achievements to milestone stacks and can expand every step', () => {
    act(() => host.querySelector<HTMLButtonElement>('.save-slot-card.empty')!.click());
    act(() => host.querySelector<HTMLButtonElement>('.opening-skip')!.click());
    const achievementButton = [...host.querySelectorAll<HTMLButtonElement>('.map-command-center button')]
      .find((button) => button.textContent?.includes('업적 기록'))!;
    act(() => achievementButton.click());

    expect(host.querySelectorAll('.achievement-card')).toHaveLength(achievementGroups.length);
    expect(host.querySelectorAll('.achievement-card.stacked').length).toBeGreaterThan(0);
    expect(host.querySelector('.achievement-toolbar')?.textContent).toContain('보상 대기 단계와 다음 목표');

    const allButton = [...host.querySelectorAll<HTMLButtonElement>('.achievement-view-toggle button')]
      .find((button) => button.textContent === '전체 보기')!;
    act(() => allButton.click());
    expect(allButton.getAttribute('aria-pressed')).toBe('true');
    expect(host.querySelectorAll('.achievement-card')).toHaveLength(achievements.length);
  });
});
