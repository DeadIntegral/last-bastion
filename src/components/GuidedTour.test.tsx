import { useState } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { GuidedTour } from './GuidedTour';

it('traps focus and game hotkeys, changes targets, and restores focus/scroll on Escape', () => {
  vi.useFakeTimers();
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => window.setTimeout(() => callback(0), 16));
  vi.stubGlobal('cancelAnimationFrame', (id: number) => window.clearTimeout(id));
  const host = document.createElement('div');
  const trigger = document.createElement('button');
  const first = document.createElement('div'); first.id = 'tour-fixture-first';
  const second = document.createElement('div'); second.id = 'tour-fixture-second';
  first.getBoundingClientRect = () => new DOMRect(100, 100, 200, 60);
  second.getBoundingClientRect = () => new DOMRect(200, 250, 200, 60);
  document.body.append(trigger, first, second, host);
  trigger.focus();
  const skipped = vi.fn(); const complete = vi.fn(); const gameKey = vi.fn();
  window.addEventListener('keydown', gameKey);
  const root = createRoot(host);
  function Harness() {
    const [open, setOpen] = useState(true);
    return open ? <GuidedTour steps={[{ target: '#tour-fixture-first', title: '첫 안내', body: '설명' }, { target: '#missing-target', title: '숨긴 안내', body: '설명' }, { target: '#tour-fixture-second', title: '두 번째 안내', body: '설명' }]}
      onSkip={() => { skipped(); setOpen(false); }} onComplete={() => { complete(); setOpen(false); }} onUnavailable={() => setOpen(false)} /> : null;
  }
  try {
    act(() => root.render(<Harness />));
    act(() => vi.runOnlyPendingTimers());
    const next = document.querySelector<HTMLButtonElement>('[data-tour-next]')!;
    expect(document.activeElement).toBe(next);
    act(() => document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyQ', bubbles: true })));
    expect(gameKey).not.toHaveBeenCalled();
    act(() => document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Tab', bubbles: true, cancelable: true })));
    expect(document.activeElement?.textContent).toBe('건너뛰기');
    act(() => next.click());
    act(() => vi.runOnlyPendingTimers());
    expect(document.querySelector('#tour-title')?.textContent).toBe('두 번째 안내');
    const previous = [...document.querySelectorAll<HTMLButtonElement>('.tour-actions button')][0];
    act(() => previous.click());
    expect(document.querySelector('#tour-title')?.textContent).toBe('첫 안내');
    expect(document.querySelector('.tour-caption')?.textContent).toContain('1/2');
    act(() => document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true })));
    expect(skipped).toHaveBeenCalledOnce();
    expect(complete).not.toHaveBeenCalled();
    expect(document.querySelector('.guided-tour')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(document.body.style.overflow).toBe('');
  } finally {
    act(() => root.unmount());
    window.removeEventListener('keydown', gameKey);
    host.remove(); trigger.remove(); first.remove(); second.remove();
    vi.unstubAllGlobals(); vi.useRealTimers();
  }
});
