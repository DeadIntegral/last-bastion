import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { TourStep } from '../types/tutorial';
import { useTranslation } from '../shared/i18n/i18n';
import { GameButton } from './GameButton';

export function tourTarget(selector: string): HTMLElement | undefined {
  return [...document.querySelectorAll<HTMLElement>(selector)].find((node) => {
    const rect = node.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && getComputedStyle(node).visibility !== 'hidden';
  });
}

interface GuidedTourProps {
  steps: readonly TourStep[];
  onComplete: () => void;
  onSkip: () => void;
  onUnavailable: () => void;
}

/** Store- and game-independent spotlight tour. Targets remain read-only until it closes. */
export function GuidedTour({ steps, onComplete, onSkip, onUnavailable }: GuidedTourProps) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [geometry, setGeometry] = useState<{ left: number; top: number; width: number; height: number; viewportWidth: number; viewportHeight: number } | null>(null);
  const [panelHeight, setPanelHeight] = useState(230);
  const panelRef = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onComplete, onSkip, onUnavailable });
  callbacks.current = { onComplete, onSkip, onUnavailable };
  const step = steps[index];

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const keydown = (event: KeyboardEvent) => {
      event.stopPropagation();
      const code = event.code || event.key;
      if (code === 'Escape') { event.preventDefault(); callbacks.current.onSkip(); }
      if (code !== 'Tab') return;
      const buttons = [...(panelRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])];
      if (!buttons.length) return;
      const first = buttons[0]; const last = buttons.at(-1)!;
      if (event.shiftKey && (document.activeElement === first || !panelRef.current?.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !panelRef.current?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', keydown, true);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', keydown, true);
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);

  useLayoutEffect(() => {
    if (!step) { callbacks.current.onUnavailable(); return; }
    const target = tourTarget(step.target);
    if (!target) {
      if (index + 1 < steps.length) setIndex(index + 1);
      else callbacks.current.onUnavailable();
      return;
    }
    target.scrollIntoView?.({ block: 'center', inline: 'nearest', behavior: 'auto' });
    const measure = () => {
      const rect = target.getBoundingClientRect();
      const width = window.innerWidth; const height = window.innerHeight;
      const left = Math.max(6, rect.left - 6); const top = Math.max(6, rect.top - 6);
      setGeometry({ left, top, width: Math.max(0, Math.min(width - 6, rect.right + 6) - left), height: Math.max(0, Math.min(height - 6, rect.bottom + 6) - top), viewportWidth: width, viewportHeight: height });
    };
    measure();
    const frame = requestAnimationFrame(() => { measure(); panelRef.current?.querySelector<HTMLButtonElement>('[data-tour-next]')?.focus({ preventScroll: true }); });
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(target);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    window.visualViewport?.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(frame); observer?.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
      window.visualViewport?.removeEventListener('resize', measure);
    };
  }, [index, step, steps.length]);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const measure = () => setPanelHeight(panel.getBoundingClientRect().height);
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(panel);
    return () => observer?.disconnect();
  }, [geometry !== null]);

  if (!geometry || !step) return null;
  const previousIndex = steps.reduce((previous, candidate, candidateIndex) => candidateIndex < index && tourTarget(candidate.target) ? candidateIndex : previous, -1);
  const nextIndex = steps.findIndex((candidate, candidateIndex) => candidateIndex > index && !!tourTarget(candidate.target));
  const visibleSteps = steps.filter((candidate) => tourTarget(candidate.target));
  const visibleIndex = visibleSteps.indexOf(step);
  const panelWidth = Math.min(350, geometry.viewportWidth - 24);
  const bottom = geometry.top + geometry.height;
  let left = Math.max(12, Math.min(geometry.left, geometry.viewportWidth - panelWidth - 12));
  let top = bottom + 12;
  if (top + panelHeight > geometry.viewportHeight - 12) {
    if (geometry.top >= panelHeight + 24) top = geometry.top - panelHeight - 12;
    else if (geometry.left >= panelWidth + 24) { left = geometry.left - panelWidth - 12; top = geometry.top; }
    else if (geometry.viewportWidth - geometry.left - geometry.width >= panelWidth + 24) { left = geometry.left + geometry.width + 12; top = geometry.top; }
    else top = geometry.viewportHeight - panelHeight - 12;
  }
  top = Math.max(12, Math.min(top, geometry.viewportHeight - panelHeight - 12));

  return createPortal(<div className="guided-tour">
    <div className="tour-input-shield" aria-hidden="true" />
    <div className="tour-spotlight" aria-hidden="true" style={{ left: geometry.left, top: geometry.top, width: geometry.width, height: geometry.height }} />
    <div className="tour-popover" ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-description" style={{ left, top, width: panelWidth, maxHeight: geometry.viewportHeight - 24 }}>
      <div className="tour-caption"><span>{t('안내')} · {visibleIndex + 1}/{visibleSteps.length}</span><GameButton variant="ghost" size="small" onClick={onSkip}>{t('건너뛰기')}</GameButton></div>
      <h2 id="tour-title">{t(step.title)}</h2><p id="tour-description">{t(step.body)}</p>
      <div className="tour-actions"><GameButton variant="ghost" size="small" disabled={previousIndex < 0} onClick={() => setIndex(previousIndex)}>{t('이전')}</GameButton>
        <GameButton variant="primary" size="small" data-tour-next onClick={() => nextIndex >= 0 ? setIndex(nextIndex) : onComplete()}>{t(nextIndex >= 0 ? '다음' : '알겠어요')}</GameButton>
      </div>
    </div>
  </div>, document.body);
}
