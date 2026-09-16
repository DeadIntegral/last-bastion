import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StageSelect } from './App';
import { useGameStore } from './store/useGameStore';

const pointerEvent = (type: string, clientX: number, pointerId = 1): MouseEvent => {
  const event = new MouseEvent(type, { bubbles: true, button: 0, clientX });
  Object.defineProperty(event, 'pointerId', { value: pointerId });
  return event;
};

describe('campaign map pointer controls', () => {
  let host: HTMLDivElement;
  let root: Root;
  const setPointerCapture = vi.fn();
  const releasePointerCapture = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    useGameStore.getState().resetProgress();
    useGameStore.setState({ unlockedStage: 7, clearedStages: [1, 2, 3, 4, 5, 6] });
    Object.defineProperties(HTMLElement.prototype, {
      scrollTo: { configurable: true, value: vi.fn() },
      setPointerCapture: { configurable: true, value: setPointerCapture },
      releasePointerCapture: { configurable: true, value: releasePointerCapture },
      hasPointerCapture: { configurable: true, value: () => true },
    });
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
    act(() => root.render(<StageSelect onBack={vi.fn()} onSelect={vi.fn()} onNavigate={vi.fn()} />));
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
    setPointerCapture.mockReset();
    releasePointerCapture.mockReset();
  });

  it('keeps a cleared western stage clickable after the eastern map unlocks', () => {
    const map = host.querySelector<HTMLElement>('.campaign-map')!;
    const stageOne = host.querySelector<HTMLButtonElement>('[aria-label^="1장"]')!;

    act(() => stageOne.dispatchEvent(pointerEvent('pointerdown', 100)));
    expect(setPointerCapture).not.toHaveBeenCalled();

    act(() => stageOne.dispatchEvent(pointerEvent('pointerup', 100)));
    act(() => stageOne.dispatchEvent(new MouseEvent('click', { bubbles: true })));

    expect(map).toBeDefined();
    expect(host.querySelector('.map-mission h2')?.textContent).toBe('국경의 불씨');
    expect(host.querySelector('.difficulty')?.textContent).toContain('전투 평가 낮음');
    expect(host.querySelector('.difficulty')?.textContent).not.toContain('1/30');
  });

  it('captures the pointer only after horizontal movement becomes a drag', () => {
    const map = host.querySelector<HTMLElement>('.campaign-map')!;
    act(() => map.dispatchEvent(pointerEvent('pointerdown', 100, 2)));
    act(() => map.dispatchEvent(pointerEvent('pointermove', 96, 2)));
    expect(setPointerCapture).not.toHaveBeenCalled();

    act(() => map.dispatchEvent(pointerEvent('pointermove', 80, 2)));
    expect(setPointerCapture).toHaveBeenCalledWith(2);
  });
});
