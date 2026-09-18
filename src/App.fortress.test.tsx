import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FortressWorkshop } from './App';
import { useGameStore } from './store/useGameStore';

const pointerEvent = (type: string, clientX: number, pointerId = 1): MouseEvent => {
  const event = new MouseEvent(type, { bubbles: true, button: 0, clientX });
  Object.defineProperty(event, 'pointerId', { value: pointerId });
  return event;
};

describe('fortress technology tree pointer controls', () => {
  let host: HTMLDivElement;
  let root: Root;
  const setPointerCapture = vi.fn();
  const releasePointerCapture = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    useGameStore.getState().resetProgress();
    useGameStore.setState({ gold: 1000 });
    Object.defineProperties(HTMLElement.prototype, {
      setPointerCapture: { configurable: true, value: setPointerCapture },
      releasePointerCapture: { configurable: true, value: releasePointerCapture },
      hasPointerCapture: { configurable: true, value: () => true },
    });
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
    act(() => root.render(<FortressWorkshop onBack={vi.fn()} />));
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
    setPointerCapture.mockReset();
    releasePointerCapture.mockReset();
  });

  it('captures only after the threshold and scrolls horizontally', () => {
    const viewport = host.querySelector<HTMLElement>('.tech-tree-viewport')!;
    viewport.scrollLeft = 120;

    act(() => viewport.dispatchEvent(pointerEvent('pointerdown', 100, 2)));
    act(() => viewport.dispatchEvent(pointerEvent('pointermove', 96, 2)));
    expect(setPointerCapture).not.toHaveBeenCalled();

    act(() => viewport.dispatchEvent(pointerEvent('pointermove', 80, 2)));
    expect(setPointerCapture).toHaveBeenCalledWith(2);
    expect(viewport.scrollLeft).toBe(140);
    expect(viewport.classList.contains('dragging')).toBe(true);

    act(() => viewport.dispatchEvent(pointerEvent('pointerup', 80, 2)));
    expect(releasePointerCapture).toHaveBeenCalledWith(2);
    expect(viewport.classList.contains('dragging')).toBe(false);
  });

  it('suppresses the research click following a completed drag', () => {
    const viewport = host.querySelector<HTMLElement>('.tech-tree-viewport')!;
    const researchButton = viewport.querySelector<HTMLButtonElement>('.tech-node button')!;
    const initialGold = useGameStore.getState().gold;

    act(() => researchButton.dispatchEvent(pointerEvent('pointerdown', 100, 3)));
    act(() => viewport.dispatchEvent(pointerEvent('pointermove', 75, 3)));
    act(() => viewport.dispatchEvent(pointerEvent('pointerup', 75, 3)));
    act(() => researchButton.dispatchEvent(new MouseEvent('click', { bubbles: true })));

    expect(useGameStore.getState().gold).toBe(initialGold);
  });

  it('keeps an ordinary short click available for research', () => {
    const researchButton = host.querySelector<HTMLButtonElement>('.branch-command .tech-node button')!;

    act(() => researchButton.dispatchEvent(pointerEvent('pointerdown', 100, 4)));
    act(() => researchButton.dispatchEvent(pointerEvent('pointerup', 100, 4)));
    act(() => researchButton.dispatchEvent(new MouseEvent('click', { bubbles: true })));

    expect(useGameStore.getState().castleTechLevels.war_coffers).toBe(1);
    expect(useGameStore.getState().gold).toBe(900);
  });
});
