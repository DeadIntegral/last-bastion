import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { OPENING_SCENE_DURATION_MS } from './data/opening';
import { achievementGroups, achievements } from './data/achievements';
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
    const titleButtons = [...host.querySelectorAll<HTMLButtonElement>('.title-menu-actions button')];
    expect(titleButtons).toHaveLength(4);
    expect(titleButtons.map((button) => button.querySelector('span')?.textContent)).toEqual(['새 게임', '불러오기', '임포트', '크레딧']);

    act(() => titleButtons[0].click());

    expect(host.querySelector('.opening-story h1')?.textContent).toBe('대륙 최후의 밤');
    act(() => host.querySelector<HTMLButtonElement>('.opening-skip')!.click());

    expect(host.querySelector('.shell-header h1')?.textContent).toBe('왕국 지도');
    const hubButtons = [...host.querySelectorAll<HTMLButtonElement>('.map-command-center button')];
    expect(hubButtons).toHaveLength(9);
    expect(hubButtons.some((button) => button.textContent?.includes('마수 도전'))).toBe(false);
    const trainingButton = hubButtons.find((button) => button.textContent?.includes('영웅 훈련소'))!;
    expect(trainingButton.disabled).toBe(true);
    expect(trainingButton.textContent).toContain('9장 클리어 시 해금');
    const merchantButton = hubButtons.find((button) => button.textContent?.includes('수수께끼 상인'))!;
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

    act(() => host.querySelector<HTMLButtonElement>('.back-button')!.click());
    const challengeNode = host.querySelector<HTMLButtonElement>('[aria-label="마수 도전 오우거 대족장"]')!;
    expect(challengeNode).not.toBeNull();

    act(() => challengeNode.click());
    expect(host.querySelector('.map-mission h2')?.textContent).toBe('오우거 대족장');
    expect(host.querySelector('.map-mission')?.classList.contains('challenge-mission')).toBe(true);

    act(() => useGameStore.setState({ clearedStages: [6, 9] }));
    const updatedTrainingButton = [...host.querySelectorAll<HTMLButtonElement>('.map-command-center button')]
      .find((button) => button.textContent?.includes('영웅 훈련소'))!;
    expect(updatedTrainingButton.disabled).toBe(false);
    act(() => updatedTrainingButton.click());
    expect(host.querySelector('.shell-header h1')?.textContent).toBe('영웅 훈련소');
  });

  it('promotes Continue to the first title action when progress exists', () => {
    act(() => useGameStore.setState({ unlockedStage: 4, clearedStages: [1, 2, 3] }));

    const titleButtons = [...host.querySelectorAll<HTMLButtonElement>('.title-menu-actions button')];
    expect(titleButtons.map((button) => button.querySelector('span')?.textContent)).toEqual(['계속하기', '새 게임', '임포트', '크레딧']);
    expect(titleButtons[0].classList.contains('title-menu-primary')).toBe(true);
    expect(titleButtons[0].textContent).toContain('CONTINUE · 4장');

    act(() => titleButtons[0].click());
    expect(host.querySelector('.shell-header h1')?.textContent).toBe('왕국 지도');
    expect(useGameStore.getState().unlockedStage).toBe(4);
  });

  it('autoplays the four-part prologue and enters the map without an advance action', () => {
    vi.useFakeTimers();
    try {
      const titleButtons = [...host.querySelectorAll<HTMLButtonElement>('.title-menu-actions button')];
      act(() => titleButtons[0].click());
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
    const titleButtons = [...host.querySelectorAll<HTMLButtonElement>('.title-menu-actions button')];
    act(() => titleButtons[0].click());
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
